import { stripe, readRawBody } from '../lib/stripe.js';
import { getBar, putBar, deleteBar } from '../lib/kv.js';
import { hashPassword } from '../lib/hash.js';
import { generatePassword } from '../lib/passgen.js';
import { sendCredentialsMail, sendAlertMail } from '../lib/brevo.js';

export const config = { api: { bodyParser: false } };

function formatAmount(session) {
  if (typeof session.amount_total !== 'number') return 'unbekannt';
  return `${(session.amount_total / 100).toFixed(2)} ${(session.currency || '').toUpperCase()}`.trim();
}

// A completed checkout means the customer HAS paid. Every failure below leaves
// them without access, so raise a real alarm — never rely on the log alone.
async function alertOps(subject, lines) {
  try {
    await sendAlertMail({ subject, lines });
  } catch (alertErr) {
    console.error('ALERT DELIVERY FAILED — paid order needs manual attention:', alertErr.message, { subject, lines });
  }
}

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
    await alertOps('⚠️ Bibelstunde: Zahlung ohne Zuordnung — manuelles Provisioning nötig', [
      'Ein Kunde hat bezahlt, aber die Checkout-Session hat keine bar/email-Metadaten.',
      `Session:       ${session.id}`,
      `Betrag:        ${formatAmount(session)}`,
      `E-Mail (Stripe): ${session.customer_email || 'unbekannt'}`,
      `PaymentIntent: ${session.payment_intent || 'unbekannt'}`,
      '',
      'Bitte Zugang manuell anlegen oder Zahlung erstatten.',
    ]);
    return res.status(200).json({ received: true, error: 'missing metadata, manual provisioning needed' });
  }

  try {
    const existing = await getBar(barName);
    if (existing && existing.source !== `stripe:${session.id}`) {
      console.error('Bar name already taken at provision time', { barName, sessionId: session.id });
      await alertOps('⚠️ Bibelstunde: Bar-Name vergeben — Kunde hat bezahlt, aber nichts erhalten', [
        `Der Bar-Name „${barName}" war bei Zahlungseingang bereits vergeben (Race Condition`,
        'zwischen Checkout-Start und Zahlung). Der Kunde hat bezahlt, aber KEINE Zugangsdaten erhalten.',
        `Session:       ${session.id}`,
        `Betrag:        ${formatAmount(session)}`,
        `Kunde:         ${email}`,
        `PaymentIntent: ${session.payment_intent || 'unbekannt'}`,
        '',
        'Bitte einen anderen Namen mit dem Kunden klären und manuell anlegen, oder die Zahlung erstatten.',
      ]);
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
    await alertOps('⚠️ Bibelstunde: Provisioning fehlgeschlagen — Kunde hat bezahlt', [
      'Nach erfolgreicher Zahlung ist das Provisioning fehlgeschlagen.',
      `Bar:           ${barName}`,
      `Kunde:         ${email}`,
      `Session:       ${session.id}`,
      `Betrag:        ${formatAmount(session)}`,
      `PaymentIntent: ${session.payment_intent || 'unbekannt'}`,
      `Fehler:        ${err.message || String(err)}`,
      '',
      'Stripe wiederholt den Webhook ggf. automatisch. Bleibt der Fehler, bitte manuell anlegen oder erstatten.',
    ]);
    return res.status(500).json({ received: true, error: 'provisioning failed' });
  }
}
