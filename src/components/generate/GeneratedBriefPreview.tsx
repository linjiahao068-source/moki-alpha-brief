"use client";

import { useMemo, useState } from "react";
import { BriefPage } from "@/components/brief/BriefPage";
import type { BriefDocument } from "@/types/brief";
import type { SavedBriefRecord } from "@/types/savedBrief";

type GeneratedBriefPreviewProps = {
  brief: BriefDocument;
  generationMeta?: {
    provider: "mock" | "deepseek";
    model?: string;
    isFallback?: boolean;
    jsonRepairStatus?: "not-needed" | "attempted" | "succeeded" | "failed";
    jsonRepairSucceeded?: boolean;
  };
};

type SaveBriefApiResult = {
  ok: boolean;
  slug?: string;
  shareUrl?: string;
  savedBrief?: SavedBriefRecord;
  error?: string;
};

export function GeneratedBriefPreview({
  brief,
  generationMeta,
}: GeneratedBriefPreviewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveBriefApiResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const canSave = brief.metadata.dataMode === "evidence-draft";
  const sourceCounts = useMemo(() => getBriefSourceCounts(brief), [brief]);
  const fallbackWarning = generationMeta?.isFallback
    ? "This preview uses a fallback generated result because the model provider did not return a complete research brief."
    : "";

  async function handleSaveBrief() {
    if (!canSave || isSaving || saveResult?.ok) return;

    setIsSaving(true);
    setSaveError(null);
    setCopyStatus(null);

    try {
      const response = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefDocument: brief,
          ticker: brief.metadata.ticker,
          companyName: brief.metadata.companyName,
          metadata: {
            evidenceLevel: brief.researchEvidenceContext?.evidenceLevel || "none",
            modelProvider: generationMeta?.provider,
            modelName: generationMeta?.model,
            isFallback: generationMeta?.isFallback || false,
          },
          evidenceSummary:
            brief.evidenceSummary || brief.researchEvidenceContext?.coverage,
          sourceCounts,
          warnings: fallbackWarning ? [fallbackWarning] : [],
          disclaimer: brief.disclaimer.text,
        }),
      });
      const payload = (await response.json()) as SaveBriefApiResult;

      if (!response.ok || !payload.ok || !payload.shareUrl) {
        throw new Error(payload.error || "Brief save failed.");
      }

      setSaveResult(payload);
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "Brief save failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!saveResult?.shareUrl) return;

    try {
      await navigator.clipboard.writeText(saveResult.shareUrl);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-white px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
          Research Brief Preview
        </p>
        <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
          {brief.metadata.ticker} / {brief.metadata.title}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <SourcePill active={Boolean(brief.evidencePack)}>Web Search</SourcePill>
          <SourcePill active={Boolean(brief.secEvidencePack)}>SEC Filings</SourcePill>
          <SourcePill active={Boolean(brief.irEvidencePack)}>Company IR</SourcePill>
          <SourcePill active={Boolean(brief.marketEvidencePack)}>Market Data</SourcePill>
          <SourcePill active={Boolean(brief.consensusEvidencePack)}>
            Consensus Estimates
          </SourcePill>
        </div>
        <p className="mt-3 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm leading-6 text-[var(--foreground)] opacity-85">
          Review the brief, then save it to create an unlisted public share page.
          Saved pages read from storage and do not regenerate the report on refresh.
        </p>

        <div className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-3 sm:p-4">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-6 text-[var(--foreground)]">
                Public Share Link
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground)] opacity-75">
                Save this generated research brief as an unlisted public page.
              </p>
            </div>
            <button
              type="button"
              disabled={!canSave || isSaving || Boolean(saveResult?.ok)}
              onClick={handleSaveBrief}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-[8px] bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] focus:ring-offset-2 focus:ring-offset-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSaving
                ? "Saving..."
                : saveResult?.ok
                  ? "Share Link Created"
                  : "Save Public Share Link"}
            </button>
          </div>

          {!canSave ? (
            <p className="mt-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-sm leading-6 text-[var(--risk-ink)]">
              Only completed research briefs with attached source context can be
              saved.
            </p>
          ) : null}

          {fallbackWarning ? (
            <p className="mt-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-sm leading-6 text-[var(--risk-ink)]">
              {fallbackWarning}
            </p>
          ) : null}

          {saveError ? (
            <p className="mt-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-sm leading-6 text-[var(--risk-ink)]">
              {saveError}
            </p>
          ) : null}

          {saveResult?.ok && saveResult.shareUrl ? (
            <div className="mt-3 rounded-[8px] border border-[var(--brand-border)] bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
                Share URL
              </p>
              <p className="mt-2 break-all font-mono text-sm font-semibold leading-6 text-[var(--foreground)]">
                {saveResult.shareUrl}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] sm:w-auto"
                >
                  Copy Link
                </button>
                <a
                  href={saveResult.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 text-sm font-semibold text-[var(--brand-ink)] transition hover:bg-[var(--brand-soft-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] sm:w-auto"
                >
                  Open Share Page
                </a>
                {copyStatus ? (
                  <span className="inline-flex min-h-10 items-center text-sm font-semibold leading-6 text-[var(--foreground)] opacity-75">
                    {copyStatus}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="max-h-none">
        <BriefPage brief={brief} variant="embedded" />
      </div>
    </section>
  );
}

function SourcePill({
  active,
  children,
}: {
  active: boolean;
  children: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
          : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] opacity-70"
      }`}
    >
      {children}: {active ? "Used" : "Not selected"}
    </span>
  );
}

function getBriefSourceCounts(brief: BriefDocument) {
  return {
    searchSources: brief.evidencePack?.sources?.length || 0,
    searchItems: brief.evidencePack?.newsItems?.length || 0,
    secSources: brief.secEvidencePack?.sources?.length || 0,
    secRecentFilings: brief.secEvidencePack?.recentFilings?.length || 0,
    secFiscalFacts: brief.secEvidencePack?.fiscalFacts?.length || 0,
    irSources: brief.irEvidencePack?.sources?.length || 0,
    irItems: brief.irEvidencePack?.irItems?.length || 0,
    marketSources: brief.marketEvidencePack?.sources?.length || 0,
    marketPriceHistoryPoints: brief.marketEvidencePack?.priceHistory?.length || 0,
    consensusSources: brief.consensusEvidencePack?.sources?.length || 0,
    consensusEstimates: brief.consensusEvidencePack?.estimates?.length || 0,
    researchSources: brief.researchEvidenceContext?.sourceRegistry?.length || 0,
    researchFacts: brief.researchEvidenceContext?.factLedger?.length || 0,
  };
}