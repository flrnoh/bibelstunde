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

1. **Stripe**: Konto + Product „Bibelstunde Lifetime" 9,99 € one-time → Price ID merken.
   ENV-Vars im Vercel-Projekt:
   - `STRIPE_SECRET_KEY` (sk_test_… / sk_live_…)
   - `STRIPE_PRICE_ID` (price_…)
   - `STRIPE_WEBHOOK_SECRET` (whsec_…, aus Webhook-Endpoint)
2. **Stripe Webhook anlegen**: Endpoint URL `https://bibelstunde.vercel.app/api/stripe-webhook`,
   Event `checkout.session.completed`. (Sobald eine Custom-Domain live ist,
   Endpoint-URL auf `https://<domain>/api/stripe-webhook` umstellen.)
3. **Brevo**: Sender-E-Mail verifizieren, API-Key generieren.
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL` (verifizierter Sender)
4. **Optional**: `APP_BASE_URL=https://bibelstunde.app` setzen, sobald Domain live.
5. Test-Mode E2E mit Stripe Test-Karte (4242 4242 4242 4242),
   dann Stripe-Mode auf Live umstellen.

### Webhook im Dashboard prüfen

Stripe Dashboard → **Developers → Webhooks** → den Endpoint öffnen und abgleichen:

- **Endpoint-URL** = `https://bibelstunde.vercel.app/api/stripe-webhook`
  (aktuell die einzige Production-Domain; `bibelstunde.app` ist noch nicht live).
- **Listening for** enthält `checkout.session.completed` (das einzige Event,
  das `api/stripe-webhook.js` verarbeitet — alle anderen werden mit `200 ignored`
  quittiert).
- **Signing secret** (`whsec_…`) stimmt mit `STRIPE_WEBHOOK_SECRET` im
  Vercel-Projekt überein.
- Im richtigen **Mode** angelegt (Test-Webhook mit `sk_test_…`, Live-Webhook mit
  `sk_live_…`) — Test- und Live-Webhooks haben unterschiedliche Signing Secrets.

Erreichbarkeit ohne Dashboard-Zugriff prüfbar: ein `GET` auf die URL muss
`405 Method not allowed`, ein `POST` ohne gültige Signatur `400` liefern.
