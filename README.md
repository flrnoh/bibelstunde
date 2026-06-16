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
