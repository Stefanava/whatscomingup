# What's Coming Up

A listings site for queer nightlife in London. It pulls upcoming events from ~30 venues and club nights into one place, lets you filter by venue, and (optionally) lets you sign in with Google to save favourites.

## How AI was used

**As a product feature.** Most venues don't publish a structured events feed — just an HTML listings page. Rather than the initial approach of using hand-written web scrapers, one per venue, events run at venues without a structured API are extracted by an LLM (Claude Haiku via the Anthropic API, called directly from a Supabase Edge Function — see [`_shared/llm-extract.ts`](supabase/functions/_shared/llm-extract.ts)).

The page HTML is sent with a JSON-schema-constrained prompt ("extract events into this shape, don't invent data, use null for missing fields") and the model returns structured event data. A couple of venues need a light preprocessing step first (e.g. Eagle London embeds its events as a JSON blob inside a Wix `<script>` tag rather than as visible HTML — that gets regex-extracted before it's handed to the model).

**As a development tool.** This project was built with heavy use of Claude Code as a pair-programming/agentic collaborator — planning changes, writing code, running and debugging builds, and carrying out multi-file migrations. All of it was human-directed and reviewed rather than autonomous: I set the direction and scope, reviewed the diffs, and made the calls on tradeoffs.

## Architecture

```
Browser
  │
  ▼
Express server (Node, Fly.io)  ──────────────┐
  │  serves static frontend (dist/)           │  proxies a few routes to
  │  Google OAuth session (Passport)           │  Supabase Edge Functions
  │  reads venues/events directly from Postgres│  (for on-demand scrape runs)
  ▼                                            ▼
Supabase Postgres                    Supabase Edge Functions (Deno)
  venues, events,                      refresh-events
  users, user_favourites               update-event-details
  │                                       │
  │                                       ▼
  │                              per-venue "provider" adapter:
  │                              ra / skiddle / rest-json /
  │                              jsonld-sitemap / ai (LLM)
  │                                       │
  └───────────── pg_cron + pg_net ────────┘
   (schedules the two Edge Functions daily / every 15 min,
    independently of the Node server)
```

**Frontend** — vanilla JS and SCSS (no framework), bundled with Parcel 2. Renders venue pills and a chronological event list from two JSON endpoints.

**Server** (`server/`) — a thin Express app. It does three jobs:
1. Serves the built frontend.
2. Reads `venues`/`events` straight from Postgres for the two main list endpoints.
3. Proxies a handful of routes (`/refresh-events`, `/scrape-venues`, `/update-event-details`, `/venue/:slug/preview`) through to the matching Supabase Edge Function, and handles optional Google login + favourites (session stored in Postgres via `connect-pg-simple`).

The server has **no knowledge of how any venue's events are gathered** — that logic lives entirely in the Edge Functions.

**Database** — Supabase-hosted Postgres. `venues` rows carry a `provider` + `provider_config` (JSONB) describing *how* to fetch that venue's events; adding a venue is a DB row, not a new code file. Schema changes are tracked as plain numbered SQL files in [`server/db/migrations/`](server/db/migrations) (applied manually — there's no migration runner).

**Edge Functions** (`supabase/functions/`, TypeScript on Deno):
- `refresh-events` — fetches events for every active venue (or one, via `?slug=`), incrementally by default or a full rebuild via `?mode=full`, then dedupes. Venues run concurrently.
- `update-event-details` — backfills missing description/cost/image on events that came from an LLM-scraped venue, in bounded batches (safe to call repeatedly on a schedule until the backlog clears).
- Both are scheduled independently of the Node server via Postgres `pg_cron` + `pg_net` (see [`003_schedule_edge_functions.sql`](server/db/migrations/003_schedule_edge_functions.sql)), so events keep refreshing even if the Fly.io app is asleep (it scales to zero when idle).

**Provider adapters** (`supabase/functions/_shared/`) — each venue resolves to exactly one of:
| provider | source |
|---|---|
| `ra` | Resident Advisor promoter API |
| `skiddle` | Skiddle API |
| `rest-json` | a generic REST/JSON endpoint (field names configured per venue) |
| `jsonld-sitemap` | crawls a sitemap, extracts JSON-LD event data from each page |
| `ai` / unset | LLM extraction against the venue's own listings HTML |

**Auth** — Google OAuth via Passport, entirely optional: if `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` aren't set, the app just runs without login and the favourites feature is hidden.

**Hosting** — Fly.io (Node app, Dockerfile, scales to zero when idle) + Supabase (Postgres + Edge Functions, always-on for the scheduled scrapes).

## Tech stack

Node.js, Express, PostgreSQL (Supabase), Supabase Edge Functions (Deno/TypeScript), Anthropic Claude API, Passport.js, Parcel 2, vanilla JS/SCSS, Fly.io.

## Running locally

```bash
nvm use          # Node version pinned in .nvmrc
npm install
npm start         # builds the frontend, then runs the server with nodemon
```

Needs a `.env` with at least:

| var | purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Supabase) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | so the Node server can call the Edge Functions |
| `PORT` | defaults to 3000 |
| `SESSION_SECRET` | optional, falls back to a dev default |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | optional — omit to run without login |

The Edge Functions themselves are deployed and configured separately via the Supabase CLI (`supabase/`), with their own secrets (`ANTHROPIC_API_KEY`, `LLM_EXTRACTION_MODEL`, `SKIDDLE_API_KEY`, and any per-venue API keys referenced from `provider_config`) set via `supabase secrets set` rather than this repo's `.env`.

## Next steps

_A running log of things worth doing next — added to as they come up._

- No automated test suite yet.
