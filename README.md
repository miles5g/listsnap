# ListSnap

Take a photo of something you want to sell. ListSnap writes the listing: title, description, price range, and tags, ready to paste into eBay, Facebook Marketplace, or Depop.

## How it works

1. You upload a photo. The browser shrinks it before sending.
2. A Supabase Edge Function sends it to a vision model (Gemini Flash Lite) with a fixed output schema, so every listing comes back in the same shape.
3. You edit the result and copy each field with one click.
4. Your last 10 listings are saved in the browser. Google sign-in is optional.

## Stack

React 18, TypeScript, Vite, Tailwind, shadcn/ui, Supabase (Edge Functions and auth).

## Run it locally

You need Node 18+ and your own Supabase project, because the AI call runs server-side.

```bash
git clone https://github.com/miles5g/listsnap.git
cd listsnap
npm install
cp .env.example .env    # add your Supabase URL and anon key
npm run dev             # http://localhost:5173
```

Backend setup (one time):

```bash
supabase functions deploy analyze-item
supabase secrets set LOVABLE_API_KEY=your_key
```

## Code map

- `src/pages/Index.tsx`: the upload, analyze, edit flow
- `src/components/`: upload box, listing editor, copy buttons
- `supabase/functions/analyze-item/index.ts`: the model call and output schema
