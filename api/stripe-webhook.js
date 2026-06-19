import { stripe, readRawBody } from '../lib/stripe.js';
import { getBar, putBar, deleteBar } from '../lib/kv.js';
import { hashPassword } from '../lib/hash.js';
import { generatePassword } from '../lib/passgen.js';
import { sendCredentialsMail } from '../lib/brevo.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method not allowed');
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).end('Server misconfigured');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).end('Missing signature');

  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).end(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: event.type });
  }

  const session = event.data.object;
  const meta = session.metadata || {};
  const barName = (meta.bar || '').trim();
  const email = (meta.email || session.customer_email || '').trim();
  const locale = meta.locale === 'en' ? 'en' : 'de';

  if (!barName || !email) {
    console.error('Webhook missing metadata bar/email', { id: session.id, meta });
    return res.status(200).json({ received: true, error: 'missing metadata, manual provisioning needed' });
  }

  try {
    const existing = await getBar(barName);
    if (existing && existing.source !== `stripe:${session.id}`) {
      console.error('Bar name already taken at provision time', { barName, sessionId: session.id });
      return res.status(200).json({ received: true, error: 'bar already provisioned, manual review needed' });
    }
    if (existing) {
      return res.status(200).json({ received: true, idempotent: true });
    }

    const password = generatePassword(14);
    const passwordHash = await hashPassword(password);

    await putBar(barName, {
      name: barName,
      passwordHash,
      email,
      createdAt: new Date().toISOString(),
      source: `stripe:${session.id}`,
      stripeCustomerId: session.customer || null,
    });

    try {
      await sendCredentialsMail({ barName, password, email, locale });
    } catch (mailErr) {
      console.error('Brevo mail failed, rolling back KV entry:', mailErr);
      try { await deleteBar(barName); } catch (delErr) {
        console.error('Rollback delete also failed:', delErr);
      }
      throw mailErr;
    }

    return res.status(200).json({ received: true, provisioned: barName });
  } catch (err) {
    console.error('Provisioning failed:', err);
    return res.status(500).json({ received: true, error: 'provisioning failed' });
  }
}
