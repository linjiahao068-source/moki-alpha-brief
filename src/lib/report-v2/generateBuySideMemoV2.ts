import "server-only";

import OpenAI from "openai";
import { buildConsensusEvidencePack } from "@/lib/consensus/buildConsensusEvidencePack";
import { parseJsonObject } from "@/lib/llm/extractJson";
import { getLlmConfig, resolveDeepSeekModel } from "@/lib/llm/config";
import type { DeepSeekModelMode } from "@/lib/llm/types";
import { buildIrEvidencePack } from "@/lib/ir/buildIrEvidencePack";
import { buildMarketEvidencePack } from "@/lib/market/buildMarketEvidencePack";
import { buildSearchEvidencePack } from "@/lib/search/buildSearchEvidencePack";
import { buildSecEvidencePack } from "@/lib/sec/buildSecEvidencePack";
import type { EvidenceCoverageSummary } from "@/types/evidence";
import { buildBuySideMemoV2Prompt } from "./buySideMemoPrompt";
import {
  BUY_SIDE_MEMO_V2_SCHEMA_VERSION,
  BUY_SIDE_MEMO_V2_SECTION_LABELS,
  V2_UNAVAILABLE,
  type BuySideMemoV2,
  type BuySideMemoV2BaseModule,
  type BuySideMemoV2ResearchContext,
  type V2ModuleAvailability,
  type V2ValuationDataSufficiency,
} from "./buySideMemoSchema";
import { getBuySideMemoV2ShareUrl, saveBuySideMemoV2 } from "./buySideMemoV2Store";
import { buildV2ResearchContext } from "./buildV2ResearchContext";
import { validateBuySideMemo } from "./validateBuySideMemo";
import { sanitizeValuationForDataSufficiency } from "./valuationSafety";

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
const PUBLIC_FORBIDDEN_TERMS =
  /\b(Mock|Demo|Draft|Phase|MVP|BriefDocument|POST API)\b/;
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
  const resolved = resolveDeepSeekModel(
    {
      ticker: input.ticker,
      companyName: input.companyName,
      model: input.model,
      modelMode: input.modelMode,
    },
    config,
  );

  if (config.provider !== "deepseek" || !config.deepseekApiKey) {
    return validateAndReturnMemo({
      memo: buildLocalMemo(input, researchContext, valuationDataSufficiency),
      provider: "local",
      model: resolved.model,
      modelMode: resolved.modelMode,
    });
  }

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
    const parsed = parseJsonObject<Partial<BuySideMemoV2>>(rawText);
    const memo = normalizeGeneratedMemo({
      input,
      rawMemo: parsed,
      researchContext,
      valuationDataSufficiency,
    });

    return validateAndReturnMemo({
      memo,
      provider: "deepseek",
      model: resolved.model,
      modelMode: resolved.modelMode,
    });
  } catch (error) {
    return {
      ok: false,
      provider: "deepseek",
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

function validateAndReturnMemo({
  memo,
  model,
  modelMode,
  provider,
}: {
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
  const fallback = buildLocalMemo(input, researchContext, valuationDataSufficiency);
  const valuationFramework = {
    ...fallback.valuationFramework,
    ...rawMemo.valuationFramework,
    label: BUY_SIDE_MEMO_V2_SECTION_LABELS.valuationFramework,
    dataSufficiency: valuationDataSufficiency,
  };

  return {
    ...fallback,
    ...rawMemo,
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
    },
    sourceFooter: {
      ...fallback.sourceFooter,
      ...rawMemo.sourceFooter,
      label: BUY_SIDE_MEMO_V2_SECTION_LABELS.sourceFooter,
      sourceStatus: researchContext.sourceStatus,
    },
  };
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
    `Web Search: ${context.sourceStatus.webSearch.status}`,
    `SEC: ${context.sourceStatus.sec.status}`,
    `Company IR: ${context.sourceStatus.companyIr.status}`,
    `Market Data: ${context.sourceStatus.marketData.status}`,
    `Consensus: ${context.sourceStatus.consensus.status === "mock" ? "internal estimate context" : "unavailable"}`,
  ];
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

  return PUBLIC_FORBIDDEN_TERMS.test(publicText)
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
