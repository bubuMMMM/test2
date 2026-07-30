# Can I Vibecode It?

An honest directory that answers whether a paid SaaS product can be replaced with one AI coding prompt.

## Stack

- Astro, server output, Vercel adapter
- Vanilla JavaScript only
- `better-sqlite3` for votes and waitlist capture
- Satori + Resvg for build-time Open Graph images
- JetBrains Mono + Space Grotesk

## Local development

```bash
npm install
npm run dev
```

SQLite is created at `data/can-i-vibecode-it.sqlite`. On Vercel, the app writes to `/tmp`; for durable public production data, set `SQLITE_PATH` to a persistent mounted volume or swap the small adapter in `src/lib/db.js` for a managed SQL service.

## Content

Every directory entry lives in its own JSON file under `data/apps/` with this schema:

```json
{
  "slug": "calendly",
  "name": "Calendly",
  "domain": "calendly.com",
  "category": "Scheduling",
  "priceMonthly": 12,
  "verdict": "yes",
  "whatYouLose": [],
  "priorArt": [],
  "prompt": "...",
  "notes": "..."
}
```

## License

MIT
