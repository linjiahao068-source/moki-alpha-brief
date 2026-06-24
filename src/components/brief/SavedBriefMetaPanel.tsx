import type { ReactNode } from "react";
import type { SavedBriefRecord } from "@/types/savedBrief";

type SavedBriefMetaPanelProps = {
  savedBrief: SavedBriefRecord;
};

export function SavedBriefMetaPanel({ savedBrief }: SavedBriefMetaPanelProps) {
  const summaryItems = getEvidenceSummaryItems(savedBrief.evidenceSummary);
  const sourceCountItems = getObjectEntries(savedBrief.sourceCounts).slice(0, 12);
  const warnings = savedBrief.warnings?.slice(0, 5) || [];

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
            Saved Brief
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {savedBrief.ticker} / {savedBrief.title}
          </h2>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill>{savedBrief.dataMode}</Pill>
          <Pill>{savedBrief.evidenceLevel}</Pill>
          {savedBrief.isFallback ? <Pill tone="risk">Fallback</Pill> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem label="Saved At" value={savedBrief.createdAt} mono />
        <MetaItem label="Updated At" value={savedBrief.updatedAt} mono />
        <MetaItem label="Ticker" value={savedBrief.ticker} mono />
        <MetaItem label="Company" value={savedBrief.companyName || "n/a"} />
        <MetaItem
          label="Model Provider"
          value={savedBrief.modelProvider || "n/a"}
          mono
        />
        <MetaItem label="Model" value={savedBrief.modelName || "n/a"} mono />
        <MetaItem
          label="Schema"
          value={savedBrief.schemaVersion || "n/a"}
          mono
        />
        <MetaItem label="Record ID" value={savedBrief.id} mono />
      </div>

      {sourceCountItems.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
            Source Counts
          </p>
          <div className="mt-3 grid gap-2 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-4">
            {sourceCountItems.map(([key, value]) => (
              <MetaItem key={key} label={formatLabel(key)} value={String(value)} mono />
            ))}
          </div>
        </div>
      ) : null}

      {summaryItems.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)] opacity-75">
            Evidence Summary
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summaryItems.map(([key, value]) => (
              <Pill key={key} tone={value === true ? "brand" : "neutral"}>
                {formatLabel(key)}: {formatSummaryValue(value)}
              </Pill>
            ))}
          </div>
        </div>
      ) : null}

      {warnings.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3 text-sm leading-6 text-[var(--risk-ink)]">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {savedBrief.disclaimer ? (
        <p className="mt-4 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-sm font-semibold leading-6 text-[var(--risk-ink)]">
          {savedBrief.disclaimer}
        </p>
      ) : null}
    </section>
  );
}

function MetaItem({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[var(--border)] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
      <p className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono" : ""}`}>
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
  tone?: "brand" | "neutral" | "risk";
}) {
  const className =
    tone === "brand"
      ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
      : tone === "risk"
        ? "border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]"
        : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${className}`}
    >
      {children}
    </span>
  );
}

function getObjectEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value).filter(([, item]) =>
    ["string", "number", "boolean"].includes(typeof item),
  );
}

function getEvidenceSummaryItems(value: unknown) {
  return getObjectEntries(value)
    .filter(([key]) => key.startsWith("has"))
    .slice(0, 14);
}

function formatLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSummaryValue(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}
