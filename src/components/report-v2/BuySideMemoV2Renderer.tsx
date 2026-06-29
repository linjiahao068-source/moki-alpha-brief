import type { SavedBuySideMemoV2Record } from "@/lib/report-v2/buySideMemoV2Store";
import { CatalystRisk } from "./CatalystRisk";
import { CompanyProfile } from "./CompanyProfile";
import { DataSourcesFooter } from "./DataSourcesFooter";
import { FundamentalAnalysis } from "./FundamentalAnalysis";
import { InvestmentConclusion } from "./InvestmentConclusion";
import { MonitoringDashboard } from "./MonitoringDashboard";
import { ValuationFramework } from "./ValuationFramework";
import { BODY_MODULE_ANCHORS, formatText } from "./rendererUtils";

type BuySideMemoV2RendererProps = {
  record: SavedBuySideMemoV2Record;
};

export function BuySideMemoV2Renderer({ record }: BuySideMemoV2RendererProps) {
  const memo = record.memo;
  const ticker = formatText(memo.metadata.ticker, record.ticker);
  const companyName = formatText(
    memo.metadata.companyName,
    record.companyName || ticker,
  );

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-white/95">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              Moki Alpha Brief
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {ticker}
              </h1>
              <p className="pb-1 text-sm leading-6 opacity-70 sm:text-base">
                {companyName}
              </p>
            </div>
          </div>

          <div className="grid gap-1 text-sm leading-6 text-[var(--foreground)] opacity-75 sm:text-right">
            <span>Saved research memo</span>
            <span>{formatText(record.updatedAt || memo.metadata.updatedAt)}</span>
          </div>
        </div>
      </header>

      <InvestmentConclusion memo={memo} />

      <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 pb-10 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-4 rounded-[8px] border border-[var(--border)] bg-white p-3">
            <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-55">
              Sections
            </p>
            <div className="grid gap-1">
              {BODY_MODULE_ANCHORS.map((item) => (
                <a
                  className="rounded-[6px] px-2 py-2 text-sm leading-5 opacity-72 transition hover:bg-[var(--muted)] hover:opacity-100"
                  href={`#${item.id}`}
                  key={item.id}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <div className="min-w-0">
          <CompanyProfile memo={memo} />
          <FundamentalAnalysis memo={memo} />
          <ValuationFramework memo={memo} />
          <CatalystRisk memo={memo} />
          <MonitoringDashboard memo={memo} />
        </div>
      </div>

      <DataSourcesFooter memo={memo} />
    </main>
  );
}
