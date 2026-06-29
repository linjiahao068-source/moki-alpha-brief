import type { V2ValuationDataSufficiency } from "./buySideMemoSchema";
import { V2_VALUATION_PROFESSIONAL_PROMPTS } from "./valuationSafety";

export const BUY_SIDE_MEMO_V2_PROMPT_VERSION =
  "buy-side-memo-v2-content-contract-2026-06-28";

export const BUY_SIDE_MEMO_V2_BODY_MODULES = [
  "投资结论",
  "公司画像",
  "基本面分析",
  "估值框架",
  "催化风险",
  "监控仪表盘",
] as const;

export const USER_VISIBLE_FORBIDDEN_TERMS = [
  "Mock",
  "Demo",
  "Draft",
  "Phase",
  "MVP",
  "BriefDocument",
  "POST API",
] as const;

export const USER_VISIBLE_FORBIDDEN_PATTERN =
  /\b(mock|demo|draft|phase|mvp|briefdocument|post api)\b/i;

export function buildBuySideMemoContentContract(
  dataSufficiency: V2ValuationDataSufficiency,
) {
  return [
    "Content contract:",
    "- Write like a thesis-first buy-side memo, not a generic AI summary.",
    "- Start from the investment view, then explain the evidence and the debate.",
    "- Tie key judgments to evidence/source context where possible by using sourceFactIds.",
    "- Include the variant perception: what the market may be pricing wrong or debating.",
    "- Focus catalysts and risks on the next 3-6 months and connect them to repricing.",
    "- Convert the thesis into monitoring metrics with thresholds and current status.",
    "- Lower confidence when evidence is partial or missing; never invent data.",
    "",
    "Six body modules only:",
    "- 投资结论",
    "- 公司画像",
    "- 基本面分析",
    "- 估值框架",
    "- 催化风险",
    "- 监控仪表盘",
    "sourceFooter is bottom data-source information only; it is not a seventh body module.",
    "",
    "投资结论 requirements:",
    "- State the current view tilt: 偏积极 / 中性 / 谨慎 / 观察.",
    "- State the core thesis in one concrete paragraph.",
    "- State the key market debate, not only company positives.",
    "- Identify the most important 3-6 month repricing factor.",
    "- State what would prove the thesis wrong.",
    "- confidence must be high, medium, or low and must reflect data sufficiency.",
    "- Do not invent target prices, implied returns, ratings, or trade actions.",
    "",
    "公司画像 requirements:",
    "- Explain how the company makes money, what drives revenue/profit, and its value-chain position.",
    "- Explain competitive advantage and vulnerability in investment terms.",
    "- Explain why investors should care now.",
    "- Avoid website-style biography, long history, and generic business descriptions.",
    "",
    "基本面分析 requirements:",
    "- Judge operating trend rather than listing data.",
    "- Discuss revenue growth, margin trend, EPS/cash flow/capex/backlog/RPO/guidance when available.",
    "- Separate reported facts, management guidance, and market context.",
    "- SEC inputs may be official disclosure context, but do not call them verified data.",
    "- When data is missing, name the missing item instead of fabricating it.",
    "",
    "估值框架 requirements:",
    "- Explain what assumptions the current market context appears to price.",
    "- Choose a method that fits the available evidence: multiple, DCF-like scenario, sum-of-the-parts, revenue multiple, or directional framework.",
    "- Bear/Base/Bull must focus on assumptions and evidence gaps when price targets are blocked.",
    buildValuationContract(dataSufficiency),
    "",
    "催化风险 requirements:",
    "- Cover 3-6 month catalysts: event, why it matters, likely repricing path.",
    "- Cover risks: risk, why it matters, trigger, metric to watch, thesis breakpoint.",
    "- Avoid generic risk language unless tied to a metric, event, or thesis failure condition.",
    "",
    "监控仪表盘 requirements:",
    "- metrics must be trackable and serve the thesis, valuation, catalysts, and risks.",
    "- Each metric should include label, whyItMatters, threshold, currentStatus, source, updateFrequency, sourceFactIds, and confidence when available.",
    "- Use provider evidence first; if evidence is missing, set unavailable or null.",
    "- Do not fill table rows with fabricated values.",
    "",
    `Do not use these words in user-facing memo text: ${USER_VISIBLE_FORBIDDEN_TERMS.join(
      ", ",
    )}.`,
  ].join("\n");
}

function buildValuationContract(dataSufficiency: V2ValuationDataSufficiency) {
  const base = [
    `- valuationFramework.dataSufficiency must be "${dataSufficiency}".`,
    "- Valuation must be conservative and evidence-aware.",
  ];

  if (dataSufficiency === "sufficient") {
    return [
      ...base,
      "- Bear/Base/Bull targetPrice and impliedReturnPercent may be numeric only when supported by evidence.",
      "- probabilityWeightedTargetPrice and probabilityWeightedImpliedReturnPercent may be numeric only when supported by evidence.",
    ].join("\n");
  }

  if (dataSufficiency === "partial") {
    return [
      ...base,
      "- Allow methodology, directional view, core assumptions, and missingData.",
      "- Every Bear/Base/Bull targetPrice and impliedReturnPercent must be null.",
      "- probabilityWeightedTargetPrice must be null.",
      "- probabilityWeightedImpliedReturnPercent must be null.",
      `- professionalPrompt may use this message when helpful: ${V2_VALUATION_PROFESSIONAL_PROMPTS.partial}`,
    ].join("\n");
  }

  return [
    ...base,
    "- Do not output targetPrice, impliedReturnPercent, or any probability-weighted target.",
    "- Every Bear/Base/Bull targetPrice and impliedReturnPercent must be null.",
    "- probabilityWeightedTargetPrice must be null.",
    "- probabilityWeightedImpliedReturnPercent must be null.",
    `- professionalPrompt must be: ${V2_VALUATION_PROFESSIONAL_PROMPTS.insufficient}`,
  ].join("\n");
}
