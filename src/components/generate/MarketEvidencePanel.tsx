import type { MarketEvidencePack, MarketQuote } from "@/types/evidence";
import type { ReactNode } from "react";

type MarketEvidencePanelProps = {
  marketEvidencePack?: MarketEvidencePack;
  warnings?: string[];
};

export function MarketEvidencePanel({
  marketEvidencePack,
  warnings = [],
}: MarketEvidencePanelProps) {
  if (!marketEvidencePack) return null;

  const quote = marketEvidencePack.quote;
  const combinedWarnings = Array.from(
    new Set([...(marketEvidencePack.warnings || []), ...warnings].filter(Boolean)),
  );

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
            Market Evidence
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {marketEvidencePack.provider === "mock"
              ? "Mock Market Evidence"
              : "Market Evidence Draft"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
            Third-party free market evidence is used only for quote, volume,
            recent daily kline, valuation context, and monitoring context. It is
            not SEC official-financial data, consensus, a formal trading quote,
            verification-grade data, or investment advice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill tone="brand">{marketEvidencePack.provider}</Pill>
          <Pill>{marketEvidencePack.sources.length} sources</Pill>
          <Pill>{marketEvidencePack.priceHistory?.length || 0} daily points</Pill>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Price" value={formatMoney(quote?.price, quote?.currency)} />
        <Metric label="Change" value={formatNumber(quote?.change)} />
        <Metric label="Percent Change" value={formatPercent(quote?.percentChange)} />
        <Metric label="Volume" value={formatNumber(quote?.volume)} />
        <Metric label="Previous Close" value={formatMoney(quote?.previousClose, quote?.currency)} />
        <Metric label="Open" value={formatMoney(quote?.open, quote?.currency)} />
        <Metric label="High" value={formatMoney(quote?.high, quote?.currency)} />
        <Metric label="Low" value={formatMoney(quote?.low, quote?.currency)} />
        <Metric label="Market Cap" value={formatMoney(quote?.marketCap, quote?.currency)} />
        <Metric label="Currency" value={quote?.currency || "N/A"} />
        <Metric label="Exchange" value={quote?.exchange || "N/A"} />
        <Metric label="RetrievedAt" value={quote?.retrievedAt || marketEvidencePack.asOf || "N/A"} />
        <Metric label="Market Timestamp" value={quote?.marketTimestamp || "N/A"} />
        <Metric label="Date Status" value={quote?.dateStatus || getDateStatus(quote)} />
      </div>

      {combinedWarnings.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
          <p className="font-semibold">
            Market Warnings: {combinedWarnings.length}
          </p>
          <ul className="mt-2 space-y-1">
            {combinedWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {marketEvidencePack.priceHistory?.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold leading-6 text-[var(--foreground)]">
            Recent Daily Kline
          </h3>
          <div className="mt-3 overflow-x-auto rounded-[8px] border border-[var(--border)]">
            <table className="min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-[var(--muted)] text-xs uppercase tracking-[0.12em] text-[var(--foreground)] opacity-75">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Open</th>
                  <th className="px-3 py-3">High</th>
                  <th className="px-3 py-3">Low</th>
                  <th className="px-3 py-3">Close</th>
                  <th className="px-3 py-3">Volume</th>
                </tr>
              </thead>
              <tbody>
                {marketEvidencePack.priceHistory.slice(-10).map((point) => (
                  <tr key={point.date} className="border-t border-[var(--border)]">
                    <td className="px-3 py-3 font-mono">{point.date}</td>
                    <td className="px-3 py-3 font-mono">{formatNumber(point.open)}</td>
                    <td className="px-3 py-3 font-mono">{formatNumber(point.high)}</td>
                    <td className="px-3 py-3 font-mono">{formatNumber(point.low)}</td>
                    <td className="px-3 py-3 font-mono">{formatNumber(point.close)}</td>
                    <td className="px-3 py-3 font-mono">{formatNumber(point.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
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

function getDateStatus(quote?: MarketQuote) {
  if (!quote) return "unknown";
  return quote.marketTimestamp ? "market-timestamp" : "retrieved-only";
}

function formatMoney(value: number | undefined, currency?: string) {
  if (value === undefined) return "N/A";
  const suffix = currency ? ` ${currency}` : "";
  return `${formatNumber(value)}${suffix}`;
}

function formatPercent(value: number | undefined) {
  if (value === undefined) return "N/A";
  return `${formatNumber(value)}%`;
}

function formatNumber(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
