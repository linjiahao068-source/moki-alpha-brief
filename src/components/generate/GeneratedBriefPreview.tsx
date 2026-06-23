"use client";

import { BriefPage } from "@/components/brief/BriefPage";
import type { BriefDocument } from "@/types/brief";

type GeneratedBriefPreviewProps = {
  brief: BriefDocument;
  generationMeta?: {
    provider: "mock" | "deepseek";
    isFallback?: boolean;
    jsonRepairStatus?: "not-needed" | "attempted" | "succeeded" | "failed";
    jsonRepairSucceeded?: boolean;
  };
};

export function GeneratedBriefPreview({
  brief,
  generationMeta,
}: GeneratedBriefPreviewProps) {
  const statusMessage = getGenerationMetaMessage(brief, generationMeta);
  const repairLabel = getRepairLabel(generationMeta);

  return (
    <section className="mt-8 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-white px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
          Generated Preview
        </p>
        <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
          {brief.metadata.ticker} / {brief.metadata.title}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-[var(--brand-ink)]">
            Data: {brief.metadata.dataMode}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-[var(--foreground)] opacity-75">
            Evidence: {getEvidenceLabel(brief)}
          </span>
          {generationMeta ? (
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[var(--foreground)] opacity-75">
              JSON Repair: {repairLabel}
            </span>
          ) : null}
        </div>
        {statusMessage ? (
          <p className="mt-3 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm leading-6 text-[var(--foreground)] opacity-85">
            {statusMessage}
          </p>
        ) : null}
      </div>
      <div className="max-h-none">
        <BriefPage brief={brief} variant="embedded" />
      </div>
    </section>
  );
}

function getEvidenceLabel(brief: BriefDocument) {
  const level = brief.researchEvidenceContext?.evidenceLevel;
  if (level === "search-and-sec") return "Search + SEC Evidence Draft";
  if (level === "sec-only") return "SEC Evidence Draft";
  if (level === "search-only") return "Search Evidence Draft";

  const hasSearch = Boolean(brief.evidencePack);
  const hasSec = Boolean(brief.secEvidencePack);

  if (hasSearch && hasSec) return "Search + SEC Evidence Draft";
  if (hasSec) return "SEC Evidence Draft";
  if (hasSearch) return "Search Evidence Draft";
  return "None / No Live Data";
}

function getGenerationMetaMessage(
  brief: BriefDocument,
  meta: GeneratedBriefPreviewProps["generationMeta"],
) {
  const level = brief.researchEvidenceContext?.evidenceLevel;

  if (meta?.provider === "mock" && meta.isFallback && level) {
    return "Evidence was fetched, but LLM generation failed. Showing fallback mock brief.";
  }

  if (meta?.provider === "deepseek" && level === "search-and-sec") {
    return "Search + SEC Evidence Draft generated with DeepSeek.";
  }

  if (meta?.jsonRepairSucceeded) {
    return "DeepSeek output was repaired into valid JSON.";
  }

  return "";
}

function getRepairLabel(meta: GeneratedBriefPreviewProps["generationMeta"]) {
  if (!meta) return "Not needed";
  if (meta.jsonRepairSucceeded) return "Succeeded";
  if (meta.jsonRepairStatus === "failed") return "Failed";
  if (meta.jsonRepairStatus === "attempted") return "Attempted";
  return "Not needed";
}
