import "server-only";

import OpenAI from "openai";
import { validateBriefDocument } from "@/lib/briefs/validateBrief";
import { parseJsonObject } from "@/lib/llm/extractJson";
import { repairBriefJson } from "@/lib/llm/repairBriefJson";
import type { BriefDocument } from "@/types/brief";
import {
  DEEPSEEK_DEFAULT_BASE_URL,
  resolveDeepSeekModel,
  type LlmConfig,
} from "../config";
import { buildBuySideEquityResearchPrompt } from "../prompts/buySideEquityResearchPrompt";
import type {
  DeepSeekModelMode,
  GenerateBriefInput,
  GenerateBriefResult,
} from "../types";

const DEEPSEEK_CHAT_MAX_TOKENS = 10000;
const DEEPSEEK_REASONER_MAX_TOKENS = 12000;

export async function deepseekProvider(
  input: GenerateBriefInput,
  config: LlmConfig,
): Promise<GenerateBriefResult> {
  const apiKey = config.deepseekApiKey;
  const baseURL = config.deepseekBaseUrl || DEEPSEEK_DEFAULT_BASE_URL;
  const { model, modelMode } = resolveDeepSeekModel(input, config);

  if (!apiKey) {
    return {
      ok: false,
      provider: "deepseek",
      model,
      modelMode,
      issues: [],
      error: "Missing DEEPSEEK_API_KEY",
    };
  }

  try {
    const rawText = await requestDeepSeekJson({
      input,
      apiKey,
      baseURL,
      model,
      modelMode,
    });
    const parsed = await parseOrRepairBriefJson({
      rawText,
      input,
      apiKey,
      baseURL,
    });
    const brief = normalizeDeepSeekBrief(parsed.brief, input);
    const issues = validateBriefDocument(brief);
    const renderable = isRenderableBrief(brief);

    return {
      ok: renderable,
      provider: "deepseek",
      model,
      modelMode,
      brief: renderable ? brief : undefined,
      issues: renderable ? issues : ["DeepSeek returned an unrenderable BriefDocument"],
      jsonRepairStatus: parsed.repairSucceeded ? "succeeded" : "not-needed",
      jsonRepairSucceeded: parsed.repairSucceeded,
      error: !renderable ? "DeepSeek returned an unrenderable BriefDocument" : undefined,
    };
  } catch (error) {
    logDeepSeekError(error, {
      baseURL,
      model,
      modelMode,
      phase: "request-or-parse",
    });

    return {
      ok: false,
      provider: "deepseek",
      model,
      modelMode,
      issues: [],
      jsonRepairStatus: error instanceof SyntaxError ? "failed" : "not-needed",
      jsonRepairSucceeded: false,
      error:
        error instanceof SyntaxError
          ? "DeepSeek returned text that could not be parsed as JSON; repair failed."
          : getDeepSeekUserError(error),
    };
  }
}

async function requestDeepSeekJson({
  input,
  apiKey,
  baseURL,
  model,
  modelMode,
}: {
  input: GenerateBriefInput;
  apiKey: string;
  baseURL: string;
  model: string;
  modelMode: DeepSeekModelMode;
}) {
  const client = new OpenAI({
    apiKey,
    baseURL,
  });
  const prompt = buildBuySideEquityResearchPrompt(input);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a buy-side stock research memo generator. You must output exactly one valid JSON object parseable by JSON.parse. Do not output Markdown. Do not wrap JSON in code fences. Do not output explanations.",
    },
    {
      role: "user",
      content: `${prompt.system}\n\n${prompt.user}`,
    },
  ];

  try {
    const completion =
      modelMode === "reasoner"
        ? await client.chat.completions.create({
            model,
            messages,
            response_format: { type: "json_object" },
            max_tokens: DEEPSEEK_REASONER_MAX_TOKENS,
          })
        : await client.chat.completions.create({
            model,
            messages,
            temperature: 0.2,
            response_format: { type: "json_object" },
            max_tokens: DEEPSEEK_CHAT_MAX_TOKENS,
          });

    return getCompletionText(completion, { model, modelMode });
  } catch (error) {
    if (!shouldRetryWithoutResponseFormat(error)) {
      throw error;
    }

    logDeepSeekError(error, {
      baseURL,
      model,
      modelMode,
      phase: "response_format-retry",
    });

    const completion =
      modelMode === "reasoner"
        ? await client.chat.completions.create({
            model,
            messages,
            max_tokens: DEEPSEEK_REASONER_MAX_TOKENS,
          })
        : await client.chat.completions.create({
            model,
            messages,
            temperature: 0.2,
            max_tokens: DEEPSEEK_CHAT_MAX_TOKENS,
          });

    return getCompletionText(completion, { model, modelMode });
  }
}

function getCompletionText(
  completion: OpenAI.Chat.Completions.ChatCompletion,
  context: {
    model: string;
    modelMode: DeepSeekModelMode;
  },
) {
  const message = completion.choices[0]?.message as
    | (OpenAI.Chat.Completions.ChatCompletionMessage & {
        reasoning_content?: string;
      })
    | undefined;
  const hasReasoningContent = Boolean(message?.reasoning_content);
  const rawText = message?.content;

  if (hasReasoningContent) {
    console.log("DeepSeek provider metadata", {
      provider: "deepseek",
      model: context.model,
      modelMode: context.modelMode,
      hasReasoningContent: true,
    });
  }

  if (!rawText) {
    throw new SyntaxError("DeepSeek returned an empty response.");
  }

  return rawText;
}

function shouldRetryWithoutResponseFormat(error: unknown) {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error).toLowerCase();

  return (
    status === 400 &&
    (message.includes("response_format") ||
      message.includes("json_object") ||
      code.includes("response_format"))
  );
}

function normalizeDeepSeekBrief(
  brief: BriefDocument,
  input: GenerateBriefInput,
): BriefDocument {
  const ticker = input.ticker.trim().toUpperCase();
  const now = formatCstTimestamp();
  const evidencePack = input.evidencePack;
  const secEvidencePack = input.secEvidencePack;
  const researchEvidenceContext = input.researchEvidenceContext;
  const hasSearchEvidence = Boolean(evidencePack);
  const hasSecEvidence = Boolean(secEvidencePack);
  const hasAnyEvidence = Boolean(researchEvidenceContext) || hasSearchEvidence || hasSecEvidence;
  const evidenceLabel = getEvidenceLabel(
    hasSearchEvidence,
    hasSecEvidence,
    researchEvidenceContext?.evidenceLevel,
  );
  const companyName =
    input.companyName?.trim() ||
    brief.metadata?.companyName ||
    secEvidencePack?.companyName ||
    `${ticker} Demo Company`;

  brief.schemaVersion = "0.1";
  brief.slug = (brief.slug || ticker).toLowerCase().replaceAll(".", "-");
  brief.metadata = {
    ...brief.metadata,
    ticker,
    companyName,
    title:
      brief.metadata?.title ||
      `${companyName} / ${ticker} Buy-Side Equity Research Memo`,
    briefType: brief.metadata?.briefType || "Public Research Brief",
    language: input.language === "en" ? "en-US" : "zh-CN",
    isMock: true,
    generatedAt: brief.metadata?.generatedAt || now,
    updatedAt: brief.metadata?.updatedAt || now,
    frameworkName:
      brief.metadata?.frameworkName ||
      "buy-side-equity-research-memo style workflow",
    frameworkStatus: "mock-reference-only",
    dataMode: hasAnyEvidence ? "evidence-draft" : "llm-demo-no-live-data",
    brand: "Moki",
    product: "Moki Alpha Brief",
    shareLabel: hasAnyEvidence ? evidenceLabel : "LLM Demo Preview",
  };
  brief.hero = {
    ...brief.hero,
    headline: brief.hero?.headline || ticker,
    subheadline: brief.hero?.subheadline || companyName,
    eyebrow: brief.hero?.eyebrow || "Alpha洞察 / 买方深度研报",
    badges: ensureDataBadge(brief.hero?.badges, evidenceLabel, hasAnyEvidence),
    metrics: brief.hero?.metrics || [],
  };
  brief.cta = {
    title: brief.cta?.title || "想生成你自己的研报？",
    description:
      brief.cta?.description ||
      "登录 Moki，创建 Alpha Brief 任务，并把研究结果保存到你的投资工作台。本页当前仅为 LLM Demo / Evidence Draft。",
    buttonLabel: brief.cta?.buttonLabel || "生成我的研报",
    buttonHref: brief.cta?.buttonHref || "/generate",
  };
  brief.sourceNote = {
    id: "source-note",
    title: brief.sourceNote?.title || "Source & Method Note",
    paragraphs: [
      buildEvidenceSourceNote({
        evidencePack,
        secEvidencePack,
        researchEvidenceContext,
        now,
      }),
      "若页面中出现财务数字、估值倍数、目标价或隐含收益，必须理解为 SEC companyfacts / 搜索摘要 / 模拟示例 / 待核查语境，不代表实时行情、一致预期或正式投资建议。",
    ].filter(Boolean),
  };
  brief.disclaimer = {
    title: brief.disclaimer?.title || "Disclaimer",
    text:
      brief.disclaimer?.text ||
      "本页面仅供研究和信息参考，不构成投资建议。当前内容为 LLM Demo / Evidence Draft，不代表实时行情、正式评级或任何个性化建议。",
  };
  brief.evidencePack = evidencePack;
  brief.secEvidencePack = secEvidencePack;
  brief.researchEvidenceContext = researchEvidenceContext;
  brief.evidenceSummary = researchEvidenceContext?.coverage;

  return brief;
}

async function parseOrRepairBriefJson({
  rawText,
  input,
  apiKey,
  baseURL,
}: {
  rawText: string;
  input: GenerateBriefInput;
  apiKey: string;
  baseURL: string;
}): Promise<{ brief: BriefDocument; repairSucceeded: boolean }> {
  try {
    return {
      brief: parseJsonObject<BriefDocument>(rawText),
      repairSucceeded: false,
    };
  } catch {
    const repaired = await repairBriefJson({
      rawText,
      input,
      apiKey,
      baseURL,
    });

    return {
      brief: repaired,
      repairSucceeded: true,
    };
  }
}

function isRenderableBrief(brief: BriefDocument) {
  return Boolean(
    brief.schemaVersion &&
      brief.slug &&
      brief.metadata?.ticker &&
      brief.metadata?.companyName &&
      brief.metadata?.dataMode &&
      Array.isArray(brief.sections) &&
      brief.sections.length &&
      brief.scenarioAnalysis?.scenarios?.length &&
      brief.monitoringDashboard?.metrics?.length &&
      brief.sourceNote?.paragraphs?.length &&
      brief.disclaimer?.text,
  );
}

function getEvidenceLabel(
  hasSearchEvidence: boolean,
  hasSecEvidence: boolean,
  evidenceLevel?: string,
) {
  if (evidenceLevel === "search-and-sec") return "Search + SEC Evidence Draft";
  if (evidenceLevel === "sec-only") return "SEC Evidence Draft";
  if (evidenceLevel === "search-only") return "Search Evidence Draft";
  if (hasSearchEvidence && hasSecEvidence) return "Search + SEC Evidence Draft";
  if (hasSecEvidence) return "SEC Evidence Draft";
  if (hasSearchEvidence) return "Search Evidence Draft";
  return "LLM Demo / No Live Data";
}

function ensureDataBadge(
  badges: BriefDocument["hero"]["badges"] | undefined,
  evidenceLabel: string,
  hasAnyEvidence: boolean,
): BriefDocument["hero"]["badges"] {
  const next = Array.isArray(badges) ? [...badges] : [];
  const hasDataBadge = next.some((badge) =>
    /demo|mock|no live data|sample|search evidence|sec evidence/i.test(
      badge.label,
    ),
  );

  if (!hasDataBadge) {
    next.push({
      label: hasAnyEvidence ? evidenceLabel : "LLM Demo / No Live Data",
      tone: hasAnyEvidence ? "brand" : "neutral",
    });
  }

  if (!next.length) {
    next.push({ label: "LLM Demo Preview", tone: "brand" });
  }

  return next;
}

function buildEvidenceSourceNote({
  evidencePack,
  secEvidencePack,
  researchEvidenceContext,
  now,
}: {
  evidencePack: GenerateBriefInput["evidencePack"];
  secEvidencePack: GenerateBriefInput["secEvidencePack"];
  researchEvidenceContext: GenerateBriefInput["researchEvidenceContext"];
  now: string;
}) {
  const notes: string[] = [];

  if (researchEvidenceContext) {
    if (researchEvidenceContext.evidenceLevel === "search-and-sec") {
      notes.push("Search + SEC Evidence Draft: Tavily/search evidence and SEC companyfacts / submissions are attached.");
    }

    notes.push(
      `Research Evidence Context: evidenceLevel=${researchEvidenceContext.evidenceLevel}; dataMode=evidence-draft; sourceCount=${researchEvidenceContext.sourceRegistry.length}; factCount=${researchEvidenceContext.factLedger.length}; missing=${researchEvidenceContext.coverage.missing.join(", ")}.`,
    );
  }

  if (evidencePack) {
    notes.push(
      `Search Evidence Draft: searchProvider=${evidencePack.searchProvider || "unknown"}; retrievedAt=${evidencePack.asOf || now}; sourceCount=${evidencePack.newsItems?.length || evidencePack.sources.length || 0}.`,
    );
  }

  if (secEvidencePack) {
    notes.push(
      `SEC Evidence Draft: secProvider=${secEvidencePack.provider}; CIK=${secEvidencePack.cik}; recentFilings=${secEvidencePack.recentFilings.length}; fiscalFacts=${secEvidencePack.fiscalFacts.length}; asOf=${secEvidencePack.asOf || now}.`,
    );
  }

  if (!notes.length) {
    notes.push(
      "LLM Demo / No Live Data: 当前未接入真实 SEC、公司 IR、实时股价、一致预期或新闻检索。",
    );
  }

  notes.push("当前未接入实时股价、一致预期、公司 IR 正文解析或数据库保存，不能标记为验证级真实数据。");

  return notes.join(" ");
}

function getDeepSeekUserError(error: unknown) {
  const status = getErrorStatus(error);

  if (status === 401) return "DeepSeek authentication failed";
  if (status === 403) return "DeepSeek permission denied";
  if (status === 404) return "DeepSeek model not found";
  if (status === 429) return "DeepSeek rate limit or quota error";
  if (status) return `DeepSeek provider request failed with status ${status}`;

  return "DeepSeek provider request failed";
}

function logDeepSeekError(
  error: unknown,
  context: {
    baseURL: string;
    model: string;
    modelMode: DeepSeekModelMode;
    phase: string;
  },
) {
  console.error("DeepSeek provider error", {
    provider: "deepseek",
    hasApiKey: Boolean(process.env.DEEPSEEK_API_KEY),
    baseURL: context.baseURL,
    model: context.model,
    modelMode: context.modelMode,
    phase: context.phase,
    error: {
      name: getErrorName(error),
      status: getErrorStatus(error),
      code: getErrorCode(error),
      message: getErrorMessage(error),
    },
  });
}

function getErrorName(error: unknown) {
  return getErrorField(error, "name") || "Error";
}

function getErrorStatus(error: unknown) {
  const value = getErrorField(error, "status");
  return typeof value === "number" ? value : undefined;
}

function getErrorCode(error: unknown) {
  const value = getErrorField(error, "code");
  return typeof value === "string" ? value : "";
}

function getErrorMessage(error: unknown) {
  const value = getErrorField(error, "message");
  return typeof value === "string" ? value : "Unknown DeepSeek provider error";
}

function getErrorField(error: unknown, field: string) {
  if (!error || typeof error !== "object") return undefined;
  return (error as Record<string, unknown>)[field];
}

function formatCstTimestamp() {
  const value = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return `${value} CST`;
}
