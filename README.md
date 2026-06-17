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
