"use client";

import { FormEvent, useMemo, useState } from "react";
import type { BriefDocument } from "@/types/brief";
import type { DeepSeekModelMode } from "@/lib/llm/types";
import { DataBoundaryNote } from "@/components/brief/DataBoundaryNote";
import { GeneratedBriefPreview } from "./GeneratedBriefPreview";
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
};

export function GenerateBriefForm() {
  const [ticker, setTicker] = useState("NVDA");
  const [companyName, setCompanyName] = useState("NVIDIA");
  const [modelMode, setModelMode] = useState<DeepSeekModelMode>("chat");
  const [useSearch, setUseSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          companyName,
          language: "zh-CN",
          modelMode,
          useSearch,
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
              description="Fast 适合快速生成，使用 deepseek-chat。"
              label="Fast"
              model="deepseek-chat"
              onChange={() => setModelMode("chat")}
            />
            <ModelModeOption
              checked={modelMode === "reasoner"}
              description="Deep Reasoning 适合复杂研报结构推理，速度可能更慢、成本可能更高。"
              label="Deep Reasoning"
              model="deepseek-reasoner"
              onChange={() => setModelMode("reasoner")}
            />
          </div>
        </fieldset>

        <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 transition hover:bg-white focus-within:ring-2 focus-within:ring-[var(--brand-hover)]">
          <input
            type="checkbox"
            checked={useSearch}
            onChange={(event) => setUseSearch(event.target.checked)}
            className="mt-1 size-4 accent-[var(--brand-hover)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-6 text-[var(--foreground)]">
              Use real-time web search
            </span>
            <span className="mt-1 block text-sm leading-6 text-[var(--foreground)] opacity-75">
              打开后会先构建 Search Evidence Pack，再让 DeepSeek 基于搜索证据草稿生成；当前仍未接 SEC、实时股价、一致预期或数据库。
            </span>
          </span>
        </label>

        <div className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-85">
          当前为 LLM Demo / Mock Demo / Search Evidence Draft，未接入 SEC、实时股价、一致预期或数据库，不构成投资建议。
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? "生成中..." : "生成 Brief"}
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
            <StatusItem
              label="Mode"
              value={result.modelMode || modelMode}
              mono
            />
            <StatusItem
              label="Fallback"
              value={result.isFallback ? "Yes" : "No"}
              mono
            />
            <StatusItem
              label="Validation"
              value={result.ok ? "Passed" : "Needs attention"}
              mono
            />
            <StatusItem
              label="Quality"
              value={
                qualityWarningList.length
                  ? `Warnings: ${qualityWarningList.length}`
                  : "Clear"
              }
              mono
            />
            <StatusItem
              label="Data Mode"
              value={result.brief?.metadata.dataMode || "n/a"}
              mono
            />
            <StatusItem
              label="Evidence"
              value={
                result.brief?.evidencePack
                  ? "Search Evidence Draft"
                  : "None / No Live Data"
              }
              mono
            />
            <StatusItem
              label="Search Provider"
              value={result.searchProvider || "n/a"}
              mono
            />
            <StatusItem
              label="Sources"
              value={String(result.brief?.evidencePack?.newsItems?.length || 0)}
              mono
            />
          </div>
          <p className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
            当前为 LLM Demo / Search Evidence Draft，未接入 SEC、实时股价、
            一致预期或数据库；搜索证据仅用于辅助研究草稿。
          </p>
          <p className="mt-3 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
            当前阶段为 Search Evidence MVP，搜索证据仅用于辅助研究草稿，未接 SEC、实时股价、一致预期，不构成投资建议。
          </p>
          {result.error && result.ok ? (
            <p className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
              {result.error}
            </p>
          ) : null}
          {(result.modelMode || modelMode) === "reasoner" ? (
            <p className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
              使用 Deep Reasoning 模式生成；推理过程不会展示，仅展示最终结构化
              BriefDocument。
            </p>
          ) : null}
          {issueList.length ? (
            <div className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Validation Issues
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--foreground)] opacity-80">
                {issueList.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {qualityWarningList.length ? (
            <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--brand-ink)]">
                Quality Warnings
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--brand-ink)]">
                {qualityWarningList.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {searchWarningList.length ? (
            <div className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Search Warnings
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--foreground)] opacity-80">
                {searchWarningList.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {result?.brief ? <DataBoundaryNote brief={result.brief} /> : null}

      {result?.brief?.evidencePack ? (
        <SourceEvidenceList
          evidencePack={result.brief.evidencePack}
          warnings={searchWarningList}
        />
      ) : null}

      {result?.brief ? <GeneratedBriefPreview brief={result.brief} /> : null}
    </div>
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
