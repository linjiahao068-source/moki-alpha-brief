import { briefJsonSchemaText } from "@/lib/briefs/briefJsonSchema";
import { compactResearchEvidenceForPrompt } from "@/lib/evidence/compactResearchEvidenceForPrompt";
import type { ResearchEvidenceContext } from "@/types/evidence";
import type { GenerateBriefInput } from "../types";

type PromptBundle = {
  system: string;
  user: string;
};

export function buildBuySideEquityResearchPrompt(
  input: GenerateBriefInput,
): PromptBundle {
  const modelMode = input.modelMode || "chat";
  const researchEvidenceContext = input.researchEvidenceContext;

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
      buildScenarioInstructions(researchEvidenceContext),
      buildMonitoringInstructions(researchEvidenceContext),
      buildDataBoundaryInstructions(researchEvidenceContext),
      buildResearchEvidenceInstructions(researchEvidenceContext),
      buildModeInstructions(modelMode),
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
    "- Do not write phrases such as '作为 AI 模型', '我无法', '以下是', or any conversational framing.",
    "- Keep paragraphs short: usually 2-4 sentences. Use bulletList for key points and callout for central judgment or debate.",
    "- Preserve useful English terms such as Executive View, Variant Perception, Bull/Base/Bear, Monitoring Dashboard, and Bottom Line.",
    "- The brief should feel like a structured investment committee memo while remaining clearly labeled as Demo / Evidence Draft.",
  ].join("\n");
}

function buildSectionInstructions() {
  return [
    "## Required Sections",
    "Create sections with these stable ids and kinds. Each section must include 1-3 content blocks.",
    "1. executive-view / kind executive-view: Investment committee style summary. State thesis, uncertainty, what would change the view, current data boundary, and market evidence context when supplied.",
    "2. company-snapshot / kind company-snapshot: Explain business structure. Use SEC filing metadata and official financial facts when provided. Use IR evidence only for company official narrative, management commentary, and business-update context.",
    "3. industry-chain-position / kind industry-chain: Explain upstream, downstream, value capture, bottlenecks, and profit pool position.",
    "4. competitive-landscape / kind competitive-landscape: Explain competitors, moat, switching costs, substitution risks, and ecosystem position.",
    "5. financial-deep-dive / kind financial-deep-dive: If ResearchEvidenceContext has official-financial SEC facts, prioritize them. Earnings Expectation may compare SEC actual context against ConsensusEvidencePack mock revenue / EPS estimates when both exist. IR evidence may explain management context, but must not replace SEC official-financial facts. If a metric is missing, say it is missing and do not invent it.",
    "6. key-value-drivers / kind value-drivers: Explain what truly drives valuation and share price perception. Separate SEC facts, search draft items, IR management commentary / product updates, and LLM analysis.",
    "7. valuation / kind valuation: If Market Evidence is supplied, use it only as valuation context. If Consensus Evidence is supplied, use it only as mock expectation context. Do not output a real target price, implied return, or formal rating. Use N/A or framework wording.",
    "8. variant-perception / kind variant-perception: Use search evidence themes only as draft market context and state what still needs SEC / IR / market / consensus verification.",
    "9. catalysts / kind catalysts: Use recent-development or risk-catalyst facts from search evidence and relevant IR business-update facts when supplied. Prefer high/medium confidence sources.",
    "10. key-risks / kind risks: Use search evidence, IR risk-disclosure context, or coverage missing items. Low-confidence sources are discussion signals only.",
    "11. bottom-line / kind bottom-line: Conclude with the current evidence level and say this remains evidence-draft, not investment advice.",
    "Use shortTitle values suitable for a desktop table of contents.",
  ].join("\n");
}

function buildScenarioInstructions(context?: ResearchEvidenceContext) {
  return [
    "## Bull / Base / Bear Scenario Analysis",
    "- scenarioAnalysis.id must be 'scenarios'.",
    "- Include Bull Case, Base Case, and Bear Case.",
    "- Probabilities should be plausible and together close to 100%.",
    "- Base Case should be the most neutral and credible path.",
    context?.coverage.hasConsensus
      ? "- Consensus Evidence is mock-only. Use it in keyAssumptions only as expectation context. targetPrice and impliedReturn must remain N/A or framework-only, not a real target."
      : "- Because consensus is missing and this MVP forbids formal recommendations, targetPrice and impliedReturn must be 'N/A - consensus / manual verification missing' or clearly labeled as simulated framework only. Market evidence, when supplied, is context only.",
    "- Do not write scenario output as a real investment recommendation.",
  ].join("\n");
}

function buildMonitoringInstructions(context?: ResearchEvidenceContext) {
  const missing = context?.coverage.missing || [
    "real-time market price",
    "consensus estimates",
    "company IR narrative",
  ];

  return [
    "## Monitoring Dashboard",
    "- monitoringDashboard.id must be 'monitoring-dashboard'.",
    "- Include at least 6 metrics.",
    "- Each metric must have metric, whyItMatters, and threshold.",
    "- The dashboard should feel like an investment tracking checklist, not a complex trading terminal.",
    context?.marketEvidencePack
      ? "- Include market evidence refresh, price / volume context, and recent daily price-history context without writing trading signals."
      : "- Include follow-up metrics for missing market evidence where useful.",
    context?.consensusEvidencePack
      ? "- Include consensus estimate refresh, revenue consensus, EPS consensus, and analyst count checks as mock/draft expectation context."
      : "- Include follow-up metrics for missing consensus estimate coverage where useful.",
    "- Include follow-up metrics for missing data coverage where useful.",
    `- Current missing data: ${missing.join(", ")}.`,
  ].join("\n");
}

function buildDataBoundaryInstructions(context?: ResearchEvidenceContext) {
  if (!context) {
    return [
      "## Data Boundary Rules",
      "- No ResearchEvidenceContext is supplied.",
      '- metadata.dataMode must be "llm-demo-no-live-data".',
      '- metadata.isMock must remain true and metadata.frameworkStatus must be "mock-reference-only".',
      "- hero.badges must include LLM Demo / No Live Data.",
      "- sourceNote must say no SEC, IR, market evidence, consensus, or news retrieval is connected.",
      "- disclaimer.text must say: 本页面仅供研究和信息参考，不构成投资建议。",
      "- Do not make recent-news, SEC-backed, real-time, consensus, or verified-data claims.",
    ].join("\n");
  }

  const sourceNoteRules = [
    "## Data Boundary Rules",
    `- ResearchEvidenceContext is supplied with evidenceLevel=${context.evidenceLevel}.`,
    '- metadata.dataMode must be "evidence-draft". Never use "verified-real-data".',
    '- metadata.isMock must remain true and metadata.frameworkStatus must be "mock-reference-only" for this phase.',
    `- hero.badges must include ${getEvidenceLabel(context)}.`,
    "- sourceNote must write evidenceLevel, search source count, SEC CIK / recent filing count / fiscal fact count, IR source count, market provider / retrievedAt / marketTimestamp, and consensus provider / estimate count when available.",
  ];

  if (context.evidenceLevel === "search-sec-ir-market-and-consensus") {
    sourceNoteRules.push(
      "- sourceNote must explicitly include: Search + SEC + IR + Market + Consensus Evidence Draft.",
      `- sourceNote must include SEC CIK=${context.secEvidencePack?.cik || "provided in context"}, recent filing count=${context.secEvidencePack?.recentFilings.length ?? "provided in context"}, fiscal fact count=${context.secEvidencePack?.fiscalFacts.length ?? "provided in context"}, search source count=${context.searchEvidencePack?.sources.length ?? "provided in context"}, IR source count=${context.irEvidencePack?.irItems.length ?? "provided in context"}, marketProvider=${context.marketEvidencePack?.provider || "provided in context"}, providerChain=${context.marketEvidencePack?.providerChain?.join(" -> ") || "provided in context"}, retrievedAt=${context.marketEvidencePack?.quote?.retrievedAt || "provided in context"}, marketTimestamp=${context.marketEvidencePack?.quote?.marketTimestamp || "N/A"}, Consensus provider=mock, consensus estimate count=${context.consensusEvidencePack?.estimates.length ?? "provided in context"}, consensus asOf=${context.consensusEvidencePack?.asOf || "provided in context"}, dataMode=evidence-draft, consensus is mock evidence, not verified-real-data, not investment advice, and 不构成投资建议.`,
      "- Because Consensus Evidence is connected in this request, do not write 'no consensus estimates', 'consensus not connected', or '未接一致预期'.",
    );
  }

  if (context.evidenceLevel === "search-sec-ir-and-market") {
    sourceNoteRules.push(
      "- sourceNote must explicitly include: Search + SEC + IR + Market Evidence Draft.",
      `- sourceNote must include SEC CIK=${context.secEvidencePack?.cik || "provided in context"}, recent filing count=${context.secEvidencePack?.recentFilings.length ?? "provided in context"}, fiscal fact count=${context.secEvidencePack?.fiscalFacts.length ?? "provided in context"}, search source count=${context.searchEvidencePack?.sources.length ?? "provided in context"}, IR source count=${context.irEvidencePack?.irItems.length ?? "provided in context"}, marketProvider=${context.marketEvidencePack?.provider || "provided in context"}, providerChain=${context.marketEvidencePack?.providerChain?.join(" -> ") || "provided in context"}, retrievedAt=${context.marketEvidencePack?.quote?.retrievedAt || "provided in context"}, and marketTimestamp=${context.marketEvidencePack?.quote?.marketTimestamp || "N/A"}.`,
      "- Because Market evidence is connected in this request, do not write 'no real-time market price', 'market evidence not connected', or '未接实时股价'. Write that third-party free market evidence is attached and may be delayed or incomplete.",
    );
  }

  if (context.evidenceLevel === "search-and-sec") {
    sourceNoteRules.push(
      "- sourceNote must explicitly include: Search + SEC Evidence Draft.",
      `- sourceNote must include SEC CIK=${context.secEvidencePack?.cik || "provided in context"}, recent filing count=${context.secEvidencePack?.recentFilings.length ?? "provided in context"}, fiscal fact count=${context.secEvidencePack?.fiscalFacts.length ?? "provided in context"}, and search source count=${context.searchEvidencePack?.sources.length ?? "provided in context"}.`,
      "- Because SEC evidence is connected in this request, do not write '未接入 SEC', 'no SEC', or 'SEC not connected'.",
    );
  }

  if (context.evidenceLevel === "search-sec-and-ir") {
    sourceNoteRules.push(
      "- sourceNote must explicitly include: Search + SEC + IR Evidence Draft.",
      `- sourceNote must include SEC CIK=${context.secEvidencePack?.cik || "provided in context"}, recent filing count=${context.secEvidencePack?.recentFilings.length ?? "provided in context"}, fiscal fact count=${context.secEvidencePack?.fiscalFacts.length ?? "provided in context"}, search source count=${context.searchEvidencePack?.sources.length ?? "provided in context"}, and IR source count=${context.irEvidencePack?.irItems.length ?? "provided in context"}.`,
      "- Because IR evidence is connected in this request, do not write 'no Company IR', 'IR not connected', or '未接公司 IR'. You may state that PDF full-text and transcript full-text parsing are not connected.",
    );
  } else if (context.irEvidencePack) {
    sourceNoteRules.push(
      `- sourceNote must include IR Evidence Draft with irProvider=${context.irEvidencePack.provider} and IR source count=${context.irEvidencePack.irItems.length}.`,
      "- Do not call IR evidence consensus. Do not call IR evidence SEC official-financial data.",
    );
  }

  if (context.marketEvidencePack) {
    sourceNoteRules.push(
      `- sourceNote must include Market Evidence Draft with marketProvider=${context.marketEvidencePack.provider}, providerChain=${context.marketEvidencePack.providerChain?.join(" -> ") || context.marketEvidencePack.provider}, retrievedAt=${context.marketEvidencePack.quote?.retrievedAt || context.marketEvidencePack.asOf}, marketTimestamp=${context.marketEvidencePack.quote?.marketTimestamp || "N/A"}, and priceHistoryPoints=${context.marketEvidencePack.priceHistory?.length || 0}.`,
      "- sourceNote must say provider may be stock-api / global-stock-data / mock fallback and that free public market data may be delayed, incomplete, field-limited, or unavailable.",
      "- Do not call market evidence consensus, SEC official-financial data, verification-grade data, a formal trading quote, or investment advice.",
    );
  }

  if (context.consensusEvidencePack) {
    sourceNoteRules.push(
      `- sourceNote must include Consensus Evidence Draft with Consensus provider=mock, consensusProvider=${context.consensusEvidencePack.provider}, estimate count=${context.consensusEvidencePack.estimates.length}, period=${context.consensusEvidencePack.period}, asOf=${context.consensusEvidencePack.asOf}, dataMode=evidence-draft, consensus is mock evidence, not verified-real-data, not investment advice, and 不构成投资建议.`,
      "- Consensus Evidence can support Earnings Expectation / expectation-gap analysis only. It is not SEC actual data, not market price data, not verified-real-data, not a formal rating, and not a formal target price.",
    );
  } else {
    sourceNoteRules.push("- sourceNote must say consensus estimates are not connected.");
  }

  return [
    ...sourceNoteRules,
    context.marketEvidencePack
      ? "- sourceNote must mention market evidence delay/incomplete caveats and say manual verification is still missing."
      : "- sourceNote must say this has no real-time market price and no manual verification.",
    "- If IR evidence is attached, sourceNote may say PDF full-text parsing and transcript full-text parsing are not connected, but must not say Company IR evidence itself is missing.",
    "- If IR evidence is not attached, sourceNote must say Company IR / earnings-release evidence is not connected.",
    "- disclaimer.text must say: 本页面仅供研究和信息参考，不构成投资建议。",
    "- Do not fabricate citations, URLs, SEC accession numbers, source ids, news links, or publisher names.",
    "- Search evidence and SEC evidence must stay separated. Search snippets cannot become official financial facts.",
    "- IR evidence must stay separated from SEC evidence and search evidence. It can support company official narrative and management commentary only.",
    "- Market evidence must stay separated from SEC, IR, Search, and consensus. It can support market-context, valuation-context, and monitoring-dashboard only.",
    "- SEC companyfacts are official disclosure facts, but this MVP extraction is still only evidence-draft and not real-time market data.",
  ].join("\n");
}

function buildResearchEvidenceInstructions(context?: ResearchEvidenceContext) {
  if (!context) {
    return [
      "## ResearchEvidenceContext",
      "No ResearchEvidenceContext is supplied.",
      "Write only framework, hypothesis, demo interpretation, or 待核查 items.",
    ].join("\n");
  }

  return [
    "## ResearchEvidenceContext",
    "Use this compact context as the only evidence source for this request.",
    "Do not use any outside facts beyond this context.",
    "Chapter-level evidence rules:",
    "- Investment View: may use market-price, market-volume, and market-price-history only as market context, never as a formal recommendation.",
    "- Financial Statement Deep Dive: use only factType=official-financial with allowedUse=financial-analysis. These are SEC companyfacts. If revenue, net income, or EPS is missing, state that it is missing.",
    "- Earnings Expectation: actual values may only come from SEC factType=official-financial. Consensus values may only come from ConsensusEvidencePack / factType=consensus-revenue, consensus-eps, consensus-range, or analyst-count.",
    "- Earnings Expectation: never write Search, IR, or Market numbers as consensus estimates. Never write Consensus Evidence as SEC actual data.",
    "- Company Snapshot: may use filing-metadata, official-financial facts, and IR management-commentary / business-update facts. Search evidence may only describe draft recent context.",
    "- Key Value Drivers: may use IR product-update, management-commentary, business-update, and company-guidance-context facts, while clearly labeling them as IR evidence draft.",
    "- Guidance / Outlook: if using IR guidance facts, call them company guidance context. Never call them consensus estimates. Consensus comparison must come only from ConsensusEvidencePack.",
    "- Financial Deep Dive: IR facts can explain management commentary, but only SEC official-financial facts may be treated as official financial data.",
    "- Catalysts: use recent-development and risk-catalyst facts. Prefer high/medium confidence. Low confidence is only market discussion.",
    "- Catalysts: may combine Search recent-development facts with IR business-update facts.",
    "- Key Risks: use risk-catalyst facts, IR risk-disclosure context, or coverage missing items. Do not turn low-confidence sources into firm facts.",
    "- Variant Perception: may combine search themes, IR company narrative, market context, and mock consensus expectation context with explicit caveats about draft evidence and manual verification.",
    "- Valuation: may use market-valuation-context and mock consensus context only as context. Do not output real target price, implied return, buy/sell/hold, or formal rating.",
    "- Monitoring Dashboard: if Market Evidence is supplied, include price, volume, price history, and market data refresh metrics. If Consensus Evidence is supplied, include revenue consensus, EPS consensus, analyst count, and consensus refresh metrics. If not supplied, include missing consensus follow-up metrics.",
    "- Do not fabricate management quotes. Do not claim PDF full text or transcript full text was parsed.",
    "Compact ResearchEvidenceContext:",
    JSON.stringify(compactResearchEvidenceForPrompt(context), null, 2),
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

function buildSchemaInstructions() {
  return [
    "## BriefDocument JSON Schema",
    "Return a single JSON object matching this schema. The root object must start with { and end with }.",
    "Do not wrap it in Markdown fences.",
    briefJsonSchemaText,
  ].join("\n");
}

function getEvidenceLabel(context: ResearchEvidenceContext) {
  const parts = [
    context.evidenceLevel.includes("search") ? "Search" : "",
    /\bsec\b/.test(context.evidenceLevel) ? "SEC" : "",
    /\bir\b/.test(context.evidenceLevel) ? "IR" : "",
    context.evidenceLevel.includes("market") ? "Market" : "",
    context.evidenceLevel.includes("consensus") ? "Consensus" : "",
  ].filter(Boolean);

  if (parts.length) return `${parts.join(" + ")} Evidence Draft`;
  return "LLM Demo / No Live Data";
}
