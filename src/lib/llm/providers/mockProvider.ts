import { nvdaBrief } from "@/data/nvdaBrief";
import { validateBriefDocument } from "@/lib/briefs/validateBrief";
import type { BriefDocument } from "@/types/brief";
import type { GenerateBriefInput, GenerateBriefResult } from "../types";

export async function mockProvider(
  input: GenerateBriefInput,
): Promise<GenerateBriefResult> {
  const ticker = normalizeTicker(input.ticker);
  const companyName = input.companyName?.trim() || getMockCompanyName(ticker);
  const now = formatCstTimestamp();
  const evidencePack = input.evidencePack;
  const secEvidencePack = input.secEvidencePack;
  const hasEvidencePack = Boolean(evidencePack);
  const hasSecEvidence = Boolean(secEvidencePack);
  const hasAnyEvidence = hasEvidencePack || hasSecEvidence;

  const baseBrief = cloneBrief(nvdaBrief);
  const brief =
    ticker === "NVDA"
      ? baseBrief
      : replaceCompanyTokens(baseBrief, ticker, companyName);

  brief.schemaVersion = "0.1";
  brief.slug = ticker.toLowerCase().replaceAll(".", "-");
  brief.metadata = {
    ...brief.metadata,
    ticker,
    companyName,
    title: `${companyName} / ${ticker} Buy-Side Equity Research Memo`,
    language: input.language === "en" ? "en-US" : "zh-CN",
    isMock: true,
    generatedAt: now,
    updatedAt: now,
    frameworkStatus: "mock-reference-only",
    dataMode: hasAnyEvidence ? "evidence-draft" : "mock",
    brand: "Moki",
    product: "Moki Alpha Brief",
    shareLabel: hasAnyEvidence
      ? getEvidenceLabel(hasEvidencePack, hasSecEvidence)
      : "LLM Demo Preview",
  };
  brief.hero = {
    ...brief.hero,
    headline: ticker,
    subheadline: companyName,
    badges: hasAnyEvidence
      ? [
          {
            label: getEvidenceLabel(hasEvidencePack, hasSecEvidence),
            tone: "brand",
          },
          {
            label: secEvidencePack?.provider === "mock"
              ? "Mock SEC Evidence"
              : "Evidence Draft",
            tone: "neutral",
          },
        ]
      : [
          { label: "LLM Demo Preview", tone: "brand" },
          { label: "Mock Provider / No Live Data", tone: "neutral" },
        ],
  };
  brief.cta = {
    ...brief.cta,
    title: "想生成你自己的研报？",
    description:
      "登录 Moki，创建 Alpha Brief 任务，并把研究结果保存到你的投资工作台。本页当前仅为生成闭环 Demo。",
    buttonLabel: "生成我的研报",
    buttonHref: "/generate",
  };
  brief.sourceNote = {
    ...brief.sourceNote,
    paragraphs: hasAnyEvidence
      ? [
          buildMockEvidenceSourceNote({ evidencePack, secEvidencePack, now }),
          "当前为 Evidence Draft，未接实时股价、一致预期或数据库；所有目标价、收益判断和估值结论仍为模拟 / 示例 / 待核查。",
        ]
      : [
          "当前结果由 mock provider 生成，用于验证 LLM 生成闭环与 BriefDocument 渲染，不代表真实研究结论。",
          "当前未接入真实 SEC、公司 IR、实时股价、一致预期或新闻检索；所有数字、判断和情景均为模拟 / 示例 / no-live-data。",
        ],
  };
  brief.disclaimer = {
    title: "Disclaimer",
    text: "本页面仅供研究和信息参考，不构成投资建议。当前生成结果为 Mock / LLM Demo / Search Evidence Draft，不代表实时行情、正式评级或任何个性化建议。",
  };
  brief.evidencePack = evidencePack;
  brief.secEvidencePack = secEvidencePack;

  const issues = validateBriefDocument(brief);

  return {
    ok: issues.length === 0,
    provider: "mock",
    model: "mock-provider",
    modelMode: input.modelMode ?? inferModelMode(input.model),
    brief,
    issues,
    isFallback: false,
    error: issues.length ? "Mock provider generated an invalid brief." : undefined,
  };
}

function inferModelMode(model: string | undefined) {
  return model === "deepseek-reasoner" ? "reasoner" : "chat";
}

function getEvidenceLabel(hasSearchEvidence: boolean, hasSecEvidence: boolean) {
  if (hasSearchEvidence && hasSecEvidence) return "Search + SEC Evidence Draft";
  if (hasSecEvidence) return "SEC Evidence Draft";
  if (hasSearchEvidence) return "Search Evidence Draft";
  return "LLM Demo Preview";
}

function buildMockEvidenceSourceNote({
  evidencePack,
  secEvidencePack,
  now,
}: {
  evidencePack: GenerateBriefInput["evidencePack"];
  secEvidencePack: GenerateBriefInput["secEvidencePack"];
  now: string;
}) {
  const parts: string[] = [];

  if (evidencePack) {
    parts.push(
      `Search Evidence Draft: provider=${evidencePack.searchProvider || "mock"}; sourceCount=${evidencePack.newsItems?.length || evidencePack.sources.length || 0}; retrievedAt=${evidencePack.asOf || now}.`,
    );
  }

  if (secEvidencePack) {
    parts.push(
      `SEC Evidence Draft: provider=${secEvidencePack.provider}; CIK=${secEvidencePack.cik}; recentFilings=${secEvidencePack.recentFilings.length}; fiscalFacts=${secEvidencePack.fiscalFacts.length}; asOf=${secEvidencePack.asOf || now}.`,
    );
  }

  parts.push("This is not verification-grade real data and does not include real-time price or consensus estimates.");

  return parts.join(" ");
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

function getMockCompanyName(ticker: string) {
  if (ticker === "NVDA") return "NVIDIA";
  return `${ticker} Demo Company`;
}

function cloneBrief(brief: BriefDocument) {
  return JSON.parse(JSON.stringify(brief)) as BriefDocument;
}

function replaceCompanyTokens<T>(value: T, ticker: string, companyName: string): T {
  if (typeof value === "string") {
    return value
      .replaceAll("NVIDIA", companyName)
      .replaceAll("NVDA", ticker) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      replaceCompanyTokens(item, ticker, companyName),
    ) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        replaceCompanyTokens(child, ticker, companyName),
      ]),
    ) as T;
  }

  return value;
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
