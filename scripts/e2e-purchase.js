#!/usr/bin/env node
/**
 * End-to-end "Testkauf" — walks the whole purchase pipeline in Stripe TEST mode:
 *
 *   Checkout  → POST /api/checkout creates a real (test) Checkout Session
 *   Webhook   → a signed checkout.session.completed event hits /api/stripe-webhook
 *   Bar       → the webhook provisions the bar record in Upstash KV
 *   Mail      → the credentials mail is sent via Brevo (password captured here)
 *   Login     → the mailed bar-code + password unlock a session via /api/login
 *
 * It invokes the real serverless handlers and the real lib/* code, so a green run
 * means the actual production code path works — not a re-implementation of it.
 *
 * Usage:
 *   npm run e2e                       # full run, really sends the mail
 *   npm run e2e -- --no-mail          # stub the Brevo call (no real email)
 *   npm run e2e -- --keep             # keep the provisioned bar (skip cleanup)
 *   npm run e2e -- --email=you@x.de   # deliver the test mail to a real inbox
 *   npm run e2e -- --bar=myTestBar    # pin the bar name (default: e2e-<ts>)
 *
 * Requires .env.local with TEST-mode credentials (STRIPE_* as sk_test_/price_/whsec_,
 * KV_REST_API_*, BREVO_*, JWT_SECRET). Run `vercel env pull .env.local` first.
 */

import { Readable } from 'node:stream';

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const NO_MAIL = flag('no-mail');
const KEEP = flag('keep');
const BAR = opt('bar', `e2e-${Date.now()}`);
const EMAIL = opt('email', 'e2e-test@bibelstunde.invalid');
const LOCALE = opt('locale', 'de');

// ── tiny test harness ─────────────────────────────────────────────────────────
let step = 0;
const pass = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const info = (msg) => console.log(`    \x1b[90m${msg}\x1b[0m`);
const stage = (msg) => console.log(`\n\x1b[1m[${++step}] ${msg}\x1b[0m`);
function assert(cond, msg) {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
  pass(msg);
}

// A minimal stand-in for the Vercel (req, res) pair the handlers expect.
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end(payload) { this.body = payload; return this; },
  };
  return res;
}

// Guard against forgetting env before the KV module (which throws on import) loads.
function requireEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`\n\x1b[31mMissing env: ${missing.join(', ')}\x1b[0m`);
    console.error('Run `vercel env pull .env.local`, then `npm run e2e`.\n');
    process.exit(1);
  }
}

// ── Brevo interception ─────────────────────────────────────────────────────────
// lib/brevo.js uses global fetch. We wrap it to (a) capture the generated password
// out of the outgoing mail so we can prove the login later, and (b) optionally stub
// the send with --no-mail. Every non-Brevo request (e.g. Upstash) passes straight
// through, so KV and Stripe keep working untouched.
const captured = { password: null, subject: null, to: null, sent: false };
function installBrevoTap() {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const target = typeof url === 'string' ? url : url?.url ?? '';
    if (target.includes('api.brevo.com')) {
      const payload = JSON.parse(options.body);
      captured.subject = payload.subject;
      captured.to = payload.to?.[0]?.email ?? null;
      const m = /Passwort:\s*(\S+)/.exec(payload.textContent)
        || /Password:\s*(\S+)/.exec(payload.textContent);
      captured.password = m ? m[1] : null;
      if (NO_MAIL) {
        captured.sent = false;
        return new Response(JSON.stringify({ messageId: 'stubbed-no-mail' }), {
          status: 201, headers: { 'content-type': 'application/json' },
        });
      }
      const res = await realFetch(url, options);
      captured.sent = res.ok;
      return res;
    }
    return realFetch(url, options);
  };
}

// ── run ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\x1b[1mTestkauf E2E\x1b[0m  bar=${BAR}  email=${EMAIL}  locale=${LOCALE}`);
  console.log(`mail=${NO_MAIL ? 'stubbed (--no-mail)' : 'REAL Brevo send'}  cleanup=${KEEP ? 'off (--keep)' : 'on'}`);

  requireEnv([
    'STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID', 'STRIPE_WEBHOOK_SECRET',
    'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'JWT_SECRET',
  ]);
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.error('\n\x1b[31mRefusing to run: STRIPE_SECRET_KEY is not a sk_test_ key.\x1b[0m');
    console.error('This harness is for TEST mode only. Point .env.local at test credentials.\n');
    process.exit(1);
  }

  installBrevoTap();

  // Imported after env is verified — lib/kv.js throws at import time without env.
  const { stripe } = await import('../lib/stripe.js');
  const { getBar, deleteBar } = await import('../lib/kv.js');
  const checkout = (await import('../api/checkout.js')).default;
  const webhook = (await import('../api/stripe-webhook.js')).default;
  const login = (await import('../api/login.js')).default;

  let provisioned = false;
  try {
    // ── 1. Checkout ──────────────────────────────────────────────────────────
    stage('Checkout — POST /api/checkout');
    const coRes = mockRes();
    await checkout({ method: 'POST', headers: { host: 'localhost' }, body: { bar: BAR, email: EMAIL, locale: LOCALE } }, coRes);
    assert(coRes.statusCode === 200, `handler returned 200 (got ${coRes.statusCode}: ${JSON.stringify(coRes.body)})`);
    assert(coRes.body?.ok === true && typeof coRes.body.url === 'string', 'response carries { ok:true, url }');

    const sessionId = /cs_test_[A-Za-z0-9]+/.exec(coRes.body.url)?.[0];
    assert(!!sessionId, `checkout URL contains a session id (${coRes.body.url.slice(0, 60)}…)`);
    info(`session ${sessionId}`);

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    assert(session.metadata?.bar === BAR, 'Stripe session metadata.bar matches');
    assert(session.metadata?.email === EMAIL, 'Stripe session metadata.email matches');
    assert(session.amount_total > 0 && session.currency === 'eur', `line item priced (${(session.amount_total / 100).toFixed(2)} ${session.currency})`);

    // ── 2. Webhook ───────────────────────────────────────────────────────────
    stage('Webhook — signed checkout.session.completed → /api/stripe-webhook');
    const event = {
      id: `evt_e2e_${sessionId}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: session.id,
          object: 'checkout.session',
          metadata: session.metadata,
          customer_email: session.customer_email ?? EMAIL,
          customer: session.customer ?? null,
          payment_status: 'paid',
        },
      },
    };
    const rawBody = JSON.stringify(event);
    const sigHeader = stripe().webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    const whReq = Readable.from([Buffer.from(rawBody)]);
    whReq.method = 'POST';
    whReq.headers = { 'stripe-signature': sigHeader };
    const whRes = mockRes();
    await webhook(whReq, whRes);
    assert(whRes.statusCode === 200, `webhook returned 200 (got ${whRes.statusCode}: ${JSON.stringify(whRes.body)})`);
    assert(whRes.body?.provisioned === BAR, `webhook reports provisioned=${BAR}`);
    provisioned = true;

    // ── 3. Bar angelegt ──────────────────────────────────────────────────────
    stage('Bar — record persisted in KV');
    const record = await getBar(BAR);
    assert(!!record, 'getBar returns a record');
    assert(record.name === BAR, 'record.name matches');
    assert(record.email === EMAIL, 'record.email matches');
    assert(typeof record.passwordHash === 'string' && record.passwordHash.startsWith('$2'), 'password stored as bcrypt hash (not plaintext)');
    assert(record.source === `stripe:${sessionId}`, `record.source traces the session (${record.source})`);

    // ── 4. Mail mit Zugang ───────────────────────────────────────────────────
    stage(`Mail — credentials sent via Brevo${NO_MAIL ? ' (stubbed)' : ''}`);
    assert(captured.to === EMAIL, `mail addressed to ${EMAIL}`);
    assert(!!captured.subject, `subject set ("${captured.subject}")`);
    assert(!!captured.password, 'password present in mail body');
    if (NO_MAIL) info('send stubbed (--no-mail) — Brevo not contacted');
    else assert(captured.sent, 'Brevo accepted the send (2xx)');

    // ── 5. Login mit Zugang ──────────────────────────────────────────────────
    stage('Login — mailed credentials unlock a session');
    const liRes = mockRes();
    await login({ method: 'POST', headers: {}, body: { bar: BAR, pass: captured.password } }, liRes);
    assert(liRes.statusCode === 200, `login returned 200 (got ${liRes.statusCode}: ${JSON.stringify(liRes.body)})`);
    assert(liRes.body?.ok === true && typeof liRes.body.token === 'string', 'login issues a session token');

    const liBad = mockRes();
    await login({ method: 'POST', headers: {}, body: { bar: BAR, pass: `${captured.password}x` } }, liBad);
    assert(liBad.statusCode === 401, 'wrong password is rejected (401)');

    console.log('\n\x1b[42m\x1b[30m PASS \x1b[0m Full purchase pipeline works end to end.');
    if (!NO_MAIL) console.log(`      A real credentials mail was sent to ${EMAIL} — check that inbox.`);
  } finally {
    if (provisioned && !KEEP) {
      await deleteBar(BAR);
      console.log(`\x1b[90m      cleaned up KV bar "${BAR}"\x1b[0m`);
    } else if (provisioned && KEEP) {
      console.log(`\x1b[90m      kept KV bar "${BAR}" (--keep) — remove it manually when done\x1b[0m`);
    }
  }
}

main().catch((err) => {
  console.error(`\n\x1b[41m\x1b[30m FAIL \x1b[0m ${err.message}`);
  console.error(err.stack?.split('\n').slice(1, 4).join('\n') ?? '');
  process.exit(1);
});
