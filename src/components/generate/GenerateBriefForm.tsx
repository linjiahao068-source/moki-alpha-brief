"use client";

import { FormEvent, useMemo, useState } from "react";
import type { DeepSeekModelMode } from "@/lib/llm/types";
import type { BriefDocument } from "@/types/brief";
import { GeneratedBriefPreview } from "./GeneratedBriefPreview";

type GenerateApiResult = {
  ok: boolean;
  brief?: BriefDocument;
  error?: string;
  provider: "mock" | "deepseek";
  model?: string;
  modelMode?: DeepSeekModelMode;
  isFallback?: boolean;
  searchProvider?: "mock" | "tavily";
  secProvider?: "mock" | "sec";
  irProvider?: "mock" | "search";
  marketProvider?: "mock" | "stock-api" | "global-stock-data";
  consensusProvider?: "mock";
  jsonRepairStatus?: "not-needed" | "attempted" | "succeeded" | "failed";
  jsonRepairSucceeded?: boolean;
};

type DataSourceItem = {
  label: string;
  status: string;
  description: string;
  isUsed: boolean;
};

export function GenerateBriefForm() {
  const [ticker, setTicker] = useState("NVDA");
  const [companyName, setCompanyName] = useState("NVIDIA");
  const [modelMode, setModelMode] = useState<DeepSeekModelMode>("chat");
  const [useSearch, setUseSearch] = useState(false);
  const [useSec, setUseSec] = useState(false);
  const [useIr, setUseIr] = useState(false);
  const [useMarket, setUseMarket] = useState(false);
  const [useConsensus, setUseConsensus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceItems = useMemo(() => getDataSourceItems(result), [result]);

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
          useMarket,
          useConsensus,
        }),
      });
      const payload = (await response.json()) as GenerateApiResult;

      setResult(payload);
      if (!response.ok || !payload.ok) {
        setError(payload.error || "Research brief generation failed.");
      }
    } catch {
      setError("Network error while generating the research brief.");
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
              description="Fast structured generation for a concise research brief."
              label="Fast"
              model="deepseek-chat"
              onChange={() => setModelMode("chat")}
            />
            <ModelModeOption
              checked={modelMode === "reasoner"}
              description="Deeper analysis mode for slower, more deliberate synthesis."
              label="Deep Reasoning"
              model="deepseek-reasoner"
              onChange={() => setModelMode("reasoner")}
            />
          </div>
        </fieldset>

        <div className="mt-5 space-y-3">
          <EvidenceToggle
            checked={useSearch}
            description="Add recent public web context for catalysts, developments, and risk signals."
            label="Use real-time web search"
            onChange={setUseSearch}
          />
          <EvidenceToggle
            checked={useSec}
            description="Use SEC EDGAR company facts and filing metadata as official disclosure context."
            label="Use SEC official data"
            onChange={setUseSec}
          />
          <EvidenceToggle
            checked={useIr}
            description="Use company IR and earnings-release materials for official company narrative and guidance context."
            label="Use Company IR / earnings release"
            onChange={setUseIr}
          />
          <EvidenceToggle
            checked={useMarket}
            description="Add quote, volume, timestamp, and recent trading context where available."
            label="Use Market Data"
            onChange={setUseMarket}
          />
          <EvidenceToggle
            checked={useConsensus}
            description="Add revenue and EPS estimate context for expectation-gap analysis."
            label="Use Consensus Estimates"
            onChange={setUseConsensus}
          />
        </div>

        <p className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-85">
          Select the data sources to include, then generate a research brief for
          review and sharing. For research and information only; not investment
          advice.
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? "Generating..." : "Generate Research Brief"}
        </button>
      </form>

      {isLoading ? (
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-sm leading-6 text-[var(--brand-ink)]">
          Generating the brief and collecting selected source context. This can
          take a moment.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 text-sm leading-6 text-[var(--risk-ink)]">
          {error}
        </div>
      ) : null}

      {result?.brief ? (
        <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
                Generated Research Brief
              </p>
              <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
                {result.brief.metadata.ticker} / {result.brief.metadata.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
                Review the data coverage and save the brief below to create an
                unlisted public share page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
              <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-[var(--foreground)] opacity-75">
                Mode: {result.modelMode || modelMode}
              </span>
              {result.brief.metadata.generatedAt ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 font-mono text-[var(--foreground)] opacity-75">
                  {result.brief.metadata.generatedAt}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
              Data Used in This Brief
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {sourceItems.map((item) => (
                <DataSourceCard key={item.label} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : result && !error ? (
        <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 text-sm leading-6 text-[var(--risk-ink)]">
          The brief could not be generated. Please try again or adjust the
          selected sources.
        </div>
      ) : null}

      {result?.brief ? (
        <GeneratedBriefPreview
          brief={result.brief}
          generationMeta={{
            provider: result.provider,
            model: result.model,
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
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 transition hover:bg-white focus-within:ring-2 focus-within:ring-[var(--brand-hover)]">
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

function DataSourceCard({ item }: { item: DataSourceItem }) {
  return (
    <div
      className={`min-w-0 rounded-[8px] border px-3 py-3 ${
        item.isUsed
          ? "border-[var(--brand-border)] bg-white"
          : "border-[var(--border)] bg-[var(--muted)]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
        {item.label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
        {item.status}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--foreground)] opacity-70">
        {item.description}
      </p>
    </div>
  );
}

function getDataSourceItems(result: GenerateApiResult | null): DataSourceItem[] {
  const brief = result?.brief;

  return [
    {
      label: "Web Search",
      status: brief?.evidencePack ? "Used" : "Not selected",
      description: brief?.evidencePack
        ? `${brief.evidencePack.sources?.length || 0} public sources`
        : "Enable web search for recent context.",
      isUsed: Boolean(brief?.evidencePack),
    },
    {
      label: "SEC Filings",
      status: brief?.secEvidencePack ? "Used" : "Not selected",
      description: brief?.secEvidencePack
        ? `${brief.secEvidencePack.recentFilings?.length || 0} recent filings`
        : "Enable SEC data for official filings.",
      isUsed: Boolean(brief?.secEvidencePack),
    },
    {
      label: "Company IR",
      status: brief?.irEvidencePack ? "Used" : "Not selected",
      description: brief?.irEvidencePack
        ? `${brief.irEvidencePack.irItems?.length || 0} company items`
        : "Enable IR for company materials.",
      isUsed: Boolean(brief?.irEvidencePack),
    },
    {
      label: "Market Data",
      status: brief?.marketEvidencePack ? "Used" : "Not selected",
      description: brief?.marketEvidencePack
        ? getMarketDescription(brief)
        : "Enable market data for quote context.",
      isUsed: Boolean(brief?.marketEvidencePack),
    },
    {
      label: "Consensus Estimates",
      status: brief?.consensusEvidencePack ? "Used" : "Not selected",
      description: brief?.consensusEvidencePack
        ? `${brief.consensusEvidencePack.estimates?.length || 0} estimate periods`
        : "Enable consensus for revenue and EPS context.",
      isUsed: Boolean(brief?.consensusEvidencePack),
    },
  ];
}

function getMarketDescription(brief: BriefDocument) {
  const quote = brief.marketEvidencePack?.quote;
  if (!quote?.price) return "Quote context attached.";
  const currency = quote.currency ? ` ${quote.currency}` : "";
  return `${formatNumber(quote.price)}${currency}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}