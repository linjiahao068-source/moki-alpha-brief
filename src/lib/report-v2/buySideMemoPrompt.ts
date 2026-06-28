import type { BuySideMemoV2ResearchContext } from "./buySideMemoSchema";
import type { V2ValuationDataSufficiency } from "./buySideMemoSchema";
import { V2_VALUATION_PROFESSIONAL_PROMPTS } from "./valuationSafety";

export type BuySideMemoV2PromptInput = {
  ticker: string;
  companyName?: string | null;
  language?: "zh-CN" | "en";
  researchContext: BuySideMemoV2ResearchContext;
  valuationDataSufficiency: V2ValuationDataSufficiency;
};

export type BuySideMemoV2Prompt = {
  system: string;
  user: string;
};

export function buildBuySideMemoV2Prompt({
  companyName,
  language = "zh-CN",
  researchContext,
  ticker,
  valuationDataSufficiency,
}: BuySideMemoV2PromptInput): BuySideMemoV2Prompt {
  const company = companyName || researchContext.companyName || ticker;

  return {
    system: [
      "You are a professional buy-side equity research memo generator.",
      "Return exactly one valid JSON object. No Markdown, no code fences, no explanations.",
      "The memo is for research workflow use, not investment advice.",
      "Do not output buy/sell/hold ratings, formal target prices, position sizing, stop-loss instructions, or trading recommendations.",
      "Do not use these words in user-facing text: Mock, Demo, Draft, Phase, MVP, BriefDocument, POST API.",
      "Do not expose chain-of-thought, hidden reasoning, provider raw payloads, API keys, request logs, or internal debug fields.",
    ].join("\n"),
    user: [
      `Generate a BuySideMemoV2 JSON object for ${ticker} (${company}).`,
      `Language: ${language === "en" ? "English" : "Chinese with concise English market terms where useful"}.`,
      "",
      "Required root fields:",
      '- schemaVersion: "buy-side-memo-v2"',
      "- metadata",
      "- researchContext: null (the server will attach the canonical research context)",
      "- investmentConclusion",
      "- companyProfile",
      "- fundamentalAnalysis",
      "- valuationFramework",
      "- catalystRisk",
      "- monitoringDashboard",
      "- sourceFooter",
      "",
      "Body module rule:",
      "There are exactly six body modules: 投资结论, 公司画像, 基本面分析, 估值框架, 催化风险, 监控仪表盘.",
      "sourceFooter is only the bottom data-source footer, not a seventh body module.",
      "",
      "Exact labels:",
      '- investmentConclusion.label = "投资结论"',
      '- companyProfile.label = "公司画像"',
      '- fundamentalAnalysis.label = "基本面分析"',
      '- valuationFramework.label = "估值框架"',
      '- catalystRisk.label = "催化风险"',
      '- monitoringDashboard.label = "监控仪表盘"',
      '- sourceFooter.label = "底部：数据来源"',
      "",
      "Use null or \"unavailable\" when evidence is missing. Do not invent facts, citations, dates, prices, estimates, URLs, or source ids.",
      "SEC context can support official disclosure discussion, but the extracted memo still requires human review and must not be called verified data.",
      "Company IR can support official company narrative and management commentary only; never treat it as SEC financial facts or consensus.",
      "Market data can support market and valuation context only; never treat it as a formal quote or a recommendation.",
      "Consensus may only be internal estimate context or unavailable. Never present it as real Wall Street consensus.",
      "",
      buildValuationInstructions(valuationDataSufficiency),
      "",
      "JSON shape notes:",
      "- metadata.dataMode must be \"evidence-draft\".",
      "- All module availability values must be available, partial, or unavailable.",
      "- Text blocks use title, body, sourceFactIds, confidence.",
      "- Metrics use label, value, unit, period, sourceFactIds, confidence.",
      "- If a field is not supported by evidence, set it to null or \"unavailable\".",
      "",
      "Compact V2 research context for grounding:",
      JSON.stringify(toPromptContext(researchContext), null, 2),
    ].join("\n"),
  };
}

function buildValuationInstructions(
  dataSufficiency: V2ValuationDataSufficiency,
) {
  const base = [
    `valuationFramework.dataSufficiency must be "${dataSufficiency}".`,
    "Valuation must be evidence-aware and conservative.",
  ];

  if (dataSufficiency === "sufficient") {
    return [
      ...base,
      "Bear/Base/Bull scenario targetPrice and impliedReturnPercent may be numeric when supported by evidence.",
      "probabilityWeightedTargetPrice and probabilityWeightedImpliedReturnPercent may be numeric when supported by evidence.",
    ].join("\n");
  }

  if (dataSufficiency === "partial") {
    return [
      ...base,
      "Allow methodology, directionalView, keyValueDrivers, and missingData.",
      "Every scenario targetPrice and impliedReturnPercent must be null.",
      "probabilityWeightedTargetPrice must be null.",
      "probabilityWeightedImpliedReturnPercent must be null.",
    ].join("\n");
  }

  return [
    ...base,
    "Do not output any target price, implied return, or probability-weighted target.",
    "Every scenario targetPrice and impliedReturnPercent must be null.",
    "probabilityWeightedTargetPrice must be null.",
    "probabilityWeightedImpliedReturnPercent must be null.",
    `professionalPrompt must be: ${V2_VALUATION_PROFESSIONAL_PROMPTS.insufficient}`,
  ].join("\n");
}

function toPromptContext(context: BuySideMemoV2ResearchContext) {
  return {
    ticker: context.ticker,
    companyName: context.companyName,
    asOf: context.asOf,
    evidenceLevel: context.evidenceLevel,
    sourceStatus: context.sourceStatus,
    coverage: context.coverage,
    consensus: {
      status: context.consensus.status,
      role: context.consensus.role,
      estimateCount: context.consensus.estimateCount,
      asOf: context.consensus.asOf,
      caveat: context.consensus.caveat,
    },
    factsBySection: {
      investmentConclusion: context.factsBySection.investmentConclusion.slice(0, 12),
      companyProfile: context.factsBySection.companyProfile.slice(0, 12),
      fundamentalAnalysis: context.factsBySection.fundamentalAnalysis.slice(0, 16),
      valuationFramework: context.factsBySection.valuationFramework.slice(0, 16),
      catalystRisk: context.factsBySection.catalystRisk.slice(0, 12),
      monitoringDashboard: context.factsBySection.monitoringDashboard.slice(0, 12),
    },
    sources: context.sources.slice(0, 20).map((source) => ({
      id: source.id,
      sourceKind: source.sourceKind,
      sourceType: source.sourceType,
      title: source.title,
      publisher: source.publisher,
      confidence: source.confidence,
      retrievedAt: source.retrievedAt,
      publishedAt: source.publishedAt,
      linkedFactIds: source.linkedFactIds,
    })),
  };
}
