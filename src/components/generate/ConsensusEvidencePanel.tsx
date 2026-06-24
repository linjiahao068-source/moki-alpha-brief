import type { ConsensusEstimate, ConsensusEvidencePack } from "@/types/evidence";
import type { ReactNode } from "react";

type ConsensusEvidencePanelProps = {
  consensusEvidencePack?: ConsensusEvidencePack;
  warnings?: string[];
};

export function ConsensusEvidencePanel({
  consensusEvidencePack,
  warnings = [],
}: ConsensusEvidencePanelProps) {
  if (!consensusEvidencePack) return null;

  const combinedWarnings = Array.from(
    new Set([...(consensusEvidencePack.warnings || []), ...warnings].filter(Boolean)),
  );

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
            Consensus Evidence
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            Mock Consensus Evidence Draft
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
            Revenue / EPS analyst estimate context for expectation-gap analysis.
            This MVP uses mock consensus evidence only. It is not SEC actual
            data, not market price data, not verified-real-data, and not
            investment advice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill tone="brand">{consensusEvidencePack.provider}</Pill>
          <Pill>{consensusEvidencePack.period}</Pill>
          <Pill>{consensusEvidencePack.estimates.length} estimates</Pill>
          {consensusEvidencePack.isFallback ? <Pill>mock fallback</Pill> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Provider" value={consensusEvidencePack.provider} />
        <Metric label="As Of" value={consensusEvidencePack.asOf || "N/A"} />
        <Metric
          label="Provider Chain"
          value={consensusEvidencePack.providerChain?.join(" -> ") || "mock"}
        />
        <Metric label="Data Mode" value={consensusEvidencePack.dataMode} />
      </div>

      {combinedWarnings.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
          <p className="font-semibold">
            Consensus Warnings: {combinedWarnings.length}
          </p>
          <ul className="mt-2 space-y-1">
            {combinedWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {consensusEvidencePack.estimates.map((estimate, index) => (
          <EstimateCard
            estimate={estimate}
            index={index}
            key={estimate.id || `${estimate.fiscalPeriod}-${index}`}
          />
        ))}
      </div>
    </section>
  );
}

function EstimateCard({
  estimate,
  index,
}: {
  estimate: ConsensusEstimate;
  index: number;
}) {
  return (
    <article className="min-w-0 rounded-[8px] border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="min-w-0 text-sm font-semibold leading-6 text-[var(--foreground)]">
          {estimate.fiscalPeriod || `Estimate ${index + 1}`}
        </h3>
        <span className="w-fit shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 font-mono text-xs text-[var(--foreground)] opacity-70">
          #{index + 1}
        </span>
      </div>

      <div className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-2">
        <Metric label="Fiscal Period" value={estimate.fiscalPeriod || "N/A"} />
        <Metric label="Fiscal Year" value={formatNumber(estimate.fiscalYear)} />
        <Metric label="Period End" value={estimate.periodEnd || "N/A"} />
        <Metric label="Estimate Date" value={estimate.estimateDate || "N/A"} />
        <Metric
          label="Revenue Avg"
          value={formatMoney(estimate.revenueAvg, estimate.currency)}
        />
        <Metric
          label="Revenue Low"
          value={formatMoney(estimate.revenueLow, estimate.currency)}
        />
        <Metric
          label="Revenue High"
          value={formatMoney(estimate.revenueHigh, estimate.currency)}
        />
        <Metric label="EPS Avg" value={formatMoney(estimate.epsAvg, estimate.currency)} />
        <Metric label="EPS Low" value={formatMoney(estimate.epsLow, estimate.currency)} />
        <Metric label="EPS High" value={formatMoney(estimate.epsHigh, estimate.currency)} />
        <Metric label="Analyst Count" value={formatNumber(estimate.analystCount)} />
        <Metric label="Provider" value={estimate.sourceProvider || "mock"} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
        {label}
      </p>
      <p className="mt-1 break-words font-mono text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "brand" | "neutral";
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 ${
        tone === "brand"
          ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
          : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] opacity-75"
      }`}
    >
      {children}
    </span>
  );
}

function formatMoney(value: number | undefined, currency?: string) {
  if (value === undefined || Number.isNaN(value)) return "N/A";
  const suffix = currency ? ` ${currency}` : "";
  return `${formatNumber(value)}${suffix}`;
}

function formatNumber(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
