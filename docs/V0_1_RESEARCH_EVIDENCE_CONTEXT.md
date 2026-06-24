# V0.1 Research Evidence Context

## Phase 9.3 Goal

Phase 9.3 merges Search Evidence Pack and SEC Evidence Pack into a unified `ResearchEvidenceContext`. The goal is not to add a new external data source. The goal is to keep source classes, factual claims, missing coverage, and prompt usage rules separate and auditable.

The current Phase 10.0.1 scope includes Search, SEC, Company IR, Market, mock Consensus Evidence, and saved public share pages. It still excludes manual verification, login, editing, history versions, PDF full-text parsing, transcript full-text parsing, and real FMP / Finnhub consensus providers.

## Why This Layer Exists

Search Evidence and SEC Evidence have different jobs:

- Search evidence supports recent developments, catalysts, risk context, and market discussion.
- SEC evidence supports official filing metadata and official financial facts from companyfacts.
- Search snippets must not become official financial facts.
- SEC facts must not be treated as real-time market data or consensus estimates.

`ResearchEvidenceContext` gives the prompt and QA UI one compact evidence object while preserving those boundaries.

## Evidence Level

- `none`: no search or SEC evidence.
- `search-only`: Search Evidence Draft only.
- `sec-only`: SEC Evidence Draft only.
- `search-and-sec`: both Search Evidence Draft and SEC Evidence Draft.

All current evidence-backed modes remain `dataMode: "evidence-draft"`. The current MVP must not use `verified-real-data`.

## Source Registry

`sourceRegistry` is the unified source list. Each source records:

- `sourceKind`: search, sec, manual, or mock
- `sourceType`: news, company-ir, web, sec-submission, sec-companyfacts, market-commentary, or manual
- title, URL, domain, publisher
- confidence
- retrievedAt / publishedAt / dateStatus
- linkedFactIds

## Fact Ledger

`factLedger` classifies facts by source and allowed use:

- `official-financial`: SEC companyfacts only; used for Financial Deep Dive.
- `filing-metadata`: SEC submissions metadata.
- `recent-development`: search evidence for recent context.
- `risk-catalyst`: search evidence for catalysts and risks.
- `market-discussion`: low-confidence discussion or aggregator context.
- `llm-analysis-placeholder`: reserved for future use.

`allowedUse` can be financial-analysis, recent-developments, risk-catalyst, context-only, or not-for-facts.

## Coverage Summary

`coverage` records what is present and what is missing:

- hasSearchEvidence
- hasSecEvidence
- hasRecentFilings
- hasFiscalFacts
- hasRevenueFact
- hasNetIncomeFact
- hasEpsFact
- hasMarketPrice: false
- hasConsensus: false
- hasCompanyIr: false
- missing
- warnings

The current MVP always marks real-time market price, consensus estimates, and company IR narrative as missing.

## Prompt Rules

When `ResearchEvidenceContext` exists:

- Financial Statement Deep Dive may only use `official-financial` facts from SEC companyfacts.
- Company Snapshot may use SEC filing metadata and official financial facts.
- Catalysts may use `recent-development` and `risk-catalyst` facts.
- Key Risks may use search evidence or missing coverage.
- Low-confidence search sources can only be discussion context.
- Valuation cannot output real target price, implied return, or formal rating because market price and consensus are missing.
- SourceNote must mention evidenceLevel, search source count, SEC CIK / filing count / fact count, and missing data.

## UI

`/generate` now shows `ResearchEvidencePanel` before Source Evidence and SEC Evidence detail panels. It summarizes:

- Evidence Level
- Coverage Summary
- Missing Data
- Source Registry Summary
- Fact Ledger Summary
- Evidence Warnings

It does not show raw SEC companyfacts JSON, raw Tavily response, raw model output, or deepseek-reasoner `reasoning_content`.

## Safety Boundary

This page is for research and information reference only and does not constitute investment advice. Search Evidence Draft and SEC Evidence Draft must not be treated as verified real data.

## Phase 9.4 Company IR Evidence Update

Phase 9.4 adds Company IR / earnings-release evidence to this context.

New evidence levels:

- `ir-only`
- `search-and-ir`
- `sec-and-ir`
- `search-sec-and-ir`

New context fields and roles:

- `irEvidencePack`
- `sourceKind: "ir"`
- `management-commentary`
- `company-guidance-context`
- `business-update`

Coverage now includes:

- `hasCompanyIr`
- `hasEarningsRelease`
- `hasManagementCommentary`
- `hasGuidanceContext`

IR evidence is limited to company official narrative, management commentary, business updates, and company guidance context. It must not be treated as SEC official-financial data, consensus estimates, real-time market price, or verified real data.

See: `docs/V0_1_COMPANY_IR_EVIDENCE_MVP.md`.

## Suggested Next Phases

- Phase 9.5: real-time market snapshot MVP.
- Phase 9.6: consensus / valuation input MVP.
- Phase 9.7: evidence cache, generated brief persistence, and real `/s/[slug]` share pages.
## Phase 9.3.1 Evidence Status Copy Fix

Phase 9.3.1 fixes the visible evidence status copy for `evidenceLevel=search-and-sec`. When Search Evidence and SEC Evidence are both attached, the page now says that Tavily/search evidence and SEC companyfacts / submissions are connected, while real-time market price, consensus estimates, company IR narrative parsing, database save, and manual verification are still missing.

This avoids the earlier contradiction where the status cards showed `SEC Provider=sec` but explanatory copy still said SEC was not connected. The data mode remains `evidence-draft`; the page still must not display `verified-real-data`.

## Phase 9.5 Market Evidence Update

Phase 9.5 adds free Market Evidence based on public `global-stock-data` request patterns.

New context field:

- `marketEvidencePack`

New evidence levels:

- `market-only`
- `search-and-market`
- `sec-and-market`
- `ir-and-market`
- `search-sec-and-market`
- `search-ir-and-market`
- `sec-ir-and-market`
- `search-sec-ir-and-market`

New coverage flags:

- `hasMarketPrice`
- `hasMarketVolume`
- `hasMarketPriceHistory`
- `hasMarketCap`

New fact ledger types:

- `market-price`
- `market-volume`
- `market-price-history`
- `market-valuation-context`

Market evidence is third-party free quote / volume / recent daily kline context only. It is not SEC official-financial data, not consensus, not a formal trading quote, not a trading signal, and not verified-real-data.

Consensus estimates, database-style history, login, permissions, and manual verification remain missing.

## Phase 10.0.1 Consensus Evidence Backfill

Phase 10.0.1 adds mock Consensus Evidence to the existing Research Evidence Context after the Phase 10 save/share MVP.

New context field:

- `consensusEvidencePack`

New evidence levels include:

- `consensus-only`
- `market-and-consensus`
- `search-sec-ir-market-and-consensus`

New coverage flags:

- `hasConsensus`
- `hasRevenueConsensus`
- `hasEpsConsensus`
- `hasAnalystCount`

New fact ledger types:

- `consensus-revenue`
- `consensus-eps`
- `consensus-range`
- `analyst-count`

Consensus Evidence is mock-only in this phase. It is not SEC actual data, not market price data, not verified-real-data, not a formal rating, not a formal target price, and not investment advice. Search, IR, and Market numbers must not be rewritten as consensus estimates.

Saved share pages keep consensus evidence inside the saved `BriefDocument`; they do not rebuild the context or fetch consensus again.

See: `docs/V0_1_CONSENSUS_ESTIMATES_BACKFILL.md`.

## Phase 10 Saved Brief Share Update

Phase 10 adds saved share links without changing the `ResearchEvidenceContext` evidence model.

The generation path still builds Search, SEC, IR, Market, and Consensus evidence before the `BriefDocument` is created. The save path only persists the already rendered `BriefDocument` and compact metadata.

Saved share pages:

- read `SavedBriefRecord` from storage;
- render `savedBrief.briefDocument`;
- show `evidenceLevel`, `dataMode=evidence-draft`, source counts, warnings, disclaimer, and compact evidence summary;
- do not call LLM providers;
- do not call Search, SEC, IR, Market, or Consensus providers;
- do not rebuild `ResearchEvidenceContext`;
- do not display raw provider responses, raw model output, raw JSON, or `reasoning_content`.

`dataMode` remains `evidence-draft`; `verified-real-data` remains forbidden.

Database-style history, permissions, login, editing, regeneration, manual verification, SEO, and OG image generation remain out of scope.

See: `docs/V0_1_SAVED_BRIEF_SHARE_MVP.md`.

See: `docs/V0_1_MARKET_DATA_MVP.md`.

## Phase 9.5.1 Stock API Provider Update

Phase 9.5.1 keeps the same `ResearchEvidenceContext` shape and adds provider compatibility inside `marketEvidencePack`.

Market provider support now includes:

- `stock-api`
- `global-stock-data`
- `mock`

Recommended local configuration:

```env
MARKET_PROVIDER=auto-free
```

`auto-free` attempts:

```text
stock-api -> global-stock-data -> mock
```

`marketEvidencePack.provider` records the final successful provider, while `providerChain` and `attemptedProviders` may record the configured chain and attempted providers. Market evidence remains third-party free market context only. It is not a formal trading quote, not consensus, not SEC official-financial data, not a formal rating, not a formal target price, and not verified-real-data.

Consensus estimates, database-style history, login, permissions, and manual verification remain missing.
