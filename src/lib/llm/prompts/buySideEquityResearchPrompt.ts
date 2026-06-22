import { briefJsonSchemaText } from "@/lib/briefs/briefJsonSchema";
import { compactSecEvidenceForPrompt } from "@/lib/sec/compactSecEvidenceForPrompt";
import type { EvidencePack, SecEvidencePack } from "@/types/evidence";
import type { GenerateBriefInput } from "../types";

type PromptBundle = {
  system: string;
  user: string;
};

export function buildBuySideEquityResearchPrompt(
  input: GenerateBriefInput,
): PromptBundle {
  const evidencePack = input.evidencePack;
  const secEvidencePack = input.secEvidencePack;
  const modelMode = input.modelMode || "chat";

  return {
    system: [
      "You are Moki Alpha Brief, a buy-side equity research memo generator.",
      "Your final answer must be one valid JSON object that conforms to the BriefDocument schema.",
      "Do not output Markdown, code fences, comments, explanations, prefaces, or conversational text.",
      "The JSON must use Chinese as the main language, with concise English market terms when useful.",
      modelMode === "reasoner"
        ? "You may reason internally, but the final content field must contain only the JSON object. Do not expose reasoning_content."
        : "Prioritize stable, compact, schema-valid JSON for fast generation.",
    ].join("\n"),
    user: [
      buildInputContext(input),
      buildMokiStyleGuide(),
      buildSectionInstructions(),
      buildScenarioInstructions(),
      buildMonitoringInstructions(),
      buildDataBoundaryInstructions(evidencePack, secEvidencePack),
      buildModeInstructions(modelMode),
      buildEvidenceInstructions(evidencePack),
      buildSecEvidenceInstructions(secEvidencePack),
      buildSchemaInstructions(),
    ].join("\n\n"),
  };
}

function buildInputContext(input: GenerateBriefInput) {
  const ticker = input.ticker.trim().toUpperCase();
  const companyName = input.companyName?.trim() || `${ticker} Demo Company`;
  const language = input.language === "en" ? "en-US" : "zh-CN";

  return [
    "## Generation Context",
    `Ticker: ${ticker}`,
    `Company Name: ${companyName}`,
    `Language: ${language}`,
    "Product: Moki Alpha Brief",
    "Page Type: Public Research Brief",
    "Research framework: buy-side-equity-research-memo style workflow",
    "Required output: BriefDocument JSON only.",
  ].join("\n");
}

function buildMokiStyleGuide() {
  return [
    "## Moki Alpha Brief Writing Style",
    "- Write like a public-facing buy-side memo, not a blog post, marketing page, brokerage trading page, or generic explainer.",
    "- Lead with conclusions. Every section should have a clear research job.",
    "- Use calm, professional, Chinese-friendly language. Avoid hype, slogans, and sales copy.",
    "- Do not write phrases such as '浣滀负 AI 妯″瀷', '鎴戞棤娉?, '浠ヤ笅鏄?, or any conversational framing.",
    "- Keep paragraphs short: usually 2-4 sentences. Use bulletList for key points and callout for central judgment or debate.",
    "- Preserve useful English terms such as Executive View, Variant Perception, Bull/Base/Bear, Monitoring Dashboard, and Bottom Line.",
    "- The brief should feel like a structured investment committee memo, while remaining clearly labeled as LLM Demo / No Live Data.",
  ].join("\n");
}

function buildSectionInstructions() {
  return [
    "## Required Sections",
    "Create sections with these stable ids and kinds. Each section must include 1-3 content blocks.",
    "1. executive-view / kind executive-view: Investment committee style summary. State the thesis, uncertainty, what would change the view, and that this is demo/no-live-data.",
    "2. company-snapshot / kind company-snapshot: Explain business structure and segment logic without inventing current revenue, EPS, margins, or market cap.",
    "3. industry-chain-position / kind industry-chain: Explain upstream, downstream, value capture, bottlenecks, and profit pool position.",
    "4. competitive-landscape / kind competitive-landscape: Explain competitors, moat, switching costs, substitution risks, and ecosystem position.",
    "5. financial-deep-dive / kind financial-deep-dive: Without evidencePack, write an analysis framework and寰呮牳鏌?indicators only. Do not fabricate real financial statement facts.",
    "6. key-value-drivers / kind value-drivers: Explain what truly drives valuation and share price perception, using simulated/example wording for numbers.",
    "7. valuation / kind valuation: Provide a scenario valuation framework, not a real target price commitment.",
    "8. variant-perception / kind variant-perception: Explain what the market could be over- or under-estimating.",
    "9. catalysts / kind catalysts: Cover observable event types for the next 3-6 months.",
    "10. key-risks / kind risks: Specific, trackable, restrained risks. Do not use exaggerated warnings or red/green trading language.",
    "11. bottom-line / kind bottom-line: A concise closing judgment that says evidencePack is needed before this can become real research.",
    "Use shortTitle values suitable for a desktop table of contents.",
  ].join("\n");
}

function buildScenarioInstructions() {
  return [
    "## Bull / Base / Bear Scenario Analysis",
    "- scenarioAnalysis.id must be 'scenarios'.",
    "- Include exactly or at least three scenarios: Bull Case, Base Case, Bear Case.",
    "- Probabilities should be plausible and together close to 100%.",
    "- Base Case should be the most neutral and credible path.",
    "- keyAssumptions must be concrete, but any numbers must be marked 妯℃嫙, 绀轰緥, 寰呮牳鏌? or N/A.",
    "- targetPrice and impliedReturn must not read like a real investment recommendation. Use labels such as '妯℃嫙鐩爣浠?, '绀轰緥鍖洪棿', or 'N/A - 寰呮帴鍏ョ湡瀹炴暟鎹?.",
    "- Each scenario should have a trigger or observable condition when possible.",
  ].join("\n");
}

function buildMonitoringInstructions() {
  return [
    "## Monitoring Dashboard",
    "- monitoringDashboard.id must be 'monitoring-dashboard'.",
    "- Include at least 6 metrics.",
    "- Each metric must have metric, whyItMatters, and threshold.",
    "- Thresholds should be observable. If no real data exists, write '寰呮帴鍏ユ暟鎹悗璺熻釜', '绀轰緥闃堝€?, or 'N/A - 寰呮牳鏌?.",
    "- The dashboard should feel like an investment tracking checklist, not a complex trading terminal.",
  ].join("\n");
}

function buildDataBoundaryInstructions(
  evidencePack?: EvidencePack,
  secEvidencePack?: SecEvidencePack,
) {
  const hasEvidencePack = Boolean(evidencePack);
  const hasSecEvidence = Boolean(secEvidencePack);
  const hasAnyEvidence = hasEvidencePack || hasSecEvidence;
  const evidenceLabel =
    hasEvidencePack && hasSecEvidence
      ? "Search + SEC Evidence Draft"
      : hasSecEvidence
        ? "SEC Evidence Draft"
        : "Search Evidence Draft";

  return [
    "## Data Boundary Rules",
    hasAnyEvidence
      ? "- Evidence draft context is supplied. Only facts explicitly present in the supplied evidence packs may be stated as evidence-backed."
      : "- No evidence pack is supplied in this request.",
    hasAnyEvidence
      ? '- Because this is an evidence draft MVP, metadata.dataMode must be "evidence-draft". Never use "verified-real-data".'
      : '- Because no evidence pack exists, metadata.dataMode must be "llm-demo-no-live-data".',
    '- metadata.isMock must remain true and metadata.frameworkStatus must be "mock-reference-only" for this phase.',
    hasAnyEvidence
      ? `- hero.badges must include ${evidenceLabel}.`
      : "- hero.badges must include LLM Demo / No Live Data.",
    hasAnyEvidence
      ? "- sourceNote must clearly say this is an evidence draft, not verified-real-data. If SEC evidence exists, include SEC provider, CIK, recent filing count, and fiscal fact count. If search evidence exists, include searchProvider, retrievedAt/asOf, and source count. Always say there is no real-time price, consensus, or database save."
      : "- sourceNote must clearly say this is an LLM Demo / No Live Data result, with no SEC, IR, real-time price, consensus, or news retrieval connected.",
    "- disclaimer.text must clearly say: 本页面仅供研究和信息参考，不构成投资建议。",
    hasSecEvidence
      ? "- SEC companyfacts/submissions are supplied as SEC Evidence Draft. You may refer to SEC facts only from secEvidencePack, but still do not claim real-time price, consensus estimates, paid terminals, database storage, or verified-real-data."
      : hasEvidencePack
        ? "- Do not claim access to SEC filings, company IR, real-time price, consensus estimates, paid terminals, or live market data. Only call the supplied evidencePack a search evidence draft."
        : "- Do not claim access to SEC filings, company IR, real-time price, consensus estimates, news search, paid terminals, or live market data.",
    hasEvidencePack
      ? "- You may discuss Recent Developments, Catalysts, Risks, and Variant Perception only when the statement can be traced to evidencePack items. Do not derive real financial metrics from search snippets."
      : "- Do not make recent-news or real-time statements.",
    "- Forbidden wording includes: 根据最新财报, 根据实时行情, 根据 SEC 文件, 市场一致预期显示, 已核验来源, 实时数据显示.",
    "- Do not fabricate citations, URLs, SEC accession numbers, source ids, news links, or publisher names.",
    "- Any financial number, valuation multiple, target price, implied return, market share, revenue split, EPS, margin, capex, or market cap must be labeled 模拟, 示例, 待核查, search-summary-mentioned, SEC companyfacts, or N/A.",
  ].join("\n");
}

function buildModeInstructions(modelMode: GenerateBriefInput["modelMode"]) {
  if (modelMode === "reasoner") {
    return [
      "## Deep Reasoning Mode",
      "- Use deeper internal structure reasoning before finalizing the JSON.",
      "- The final content must still be one JSON object only.",
      "- Do not expose, summarize, store, or reference reasoning_content.",
      "- Prefer fuller section logic than chat mode, but keep the JSON compact enough to avoid truncation.",
    ].join("\n");
  }

  return [
    "## Fast Mode",
    "- Prioritize schema-valid JSON and stable rendering.",
    "- Keep sections concise but complete.",
    "- Avoid overlong prose that could cause truncation.",
  ].join("\n");
}

function buildEvidenceInstructions(evidencePack?: EvidencePack) {
  if (!evidencePack) {
    return [
      "## Evidence Pack Injection Point",
      "No evidencePack is supplied.",
      "Therefore all factual-sounding claims must be framed as research framework, hypothesis, demo interpretation, or寰呮牳鏌?item.",
      "Do not assume recent web search exists.",
    ].join("\n");
  }

  return [
    "## Evidence Pack Injection Point",
    "Use only the supplied evidencePack for search-backed recent developments.",
    "All recent content must be traceable to evidencePack.newsItems or evidencePack.sources.",
    "Do not introduce facts, source names, URLs, or dates that are not present in evidencePack.",
    "Do not treat evidencePack as SEC, real-time stock price, consensus, or verified financial statement data.",
    "Catalysts must cite or clearly reference 1-2 high/medium confidence search evidence items when available.",
    "Key Risks must reference at least one search evidence item, or state that search evidence is insufficient and the issue needs SEC / IR / market data verification.",
    "Variant Perception must connect to recent themes visible in the supplied search evidence.",
    "Do not use low-confidence sources such as reddit, forums, Perplexity, AI answer pages, or social media as factual bases for strong conclusions.",
    "Low-confidence sources may only be described as discussion signals or market chatter.",
    "If evidence is thin, say it needs SEC / IR / market data verification instead of inventing a fact.",
    "If a number appears in a search snippet, label it as search-summary-mentioned and pending verification.",
    "Set metadata.dataMode to evidence-draft and keep isMock true.",
    "EvidencePack summary for this request:",
    JSON.stringify(summarizeEvidencePack(evidencePack), null, 2),
  ].join("\n");
}

function buildSecEvidenceInstructions(secEvidencePack?: SecEvidencePack) {
  if (!secEvidencePack) {
    return [
      "## SEC Evidence Injection Point",
      "No secEvidencePack is supplied.",
      "Do not claim that SEC companyfacts, submissions, 10-K, 10-Q, or 8-K data has been used.",
    ].join("\n");
  }

  return [
    "## SEC Evidence Injection Point",
    "Use only the supplied secEvidencePack for SEC-backed financial facts.",
    "Financial Statement Deep Dive must prioritize secEvidencePack.fiscalFacts.",
    "Company Snapshot may reference secEvidencePack.recentFilings metadata.",
    "Key Value Drivers may combine SEC facts with search evidence only when the source type is clearly separated.",
    "Valuation must still avoid real target-price promises because there is no real-time price or consensus data.",
    "If EPS, Revenue, Net Income, or any metric is missing, write that SEC companyfacts extraction did not extract that metric; do not invent it.",
    "Every financial fact must be described as sourced from SEC companyfacts.",
    "Never convert Tavily/search snippets into SEC fiscalFacts.",
    "Never claim real-time stock price, consensus estimates, or verified-real-data.",
    "SEC evidence summary for this request:",
    JSON.stringify(compactSecEvidenceForPrompt(secEvidencePack), null, 2),
  ].join("\n");
}

function summarizeEvidencePack(evidencePack: EvidencePack) {
  return {
    asOf: evidencePack.asOf,
    ticker: evidencePack.ticker,
    companyName: evidencePack.companyName,
    dataMode: evidencePack.dataMode,
    searchProvider: evidencePack.searchProvider,
    sourceCount:
      evidencePack.newsItems?.length || evidencePack.sources?.length || 0,
    confidenceCounts: countConfidence(evidencePack),
    warnings: evidencePack.warnings || [],
    newsItems: (evidencePack.newsItems || []).slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      publisher: item.publisher,
      domain: item.domain,
      publishedAt: item.publishedAt,
      retrievedAt: item.retrievedAt,
      dateStatus: item.dateStatus,
      confidence: item.confidence,
      qualityReason: item.qualityReason,
      sourceRank: item.sourceRank,
      snippet: item.snippet,
      theme: item.theme,
      relevance: item.relevance,
    })),
  };
}

function countConfidence(evidencePack: EvidencePack) {
  return (evidencePack.sources || []).reduce(
    (acc, source) => {
      acc[source.confidence] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );
}

function buildSchemaInstructions() {
  return [
    "## BriefDocument JSON Schema",
    "Return a single JSON object matching this schema. The root object must start with { and end with }.",
    "Do not wrap it in Markdown fences.",
    briefJsonSchemaText,
  ].join("\n");
}
