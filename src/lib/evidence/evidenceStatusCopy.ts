import type {
  ResearchEvidenceLevel,
  SearchProviderName,
  SecProviderName,
} from "@/types/evidence";

type EvidenceStatusCopyInput = {
  evidenceLevel?: ResearchEvidenceLevel;
  hasSearchEvidence?: boolean;
  hasSecEvidence?: boolean;
  searchProvider?: SearchProviderName | string;
  secProvider?: SecProviderName | string;
};

export type EvidenceStatusCopy = {
  label: string;
  shortDescription: string;
  boundaryDescription: string;
  warningDescription: string;
  mvpLabel: string;
};

export function getEvidenceStatusCopy({
  evidenceLevel,
  hasSearchEvidence = false,
  hasSecEvidence = false,
  searchProvider,
  secProvider,
}: EvidenceStatusCopyInput): EvidenceStatusCopy {
  const level = resolveEvidenceLevel({
    evidenceLevel,
    hasSearchEvidence,
    hasSecEvidence,
  });
  const searchName = searchProvider === "tavily" ? "Tavily 搜索证据" : "搜索证据";
  const secName =
    secProvider === "sec" || hasSecEvidence
      ? "SEC companyfacts / submissions"
      : "SEC companyfacts / submissions";

  if (level === "search-and-sec") {
    return {
      label: "Search + SEC Evidence Draft",
      shortDescription: `当前为 Search + SEC Evidence Draft，已接入 ${searchName} 与 ${secName}；未接入实时股价、一致预期、公司 IR 正文解析或数据库；不构成投资建议。`,
      boundaryDescription:
        "已接入 SEC companyfacts / submissions 与搜索证据，但当前仍缺少实时股价、一致预期、公司 IR 正文解析、数据库保存和人工校验，因此仍是 evidence-draft，不是验证级真实数据。",
      warningDescription:
        "当前阶段为 Research Evidence Context MVP，搜索证据用于近期内容判断，SEC evidence 用于官方披露和财务事实；未接实时股价、一致预期、公司 IR 正文解析或数据库，不构成投资建议。",
      mvpLabel: "Research Evidence Context MVP",
    };
  }

  if (level === "sec-only") {
    return {
      label: "SEC Evidence Draft",
      shortDescription:
        "当前为 SEC Evidence Draft，已接入 SEC companyfacts / submissions；未接入搜索证据、实时股价、一致预期、公司 IR 或数据库；不构成投资建议。",
      boundaryDescription:
        "SEC companyfacts / submissions 已接入，但当前仍缺少搜索证据、实时股价、一致预期、公司 IR 正文解析、数据库保存和人工校验，因此仍是 evidence-draft，不是验证级真实数据。",
      warningDescription:
        "当前阶段为 SEC Evidence MVP，SEC evidence 用于官方披露和财务事实；未接搜索证据、实时股价、一致预期、公司 IR 正文解析或数据库，不构成投资建议。",
      mvpLabel: "SEC Evidence MVP",
    };
  }

  if (level === "search-only") {
    return {
      label: "Search Evidence Draft",
      shortDescription:
        "当前为 Search Evidence Draft，已接入搜索证据；未接入 SEC、实时股价、一致预期、公司 IR 或数据库；不构成投资建议。",
      boundaryDescription:
        "搜索证据已接入，但当前未接入 SEC companyfacts / submissions、实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，因此仍是 evidence-draft，不是验证级真实数据。",
      warningDescription:
        "当前阶段为 Search Evidence MVP，搜索证据仅用于辅助近期内容判断；未接 SEC、实时股价、一致预期、公司 IR 正文解析或数据库，不构成投资建议。",
      mvpLabel: "Search Evidence MVP",
    };
  }

  return {
    label: "LLM Demo / No Live Data",
    shortDescription:
      "LLM Demo / No Live Data，未接入搜索、SEC、实时股价、一致预期、公司 IR 或数据库；不构成投资建议。",
    boundaryDescription:
      "当前为 LLM Demo / No Live Data，未接入搜索、SEC、实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验。",
    warningDescription:
      "当前阶段为 LLM Demo MVP，未接入搜索、SEC、实时股价、一致预期、公司 IR 正文解析或数据库，不构成投资建议。",
    mvpLabel: "LLM Demo MVP",
  };
}

function resolveEvidenceLevel({
  evidenceLevel,
  hasSearchEvidence,
  hasSecEvidence,
}: Pick<
  EvidenceStatusCopyInput,
  "evidenceLevel" | "hasSearchEvidence" | "hasSecEvidence"
>): ResearchEvidenceLevel {
  if (evidenceLevel) return evidenceLevel;
  if (hasSearchEvidence && hasSecEvidence) return "search-and-sec";
  if (hasSecEvidence) return "sec-only";
  if (hasSearchEvidence) return "search-only";
  return "none";
}
