import {
  BUY_SIDE_MEMO_V2_BODY_MODULES,
  BUY_SIDE_MEMO_V2_PROMPT_VERSION,
  buildBuySideMemoContentContract,
  USER_VISIBLE_FORBIDDEN_TERMS,
} from "./buySideMemoContentRules";
import type { BuySideMemoV2ResearchContext } from "./buySideMemoSchema";
import type { V2ValuationDataSufficiency } from "./buySideMemoSchema";

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
  promptVersion: typeof BUY_SIDE_MEMO_V2_PROMPT_VERSION;
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
    promptVersion: BUY_SIDE_MEMO_V2_PROMPT_VERSION,
    system: [
      "You are a senior buy-side equity research analyst.",
      "Return exactly one valid JSON object. No Markdown, no code fences, no comments, no explanations.",
      "The output must be a thesis-first research memo, not generic company summarization.",
      "The memo is for research workflow use and must not be investment advice.",
      "Do not output buy/sell/hold ratings, formal target prices, position sizing, stop-loss instructions, or trading recommendations.",
      `Do not use these words in user-facing text: ${USER_VISIBLE_FORBIDDEN_TERMS.join(
        ", ",
      )}.`,
      "Do not expose chain-of-thought, hidden reasoning, provider raw payloads, API keys, request logs, or internal debug fields.",
    ].join("\n"),
    user: [
      `Generate a BuySideMemoV2 JSON object for ${ticker} (${company}).`,
      `Prompt version: ${BUY_SIDE_MEMO_V2_PROMPT_VERSION}.`,
      `Language: ${
        language === "en"
          ? "English"
          : "Chinese with concise English market terms where useful"
      }.`,
      "",
      "Required root fields:",
      '- schemaVersion: "buy-side-memo-v2"',
      "- metadata",
      "- researchContext: null (the server will attach canonical research context)",
      "- investmentConclusion",
      "- companyProfile",
      "- fundamentalAnalysis",
      "- valuationFramework",
      "- catalystRisk",
      "- monitoringDashboard",
      "- sourceFooter",
      "",
      "Body module rule:",
      `There are exactly six body modules: ${BUY_SIDE_MEMO_V2_BODY_MODULES.join(
        ", ",
      )}.`,
      "sourceFooter is only bottom data-source information and must not be written as a seventh body module.",
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
      buildBuySideMemoContentContract(valuationDataSufficiency),
      "",
      "Data boundary rules:",
      '- metadata.dataMode must be "evidence-draft".',
      "Use null or \"unavailable\" when evidence is missing.",
      "Do not invent facts, citations, dates, prices, estimates, URLs, or source ids.",
      "SEC context can support official disclosure discussion, but do not call it verified data.",
      "Company IR can support official company narrative and management commentary only; never treat it as SEC financial facts or consensus.",
      "Market data can support market and valuation context only; never treat it as a formal quote or a recommendation.",
      "Consensus may only be internal estimate context or unavailable. Never present it as real Wall Street consensus.",
      "",
      "JSON shape notes:",
      "- All module availability values must be available, partial, or unavailable.",
      "- Text blocks use title, body, sourceFactIds, confidence.",
      "- Metrics use label, value, unit, period, whyItMatters, threshold, currentStatus, source, updateFrequency, sourceFactIds, confidence.",
      "- If a field is not supported by evidence, set it to null or \"unavailable\".",
      "",
      "Compact V2 research context for grounding:",
      JSON.stringify(toPromptContext(researchContext), null, 2),
    ].join("\n"),
  };
}

function toPromptContext(context: BuySideMemoV2ResearchContext) {
  return {
    ticker: context.ticker,
    companyName: context.companyName,
    asOf: context.asOf,
    evidenceLevel: context.evidenceLevel,
    sourceStatus: context.sourceStatus,
    coverage: context.coverage,
    warnings: context.warnings.slice(0, 12),
    consensus: {
      status: context.consensus.status,
      role: context.consensus.role,
      estimateCount: context.consensus.estimateCount,
      asOf: context.consensus.asOf,
      caveat: context.consensus.caveat,
    },
    factsBySection: {
      investmentConclusion:
        context.factsBySection.investmentConclusion.slice(0, 12),
      companyProfile: context.factsBySection.companyProfile.slice(0, 12),
      fundamentalAnalysis:
        context.factsBySection.fundamentalAnalysis.slice(0, 16),
      valuationFramework:
        context.factsBySection.valuationFramework.slice(0, 16),
      catalystRisk: context.factsBySection.catalystRisk.slice(0, 12),
      monitoringDashboard:
        context.factsBySection.monitoringDashboard.slice(0, 12),
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
