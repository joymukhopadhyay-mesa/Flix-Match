# Tonight — pick something together

Two people, one shared shortlist, one pick — with exactly where to watch it in India, tonight.

## How it works

1. Partner A opens the app, sets their mood/language/rating/era preferences, and gets a QR code
   (+ shareable link) to send to Partner B.
2. Partner B scans it, fills in the same form independently — neither sees the other's answers.
3. Once both submit, Gemini blends both profiles (including free-text mood) into a search brief,
   which pulls ~30 matching titles from TMDB, enriched with real IMDb ratings (OMDb) and current
   India streaming links (RapidAPI).
4. Both partners swipe the same 30 titles, in their own shuffled order. The moment they both like
   the same title, both screens jump to the match reveal — poster, details, and direct links to
   watch it now.
5. No match after 30? Gemini re-runs the brief leaning into what was actually swiped right on, for
   one more round of 30 new titles. Still nothing after that? Both partners see the top 5 by
   combined right-swipes and pick together.
6. The session, both preference profiles, every swipe, the match, and an optional post-watch
   rating are all saved to Supabase — future nights for the same couple reuse a running "taste
   notes" summary Gemini updates after each rating.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the Supabase project and schema

Create a project at [supabase.com](https://supabase.com), then run
[`supabase/schema.sql`](supabase/schema.sql) in its SQL editor (or `supabase db push` if you use
the CLI). It creates all tables with RLS locked down to deny-all for `anon`/`authenticated` — the
app only ever talks to Postgres through the secret key in server-side API routes.

### 3. Get your API keys

Copy `.env.example` to `.env.local` and fill in:

| Key | Where to get it |
| --- | --- |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `TMDB_API_KEY` | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) — the v3 API key, not the read access token |
| `OMDB_API_KEY` | [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx) — free tier is enough |
| `RAPID_API_KEY` / `RAPID_API_HOST` | Whichever India OTT-availability API you're subscribed to on RapidAPI — see the warning below |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Supabase project → Settings → API (new-format project keys) |

**Why two rating sources?** Most India OTT-availability APIs only give an aggregated score, not a
real IMDb rating, so OMDb fills in the genuine `imdbRating` used for the "Minimum IMDb rating"
filter and the number shown on each card.

**⚠️ RapidAPI provider currently unresolved.** [lib/streamingAvailability/client.ts](lib/streamingAvailability/client.ts)
is built against movie-of-the-night's "Streaming Availability API" contract
(`GET /shows/{mediaType}/{tmdbId}?country=in`). If your `RAPID_API_HOST` points at a different
provider (e.g. "OTT details" / `ott-details.p.rapidapi.com`), that client will silently return no
streaming links until it's rewritten against the real contract — get the exact endpoint path +
example response from your RapidAPI dashboard's Endpoints tab and update that file.

### 4. Run it

```bash
npm run dev
```

Open two browser windows (or a phone + laptop) at `http://localhost:3000` to try the full
two-partner flow. On a phone, the QR "Share" button uses the Web Share API, so it only shows a
real share sheet on an actual mobile browser — desktop falls back to downloading the QR image.

## Notes / known limitations

- Supabase is live and verified end-to-end (session creation round-trips through Postgres).
  Gemini, TMDB, and OMDb are wired up but not yet exercised end-to-end together — run the
  two-window test below once all keys are in place.
- RapidAPI OTT lookup is currently a no-op against most providers (see the warning above) — swipe
  cards and the match screen will just show no streaming links until that client is updated.
- "Same couple, next time" relies on each device keeping its own `localStorage` profile — clearing
  site data resets that device's identity (it just starts a fresh couple, nothing breaks).
