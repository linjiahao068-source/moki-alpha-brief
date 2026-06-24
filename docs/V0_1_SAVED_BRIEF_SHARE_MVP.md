# V0.1 Saved Brief Share MVP

Phase 10 adds saved BriefDocument sharing for generated evidence-draft briefs.

Phase 10.0.1 adds mock Consensus Evidence compatibility on top of this save/share flow. It does not change the storage adapter, save API, or share-page rendering model.

## What Changed

- Added `SavedBriefRecord` in `src/types/savedBrief.ts`.
- Added a server-only storage adapter layer in `src/lib/storage/*`.
- Added local development memory storage.
- Added Upstash Redis storage for Vercel-style deployments.
- Added `POST /api/briefs` to save a generated BriefDocument.
- Added `GET /api/briefs/[slug]` to read a saved BriefDocument.
- Updated `/generate` with `Save & Create Share Link`, `Copy Link`, and `Open Share Page`.
- Updated `/s/[slug]` to read saved briefs first and render the saved BriefDocument without regeneration.

## Storage

Environment variables:

```env
BRIEF_STORAGE_PROVIDER=memory
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
BRIEF_SHARE_BASE_URL=http://localhost:3000
```

Rules:

- Local development defaults to `memory`.
- Production deployments should use `BRIEF_STORAGE_PROVIDER=upstash`.
- Upstash credentials are read only on the server.
- Do not create or use `NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN`.
- Do not commit real Upstash tokens, LLM API keys, provider responses, or `.env.local`.

Redis key format:

```text
brief:{slug}
```

Slug format:

```text
ticker-lowercase-yyyymmdd-randomsuffix
```

Example:

```text
nvda-20260624-a1b2c3
```

## Saved Record

`SavedBriefRecord` stores:

- `id`
- `slug`
- `title`
- `ticker`
- `companyName`
- `createdAt`
- `updatedAt`
- `schemaVersion`
- `dataMode: "evidence-draft"`
- `evidenceLevel`
- `modelProvider`
- `modelName`
- `isFallback`
- `briefDocument`
- `evidenceSummary`
- `sourceCounts`
- `warnings`
- `disclaimer`

The saved record is designed to render `/s/[slug]` directly.

## API Contract

`POST /api/briefs` accepts a rendered `BriefDocument` and metadata from the generation result. It validates the document, sanitizes unsafe fields, saves it, and returns:

```json
{
  "ok": true,
  "slug": "nvda-20260624-a1b2c3",
  "shareUrl": "http://localhost:3000/s/nvda-20260624-a1b2c3",
  "savedBrief": {}
}
```

`GET /api/briefs/[slug]` returns:

```json
{
  "ok": true,
  "savedBrief": {}
}
```

Not found:

```json
{
  "ok": false,
  "error": "Brief not found"
}
```

## Share Page Behavior

`/s/[slug]` reads saved storage first.

If a saved brief exists:

- It renders `savedBrief.briefDocument`.
- It shows saved metadata, ticker, evidence level, `dataMode=evidence-draft`, source counts, warnings, and disclaimer.
- It does not call the LLM.
- It does not call Search, SEC, IR, Market, or Consensus providers.
- It can display a saved BriefDocument whose evidence level includes `search-sec-ir-market-and-consensus`.
- It does not display raw JSON, `reasoning_content`, raw provider responses, or raw model output.

If `slug=nvda` and storage has no saved record, `/s/nvda` continues to show the existing static NVDA demo.

All other missing slugs show the Moki not-found state.

## Security And Boundary Rules

The save path rejects `verified-real-data`.

The save path only accepts `metadata.dataMode="evidence-draft"`.

The saved payload is sanitized to remove:

- API keys
- tokens
- authorization fields
- raw model output
- raw provider responses
- `reasoning_content`
- internal error stacks
- debug fields

The saved payload keeps:

- the renderable `briefDocument`
- ticker and company name
- created/updated timestamps
- evidence level and source counts
- consensus evidence summary when the generated BriefDocument contains `consensusEvidencePack`
- model provider/model name
- fallback flag
- warnings and disclaimer

## Product Scope

This phase does not add:

- login
- permissions
- payment
- editor
- history versions
- regeneration
- SEO metadata
- OG image generation

Share links are unlisted public links. Anyone with the URL can view the saved brief.

The page remains `dataMode=evidence-draft` and does not constitute investment advice.
