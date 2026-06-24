# Moki Alpha Brief

Moki Alpha Brief is a V0.1 public research brief clone for a buy-side style NVDA memo.

Current status: V0.1 static share page plus Phase 10 Saved Brief Share MVP and Phase 10.0.1 Consensus Evidence Backfill. Generated evidence-draft BriefDocuments can be saved and opened through real unlisted `/s/[slug]` links. Consensus estimates are mock evidence in this MVP. It defaults to evidence-draft / mock-safe behavior and keeps the Moki black, white, and gold visual system.

## Local Run

```bash
npm install
npm run dev
```

Windows PowerShell can use `npm.cmd` if `npm.ps1` is blocked.

## Page Paths

- `/` - demo brief
- `/s/nvda` - static NVDA demo, unless a saved `nvda-*` style slug is opened
- `/s/test` - Moki-styled not found state
- `/generate` - internal LLM / mock generation page with Fast and Deep Reasoning modes plus saved share link creation

## Checks

```bash
npm run lint
npm run build
```

## Saved Brief Share MVP

Phase 10 saves the rendered `BriefDocument` after generation and returns a real unlisted public share link.

Local development defaults to the memory store:

```env
BRIEF_STORAGE_PROVIDER=memory
BRIEF_SHARE_BASE_URL=http://localhost:3000
```

Production deployments should use Upstash Redis:

```env
BRIEF_STORAGE_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Do not expose Upstash tokens through `NEXT_PUBLIC_*` variables and do not commit real tokens.

Saved share pages read storage only. They do not call the LLM and do not fetch Search, SEC, IR, Market, or Consensus evidence again. Saved briefs remain `dataMode=evidence-draft`, reject `verified-real-data`, and do not store `reasoning_content`, raw model output, raw provider responses, or API keys.

Share links are unlisted public links and do not add login, permissions, editing, payment, history versions, SEO, or OG image generation.

## Not Connected In V0.1

- No committed LLM API key
- No real serenity-skill execution
- No formal trading quote feed or consensus estimate feed
- No login or saved user account
- No editor, permissions, payment, or history versions
- No PDF full-text parsing or transcript full-text parsing

The optional DeepSeek provider uses `.env.local` only:

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
```

`/generate` can choose Fast (`deepseek-chat`) or Deep Reasoning (`deepseek-reasoner`). The reasoner mode does not show, save, or pass back internal reasoning; it only renders the final structured BriefDocument JSON.

`/generate` can also enable Search, SEC, Company IR, Market, and Consensus Evidence Draft modes. Without `TAVILY_API_KEY`, search-backed IR falls back to mock IR evidence. Market Evidence uses `MARKET_PROVIDER=auto-free` by default and tries `stock-api -> global-stock-data -> mock`. Consensus Evidence uses `CONSENSUS_PROVIDER=mock` and does not call FMP or Finnhub in Phase 10.0.1.

Market Evidence is third-party free quote / volume / recent daily kline context only. It may be delayed, incomplete, field-limited, or unavailable. It is not a formal trading quote, not consensus, not a formal rating, not a formal target price, and not verified-real-data.

Consensus Evidence is mock revenue / EPS analyst estimate context only. It is not SEC actual data, not market price data, not verified-real-data, not a formal rating, not a formal target price, and not investment advice.

Saved Brief Share:

- `docs/V0_1_SAVED_BRIEF_SHARE_MVP.md`

Consensus Evidence Backfill:

- `docs/V0_1_CONSENSUS_ESTIMATES_BACKFILL.md`

## Docs

Start here:

- `docs/V0_1_ALPHA_BRIEF_HANDOFF.md`

Brief schema:

- `docs/V0_1_BRIEF_SCHEMA.md`

LLM generation MVP:

- `docs/V0_1_LLM_GENERATION_MVP.md`

Data boundary:

- `docs/V0_1_DATA_BOUNDARY.md`

Prompt quality:

- `docs/V0_1_PROMPT_QUALITY.md`

Search evidence:

- `docs/V0_1_SEARCH_EVIDENCE_MVP.md`
- `docs/V0_1_SEARCH_EVIDENCE_QA.md`

SEC evidence:

- `docs/V0_1_SEC_EVIDENCE_MVP.md`

Research evidence context:

- `docs/V0_1_RESEARCH_EVIDENCE_CONTEXT.md`

Company IR evidence:

- `docs/V0_1_COMPANY_IR_EVIDENCE_MVP.md`

Market evidence:

- `docs/V0_1_MARKET_DATA_MVP.md`

Saved brief share:

- `docs/V0_1_SAVED_BRIEF_SHARE_MVP.md`

Evidence status copy:

- Phase 9.3.1 fixed `search-and-sec` status copy so the UI no longer says SEC is missing when SEC Evidence is attached.

Mobile QA:

- `docs/V0_1_MOBILE_QA_REPORT.md`
