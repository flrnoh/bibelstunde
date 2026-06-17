import { stripe } from '../lib/stripe.js';
import { barExists } from '../lib/kv.js';

const MAX_BAR_LEN = 32;
const BAR_RE = /^[a-zA-Z0-9_-]{2,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function baseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { bar, email, locale } = req.body ?? {};

  if (typeof bar !== 'string' || !BAR_RE.test(bar.trim())) {
    return res.status(400).json({
      ok: false,
      error: 'Bitte einen Bar-Namen mit 2–32 Zeichen (Buchstaben, Zahlen, _ und -) angeben.',
    });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ ok: false, error: 'Bitte eine gültige E-Mail angeben.' });
  }

  const barName = bar.trim();
  const customerEmail = email.trim();
  const lang = locale === 'en' ? 'en' : 'de';

  if (await barExists(barName)) {
    return res.status(409).json({
      ok: false,
      error: 'Dieser Bar-Name ist bereits vergeben. Bitte einen anderen wählen.',
    });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return res.status(500).json({ ok: false, error: 'Server-Konfiguration unvollständig.' });
  }

  const base = baseUrl(req);

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      locale: lang === 'en' ? 'en' : 'de',
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/${lang === 'en' ? 'en' : ''}#kauf`,
      metadata: { bar: barName, email: customerEmail, locale: lang },
      payment_intent_data: {
        metadata: { bar: barName, email: customerEmail, locale: lang },
      },
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err) {
    console.error('Stripe checkout failed:', err);
    return res.status(500).json({ ok: false, error: 'Checkout konnte nicht gestartet werden.' });
  }
}
