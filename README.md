# ListSnap

**Turn a photo into a marketplace-ready listing in seconds.** Upload an item image → AI extracts brand, category, and details → generates title, description, price range, and tags → copy to eBay, Facebook Marketplace, Depop, and more.

Built for resellers who want to list faster without retyping the same fields.

## Highlights

- **Photo → listing pipeline** — 3-step UI (upload → analyze → edit/export)
- **Structured AI output** — tool-calling schema for consistent title, description, tags, and suggested price
- **Listing templates** — default, minimal, and detailed generation modes
- **Local persistence** — last listing + 10-item history in `localStorage`
- **Optional Google sign-in** — Supabase auth to sync history when enabled
- **Export helpers** — one-click copy for title, description, and full listing blocks
- **SEO-ready** — Open Graph, Twitter cards, JSON-LD, sitemap, robots

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| Backend | Supabase Edge Functions (Deno) |
| AI | Vision + structured generation via Lovable AI gateway |
| Auth | Supabase (Google OAuth optional) |

## Architecture

```
Browser (React)
    → compress image client-side
    → supabase.functions.invoke("analyze-item")
        → Edge Function (vision + tool call)
    → ListingEditor + ExportButtons
    → localStorage history (+ optional Supabase user)
```

## Run locally

**Prerequisites:** Node.js 18+, a Supabase project with `analyze-item` deployed, and `LOVABLE_API_KEY` set in Supabase secrets.

```bash
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npm run dev
```

Open `http://localhost:5173`.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Deploy the edge function:
   ```bash
   supabase functions deploy analyze-item
   ```
3. Set secrets:
   ```bash
   supabase secrets set LOVABLE_API_KEY=your_key
   ```
4. Enable Google provider under Authentication if you want sign-in (optional).

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |

Never commit `.env` — keys stay local and in Supabase dashboard secrets.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Vitest unit tests |

## Project layout

```
listnap/
├── src/
│   ├── pages/Index.tsx       # Main flow
│   ├── components/           # Upload, editor, export, stepper
│   └── integrations/supabase/
├── supabase/functions/analyze-item/
└── public/                   # OG image, sitemap, robots
```

## Deployment

- **Frontend:** Vite static build → Vercel, Netlify, or Lovable publish
- **Backend:** Supabase hosted edge functions
- Production site: [listnap.app](https://listnap.app/) (when deployed)

## Status

Production-oriented MVP — core analyze → edit → copy loop is complete; auth and history are optional enhancements.

## Author

**Miles Johnson** — [@miles5g](https://github.com/miles5g)

## License

MIT
