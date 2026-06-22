import "server-only";

import OpenAI from "openai";
import { validateBriefDocument } from "@/lib/briefs/validateBrief";
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

const DEEPSEEK_MAX_TOKENS = 8192;

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
    const parsed = JSON.parse(extractJsonObjectText(rawText)) as BriefDocument;
    const brief = normalizeDeepSeekBrief(parsed, input);
    const issues = validateBriefDocument(brief);

    return {
      ok: issues.length === 0,
      provider: "deepseek",
      model,
      modelMode,
      brief: issues.length === 0 ? brief : undefined,
      issues,
      error: issues.length
        ? "DeepSeek returned invalid BriefDocument schema"
        : undefined,
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
      error:
        error instanceof SyntaxError
          ? "DeepSeek returned text that could not be parsed as JSON."
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
        "你是一个买方股票研究 memo 生成器。你只能输出符合 BriefDocument Schema 的 JSON。不要输出 Markdown，不要输出解释。",
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
            max_tokens: DEEPSEEK_MAX_TOKENS,
          })
        : await client.chat.completions.create({
            model,
            messages,
            temperature: 0.3,
            response_format: { type: "json_object" },
            max_tokens: DEEPSEEK_MAX_TOKENS,
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
            max_tokens: DEEPSEEK_MAX_TOKENS,
          })
        : await client.chat.completions.create({
            model,
            messages,
            temperature: 0.3,
            max_tokens: DEEPSEEK_MAX_TOKENS,
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

function extractJsonObjectText(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new SyntaxError("No JSON object found in DeepSeek response.");
  }

  return trimmed.slice(start, end + 1);
}

function normalizeDeepSeekBrief(
  brief: BriefDocument,
  input: GenerateBriefInput,
): BriefDocument {
  const ticker = input.ticker.trim().toUpperCase();
  const now = formatCstTimestamp();
  const evidencePack = input.evidencePack;
  const secEvidencePack = input.secEvidencePack;
  const hasSearchEvidence = Boolean(evidencePack);
  const hasSecEvidence = Boolean(secEvidencePack);
  const hasAnyEvidence = hasSearchEvidence || hasSecEvidence;
  const evidenceLabel = getEvidenceLabel(hasSearchEvidence, hasSecEvidence);
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
      ...(brief.sourceNote?.paragraphs || []).map(sanitizeUserVisibleBoundaryText),
      buildEvidenceSourceNote({ evidencePack, secEvidencePack, now }),
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

  return brief;
}

function getEvidenceLabel(hasSearchEvidence: boolean, hasSecEvidence: boolean) {
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
  now,
}: {
  evidencePack: GenerateBriefInput["evidencePack"];
  secEvidencePack: GenerateBriefInput["secEvidencePack"];
  now: string;
}) {
  const notes: string[] = [];

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

  notes.push("当前未接入实时股价、一致预期或数据库保存，不能标记为验证级真实数据。");

  return notes.join(" ");
}

function sanitizeUserVisibleBoundaryText(text: string) {
  return text.replaceAll("verified-real-data", "verification-grade real data");
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
