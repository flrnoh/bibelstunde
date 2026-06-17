import Stripe from 'stripe';

let _client = null;

export function stripe() {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _client = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
  return _client;
}

export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
