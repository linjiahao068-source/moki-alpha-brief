# V0.1 Research Evidence Context

## Phase 9.3 Goal

Phase 9.3 merges Search Evidence Pack and SEC Evidence Pack into a unified `ResearchEvidenceContext`. The goal is not to add a new external data source. The goal is to keep source classes, factual claims, missing coverage, and prompt usage rules separate and auditable.

Current scope still excludes real-time market price, consensus estimates, company IR narrative parsing, database persistence, and saved public share pages.

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

## Suggested Next Phases

- Phase 9.4: real-time market snapshot MVP.
- Phase 9.5: consensus / valuation input MVP.
- Phase 9.6: evidence cache, generated brief persistence, and real `/s/[slug]` share pages.
## Phase 9.3.1 Evidence Status Copy Fix

Phase 9.3.1 fixes the visible evidence status copy for `evidenceLevel=search-and-sec`. When Search Evidence and SEC Evidence are both attached, the page now says that Tavily/search evidence and SEC companyfacts / submissions are connected, while real-time market price, consensus estimates, company IR narrative parsing, database save, and manual verification are still missing.

This avoids the earlier contradiction where the status cards showed `SEC Provider=sec` but explanatory copy still said SEC was not connected. The data mode remains `evidence-draft`; the page still must not display `verified-real-data`.
