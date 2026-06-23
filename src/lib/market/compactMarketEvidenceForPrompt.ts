import type { MarketEvidencePack } from "@/types/evidence";

export function compactMarketEvidenceForPrompt(pack?: MarketEvidencePack) {
  if (!pack) return undefined;

  return {
    asOf: pack.asOf,
    ticker: pack.ticker,
    companyName: pack.companyName,
    provider: pack.provider,
    providerChain: pack.providerChain,
    attemptedProviders: pack.attemptedProviders,
    dataMode: pack.dataMode,
    quote: pack.quote
      ? {
          symbol: pack.quote.symbol,
          name: pack.quote.name,
          provider: pack.quote.provider,
          price: pack.quote.price,
          previousClose: pack.quote.previousClose,
          open: pack.quote.open,
          high: pack.quote.high,
          low: pack.quote.low,
          volume: pack.quote.volume,
          change: pack.quote.change,
          percentChange: pack.quote.percentChange,
          marketCap: pack.quote.marketCap,
          peRatio: pack.quote.peRatio,
          currency: pack.quote.currency,
          exchange: pack.quote.exchange,
          marketTimestamp: pack.quote.marketTimestamp,
          retrievedAt: pack.quote.retrievedAt,
          dateStatus: pack.quote.dateStatus,
          confidence: pack.quote.confidence,
        }
      : undefined,
    priceHistory: (pack.priceHistory || []).slice(-10),
    sources: pack.sources.slice(0, 4).map((source) => ({
      id: source.id,
      title: source.title,
      url: source.url,
      domain: source.domain,
      publisher: source.publisher,
      confidence: source.confidence,
      retrievedAt: source.retrievedAt,
      dateStatus: source.dateStatus,
    })),
    warnings: (pack.warnings || []).slice(0, 6),
  };
}
