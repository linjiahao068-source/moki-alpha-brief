import type { BriefDataMode, BriefDocument } from "@/types/brief";

type DataBoundaryNoteProps = {
  brief: BriefDocument;
  compact?: boolean;
};

const labelByDataMode: Record<BriefDataMode, string> = {
  mock: "Mock Demo / No Live Data",
  "llm-demo-no-live-data": "LLM Demo / No Live Data",
  "evidence-draft": "Evidence Draft / Sources Attached",
  "verified-real-data": "Verification Mode Disabled",
};

export function DataBoundaryNote({
  brief,
  compact = false,
}: DataBoundaryNoteProps) {
  const dataMode = brief.metadata.dataMode;
  const hasEvidence = Boolean(
    brief.researchEvidenceContext || brief.evidencePack || brief.secEvidencePack,
  );
  const isVerified = dataMode === "verified-real-data";
  const isEvidenceDraft = dataMode === "evidence-draft";
  const evidenceState = getEvidenceState(brief);

  return (
    <aside
      className={`rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] ${
        compact ? "px-4 py-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
            Data Boundary
          </p>
          <h2 className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
            {isEvidenceDraft ? evidenceState.label : labelByDataMode[dataMode]}
          </h2>
        </div>
        <span className="inline-flex w-fit max-w-full rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-mono text-xs font-semibold leading-5 text-[var(--brand-ink)]">
          {hasEvidence ? "Evidence: attached" : "Evidence: none"}
        </span>
      </div>

      {isEvidenceDraft ? (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          {evidenceState.description}
        </p>
      ) : !isVerified ? (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          当前未接入实时数据源，数字和判断仅为演示结构。页面未连接真实 SEC、公司 IR、实时股价、一致预期或新闻检索。
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          当前版本不支持验证级真实数据展示；必须先具备完整证据链、来源时间戳、置信度和人工校验。
        </p>
      )}
    </aside>
  );
}

function getEvidenceState(brief: BriefDocument) {
  const level = brief.researchEvidenceContext?.evidenceLevel;
  if (level === "search-and-sec") {
    return {
      label: "Search + SEC Evidence Draft / Sources Attached",
      description:
        "当前为 Search + SEC Evidence Draft，已接入搜索证据和 SEC companyfacts / submissions；未接入实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，不构成投资建议。",
    };
  }
  if (level === "sec-only") {
    return {
      label: "SEC Evidence Draft / Sources Attached",
      description:
        "当前为 SEC Evidence Draft，已接入 SEC companyfacts / submissions；未接入搜索证据、实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，不构成投资建议。",
    };
  }
  if (level === "search-only") {
    return {
      label: "Search Evidence Draft / Sources Attached",
      description:
        "当前为 Search Evidence Draft，已接入搜索证据；未接入 SEC companyfacts / submissions、实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，不构成投资建议。",
    };
  }

  const hasSearch = Boolean(brief.evidencePack);
  const hasSec = Boolean(brief.secEvidencePack);

  if (hasSearch && hasSec) {
    return {
      label: "Search + SEC Evidence Draft / Sources Attached",
      description:
        "当前为 Search + SEC Evidence Draft，已接入搜索证据和 SEC companyfacts / submissions；未接入实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，不构成投资建议。",
    };
  }
  if (hasSec) {
    return {
      label: "SEC Evidence Draft / Sources Attached",
      description:
        "当前为 SEC Evidence Draft，已接入 SEC companyfacts / submissions；未接入搜索证据、实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，不构成投资建议。",
    };
  }
  if (hasSearch) {
    return {
      label: "Search Evidence Draft / Sources Attached",
      description:
        "当前为 Search Evidence Draft，已接入搜索证据；未接入 SEC companyfacts / submissions、实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，不构成投资建议。",
    };
  }
  return {
    label: "Evidence Draft / Sources Attached",
    description:
      "当前为 Evidence Draft；未接入实时股价、一致预期、公司 IR 正文解析、数据库保存或人工校验，不构成投资建议。",
  };
}
