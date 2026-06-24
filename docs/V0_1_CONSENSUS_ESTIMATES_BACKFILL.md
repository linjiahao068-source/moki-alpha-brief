# V0.1 Consensus Estimates Backfill

Phase 10.0.1 backfills Consensus Evidence after the Phase 10 Saved Brief Share MVP.

## What Changed

- Added `ConsensusEvidencePack` and `ConsensusEstimate`.
- Added server-only mock consensus config:
  - `CONSENSUS_PROVIDER=mock`
  - `CONSENSUS_PERIOD=quarter`
  - `CONSENSUS_MAX_PERIODS=4`
- Added `src/lib/consensus/*` with a mock provider abstraction.
- Added `POST /api/consensus-evidence`.
- Added `useConsensus` to `/api/generate-brief`.
- Added `consensusEvidencePack` to `ResearchEvidenceContext`.
- Added `ConsensusEvidencePanel` on `/generate`.
- Preserved consensus evidence inside saved `BriefDocument` records and `/s/[slug]` share pages.

## Boundaries

- Current consensus evidence is mock-only.
- It does not call FMP or Finnhub.
- It does not require API keys.
- It must not use `NEXT_PUBLIC_CONSENSUS_PROVIDER`.
- Consensus evidence is not SEC actual data.
- Consensus evidence is not market price data.
- Consensus evidence is not verified-real-data.
- Consensus evidence must not produce a formal target price, formal rating, or investment advice.

## Evidence Usage

Consensus facts can support:

- `consensus-context`
- `expectation-gap`
- `guidance-comparison`
- `context-only`

SEC actuals can only come from SEC `official-financial` facts.

Market price context can only come from Market Evidence.

Search, IR, and Market numbers must not be rewritten as consensus estimates.

## Save And Share Compatibility

Phase 10 save/share logic is unchanged.

Saved share pages:

- render the already saved `BriefDocument`;
- keep `consensusEvidencePack`, `evidenceSummary`, `sourceCounts`, and `evidenceLevel`;
- do not call the LLM;
- do not fetch Search, SEC, IR, Market, or Consensus evidence again;
- do not store raw provider responses, raw model output, `reasoning_content`, or API keys.

## Future Work

Real FMP / Finnhub providers can be added later as Phase 10.0.2 or Phase 9.6.1. They should remain server-side only and preserve the same normalized `ConsensusEvidencePack` boundary.
