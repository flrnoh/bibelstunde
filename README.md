# Bibelstunde

Cocktail-Roulette für die Bar. App + Landing + Bezahl-Pipeline.

## Struktur

```
app/         App (Login + Roulette)              → /app
api/         Vercel Serverless Functions         → /api/*
lib/         Shared backend helpers (kv, auth, hash)
scripts/     Maintenance scripts (seed, …)
```

PR 2 wird Landing unter `/` ergänzen, PR 3 die Stripe-Pipeline.

## Lokale Entwicklung

```bash
npm install
vercel link                  # einmalig: mit Vercel-Projekt verknüpfen
vercel env pull .env.local   # lädt KV- und JWT-ENV vom Vercel-Projekt
npm run dev                  # vercel dev — App auf http://localhost:3000/app
```

## Erstmaliges Setup (einmalig im Vercel-Projekt)

1. **Upstash Redis** im Vercel-Marketplace mit dem Projekt verknüpfen
   → `KV_REST_API_URL` und `KV_REST_API_TOKEN` werden auto-injected
2. **`JWT_SECRET`** als ENV-Var setzen: `openssl rand -base64 64`
3. Bestehende Bars in KV migrieren:
   ```bash
   vercel env pull .env.local
   node --env-file=.env.local scripts/seed.js
   ```

## Bezahl-Pipeline (PR 3)

1. **Stripe**: Konto + Product „Bibelstunde Lifetime" 49,99 € one-time → Price ID merken.
   ENV-Vars im Vercel-Projekt:
   - `STRIPE_SECRET_KEY` (sk_test_… / sk_live_…)
   - `STRIPE_PRICE_ID` (price_…)
   - `STRIPE_WEBHOOK_SECRET` (whsec_…, aus Webhook-Endpoint)
2. **Stripe Webhook anlegen**: Endpoint URL `https://<deine-domain>/api/stripe-webhook`,
   Event `checkout.session.completed`.
3. **Brevo**: Sender-E-Mail verifizieren, API-Key generieren.
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL` (verifizierter Sender)
4. **Optional**: `APP_BASE_URL=https://bibelstunde.app` setzen, sobald Domain live.
5. Test-Mode E2E mit Stripe Test-Karte (4242 4242 4242 4242),
   dann Stripe-Mode auf Live umstellen.

## Kompletter Testkauf (E2E)

`scripts/e2e-purchase.js` fährt die ganze Pipeline in **einem** Lauf durch und
prüft jede Stufe: Checkout → Webhook → Bar in KV → Mail → Login. Es ruft die
echten Handler (`api/*`) und `lib/*` auf, ist also ein echter Integrationstest,
keine Nachbildung.

```bash
vercel env pull .env.local   # Test-Mode-Keys (sk_test_…, price_…, whsec_…) laden
npm install
npm run e2e                          # voller Lauf, verschickt echte Brevo-Mail
npm run e2e -- --email=du@example.de # Mail an ein echtes Postfach schicken
npm run e2e -- --no-mail             # Brevo-Aufruf stubben (keine echte Mail)
npm run e2e -- --keep                # angelegte Bar in KV behalten (kein Cleanup)
```

Der Lauf legt eine Wegwerf-Bar `e2e-<timestamp>` an, verifiziert, dass das
Passwort aus der Mail wirklich einloggt, und räumt die Bar danach wieder auf.
Läuft nur mit `sk_test_`-Keys — bei Live-Keys bricht das Skript bewusst ab.
