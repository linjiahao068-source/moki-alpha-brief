import "server-only";

import OpenAI from "openai";
import { buildConsensusEvidencePack } from "@/lib/consensus/buildConsensusEvidencePack";
import { parseJsonObject } from "@/lib/llm/extractJson";
import { getLlmConfig } from "@/lib/llm/config";
import type { DeepSeekModelMode } from "@/lib/llm/types";
import { buildIrEvidencePack } from "@/lib/ir/buildIrEvidencePack";
import { buildMarketEvidencePack } from "@/lib/market/buildMarketEvidencePack";
import { buildSearchEvidencePack } from "@/lib/search/buildSearchEvidencePack";
import { buildSecEvidencePack } from "@/lib/sec/buildSecEvidencePack";
import type { EvidenceCoverageSummary, ResearchEvidenceFact } from "@/types/evidence";
import { buildBuySideMemoV2Prompt } from "./buySideMemoPrompt";
import {
  BUY_SIDE_MEMO_V2_SCHEMA_VERSION,
  BUY_SIDE_MEMO_V2_SECTION_LABELS,
  V2_UNAVAILABLE,
  type BuySideMemoV2,
  type BuySideMemoV2BaseModule,
  type BuySideMemoV2Metric,
  type BuySideMemoV2TextBlock,
  type BuySideMemoV2ResearchContext,
  type V2ModuleAvailability,
  type V2ValuationDataSufficiency,
} from "./buySideMemoSchema";
import { getBuySideMemoV2ShareUrl, saveBuySideMemoV2 } from "./buySideMemoV2Store";
import { buildV2ResearchContext } from "./buildV2ResearchContext";
import {
  createV2LlmDiagnostics,
  getBuySideMemoV2LlmReadiness,
  resolveBuySideMemoV2Model,
  withDiagnosticUpdate,
  type BuySideMemoV2GenerationMode,
  type V2LlmPathDiagnostics,
} from "./llmPathDiagnostics";
import { repairBuySideMemoV2Json } from "./repairBuySideMemoV2Json";
import { validateBuySideMemo } from "./validateBuySideMemo";
import {
  sanitizeValuationForDataSufficiency,
  V2_VALUATION_PROFESSIONAL_PROMPTS,
} from "./valuationSafety";
import { USER_VISIBLE_FORBIDDEN_PATTERN } from "./buySideMemoContentRules";

export type GenerateBuySideMemoV2Input = {
  ticker: string;
  companyName?: string;
  language?: "zh-CN" | "en";
  modelMode?: DeepSeekModelMode;
  model?: string;
  useSearch?: boolean;
  useSec?: boolean;
  useIr?: boolean;
  useMarket?: boolean;
  useConsensus?: boolean;
  save?: boolean;
  requestBaseUrl?: string;
};

export type GenerateBuySideMemoV2Result = {
  ok: boolean;
  memo?: BuySideMemoV2;
  error?: string;
  validationIssues?: string[];
  validationWarnings?: string[];
  provider: "deepseek" | "local";
  generationMode: BuySideMemoV2GenerationMode;
  diagnostics: V2LlmPathDiagnostics;
  model?: string;
  modelMode?: DeepSeekModelMode;
  slug?: string;
  shareUrl?: string;
  researchContext?: BuySideMemoV2ResearchContext;
  sourceSummary?: {
    evidenceLevel: string;
    sourceCount: number;
    factCount: number;
  };
};

const DEEPSEEK_CHAT_MAX_TOKENS = 10000;
const DEEPSEEK_REASONER_MAX_TOKENS = 12000;
const RESEARCH_CONTEXT_MACHINE_STRING_KEYS = new Set([
  "asOf",
  "dataMode",
  "dataRole",
  "factType",
  "id",
  "provider",
  "role",
  "schemaVersion",
  "source",
  "sourceId",
  "sourceKind",
  "status",
  "ticker",
  "url",
]);

export async function generateBuySideMemoV2(
  input: GenerateBuySideMemoV2Input,
): Promise<GenerateBuySideMemoV2Result> {
  const ticker = input.ticker.trim().toUpperCase();
  const evidence = await collectEvidence(input);
  const researchContext = sanitizeResearchContextForMemo(buildV2ResearchContext({
    ticker,
    companyName: input.companyName,
    searchEvidencePack: evidence.searchEvidencePack,
    secEvidencePack: evidence.secEvidencePack,
    irEvidencePack: evidence.irEvidencePack,
    marketEvidencePack: evidence.marketEvidencePack,
    consensusEvidencePack: evidence.consensusEvidencePack,
  }));
  const valuationDataSufficiency =
    inferValuationDataSufficiency(researchContext);
  const generated = await generateMemoFromContext({
    input: { ...input, ticker },
    researchContext,
    valuationDataSufficiency,
  });

  if (!generated.ok || !generated.memo) {
    return {
      ...generated,
      researchContext,
      sourceSummary: getSourceSummary(researchContext),
    };
  }

  if (input.save === false) {
    return {
      ...generated,
      researchContext,
      sourceSummary: getSourceSummary(researchContext),
    };
  }

  try {
    const saved = await saveBuySideMemoV2({
      memo: generated.memo,
      ticker,
    });

    return {
      ...generated,
      slug: saved.slug,
      shareUrl: getBuySideMemoV2ShareUrl(saved.slug, input.requestBaseUrl),
      researchContext,
      sourceSummary: getSourceSummary(researchContext),
    };
  } catch (error) {
    return {
      ok: false,
      memo: generated.memo,
      provider: generated.provider,
      generationMode: generated.generationMode,
      diagnostics: generated.diagnostics,
      model: generated.model,
      modelMode: generated.modelMode,
      error:
        error instanceof Error && error.message
          ? `Memo generated, but the share link could not be created: ${error.message}`
          : "Memo generated, but the share link could not be created.",
      researchContext,
      sourceSummary: getSourceSummary(researchContext),
    };
  }
}

async function collectEvidence(input: GenerateBuySideMemoV2Input) {
  const ticker = input.ticker.trim().toUpperCase();
  const companyName = input.companyName?.trim();
  const [searchResult, secResult, irResult, marketResult, consensusResult] =
    await Promise.all([
      isEnabled(input.useSearch, true)
        ? buildSearchEvidencePack({ ticker, companyName, maxResults: 5 })
        : Promise.resolve(undefined),
      isEnabled(input.useSec, true)
        ? buildSecEvidencePack({ ticker, companyName })
        : Promise.resolve(undefined),
      isEnabled(input.useIr, true)
        ? buildIrEvidencePack({ ticker, companyName, maxResults: 5 })
        : Promise.resolve(undefined),
      isEnabled(input.useMarket, true)
        ? buildMarketEvidencePack({ ticker, companyName })
        : Promise.resolve(undefined),
      isEnabled(input.useConsensus, false)
        ? buildConsensusEvidencePack({ ticker, companyName })
        : Promise.resolve(undefined),
    ]);

  return {
    searchEvidencePack: searchResult?.evidencePack,
    secEvidencePack: secResult?.secEvidencePack,
    irEvidencePack: irResult?.irEvidencePack,
    marketEvidencePack: marketResult?.marketEvidencePack,
    consensusEvidencePack: consensusResult?.consensusEvidencePack,
  };
}

function sanitizeResearchContextForMemo(
  context: BuySideMemoV2ResearchContext,
): BuySideMemoV2ResearchContext {
  return sanitizeResearchContextValue(context) as BuySideMemoV2ResearchContext;
}

function sanitizeResearchContextValue(
  value: unknown,
  keyName = "",
): unknown {
  if (typeof value === "string") {
    return RESEARCH_CONTEXT_MACHINE_STRING_KEYS.has(keyName)
      ? value
      : sanitizePublicResearchText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResearchContextValue(item, keyName));
  }

  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      sanitizeResearchContextValue(childValue, key),
    ]),
  );
}

function sanitizePublicResearchText(value: string) {
  return value
    .replace(/\bmock\b/gi, "internal estimate context")
    .replace(/\bdemo\b/gi, "example")
    .replace(/\bdraft\b/gi, "research")
    .replace(/\bphase\b/gi, "release")
    .replace(/\bMVP\b/g, "current release")
    .replace(/\bBriefDocument\b/g, "memo")
    .replace(/\bPOST API\b/g, "request")
    .replace(/\bQA\b/g, "review")
    .replace(/\bdevelopment\b/gi, "research review")
    .replace(/\bsimulated\b/gi, "limited research")
    .replace(/\btesting\b/gi, "review")
    .replace(/verified-real-data/gi, "verified data boundary");
}

async function generateMemoFromContext({
  input,
  researchContext,
  valuationDataSufficiency,
}: {
  input: GenerateBuySideMemoV2Input;
  researchContext: BuySideMemoV2ResearchContext;
  valuationDataSufficiency: V2ValuationDataSufficiency;
}): Promise<GenerateBuySideMemoV2Result> {
  const config = getLlmConfig();
  const resolved = resolveBuySideMemoV2Model(input, config);
  const readiness = getBuySideMemoV2LlmReadiness(config);

  if (!readiness.canUseLlm || !config.deepseekApiKey) {
    const diagnostics = createV2LlmDiagnostics({
      fallbackReason: readiness.fallbackReason,
      generationMode: "localFallback",
      missingEnv: readiness.missingEnv,
      model: resolved.model,
      modelMode: resolved.modelMode,
      requestedProvider: config.provider,
      resolvedProvider: "local",
    });

    return validateAndReturnMemo({
      memo: buildContractLocalMemo(
        input,
        researchContext,
        valuationDataSufficiency,
      ),
      provider: "local",
      generationMode: "localFallback",
      diagnostics,
      model: resolved.model,
      modelMode: resolved.modelMode,
    });
  }

  let diagnostics = createV2LlmDiagnostics({
    generationMode: "llm",
    model: resolved.model,
    modelMode: resolved.modelMode,
    promptSentToLlm: true,
    requestedProvider: config.provider,
    resolvedProvider: "deepseek",
  });

  try {
    const rawText = await requestDeepSeekMemo({
      apiKey: config.deepseekApiKey,
      baseURL: config.deepseekBaseUrl,
      input,
      model: resolved.model,
      modelMode: resolved.modelMode,
      researchContext,
      valuationDataSufficiency,
    });
    const parsedResult = await parseOrRepairGeneratedMemo({
      apiKey: config.deepseekApiKey,
      baseURL: config.deepseekBaseUrl,
      input,
      rawText,
      researchContext,
      valuationDataSufficiency,
    });
    diagnostics = withDiagnosticUpdate(diagnostics, {
      jsonExtraction: parsedResult.jsonExtraction,
      jsonRepair: parsedResult.jsonRepair,
    });
    const memo = normalizeGeneratedMemo({
      input,
      rawMemo: parsedResult.rawMemo,
      researchContext,
      valuationDataSufficiency,
    });

    return validateAndReturnMemo({
      memo,
      provider: "deepseek",
      generationMode: "llm",
      diagnostics,
      model: resolved.model,
      modelMode: resolved.modelMode,
    });
  } catch (error) {
    return {
      ok: false,
      provider: "deepseek",
      generationMode: "llmError",
      diagnostics: withDiagnosticUpdate(diagnostics, {
        generationMode: "llmError",
        jsonExtraction:
          diagnostics.jsonExtraction === "notRun"
            ? diagnostics.jsonExtraction
            : diagnostics.jsonExtraction,
        validation: "notRun",
      }),
      model: resolved.model,
      modelMode: resolved.modelMode,
      error:
        error instanceof SyntaxError
          ? "The generated memo was not valid JSON."
          : getProviderError(error),
    };
  }
}

async function requestDeepSeekMemo({
  apiKey,
  baseURL,
  input,
  model,
  modelMode,
  researchContext,
  valuationDataSufficiency,
}: {
  apiKey: string;
  baseURL: string;
  input: GenerateBuySideMemoV2Input;
  model: string;
  modelMode: DeepSeekModelMode;
  researchContext: BuySideMemoV2ResearchContext;
  valuationDataSufficiency: V2ValuationDataSufficiency;
}) {
  const client = new OpenAI({ apiKey, baseURL });
  const prompt = buildBuySideMemoV2Prompt({
    ticker: input.ticker,
    companyName: input.companyName,
    language: input.language,
    researchContext,
    valuationDataSufficiency,
  });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: prompt.system,
    },
    {
      role: "user",
      content: prompt.user,
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

    return getCompletionText(completion);
  } catch (error) {
    if (!shouldRetryWithoutResponseFormat(error)) throw error;

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

    return getCompletionText(completion);
  }
}

async function parseOrRepairGeneratedMemo({
  apiKey,
  baseURL,
  input,
  rawText,
  researchContext,
  valuationDataSufficiency,
}: {
  apiKey: string;
  baseURL: string;
  input: GenerateBuySideMemoV2Input;
  rawText: string;
  researchContext: BuySideMemoV2ResearchContext;
  valuationDataSufficiency: V2ValuationDataSufficiency;
}): Promise<{
  rawMemo: Partial<BuySideMemoV2>;
  jsonExtraction: "passed" | "failed";
  jsonRepair: "notNeeded" | "passed";
}> {
  try {
    return {
      rawMemo: parseJsonObject<Partial<BuySideMemoV2>>(rawText),
      jsonExtraction: "passed",
      jsonRepair: "notNeeded",
    };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;

    return {
      rawMemo: await repairBuySideMemoV2Json({
        apiKey,
        baseURL,
        companyName: input.companyName,
        language: input.language,
        rawText,
        researchContext,
        ticker: input.ticker,
        valuationDataSufficiency,
      }),
      jsonExtraction: "failed",
      jsonRepair: "passed",
    };
  }
}

function validateAndReturnMemo({
  diagnostics,
  generationMode,
  memo,
  model,
  modelMode,
  provider,
}: {
  diagnostics: V2LlmPathDiagnostics;
  generationMode: BuySideMemoV2GenerationMode;
  memo: BuySideMemoV2;
  model: string;
  modelMode: DeepSeekModelMode;
  provider: "deepseek" | "local";
}): GenerateBuySideMemoV2Result {
  const validation = validateBuySideMemo(memo);
  const publicLanguageIssues = validatePublicLanguage(memo);
  const issues = [...validation.issues, ...publicLanguageIssues];

  if (issues.length) {
    return {
      ok: false,
      provider,
      generationMode: "validationFailed",
      diagnostics: withDiagnosticUpdate(diagnostics, {
        generationMode: "validationFailed",
        validation: "failed",
      }),
      model,
      modelMode,
      error:
        "The generated memo did not pass structure and valuation safety checks.",
      validationIssues: toPublicValidationIssues(issues),
      validationWarnings: toPublicValidationIssues(validation.warnings),
    };
  }

  return {
    ok: true,
    memo,
    provider,
    generationMode,
    diagnostics: withDiagnosticUpdate(diagnostics, {
      validation: "passed",
    }),
    model,
    modelMode,
    validationWarnings: toPublicValidationIssues(validation.warnings),
  };
}

function normalizeGeneratedMemo({
  input,
  rawMemo,
  researchContext,
  valuationDataSufficiency,
}: {
  input: GenerateBuySideMemoV2Input;
  rawMemo: Partial<BuySideMemoV2>;
  researchContext: BuySideMemoV2ResearchContext;
  valuationDataSufficiency: V2ValuationDataSufficiency;
}): BuySideMemoV2 {
  const fallback = buildContractLocalMemo(
    input,
    researchContext,
    valuationDataSufficiency,
  );
  const valuationFramework = {
    ...fallback.valuationFramework,
    ...rawMemo.valuationFramework,
    label: BUY_SIDE_MEMO_V2_SECTION_LABELS.valuationFramework,
    dataSufficiency: valuationDataSufficiency,
  };

  const memo: BuySideMemoV2 = {
    ...fallback,
    schemaVersion: BUY_SIDE_MEMO_V2_SCHEMA_VERSION,
    metadata: {
      ...fallback.metadata,
      ...rawMemo.metadata,
      ticker: input.ticker,
      companyName: input.companyName || researchContext.companyName,
      dataMode: "evidence-draft",
      language: input.language || "zh-CN",
      generatedAt: fallback.metadata.generatedAt,
      updatedAt: fallback.metadata.updatedAt,
    },
    researchContext,
    investmentConclusion: {
      ...fallback.investmentConclusion,
      ...rawMemo.investmentConclusion,
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.investmentConclusion,
    },
    companyProfile: {
      ...fallback.companyProfile,
      ...rawMemo.companyProfile,
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.companyProfile,
    },
    fundamentalAnalysis: {
      ...fallback.fundamentalAnalysis,
      ...rawMemo.fundamentalAnalysis,
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.fundamentalAnalysis,
    },
    valuationFramework: sanitizeValuationForDataSufficiency(
      valuationFramework,
    ),
    catalystRisk: {
      ...fallback.catalystRisk,
      ...rawMemo.catalystRisk,
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.catalystRisk,
    },
    monitoringDashboard: {
      ...fallback.monitoringDashboard,
      ...rawMemo.monitoringDashboard,
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.monitoringDashboard,
      metrics: normalizeDashboardMetrics(null, fallback.monitoringDashboard.metrics),
    },
    sourceFooter: {
      ...fallback.sourceFooter,
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.sourceFooter,
      sourceStatus: researchContext.sourceStatus,
    },
  };

  return sanitizePublicMemoSections(enforceGeneratedMemoContent(memo, fallback));
}

function enforceGeneratedMemoContent(
  memo: BuySideMemoV2,
  fallback: BuySideMemoV2,
): BuySideMemoV2 {
  return {
    ...memo,
    investmentConclusion: {
      ...memo.investmentConclusion,
      thesis: coalesceText(
        memo.investmentConclusion.thesis,
        fallback.investmentConclusion.thesis,
      ),
      conclusion: coalesceText(
        memo.investmentConclusion.conclusion,
        fallback.investmentConclusion.conclusion,
      ),
      keyDebate: coalesceText(
        memo.investmentConclusion.keyDebate,
        fallback.investmentConclusion.keyDebate,
      ),
      variantView: coalesceText(
        memo.investmentConclusion.variantView,
        fallback.investmentConclusion.variantView,
      ),
      whatWouldChangeMind: coalesceStringArray(
        memo.investmentConclusion.whatWouldChangeMind,
        fallback.investmentConclusion.whatWouldChangeMind,
      ),
      confidence:
        memo.valuationFramework.dataSufficiency === "sufficient"
          ? memo.investmentConclusion.confidence || fallback.investmentConclusion.confidence
          : memo.investmentConclusion.confidence === "high"
            ? fallback.investmentConclusion.confidence
            : memo.investmentConclusion.confidence || fallback.investmentConclusion.confidence,
    },
    catalystRisk: {
      ...memo.catalystRisk,
      catalysts: Array.isArray(memo.catalystRisk.catalysts) &&
        memo.catalystRisk.catalysts.length
        ? memo.catalystRisk.catalysts
        : fallback.catalystRisk.catalysts,
      risks: Array.isArray(memo.catalystRisk.risks) &&
        memo.catalystRisk.risks.length
        ? memo.catalystRisk.risks
        : fallback.catalystRisk.risks,
      scenarioTriggers: coalesceStringArray(
        memo.catalystRisk.scenarioTriggers,
        fallback.catalystRisk.scenarioTriggers,
      ),
    },
    monitoringDashboard: {
      ...memo.monitoringDashboard,
      metrics: normalizeDashboardMetrics(null, fallback.monitoringDashboard.metrics),
      refreshCadence: coalesceText(
        memo.monitoringDashboard.refreshCadence,
        fallback.monitoringDashboard.refreshCadence,
      ),
      alertRules: coalesceStringArray(
        memo.monitoringDashboard.alertRules,
        fallback.monitoringDashboard.alertRules,
      ),
    },
    sourceFooter: {
      ...memo.sourceFooter,
      sourceNotes: fallback.sourceFooter.sourceNotes,
      caveats: fallback.sourceFooter.caveats,
      sourceStatus: fallback.sourceFooter.sourceStatus,
    },
  };
}

function normalizeDashboardMetrics(
  value: unknown,
  fallback: BuySideMemoV2["monitoringDashboard"]["metrics"],
): BuySideMemoV2Metric[] {
  const fallbackMetrics = Array.isArray(fallback) ? fallback : [];

  if (!Array.isArray(value) || value.length === 0) {
    return fallbackMetrics;
  }

  return value.slice(0, 8).map((item, index) => {
    const metric = isRecord(item) ? item : {};
    const fallbackMetric = fallbackMetrics[index] || fallbackMetrics[0];

    return {
      label: coalesceText(metric.label, fallbackMetric?.label || "Thesis metric"),
      value: coalesceMetricValue(metric.value, fallbackMetric?.value),
      unit: coalesceText(metric.unit, fallbackMetric?.unit || null),
      period: coalesceText(metric.period, fallbackMetric?.period || null),
      whyItMatters: coalesceText(
        metric.whyItMatters,
        fallbackMetric?.whyItMatters || "用于验证 thesis 是否仍由证据支撑。",
      ),
      threshold: coalesceText(
        metric.threshold,
        fallbackMetric?.threshold || "关注连续披露方向和相对预期的偏离。",
      ),
      currentStatus: coalesceText(
        metric.currentStatus,
        fallbackMetric?.currentStatus || "等待下一次证据刷新。",
      ),
      source: coalesceText(
        metric.source,
        fallbackMetric?.source || "Research context",
      ),
      updateFrequency: coalesceText(
        metric.updateFrequency,
        fallbackMetric?.updateFrequency || "event driven",
      ),
      sourceFactIds: Array.isArray(metric.sourceFactIds)
        ? metric.sourceFactIds.filter((id): id is string => typeof id === "string")
        : fallbackMetric?.sourceFactIds || null,
      confidence:
        metric.confidence === "high" ||
        metric.confidence === "medium" ||
        metric.confidence === "low"
          ? metric.confidence
          : fallbackMetric?.confidence || "medium",
    };
  });
}

function coalesceMetricValue(value: unknown, fallback: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    value === null ||
    value === V2_UNAVAILABLE
  ) {
    return value;
  }

  if (
    typeof fallback === "string" ||
    typeof fallback === "number" ||
    fallback === null ||
    fallback === V2_UNAVAILABLE
  ) {
    return fallback;
  }

  return V2_UNAVAILABLE;
}

function sanitizePublicMemoSections(memo: BuySideMemoV2): BuySideMemoV2 {
  return {
    ...memo,
    investmentConclusion: sanitizePublicModule(
      memo.investmentConclusion,
    ) as BuySideMemoV2["investmentConclusion"],
    companyProfile: sanitizePublicModule(
      memo.companyProfile,
    ) as BuySideMemoV2["companyProfile"],
    fundamentalAnalysis: sanitizePublicModule(
      memo.fundamentalAnalysis,
    ) as BuySideMemoV2["fundamentalAnalysis"],
    valuationFramework: sanitizePublicModule(
      memo.valuationFramework,
    ) as BuySideMemoV2["valuationFramework"],
    catalystRisk: sanitizePublicModule(
      memo.catalystRisk,
    ) as BuySideMemoV2["catalystRisk"],
    monitoringDashboard: sanitizePublicModule(
      memo.monitoringDashboard,
    ) as BuySideMemoV2["monitoringDashboard"],
    sourceFooter: {
      ...(sanitizePublicModule(memo.sourceFooter) as BuySideMemoV2["sourceFooter"]),
      sourceStatus: memo.sourceFooter.sourceStatus,
    },
  };
}

function sanitizePublicModule(value: unknown, keyName = ""): unknown {
  if (typeof value === "string") {
    return isPublicMachineStringKey(keyName)
      ? value
      : sanitizePublicResearchText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePublicModule(item, keyName));
  }

  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      sanitizePublicModule(childValue, key),
    ]),
  );
}

function isPublicMachineStringKey(keyName: string) {
  return (
    keyName === "label" ||
    keyName === "availability" ||
    keyName === "confidence" ||
    keyName === "dataSufficiency" ||
    keyName === "name" ||
    keyName === "sourceFactIds"
  );
}

function coalesceText(value: unknown, fallback: unknown) {
  if (typeof value === "string" && value.trim() && value !== V2_UNAVAILABLE) {
    return value;
  }

  return typeof fallback === "string" ? fallback : null;
}

function coalesceStringArray(value: unknown, fallback: unknown) {
  if (Array.isArray(value) && value.some((item) => typeof item === "string")) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return Array.isArray(fallback)
    ? fallback.filter((item): item is string => typeof item === "string")
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function buildLocalMemo(
  input: GenerateBuySideMemoV2Input,
  researchContext: BuySideMemoV2ResearchContext,
  valuationDataSufficiency: V2ValuationDataSufficiency,
): BuySideMemoV2 {
  const now = formatCstTimestamp();
  const ticker = input.ticker.trim().toUpperCase();
  const companyName = input.companyName || researchContext.companyName || ticker;
  const availability = getModuleAvailability(researchContext.coverage);
  const missing = researchContext.coverage?.missing || [];
  const valuationModule = sanitizeValuationForDataSufficiency({
    ...baseModule(BUY_SIDE_MEMO_V2_SECTION_LABELS.valuationFramework, availability),
    label: BUY_SIDE_MEMO_V2_SECTION_LABELS.valuationFramework,
    dataSufficiency: valuationDataSufficiency,
    methodology:
      valuationDataSufficiency === "insufficient"
        ? ["等待更完整的市场、财务和人工复核输入。"]
        : ["使用 SEC 财务事实、市场上下文和情景框架进行方向性评估。"],
    directionalView:
      valuationDataSufficiency === "insufficient"
        ? "当前证据不足以形成目标价。"
        : "可讨论估值方向和关键变量，但目标价需等待更完整证据。",
    keyValueDrivers: [
      "收入增长质量",
      "利润率可持续性",
      "自由现金流转换",
      "市场对增长持续性的定价",
    ],
    missingData: missing.length ? missing : null,
    scenarios: [
      emptyScenario("bear"),
      emptyScenario("base"),
      emptyScenario("bull"),
    ],
    probabilityWeightedTargetPrice: null,
    probabilityWeightedImpliedReturnPercent: null,
    professionalPrompt:
      valuationDataSufficiency === "insufficient"
        ? "当前证据不足以形成专业目标价。请先补齐可比公司、历史估值、盈利预测、资本结构、市场价格与人工复核，再输出任何目标价或隐含回报。"
        : null,
  });

  return {
    schemaVersion: BUY_SIDE_MEMO_V2_SCHEMA_VERSION,
    metadata: {
      ticker,
      companyName,
      title: `${companyName} Buy-side Memo`,
      generatedAt: now,
      updatedAt: now,
      language: input.language || "zh-CN",
      dataMode: "evidence-draft",
    },
    researchContext,
    investmentConclusion: {
      ...baseModule(BUY_SIDE_MEMO_V2_SECTION_LABELS.investmentConclusion, availability),
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.investmentConclusion,
      thesis: "当前证据支持形成研究假设，但仍需人工复核后才能升级为正式投资结论。",
      conclusion: "保持观察，优先跟踪基本面兑现、估值变量和关键风险变化。",
      confidence: "medium",
      timeHorizon: "6-12 months",
      keyDebate: "市场定价是否已经充分反映增长持续性与利润率韧性。",
      variantView: "若增长或利润率证据恶化，估值框架应下修；若需求和现金流继续增强，框架可上修。",
      whatWouldChangeMind: [
        "SEC 财务事实出现持续偏离",
        "公司官方叙事与市场需求信号明显背离",
        "市场价格和成交量出现异常变化",
      ],
      keyPoints: null,
    },
    companyProfile: {
      ...baseModule(BUY_SIDE_MEMO_V2_SECTION_LABELS.companyProfile, availability),
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.companyProfile,
      businessSummary: `${companyName} 的公司画像应基于 SEC 披露、公司官方叙事和公开市场上下文综合判断。`,
      segmentNotes: null,
      moat: "需要结合收入结构、客户需求、产品周期和竞争格局进一步复核。",
      customerDemand: "需求判断应优先引用公司官方更新、公开新闻和财务事实。",
      managementNarrative: researchContext.sourceStatus.companyIr.sourceCount
        ? "公司官方叙事已接入，可用于解释管理层关注点。"
        : V2_UNAVAILABLE,
      missingData: missing.length ? missing : null,
    },
    fundamentalAnalysis: {
      ...baseModule(BUY_SIDE_MEMO_V2_SECTION_LABELS.fundamentalAnalysis, availability),
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.fundamentalAnalysis,
      revenueQuality: researchContext.coverage?.hasRevenueFact
        ? "已有收入相关披露事实，可作为基本面分析起点。"
        : V2_UNAVAILABLE,
      marginStructure: researchContext.coverage?.hasNetIncomeFact
        ? "已有利润相关披露事实，可继续分析利润质量。"
        : V2_UNAVAILABLE,
      cashFlow: V2_UNAVAILABLE,
      balanceSheet: V2_UNAVAILABLE,
      growthDrivers: ["产品周期", "终端需求", "行业资本开支", "竞争格局"],
      secFacts: null,
      consensusContext: researchContext.consensus.status === "mock"
        ? "仅作为内部预期场景参考，不代表真实市场一致预期。"
        : V2_UNAVAILABLE,
      missingData: missing.length ? missing : null,
    },
    valuationFramework: valuationModule,
    catalystRisk: {
      ...baseModule(BUY_SIDE_MEMO_V2_SECTION_LABELS.catalystRisk, availability),
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.catalystRisk,
      catalysts: null,
      risks: null,
      scenarioTriggers: [
        "下一次财报披露",
        "公司官方经营更新",
        "行业需求或供给变化",
        "估值倍数重新定价",
      ],
      missingData: missing.length ? missing : null,
    },
    monitoringDashboard: {
      ...baseModule(BUY_SIDE_MEMO_V2_SECTION_LABELS.monitoringDashboard, availability),
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.monitoringDashboard,
      metrics: null,
      refreshCadence: "重大公告、财报和市场数据变化后刷新。",
      alertRules: [
        "收入、利润率或现金流指标显著偏离预期",
        "公司官方指引出现方向性变化",
        "市场价格或成交量出现异常波动",
      ],
      missingData: missing.length ? missing : null,
    },
    sourceFooter: {
      ...baseModule(BUY_SIDE_MEMO_V2_SECTION_LABELS.sourceFooter, availability),
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.sourceFooter,
      sourceStatus: researchContext.sourceStatus,
      sourceNotes: buildSourceNotes(researchContext),
      caveats: [
        "本页基于公开来源和自动整理的研究上下文，需要人工复核。",
        "不构成投资建议、评级、目标价或交易指令。",
      ],
      missingData: missing.length ? missing : null,
    },
  };
}

function buildContractLocalMemo(
  input: GenerateBuySideMemoV2Input,
  researchContext: BuySideMemoV2ResearchContext,
  valuationDataSufficiency: V2ValuationDataSufficiency,
): BuySideMemoV2 {
  const memo = buildLocalMemo(input, researchContext, valuationDataSufficiency);
  const companyName =
    input.companyName || researchContext.companyName || input.ticker;
  const coverage = researchContext.coverage;
  const missing = coverage?.missing || [];
  const availability = getModuleAvailability(coverage);
  const financialFacts = factsOfTypes(researchContext.facts, [
    "official-financial",
    "filing-metadata",
  ]);
  const marketFacts = factsOfTypes(researchContext.facts, [
    "market-price",
    "market-volume",
    "market-price-history",
    "market-valuation-context",
  ]);
  const catalystFacts = factsOfTypes(researchContext.facts, [
    "recent-development",
    "risk-catalyst",
    "business-update",
    "company-guidance-context",
    "management-commentary",
  ]);
  const monitoringMetrics = buildMonitoringMetrics(researchContext);
  const thesisFactIds = pickFactIds(
    [...financialFacts, ...marketFacts, ...catalystFacts],
    5,
  );
  const confidence = getInvestmentConfidence(
    valuationDataSufficiency,
    researchContext,
  );
  const missingText =
    missing.length > 0 ? missing.join("；") : "需要继续人工复核关键输入。";
  const valuationModule = sanitizeValuationForDataSufficiency({
    ...memo.valuationFramework,
    availability,
    dataSufficiency: valuationDataSufficiency,
    methodology:
      valuationDataSufficiency === "insufficient"
        ? ["等待更完整的市场、财务、可比公司和人工复核输入。"]
        : [
            "使用披露事实、市场上下文和情景假设做方向性估值框架；在数据未充分前不输出目标价。",
            "可讨论 multiple、DCF-like scenario、revenue multiple 或 sum-of-the-parts 的适用性，但必须标明缺失数据。",
          ],
    directionalView:
      valuationDataSufficiency === "insufficient"
        ? "当前证据不足以形成目标价。"
        : "当前只能讨论市场可能定价的增长、利润率和持续性假设；目标价与隐含回报需等待更完整证据。",
    keyValueDrivers: [
      "收入增长质量",
      "利润率可持续性",
      "现金流转换与资本开支强度",
      "市场对增长持续性的定价",
    ],
    missingData: missing.length ? missing : ["可比公司、历史倍数、完整预测和人工复核"],
    scenarios: [
      scenarioWithoutTarget("bear", [
        "需求、利润率或管理层指引证据转弱，市场下修增长持续性假设。",
        `缺失数据：${missingText}`,
      ]),
      scenarioWithoutTarget("base", [
        "基本面证据与市场预期大体匹配，估值主要随披露和指引微调。",
        "需要继续跟踪收入、利润率、现金流和管理层指引。",
      ]),
      scenarioWithoutTarget("bull", [
        "需求、利润率或现金流证据继续强化，市场上修增长质量假设。",
        "需要更多可比估值、历史倍数和预测数据后才能量化目标价。",
      ]),
    ],
    probabilityWeightedTargetPrice: null,
    probabilityWeightedImpliedReturnPercent: null,
    professionalPrompt:
      valuationDataSufficiency === "insufficient"
        ? V2_VALUATION_PROFESSIONAL_PROMPTS.insufficient
        : valuationDataSufficiency === "partial"
          ? V2_VALUATION_PROFESSIONAL_PROMPTS.partial
          : null,
  });

  return {
    ...memo,
    investmentConclusion: {
      ...memo.investmentConclusion,
      availability,
      thesis:
        `当前观点倾向为观察至中性：${companyName} 的研究价值来自增长质量、利润率韧性和市场对持续性的再定价，但现有证据仍需要人工复核。`,
      conclusion:
        "先把 thesis 放在证据之前：若后续披露继续支持收入增长、利润率和现金流韧性，市场可能上修质量假设；若披露或公司叙事转弱，应下调判断。",
      confidence,
      timeHorizon: "3-6 months",
      keyDebate:
        "关键争议是市场是否已经充分反映未来增长持续性、利润率韧性以及资本开支/需求周期的风险。",
      variantView:
        "变体观点：市场可能低估了需求延续性，也可能高估了利润率和估值倍数的可持续性；需要用下一轮披露和管理层指引验证。",
      whatWouldChangeMind: [
        "收入、利润率、EPS 或现金流披露连续低于可跟踪阈值。",
        "管理层指引或公司叙事与需求韧性 thesis 明显背离。",
        "市场价格、估值上下文或成交量出现与基本面不匹配的再定价。",
      ],
      keyPoints: [
        textBlock(
          "3-6个月重新定价因素",
          "下一轮财报、公司指引、需求信号、利润率变化和市场估值假设是最重要的重新定价因素。",
          thesisFactIds,
          confidence,
        ),
      ],
    },
    companyProfile: {
      ...memo.companyProfile,
      availability,
      businessSummary:
        `${companyName} 的公司画像应聚焦投资相关问题：靠什么产品/服务赚钱、收入和利润由什么驱动、在产业链中承担什么角色，以及这些因素如何影响估值假设。`,
      segmentNotes: buildTextBlocksFromFacts(
        financialFacts.length ? financialFacts : catalystFacts,
        "投资相关业务线索",
        3,
      ),
      moat:
        "竞争优势需要落到客户需求、产品周期、供应链/生态位置和利润率韧性；脆弱点则来自需求周期、竞争替代和估值倍数回落。",
      customerDemand:
        "需求判断优先参考披露事实、公司官方叙事、近期公开上下文和市场数据；缺少直接证据时保持定性。",
      managementNarrative: coverage?.hasCompanyIr
        ? "公司官方叙事已接入，可用于理解管理层关注点和指引方向，但不能替代披露财务事实。"
        : V2_UNAVAILABLE,
      missingData: missing.length ? missing : null,
    },
    fundamentalAnalysis: {
      ...memo.fundamentalAnalysis,
      availability,
      revenueQuality: coverage?.hasRevenueFact
        ? "已有收入相关披露事实，可用于判断增长质量；下一步应比较增长是否来自可持续需求而非一次性因素。"
        : V2_UNAVAILABLE,
      marginStructure: coverage?.hasNetIncomeFact
        ? "已有利润相关披露事实，可继续判断利润率趋势和经营杠杆是否改善、恶化或分化。"
        : V2_UNAVAILABLE,
      cashFlow:
        "现金流、资本开支、backlog/RPO 或指引若未在 evidence 中出现，应保持缺失标记，不推导虚假趋势。",
      balanceSheet:
        coverage?.hasFiscalFacts
          ? "披露事实可作为资产负债表分析入口，但仍需结合债务、现金和资本结构明细。"
          : V2_UNAVAILABLE,
      growthDrivers: [
        "收入增长趋势",
        "利润率趋势",
        "EPS / 现金流转换",
        "管理层指引与需求信号",
      ],
      secFacts: financialFacts.slice(0, 6).map((fact) =>
        factToMetric(fact, {
          source: "SEC disclosure context",
          updateFrequency: "quarterly or filing-driven",
          whyItMatters: "用于区分 reported facts 与市场叙事。",
          threshold: "关注连续披露方向和相对预期的偏离。",
        }),
      ),
      consensusContext:
        researchContext.consensus.status === "mock"
          ? "仅可作为内部预期情境参考，不能包装成真实华尔街一致预期。"
          : V2_UNAVAILABLE,
      missingData: missing.length ? missing : null,
    },
    valuationFramework: valuationModule,
    catalystRisk: {
      ...memo.catalystRisk,
      availability,
      catalysts: buildCatalystBlocks(catalystFacts, confidence),
      risks: buildRiskBlocks(missing, marketFacts, confidence),
      scenarioTriggers: [
        "下一次财报或经营更新改变收入/利润率趋势判断。",
        "公司官方指引出现方向性变化。",
        "行业需求、供给或资本开支信号改变增长持续性假设。",
        "市场估值倍数或价格行为与基本面证据明显背离。",
      ],
      missingData: missing.length ? missing : null,
    },
    monitoringDashboard: {
      ...memo.monitoringDashboard,
      availability,
      metrics: monitoringMetrics,
      refreshCadence: "重大公告、财报、公司指引和市场数据变化后刷新。",
      alertRules: [
        "收入、利润率、EPS 或现金流指标连续偏离 thesis 阈值。",
        "公司官方指引或管理层叙事出现方向性变化。",
        "市场价格、成交量或估值上下文与基本面证据出现背离。",
      ],
      missingData: missing.length ? missing : null,
    },
    sourceFooter: {
      ...memo.sourceFooter,
      sourceNotes: buildSourceNotes(researchContext),
      caveats: [
        "本页基于公开来源和自动整理的研究上下文，仍需要人工复核。",
        "不构成投资建议、评级、目标价或交易指令。",
      ],
    },
  };
}

function baseModule(
  label: string,
  availability: V2ModuleAvailability,
): BuySideMemoV2BaseModule {
  return {
    label,
    availability,
    unavailableReason:
      availability === "unavailable"
        ? "当前证据不足，无法形成稳定结论。"
        : null,
    evidenceNotes: null,
  };
}

function emptyScenario(name: "bear" | "base" | "bull") {
  return {
    name,
    targetPrice: null,
    impliedReturnPercent: null,
    probability: null,
    assumptions: null,
    sourceFactIds: null,
  };
}

function scenarioWithoutTarget(
  name: "bear" | "base" | "bull",
  assumptions: string[],
) {
  return {
    ...emptyScenario(name),
    assumptions,
  };
}

function factsOfTypes(
  facts: ResearchEvidenceFact[],
  factTypes: ResearchEvidenceFact["factType"][],
) {
  return facts.filter((fact) => factTypes.includes(fact.factType));
}

function pickFactIds(facts: ResearchEvidenceFact[], limit: number) {
  const ids = facts.map((fact) => fact.id).filter(Boolean);
  return ids.length ? Array.from(new Set(ids)).slice(0, limit) : null;
}

function textBlock(
  title: string,
  body: string,
  sourceFactIds: string[] | null,
  confidence: ResearchEvidenceFact["confidence"] | null,
): BuySideMemoV2TextBlock {
  return {
    title,
    body,
    sourceFactIds,
    confidence,
  };
}

function buildTextBlocksFromFacts(
  facts: ResearchEvidenceFact[],
  fallbackTitle: string,
  limit: number,
) {
  const blocks = facts.slice(0, limit).map((fact) =>
    textBlock(
      fact.label || fallbackTitle,
      formatFactForMemo(fact),
      [fact.id],
      fact.confidence,
    ),
  );

  return blocks.length ? blocks : null;
}

function buildCatalystBlocks(
  facts: ResearchEvidenceFact[],
  confidence: ResearchEvidenceFact["confidence"],
) {
  const evidenceBlocks = buildTextBlocksFromFacts(facts, "3-6个月催化剂", 3);

  if (evidenceBlocks) {
    return evidenceBlocks.map((block) => ({
      ...block,
      body: `${block.body} 重要性：可能改变市场对增长、利润率或需求持续性的定价。触发路径：后续公告、财报或公司指引确认。`,
    }));
  }

  return [
    textBlock(
      "3-6个月催化剂",
      "下一轮财报、公司官方经营更新、需求信号和市场估值假设变化，是最可能驱动重新定价的事件。",
      null,
      confidence,
    ),
  ];
}

function buildRiskBlocks(
  missing: string[],
  marketFacts: ResearchEvidenceFact[],
  confidence: ResearchEvidenceFact["confidence"],
) {
  const marketFactIds = pickFactIds(marketFacts, 3);

  return [
    textBlock(
      "thesis breakpoint",
      `如果收入、利润率、现金流或管理层指引连续偏离 thesis，投资判断应下修。需要补齐：${
        missing.length ? missing.join("；") : "完整预测、可比估值和人工复核"
      }。`,
      marketFactIds,
      confidence,
    ),
    textBlock(
      "估值再定价风险",
      "若市场价格或估值上下文与基本面证据背离，可能触发倍数收缩；需跟踪价格、成交量、市场估值上下文和下一次披露。",
      marketFactIds,
      confidence,
    ),
  ];
}

function buildMonitoringMetrics(
  context: BuySideMemoV2ResearchContext,
): BuySideMemoV2Metric[] {
  const facts = [
    ...factsOfTypes(context.facts, [
      "official-financial",
      "market-price",
      "market-volume",
      "market-valuation-context",
      "company-guidance-context",
      "business-update",
      "consensus-revenue",
      "consensus-eps",
      "analyst-count",
    ]),
  ];
  const metrics = facts.slice(0, 8).map((fact) =>
    factToMetric(fact, {
      source: sourceLabelForFact(fact),
      updateFrequency: updateFrequencyForFact(fact),
      whyItMatters: whyFactMatters(fact),
      threshold: thresholdForFact(fact),
    }),
  );

  if (metrics.length) return metrics;

  return [
    {
      label: "收入 / 利润率 / 现金流",
      value: V2_UNAVAILABLE,
      unit: null,
      period: null,
      whyItMatters: "用于验证 thesis 是否仍由基本面支撑。",
      threshold: "等待下一次披露后设定可量化阈值。",
      currentStatus: V2_UNAVAILABLE,
      source: "provider evidence unavailable",
      updateFrequency: "filing or event driven",
      sourceFactIds: null,
      confidence: "low",
    },
  ];
}

function factToMetric(
  fact: ResearchEvidenceFact,
  options: {
    source: string;
    updateFrequency: string;
    whyItMatters: string;
    threshold: string;
  },
): BuySideMemoV2Metric {
  return {
    label: fact.label,
    value: fact.value ?? V2_UNAVAILABLE,
    unit: fact.unit || null,
    period: fact.period || fact.filed || null,
    whyItMatters: options.whyItMatters,
    threshold: options.threshold,
    currentStatus: formatFactForMemo(fact),
    source: options.source,
    updateFrequency: options.updateFrequency,
    sourceFactIds: [fact.id],
    confidence: fact.confidence,
  };
}

function formatFactForMemo(fact: ResearchEvidenceFact) {
  const value = fact.value === undefined ? "unavailable" : String(fact.value);
  const unit = fact.unit ? ` ${fact.unit}` : "";
  const period = fact.period || fact.filed;

  return `${fact.label}: ${value}${unit}${period ? ` (${period})` : ""}`;
}

function sourceLabelForFact(fact: ResearchEvidenceFact) {
  if (fact.sourceKind === "sec") return "SEC disclosure context";
  if (fact.sourceKind === "ir") return "Company IR context";
  if (fact.sourceKind === "market") return "Market data context";
  if (fact.sourceKind === "consensus") return "Internal estimate context";
  if (fact.sourceKind === "search") return "Public web context";
  return "Research context";
}

function updateFrequencyForFact(fact: ResearchEvidenceFact) {
  if (fact.sourceKind === "sec") return "quarterly or filing-driven";
  if (fact.sourceKind === "market") return "market data refresh";
  if (fact.sourceKind === "ir") return "company update or earnings cycle";
  if (fact.sourceKind === "consensus") return "estimate update cycle";
  return "event driven";
}

function whyFactMatters(fact: ResearchEvidenceFact) {
  if (fact.factType.includes("revenue")) return "验证收入增长质量和市场预期差。";
  if (fact.factType.includes("eps")) return "验证盈利趋势和预期差。";
  if (fact.factType.includes("market")) return "验证估值和价格行为是否支持 thesis。";
  if (fact.factType.includes("guidance")) return "验证管理层指引是否支持 3-6 个月 thesis。";
  if (fact.factType === "official-financial") return "区分披露事实与市场叙事。";
  return "用于跟踪 thesis、催化剂或风险是否正在变化。";
}

function thresholdForFact(fact: ResearchEvidenceFact) {
  if (fact.factType.includes("market")) {
    return "关注价格、成交量或估值上下文相对基本面的背离。";
  }

  if (fact.factType.includes("guidance")) {
    return "关注管理层指引是否出现方向性上修或下修。";
  }

  return "关注连续披露方向、相对预期的偏离和人工复核结论。";
}

function getInvestmentConfidence(
  valuationDataSufficiency: V2ValuationDataSufficiency,
  context: BuySideMemoV2ResearchContext,
): ResearchEvidenceFact["confidence"] {
  if (valuationDataSufficiency === "insufficient") return "low";
  if (!context.coverage?.hasFiscalFacts || !context.coverage?.hasMarketPrice) {
    return "medium";
  }
  if (valuationDataSufficiency === "partial") return "medium";
  return "high";
}

function inferValuationDataSufficiency(
  context: BuySideMemoV2ResearchContext,
): V2ValuationDataSufficiency {
  const coverage = context.coverage;
  if (!coverage) return "insufficient";

  const hasCoreFinancials =
    coverage.hasSecEvidence &&
    coverage.hasFiscalFacts &&
    (coverage.hasRevenueFact || coverage.hasNetIncomeFact || coverage.hasEpsFact);
  const hasMarketContext = coverage.hasMarketPrice || coverage.hasMarketCap;
  const hasUsableContext = hasCoreFinancials || hasMarketContext;

  if (!hasUsableContext) return "insufficient";

  if (
    hasCoreFinancials &&
    hasMarketContext &&
    coverage.hasRevenueConsensus &&
    coverage.hasEpsConsensus &&
    context.consensus.status !== "mock"
  ) {
    return "sufficient";
  }

  return "partial";
}

function getModuleAvailability(
  coverage: EvidenceCoverageSummary | null,
): V2ModuleAvailability {
  if (!coverage) return "unavailable";
  if (coverage.hasSecEvidence || coverage.hasSearchEvidence || coverage.hasMarketPrice) {
    return "partial";
  }

  return "unavailable";
}

function buildSourceNotes(context: BuySideMemoV2ResearchContext) {
  return [
    `Web Search: ${formatSourceStatusForNote(context.sourceStatus.webSearch.status)}`,
    `SEC: ${formatSourceStatusForNote(context.sourceStatus.sec.status)}`,
    `Company IR: ${formatSourceStatusForNote(context.sourceStatus.companyIr.status)}`,
    `Market Data: ${formatSourceStatusForNote(context.sourceStatus.marketData.status)}`,
    `Consensus: ${
      context.sourceStatus.consensus.status === "mock"
        ? "internal estimate context"
        : "unavailable"
    }`,
  ];
}

function formatSourceStatusForNote(status: string) {
  if (status === "mock") return "limited research context";
  return status;
}

function validatePublicLanguage(memo: BuySideMemoV2) {
  const publicText = JSON.stringify({
    investmentConclusion: memo.investmentConclusion,
    companyProfile: memo.companyProfile,
    fundamentalAnalysis: memo.fundamentalAnalysis,
    valuationFramework: memo.valuationFramework,
    catalystRisk: memo.catalystRisk,
    monitoringDashboard: memo.monitoringDashboard,
    sourceFooter: {
      ...memo.sourceFooter,
      sourceStatus: undefined,
    },
  });

  return USER_VISIBLE_FORBIDDEN_PATTERN.test(publicText)
    ? ["Memo text contains internal wording that should not be shown."]
    : [];
}

function toPublicValidationIssues(issues: string[]) {
  return issues.map((issue) =>
    issue
      .replace(/BuySideMemoV2/g, "memo")
      .replace(/BriefDocument/g, "memo")
      .replace(/mock/gi, "internal estimate context")
      .replace(/evidence-draft/gi, "research evidence boundary")
      .replace(/MVP/g, "current release")
      .replace(/POST API/g, "request"),
  );
}

function getSourceSummary(context: BuySideMemoV2ResearchContext) {
  return {
    evidenceLevel: context.evidenceLevel,
    sourceCount: context.sources.length,
    factCount: context.facts.length,
  };
}

function isEnabled(value: boolean | undefined, defaultValue: boolean) {
  return value === undefined ? defaultValue : value;
}

function getCompletionText(completion: OpenAI.Chat.Completions.ChatCompletion) {
  const rawText = completion.choices[0]?.message?.content;

  if (!rawText) {
    throw new SyntaxError("The model returned an empty response.");
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

function getProviderError(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 401) return "The model provider could not authenticate.";
  if (status === 403) return "The model provider denied access.";
  if (status === 404) return "The requested model was not found.";
  if (status === 429) return "The model provider rate limit was reached.";
  if (status) return `The model provider request failed with status ${status}.`;
  return getErrorMessage(error) || "The model provider request failed.";
}

function getErrorStatus(error: unknown) {
  const record = error as { status?: unknown };
  return typeof record?.status === "number" ? record.status : undefined;
}

function getErrorCode(error: unknown) {
  const record = error as { code?: unknown };
  return typeof record?.code === "string" ? record.code : "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
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
