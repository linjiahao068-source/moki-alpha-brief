# V0.1 Company IR / Earnings Release Evidence MVP

## Phase 9.4 Goal

Phase 9.4 adds Company IR / earnings-release evidence to the existing Research Evidence Context. The goal is to let DeepSeek generate a `BriefDocument` from Search + SEC + IR evidence while preserving clear source boundaries.

This phase does not add real-time market price, consensus estimates, database persistence, saved share links, PDF full-text parsing, transcript full-text parsing, or new third-party API keys.

## New Evidence Type

`src/types/evidence.ts` now includes `IrEvidencePack`.

Core fields:

- `asOf`
- `ticker`
- `companyName`
- `provider: "mock" | "search"`
- `dataMode: "evidence-draft"`
- `irItems`
- `sources`
- `warnings`

Each `IrEvidenceItem` stores title, URL, domain, publisher, source type, published / retrieved dates, snippet, confidence, theme, and allowed use.

Allowed role:

- Company official narrative
- Management commentary
- Business updates
- Company guidance context

Forbidden role:

- SEC official-financial data
- Consensus estimates
- Real-time market price
- Verified real data

## Provider Design

New module:

```text
src/lib/ir/
```

Files:

- `types.ts`
- `config.ts`
- `classifyIrSource.ts`
- `providers/mockIrProvider.ts`
- `providers/searchIrProvider.ts`
- `buildIrEvidencePack.ts`
- `compactIrEvidenceForPrompt.ts`

`IR_PROVIDER=search` reuses the existing Tavily search path and `TAVILY_API_KEY`. It does not add a new API key. Search failure or missing Tavily config falls back to mock IR evidence.

The IR builder stores search snippets and metadata only. It does not download PDFs, parse HTML full text, or parse transcript full text. Final `irItems` are capped at 5.

## API

New route:

```text
POST /api/ir-evidence
```

Request:

```json
{
  "ticker": "NVDA",
  "companyName": "NVIDIA"
}
```

Response:

```json
{
  "ok": true,
  "provider": "search",
  "isFallback": false,
  "irEvidencePack": {},
  "warnings": []
}
```

Only POST is supported. The API does not use a database and does not save results.

## ResearchEvidenceContext

`ResearchEvidenceContext` now supports:

- `irEvidencePack`
- `evidenceLevel: "ir-only" | "search-and-ir" | "sec-and-ir" | "search-sec-and-ir"`
- `sourceKind: "ir"`
- IR fact types: `management-commentary`, `company-guidance-context`, `business-update`
- coverage flags: `hasCompanyIr`, `hasEarningsRelease`, `hasManagementCommentary`, `hasGuidanceContext`

SEC `official-financial` facts still come only from SEC companyfacts. IR evidence cannot become official financial facts.

## Generate Flow

`POST /api/generate-brief` now accepts:

```json
{
  "ticker": "NVDA",
  "companyName": "NVIDIA",
  "language": "zh-CN",
  "modelMode": "chat",
  "useSearch": true,
  "useSec": true,
  "useIr": true
}
```

When all three evidence toggles are on, the result should show:

- `dataMode=evidence-draft`
- `evidenceLevel=search-sec-and-ir`
- `Evidence = Search + SEC + IR Evidence Draft`
- `fallback=No` when DeepSeek succeeds

## Prompt Boundary

Prompt rules now distinguish:

- Search: recent public context, catalysts, risks, market discussion
- SEC: official filings metadata and official financial facts from companyfacts
- IR: company official narrative, management commentary, business updates, and company guidance context

Guidance / Outlook must use the phrase company guidance context, not consensus. Valuation still cannot output real target price, implied return, or formal rating because real-time market price and consensus are missing.

## UI

`/generate` adds:

- `Use Company IR / earnings release`
- IR provider and source count status cards
- Company IR coverage status
- `IrEvidencePanel`

`IrEvidencePanel` displays title, domain, source type, theme, confidence, date status, retrieved date, URL, and snippet.

## Quality Checks

Validation and quality checks now warn or issue when:

- evidence level includes IR but no IR pack is attached
- source note says Company IR is missing even though IR evidence is attached
- IR is written as consensus
- IR numbers are written as SEC official-financial facts
- IR source count is below 2
- all IR sources are retrieved-only
- Company Snapshot or Key Value Drivers fail to reflect IR when IR evidence is attached

These IR quality warnings do not trigger fallback by themselves.

## Environment

`.env.example` includes:

```env
IR_PROVIDER=search
IR_MAX_RESULTS=5
```

`IR_PROVIDER=search` uses Tavily through the existing search provider capability. No new API key is introduced.

## Phase 9.5 Market Evidence Follow-up

Phase 9.5 keeps Company IR evidence unchanged and adds a separate `MarketEvidencePack`.

IR evidence remains company official narrative / management commentary / business-update / company guidance context only.

Market evidence remains quote / volume / recent daily kline context only.

The two evidence classes must not be merged:

- IR evidence is not SEC official-financial data.
- IR guidance is not consensus.
- Market evidence is not consensus.
- Market evidence is not a formal trading quote or trading signal.

See: `docs/V0_1_MARKET_DATA_MVP.md`.
