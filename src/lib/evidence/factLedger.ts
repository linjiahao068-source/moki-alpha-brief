import type {
  ConsensusEstimate,
  ConsensusEvidencePack,
  EvidenceNewsItem,
  EvidencePack,
  IrEvidenceItem,
  IrEvidencePack,
  MarketEvidencePack,
  MarketPricePoint,
  ResearchEvidenceFact,
  SecEvidencePack,
  SecFiscalFact,
  SecFilingSummary,
} from "@/types/evidence";
import {
  getIrSourceId,
  getMarketSourceId,
  getConsensusSourceId,
  getSearchSourceId,
  getSecSourceId,
} from "./sourceRegistry";

export function buildFactLedger({
  searchEvidencePack,
  secEvidencePack,
  irEvidencePack,
  marketEvidencePack,
  consensusEvidencePack,
}: {
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
  marketEvidencePack?: MarketEvidencePack;
  consensusEvidencePack?: ConsensusEvidencePack;
}): ResearchEvidenceFact[] {
  return [
    ...buildSecFinancialFacts(secEvidencePack),
    ...buildSecFilingFacts(secEvidencePack),
    ...buildSearchFacts(searchEvidencePack),
    ...buildIrFacts(irEvidencePack),
    ...buildMarketFacts(marketEvidencePack),
    ...buildConsensusFacts(consensusEvidencePack),
  ];
}

function buildSecFinancialFacts(secEvidencePack?: SecEvidencePack) {
  if (!secEvidencePack) return [];

  return secEvidencePack.fiscalFacts.map((fact, index) =>
    secFiscalFactToLedgerFact(fact, index, secEvidencePack.provider),
  );
}

function secFiscalFactToLedgerFact(
  fact: SecFiscalFact,
  index: number,
  provider: SecEvidencePack["provider"],
): ResearchEvidenceFact {
  return {
    id: `sec-financial-${index + 1}-${slugify(fact.concept)}`,
    factType: "official-financial",
    sourceKind: provider === "mock" ? "mock" : "sec",
    sourceId: getSecSourceId("sec-companyfacts"),
    label: fact.label || fact.concept,
    value: fact.value,
    unit: fact.unit,
    period: fact.periodEnd || fact.frame || [fact.fy, fact.fp].filter(Boolean).join(" "),
    filed: fact.filed,
    form: fact.form,
    concept: fact.concept,
    confidence: "high",
    allowedUse: "financial-analysis",
    note: "Official financial fact from SEC companyfacts. Do not mix with search snippets.",
  };
}

function buildSecFilingFacts(secEvidencePack?: SecEvidencePack) {
  if (!secEvidencePack) return [];

  return secEvidencePack.recentFilings.map((filing, index) =>
    secFilingToLedgerFact(filing, index, secEvidencePack.provider),
  );
}

function secFilingToLedgerFact(
  filing: SecFilingSummary,
  index: number,
  provider: SecEvidencePack["provider"],
): ResearchEvidenceFact {
  return {
    id: `sec-filing-${index + 1}-${slugify(filing.form)}`,
    factType: "filing-metadata",
    sourceKind: provider === "mock" ? "mock" : "sec",
    sourceId: getSecSourceId("sec-submissions"),
    label: `${filing.form} filed ${filing.filingDate}`,
    value: filing.accessionNumber,
    period: filing.reportDate,
    filed: filing.filingDate,
    form: filing.form,
    confidence: "high",
    allowedUse: "context-only",
    note: filing.description || "SEC submissions filing metadata.",
  };
}

function buildSearchFacts(searchEvidencePack?: EvidencePack) {
  if (!searchEvidencePack?.newsItems?.length) return [];

  return searchEvidencePack.newsItems.map((item, index) =>
    searchItemToLedgerFact(item, index, searchEvidencePack.searchProvider),
  );
}

function searchItemToLedgerFact(
  item: EvidenceNewsItem,
  index: number,
  provider: EvidencePack["searchProvider"],
): ResearchEvidenceFact {
  const confidence = item.confidence || "low";
  const sourceKind = provider === "mock" ? "mock" : "search";
  const factType = getSearchFactType(item);

  return {
    id: `search-${factType}-${index + 1}`,
    factType,
    sourceKind,
    sourceId: getSearchSourceId(item.sourceId || item.id),
    label: item.title,
    value: truncate(item.snippet, 360),
    period: item.publishedAt || item.retrievedAt,
    confidence,
    allowedUse: getAllowedUse(item, confidence),
    note:
      confidence === "low"
        ? "Low-confidence search item. Use only as market discussion context, not as a fact base."
        : "Search evidence draft item. Use for recent developments, catalysts, or risk context only.",
  };
}

function getSearchFactType(item: EvidenceNewsItem): ResearchEvidenceFact["factType"] {
  if (item.confidence === "low") return "market-discussion";
  if (item.theme === "risk") return "risk-catalyst";
  if (item.theme === "catalyst" || item.theme === "company-update") {
    return "recent-development";
  }
  return "market-discussion";
}

function getAllowedUse(
  item: EvidenceNewsItem,
  confidence: "high" | "medium" | "low",
): ResearchEvidenceFact["allowedUse"] {
  if (confidence === "low") return "context-only";
  if (item.theme === "risk") return "risk-catalyst";
  return "recent-developments";
}

function buildIrFacts(irEvidencePack?: IrEvidencePack) {
  if (!irEvidencePack?.irItems?.length) return [];

  return irEvidencePack.irItems.map((item, index) =>
    irItemToLedgerFact(item, index),
  );
}

function irItemToLedgerFact(
  item: IrEvidenceItem,
  index: number,
): ResearchEvidenceFact {
  const factType = getIrFactType(item);

  return {
    id: `ir-${factType}-${index + 1}`,
    factType,
    sourceKind: "ir",
    sourceId: getIrSourceId(item.id),
    label: item.title,
    value: truncate(item.snippet, 360),
    period: item.publishedAt || item.retrievedAt,
    confidence: item.confidence,
    allowedUse:
      item.confidence === "low" ? "context-only" : getIrAllowedUse(item),
    note:
      "Company IR evidence draft item. Use for official company narrative, management commentary, business updates, or company guidance context only. Do not treat it as SEC official financial facts, consensus, or real-time market data.",
  };
}

function getIrFactType(
  item: IrEvidenceItem,
): ResearchEvidenceFact["factType"] {
  if (item.allowedUse === "company-guidance-context") {
    return "company-guidance-context";
  }
  if (item.allowedUse === "business-update") return "business-update";
  return "management-commentary";
}

function getIrAllowedUse(
  item: IrEvidenceItem,
): ResearchEvidenceFact["allowedUse"] {
  if (item.allowedUse === "company-guidance-context") {
    return "company-guidance-context";
  }
  if (item.allowedUse === "business-update") return "business-update";
  if (item.allowedUse === "management-commentary") {
    return "management-commentary";
  }
  return "context-only";
}

function buildMarketFacts(marketEvidencePack?: MarketEvidencePack) {
  if (!marketEvidencePack) return [];

  const quote = marketEvidencePack.quote;
  const sourceKind =
    marketEvidencePack.provider === "mock" ? ("mock" as const) : ("market" as const);
  const sourceId = getMarketSourceId(
    marketEvidencePack.sources[0]?.id || "market-data",
  );
  const facts: ResearchEvidenceFact[] = [];

  if (quote?.price !== undefined) {
    facts.push({
      id: "market-price-1",
      factType: "market-price",
      sourceKind,
      sourceId,
      label: `${quote.symbol} market price context`,
      value: quote.price,
      unit: quote.currency,
      period: quote.marketTimestamp || quote.retrievedAt,
      confidence: "medium",
      allowedUse: "market-context",
      note:
        "Third-party free market evidence. Use as delayed/incomplete market context only, not an official trading quote or recommendation.",
    });
  }

  if (quote?.volume !== undefined) {
    facts.push({
      id: "market-volume-1",
      factType: "market-volume",
      sourceKind,
      sourceId,
      label: `${quote.symbol} market volume context`,
      value: quote.volume,
      unit: "shares",
      period: quote.marketTimestamp || quote.retrievedAt,
      confidence: "medium",
      allowedUse: "monitoring-dashboard",
      note:
        "Third-party free market evidence. Use volume as monitoring context only.",
    });
  }

  if (quote?.marketCap !== undefined || quote?.peRatio !== undefined) {
    facts.push({
      id: "market-valuation-context-1",
      factType: "market-valuation-context",
      sourceKind,
      sourceId,
      label: `${quote.symbol} valuation context`,
      value: [
        quote.marketCap !== undefined ? `marketCap=${quote.marketCap}` : "",
        quote.peRatio !== undefined ? `peRatio=${quote.peRatio}` : "",
      ]
        .filter(Boolean)
        .join("; "),
      unit: quote.currency,
      period: quote.marketTimestamp || quote.retrievedAt,
      confidence: "medium",
      allowedUse: "valuation-context",
      note:
        "Market valuation context only. Do not use it to produce a formal target price, formal rating, or buy/sell signal.",
    });
  }

  const historySummary = summarizeHistory(marketEvidencePack.priceHistory || []);
  if (historySummary) {
    facts.push({
      id: "market-price-history-1",
      factType: "market-price-history",
      sourceKind,
      sourceId,
      label: `${quote?.symbol || marketEvidencePack.ticker} recent daily price history`,
      value: historySummary,
      period: marketEvidencePack.asOf,
      confidence: "medium",
      allowedUse: "monitoring-dashboard",
      note:
        "Recent daily kline context only. Do not infer trading signals or formal recommendations.",
    });
  }

  return facts;
}

function summarizeHistory(points: MarketPricePoint[]) {
  const cleaned = points.filter((point) => point.date && point.close !== undefined);
  if (!cleaned.length) return "";
  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];

  return `${cleaned.length} daily points; first=${first.date} close=${first.close}; last=${last.date} close=${last.close}`;
}

function buildConsensusFacts(consensusEvidencePack?: ConsensusEvidencePack) {
  if (!consensusEvidencePack?.estimates.length) return [];

  const sourceId = getConsensusSourceId(
    consensusEvidencePack.sources[0]?.id || "consensus-estimates",
  );

  return consensusEvidencePack.estimates.flatMap((estimate, index) =>
    consensusEstimateToLedgerFacts({
      estimate,
      index,
      sourceId,
      ticker: consensusEvidencePack.ticker,
    }),
  );
}

function consensusEstimateToLedgerFacts({
  estimate,
  index,
  sourceId,
  ticker,
}: {
  estimate: ConsensusEstimate;
  index: number;
  sourceId: string;
  ticker: string;
}) {
  const facts: ResearchEvidenceFact[] = [];
  const period = estimate.fiscalPeriod || estimate.periodEnd || estimate.estimateDate;
  const sourceKind = "consensus" as const;
  const baseNote =
    "Analyst consensus evidence draft. Use only as revenue / EPS estimate context. It is not SEC actual data, market price data, verified-real-data, a formal rating, or a formal target price.";

  if (estimate.revenueAvg !== undefined) {
    facts.push({
      id: `consensus-revenue-${index + 1}`,
      factType: "consensus-revenue",
      sourceKind,
      sourceId,
      label: `${ticker} revenue consensus estimate`,
      value: estimate.revenueAvg,
      unit: estimate.currency,
      period,
      confidence: "medium",
      allowedUse: "expectation-gap",
      note: baseNote,
    });
  }

  if (estimate.epsAvg !== undefined) {
    facts.push({
      id: `consensus-eps-${index + 1}`,
      factType: "consensus-eps",
      sourceKind,
      sourceId,
      label: `${ticker} EPS consensus estimate`,
      value: estimate.epsAvg,
      unit: estimate.currency,
      period,
      confidence: "medium",
      allowedUse: "expectation-gap",
      note: baseNote,
    });
  }

  const rangeParts = [
    estimate.revenueLow !== undefined ? `revenueLow=${estimate.revenueLow}` : "",
    estimate.revenueHigh !== undefined ? `revenueHigh=${estimate.revenueHigh}` : "",
    estimate.epsLow !== undefined ? `epsLow=${estimate.epsLow}` : "",
    estimate.epsHigh !== undefined ? `epsHigh=${estimate.epsHigh}` : "",
  ].filter(Boolean);

  if (rangeParts.length) {
    facts.push({
      id: `consensus-range-${index + 1}`,
      factType: "consensus-range",
      sourceKind,
      sourceId,
      label: `${ticker} consensus estimate range`,
      value: rangeParts.join("; "),
      unit: estimate.currency,
      period,
      confidence: "medium",
      allowedUse: "guidance-comparison",
      note: baseNote,
    });
  }

  if (estimate.analystCount !== undefined) {
    facts.push({
      id: `consensus-analyst-count-${index + 1}`,
      factType: "analyst-count",
      sourceKind,
      sourceId,
      label: `${ticker} consensus analyst count`,
      value: estimate.analystCount,
      unit: "analysts",
      period,
      confidence: "medium",
      allowedUse: "consensus-context",
      note: baseNote,
    });
  }

  return facts;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
