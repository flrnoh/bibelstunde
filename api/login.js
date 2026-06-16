import { getBar } from '../lib/kv.js';
import { verifyPassword } from '../lib/hash.js';
import { signSessionToken } from '../lib/auth.js';

const INVALID = { ok: false, error: 'Zugangscode oder Passwort ist falsch.' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { bar, pass } = req.body ?? {};

  if (typeof bar !== 'string' || typeof pass !== 'string' || !bar.trim() || !pass) {
    return res.status(400).json({ ok: false, error: 'Bitte Zugangscode und Passwort eingeben.' });
  }

  const record = await getBar(bar);
  if (!record) {
    return res.status(401).json(INVALID);
  }

  const ok = await verifyPassword(pass, record.passwordHash);
  if (!ok) {
    return res.status(401).json(INVALID);
  }

  const token = await signSessionToken({
    sub: bar.trim().toLowerCase(),
    name: record.name ?? bar.trim(),
  });

  return res.status(200).json({ ok: true, token, name: record.name ?? bar.trim() });
}
