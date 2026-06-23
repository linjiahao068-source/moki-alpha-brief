# V0.1 Market Data Evidence MVP

## Phase 9.5 Goal

Phase 9.5 adds a free Market Evidence MVP based on the public request patterns documented by `global-stock-data`.

This phase implements the project's own TypeScript `MarketEvidenceProvider`. It does not run the Python skill, does not start a Python service, and does not migrate the full `global-stock-data` endpoint surface.

Scope:

- Quote / market snapshot context.
- Recent daily kline context.
- US ticker support such as `NVDA`, `TSLA`, `ORCL`, `SNOW`, and `MSFT`.
- Minimal Hong Kong ticker compatibility such as `0700.HK` and `9988.HK`.

Out of scope:

- Twelve Data, Polygon, Finnhub, or other paid/stable commercial providers.
- Consensus estimates.
- Database persistence.
- Saved generated share links.
- Trading signals.
- Formal buy/sell/hold ratings.
- Formal target prices.
- Raw provider response display.
- DeepSeek internal reasoning display.

## Phase 9.5.1 Update

Phase 9.5.1 adds the `stock-api` package as an additional server-side market provider and introduces `MARKET_PROVIDER=auto-free`.

`auto-free` tries providers in this order:

```text
stock-api -> global-stock-data -> mock
```

The `stockApiMarketProvider` uses `stocks.auto.getStock()` for the normalized quote snapshot and `stocks.auto.getKlines(..., { period: "day" })` for recent daily kline context. It maps the stable public fields into `MarketEvidencePack`, never exposes raw provider responses, and remains server-side only.

This phase still does not add Twelve Data, Polygon, Finnhub, consensus estimates, a database, saved generated results, real share links, formal target prices, formal ratings, or verified-real-data.

## Environment

`.env.example` now includes:

```env
MARKET_PROVIDER=auto-free
MARKET_MAX_DAILY_POINTS=30
MARKET_DATA_REGION=auto
```

Supported values:

- `auto-free`: `stock-api -> global-stock-data -> mock`.
- `stock-api`: try `stockApiMarketProvider`, then fall back to mock.
- `global-stock-data`: try `globalStockDataMarketProvider`, then fall back to mock.
- `mock`: use `mockMarketProvider` only.

No API key is required. There is no `NEXT_PUBLIC_MARKET_PROVIDER`, and no real secret should be written into code or documentation.

## MarketEvidencePack

`src/types/evidence.ts` adds:

- `MarketEvidencePack`
- `MarketQuote`
- `MarketPricePoint`

The pack is always:

```ts
dataMode: "evidence-draft"
provider: "mock" | "stock-api" | "global-stock-data"
```

Market evidence is not SEC official-financial data, not consensus, and not verified-real-data.

Every quote includes:

- `provider`
- `retrievedAt`
- `confidence: "medium"`

When a provider has no market timestamp, `dateStatus` is `retrieved-only`.

## Provider Strategy

`stockApiMarketProvider` uses the `stock-api` Node / TypeScript API:

- `stocks.auto.getStock(code)` for quote context.
- `stocks.auto.getKlines(code, { period: "day", count })` for daily kline context.
- US tickers are adapted as `USNVDA`, `USTSLA`, `USORCL`, `USSNOW`, and `USMSFT`.
- Hong Kong tickers such as `0700.HK` are lightly adapted to `HK00700`.

`globalStockDataMarketProvider` remains available and uses TypeScript `fetch` and public endpoints inspired by `global-stock-data`:

- Yahoo chart for quote context and daily kline.
- Sina US daily kline where available.
- Tencent / Sina quote endpoints as quote fallbacks.

The provider returns normalized quote, recent daily kline, sources, and warnings only. It never returns raw provider responses to the frontend.

If configured public market sources fail, `buildMarketEvidencePack` falls back according to the selected provider chain and records warnings such as:

- `stock-api failed; falling back to global-stock-data.`
- `global-stock-data failed; falling back to mock.`
- `Provider fallback used when public source is unavailable.`
- `Free public market data source may be delayed or incomplete.`
- `Market evidence is for research context only, not official trading quote.`
- `Consensus estimates are not connected.`

## API

New endpoint:

```text
POST /api/market-evidence
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
  "provider": "stock-api",
  "isFallback": false,
  "providerChain": ["stock-api", "global-stock-data", "mock"],
  "attemptedProviders": ["stock-api"],
  "marketEvidencePack": {},
  "warnings": []
}
```

Only POST is supported. The API does not use a database and does not save results.

## ResearchEvidenceContext

`ResearchEvidenceContext` now supports `marketEvidencePack`.

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

New fact types:

- `market-price`
- `market-volume`
- `market-price-history`
- `market-valuation-context`

New allowed use values:

- `market-context`
- `valuation-context`
- `monitoring-dashboard`

SEC `official-financial` facts still come only from SEC companyfacts. Consensus remains missing.

## Generate Flow

`POST /api/generate-brief` accepts:

```json
{
  "ticker": "NVDA",
  "companyName": "NVIDIA",
  "language": "zh-CN",
  "modelMode": "chat",
  "useSearch": true,
  "useSec": true,
  "useIr": true,
  "useMarket": true
}
```

When all evidence toggles are enabled, the expected evidence level is:

```text
search-sec-ir-and-market
```

`dataMode` remains `evidence-draft`.

## Prompt Boundary

Market evidence may support:

- Investment View market context.
- Valuation context.
- Monitoring Dashboard price, volume, price history, and refresh metrics.
- Catalysts / risks only as market context alongside Search and IR.

Market evidence must not support:

- Formal target price.
- Formal buy/sell/hold rating.
- Implied return as a real recommendation.
- Consensus estimates.
- SEC official-financial facts.

SourceNote must mention:

- Market provider.
- `retrievedAt` / `marketTimestamp`.
- Free public market data may be delayed or incomplete.
- Consensus still missing.
- Database save and manual verification still missing.
- `dataMode=evidence-draft`.
- Not investment advice.

## UI

`/generate` adds:

- `Use Market Data`
- Market provider status.
- Market price status.
- Market timestamp / retrievedAt status.
- `MarketEvidencePanel`

`MarketEvidencePanel` displays normalized fields only:

- price
- change
- percentChange
- volume
- previousClose
- open
- high
- low
- marketCap
- currency
- exchange
- retrievedAt
- warnings

Missing fields display `N/A`.

The panel does not use red/green trading colors, does not display raw JSON, and does not display raw provider responses.

## Quality Checks

Validation and quality checks now warn or issue when:

- `useMarket=true` but no `marketEvidencePack` is attached.
- Evidence level includes Market but Market evidence is missing.
- SourceNote says market evidence is not connected while Market evidence is attached.
- The brief claims consensus is connected while `coverage.hasConsensus=false`.
- The brief outputs a formal target price or formal rating.
- Market evidence exists but Investment View or Monitoring Dashboard does not reflect market context.
- Market fallback mock is used.

Warnings do not directly trigger fallback.

## Current Boundary

This MVP improves evidence-draft market context only.

It is not a formal trading quote, not a trading signal system, not a rating system, not consensus, and not verified-real-data.

Future commercial stability can add providers such as Twelve Data, Polygon, or Finnhub, but Phase 9.5.1 intentionally does not do that.
