"use client";

import { FormEvent, useMemo, useState } from "react";
import { DataBoundaryNote } from "@/components/brief/DataBoundaryNote";
import { getEvidenceStatusCopy } from "@/lib/evidence/evidenceStatusCopy";
import type { DeepSeekModelMode } from "@/lib/llm/types";
import type { BriefDocument } from "@/types/brief";
import type {
  EvidenceCoverageSummary,
  ResearchEvidenceContext,
  ResearchEvidenceLevel,
} from "@/types/evidence";
import { GeneratedBriefPreview } from "./GeneratedBriefPreview";
import { IrEvidencePanel } from "./IrEvidencePanel";
import { ResearchEvidencePanel } from "./ResearchEvidencePanel";
import { SecEvidencePanel } from "./SecEvidencePanel";
import { SourceEvidenceList } from "./SourceEvidenceList";

type GenerateApiResult = {
  ok: boolean;
  brief?: BriefDocument;
  issues?: string[];
  qualityWarnings?: string[];
  error?: string;
  provider: "mock" | "deepseek";
  model?: string;
  modelMode?: DeepSeekModelMode;
  isFallback?: boolean;
  searchProvider?: "mock" | "tavily";
  searchIsFallback?: boolean;
  searchWarnings?: string[];
  secProvider?: "mock" | "sec";
  secIsFallback?: boolean;
  secWarnings?: string[];
  cik?: string;
  irProvider?: "mock" | "search";
  irIsFallback?: boolean;
  irWarnings?: string[];
  researchEvidenceContext?: ResearchEvidenceContext;
  evidenceLevel?: ResearchEvidenceLevel;
  coverage?: EvidenceCoverageSummary;
  evidenceWarnings?: string[];
  jsonRepairStatus?: "not-needed" | "attempted" | "succeeded" | "failed";
  jsonRepairSucceeded?: boolean;
};

export function GenerateBriefForm() {
  const [ticker, setTicker] = useState("NVDA");
  const [companyName, setCompanyName] = useState("NVIDIA");
  const [modelMode, setModelMode] = useState<DeepSeekModelMode>("chat");
  const [useSearch, setUseSearch] = useState(false);
  const [useSec, setUseSec] = useState(false);
  const [useIr, setUseIr] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const researchEvidenceContext = useMemo(
    () => result?.researchEvidenceContext || result?.brief?.researchEvidenceContext,
    [result],
  );
  const coverage = result?.coverage || result?.brief?.evidenceSummary;
  const evidenceLevel =
    result?.evidenceLevel || researchEvidenceContext?.evidenceLevel;
  const evidenceStatus = useMemo(
    () =>
      getEvidenceStatusCopy({
        evidenceLevel,
        hasSearchEvidence: Boolean(result?.brief?.evidencePack),
        hasSecEvidence: Boolean(result?.brief?.secEvidencePack),
        hasIrEvidence: Boolean(result?.brief?.irEvidencePack),
        searchProvider:
          result?.searchProvider || result?.brief?.evidencePack?.searchProvider,
        secProvider:
          result?.secProvider || result?.brief?.secEvidencePack?.provider,
        irProvider: result?.irProvider || result?.brief?.irEvidencePack?.provider,
      }),
    [evidenceLevel, result],
  );
  const issueList = useMemo(
    () => (result?.issues || []).filter(Boolean),
    [result],
  );
  const qualityWarningList = useMemo(
    () => (result?.qualityWarnings || []).filter(Boolean),
    [result],
  );
  const searchWarningList = useMemo(
    () => (result?.searchWarnings || []).filter(Boolean),
    [result],
  );
  const secWarningList = useMemo(
    () => (result?.secWarnings || []).filter(Boolean),
    [result],
  );
  const irWarningList = useMemo(
    () => (result?.irWarnings || []).filter(Boolean),
    [result],
  );
  const evidenceStats = useMemo(
    () => getEvidenceStats(result?.brief),
    [result],
  );
  const secStats = useMemo(() => getSecStats(result?.brief), [result]);
  const irStats = useMemo(() => getIrStats(result?.brief), [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          companyName,
          language: "zh-CN",
          modelMode,
          useSearch,
          useSec,
          useIr,
        }),
      });
      const payload = (await response.json()) as GenerateApiResult;

      setResult(payload);
      if (!response.ok || !payload.ok) {
        setError(payload.error || "Brief generation failed.");
      }
    } catch {
      setError("Network error while calling /api/generate-brief.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-[8px] border border-[var(--border)] bg-white p-4 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-6"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <label className="block min-w-0">
            <span className="text-sm font-semibold leading-6 text-[var(--foreground)]">
              Ticker
            </span>
            <input
              value={ticker}
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              className="mt-2 h-11 w-full rounded-[8px] border border-[var(--border)] bg-white px-3 font-mono text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-soft-strong)]"
              maxLength={12}
              placeholder="NVDA"
              required
            />
          </label>
          <label className="block min-w-0">
            <span className="text-sm font-semibold leading-6 text-[var(--foreground)]">
              Company Name
            </span>
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="mt-2 h-11 w-full rounded-[8px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-soft-strong)]"
              placeholder="NVIDIA"
            />
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold leading-6 text-[var(--foreground)]">
            Model Mode
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <ModelModeOption
              checked={modelMode === "chat"}
              description="Fast is optimized for quick structured generation with deepseek-chat."
              label="Fast"
              model="deepseek-chat"
              onChange={() => setModelMode("chat")}
            />
            <ModelModeOption
              checked={modelMode === "reasoner"}
              description="Deep Reasoning uses deepseek-reasoner. It may be slower, and reasoning_content is never shown or stored."
              label="Deep Reasoning"
              model="deepseek-reasoner"
              onChange={() => setModelMode("reasoner")}
            />
          </div>
        </fieldset>

        <EvidenceToggle
          checked={useSearch}
          description="Fetch Tavily or mock search evidence for recent developments, catalysts, and risk context."
          label="Use real-time web search"
          onChange={setUseSearch}
        />
        <EvidenceToggle
          checked={useSec}
          description="Fetch SEC EDGAR companyfacts and submissions metadata for official disclosure evidence."
          label="Use SEC official data"
          onChange={setUseSec}
        />
        <EvidenceToggle
          checked={useIr}
          description="Use Company IR / earnings-release search evidence for official company narrative and management commentary."
          label="Use Company IR / earnings release"
          onChange={setUseIr}
        />

        <div className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-85">
          Current mode is LLM Demo / Evidence Draft. Optional Search, SEC,
          and Company IR evidence remain draft inputs; real-time market price,
          consensus estimates, database save, PDF full-text parsing, transcript
          full-text parsing, and manual verification are still out of scope.
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? "Generating..." : "生成 Brief"}
        </button>
      </form>

      {error ? (
        <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 text-sm leading-6 text-[var(--risk-ink)]">
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
          <div className="grid gap-3 text-sm leading-6 text-[var(--foreground)] sm:grid-cols-2 lg:grid-cols-4">
            <StatusItem label="Provider" value={result.provider} mono />
            <StatusItem label="Model" value={result.model || "n/a"} mono />
            <StatusItem label="Mode" value={result.modelMode || modelMode} mono />
            <StatusItem label="Fallback" value={result.isFallback ? "Yes" : "No"} mono />
            <StatusItem label="Validation" value={result.ok ? "Passed" : "Needs attention"} mono />
            <StatusItem label="JSON Repair" value={getJsonRepairLabel(result)} mono />
            <StatusItem label="Data Mode" value={result.brief?.metadata.dataMode || "n/a"} mono />
            <StatusItem label="Evidence" value={evidenceStatus.label} mono />
            <StatusItem label="Evidence Level" value={evidenceLevel || "none"} mono />
            <StatusItem label="Coverage" value={getCoverageLabel(coverage)} mono />
            <StatusItem label="Revenue / NI / EPS" value={getFactCoverageLabel(coverage)} mono />
            <StatusItem label="Search Provider" value={result.searchProvider || "n/a"} mono />
            <StatusItem label="Sources" value={String(evidenceStats.total)} mono />
            <StatusItem label="High / Medium / Low" value={`${evidenceStats.high} / ${evidenceStats.medium} / ${evidenceStats.low}`} mono />
            <StatusItem label="SEC Provider" value={result.secProvider || "n/a"} mono />
            <StatusItem label="CIK" value={result.cik || result.brief?.secEvidencePack?.cik || "n/a"} mono />
            <StatusItem label="Recent Filings" value={String(secStats.recentFilings)} mono />
            <StatusItem label="Fiscal Facts" value={String(secStats.fiscalFacts)} mono />
            <StatusItem label="IR Provider" value={result.irProvider || "n/a"} mono />
            <StatusItem label="IR Sources" value={String(irStats.total)} mono />
            <StatusItem label="Company IR Coverage" value={coverage?.hasCompanyIr ? "yes" : "no"} mono />
            <StatusItem label="Earnings / Guidance" value={getIrCoverageLabel(coverage)} mono />
          </div>

          <p className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-85">
            {getGenerationStatusMessage(result, evidenceStatus.shortDescription)}
          </p>

          <p className="mt-3 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
            {evidenceStatus.warningDescription}
          </p>

          {result.jsonRepairSucceeded ? (
            <p className="mt-3 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
              DeepSeek output was repaired into valid JSON.
            </p>
          ) : null}

          {(result.modelMode || modelMode) === "reasoner" ? (
            <p className="mt-3 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
              使用 Deep Reasoning 模式生成；推理过程不会展示，仅展示最终结构化 BriefDocument。
            </p>
          ) : null}

          <IssuePanel title="Validation Issues" items={issueList} />
          <IssuePanel title="Quality Warnings" items={qualityWarningList} brand />
          <IssuePanel title="Search Warnings" items={searchWarningList} />
          <IssuePanel title="SEC Warnings" items={secWarningList} />
          <IssuePanel title="IR Warnings" items={irWarningList} />
        </section>
      ) : null}

      {result?.brief ? <DataBoundaryNote brief={result.brief} /> : null}

      {researchEvidenceContext ? (
        <ResearchEvidencePanel
          context={researchEvidenceContext}
          warnings={result?.evidenceWarnings}
        />
      ) : null}

      {result?.brief?.evidencePack ? (
        <SourceEvidenceList
          evidenceLevel={evidenceLevel}
          evidencePack={result.brief.evidencePack}
          hasSecEvidence={Boolean(result.brief.secEvidencePack)}
          secProvider={result.secProvider || result.brief.secEvidencePack?.provider}
          warnings={searchWarningList}
        />
      ) : null}

      {result?.brief?.secEvidencePack ? (
        <SecEvidencePanel
          secEvidencePack={result.brief.secEvidencePack}
          warnings={secWarningList}
        />
      ) : null}

      {result?.brief?.irEvidencePack ? (
        <IrEvidencePanel
          irEvidencePack={result.brief.irEvidencePack}
          warnings={irWarningList}
        />
      ) : null}

      {result?.brief ? (
        <GeneratedBriefPreview
          brief={result.brief}
          generationMeta={{
            provider: result.provider,
            isFallback: result.isFallback,
            jsonRepairStatus: result.jsonRepairStatus,
            jsonRepairSucceeded: result.jsonRepairSucceeded,
          }}
        />
      ) : null}
    </div>
  );
}

function EvidenceToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 transition hover:bg-white focus-within:ring-2 focus-within:ring-[var(--brand-hover)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 accent-[var(--brand-hover)]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-6 text-[var(--foreground)]">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-6 text-[var(--foreground)] opacity-75">
          {description}
        </span>
      </span>
    </label>
  );
}

function ModelModeOption({
  checked,
  description,
  label,
  model,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  model: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`block min-w-0 cursor-pointer rounded-[8px] border p-4 transition focus-within:ring-2 focus-within:ring-[var(--brand-hover)] ${
        checked
          ? "border-[var(--brand-border)] bg-[var(--brand-soft)]"
          : "border-[var(--border)] bg-white hover:bg-[var(--muted)]"
      }`}
    >
      <span className="flex items-start gap-3">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          className="mt-1 size-4 accent-[var(--brand-hover)]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-6 text-[var(--foreground)]">
            {label}
          </span>
          <span className="mt-0.5 block font-mono text-xs font-semibold leading-5 text-[var(--brand-ink)]">
            {model}
          </span>
          <span className="mt-2 block text-sm leading-6 text-[var(--foreground)] opacity-75">
            {description}
          </span>
        </span>
      </span>
    </label>
  );
}

function StatusItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-semibold ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function IssuePanel({
  brand = false,
  items,
  title,
}: {
  brand?: boolean;
  items: string[];
  title: string;
}) {
  if (!items.length) return null;

  return (
    <div
      className={`mt-4 rounded-[8px] border px-4 py-3 ${
        brand
          ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
          : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]"
      }`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 opacity-85">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function getEvidenceStats(brief?: BriefDocument) {
  const sources = brief?.evidencePack?.sources || [];
  const warnings = brief?.evidencePack?.warnings || [];

  return sources.reduce(
    (acc, source) => {
      acc.total += 1;
      acc[source.confidence || "low"] += 1;
      return acc;
    },
    {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      warningCount: warnings.length,
    },
  );
}

function getSecStats(brief?: BriefDocument) {
  return {
    recentFilings: brief?.secEvidencePack?.recentFilings.length || 0,
    fiscalFacts: brief?.secEvidencePack?.fiscalFacts.length || 0,
    warningCount: brief?.secEvidencePack?.warnings?.length || 0,
  };
}

function getIrStats(brief?: BriefDocument) {
  return {
    total: brief?.irEvidencePack?.irItems.length || 0,
    warningCount: brief?.irEvidencePack?.warnings?.length || 0,
  };
}

function getGenerationStatusMessage(
  result: GenerateApiResult,
  fallbackCopy: string,
) {
  const level = result.evidenceLevel || result.brief?.researchEvidenceContext?.evidenceLevel;

  if (result.provider === "mock" && result.isFallback && level && level !== "none") {
    return "Evidence was fetched, but LLM generation failed. Showing fallback mock brief.";
  }

  if (result.provider === "deepseek") {
    return fallbackCopy;
  }

  return fallbackCopy;
}

function getJsonRepairLabel(result: GenerateApiResult) {
  if (result.jsonRepairSucceeded) return "Succeeded";
  if (result.jsonRepairStatus === "failed") return "Failed";
  if (result.jsonRepairStatus === "attempted") return "Attempted";
  return "Not needed";
}

function getCoverageLabel(coverage?: EvidenceCoverageSummary) {
  if (!coverage) return "none";
  return [
    coverage.hasSearchEvidence ? "Search" : "Search missing",
    coverage.hasSecEvidence ? "SEC" : "SEC missing",
    coverage.hasCompanyIr ? "IR" : "IR missing",
    "Market Price missing",
    "Consensus missing",
  ].join(" / ");
}

function getFactCoverageLabel(coverage?: EvidenceCoverageSummary) {
  if (!coverage) return "n/a";
  return `${coverage.hasRevenueFact ? "yes" : "no"} / ${
    coverage.hasNetIncomeFact ? "yes" : "no"
  } / ${coverage.hasEpsFact ? "yes" : "no"}`;
}

function getIrCoverageLabel(coverage?: EvidenceCoverageSummary) {
  if (!coverage) return "n/a";
  return `${coverage.hasEarningsRelease ? "earnings yes" : "earnings no"} / ${
    coverage.hasGuidanceContext ? "guidance yes" : "guidance no"
  }`;
}
