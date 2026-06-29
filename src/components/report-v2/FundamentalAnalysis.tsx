import type { BuySideMemoV2 } from "@/lib/report-v2/buySideMemoSchema";
import {
  asArray,
  BulletList,
  COPY,
  EmptyState,
  FieldBlock,
  formatText,
  MetricValue,
  SectionShell,
} from "./rendererUtils";

type FundamentalAnalysisProps = {
  memo: BuySideMemoV2;
};

export function FundamentalAnalysis({ memo }: FundamentalAnalysisProps) {
  const section = memo.fundamentalAnalysis;
  const facts = asArray(section.secFacts);

  return (
    <SectionShell
      eyebrow="Operating trend"
      id="fundamental-analysis"
      index="03"
      title={"\u57fa\u672c\u9762\u5206\u6790"}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FieldBlock
          label="Revenue trend"
          value={formatText(section.revenueQuality)}
        />
        <FieldBlock
          label="Margin trend"
          value={formatText(section.marginStructure)}
        />
        <FieldBlock
          label="Cash flow / capex"
          value={formatText(section.cashFlow)}
        />
        <FieldBlock
          label="Balance sheet"
          value={formatText(section.balanceSheet)}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <FieldBlock
          label="Growth drivers"
          value={
            <BulletList
              emptyText={
                "\u589e\u957f\u9a71\u52a8\u9700\u8981\u540e\u7eed\u8ddf\u8e2a"
              }
              items={section.growthDrivers}
            />
          }
        />
        <FieldBlock
          label="Estimate context"
          value={formatText(
            section.consensusContext,
            `${COPY.realConsensusUnavailable}\uff0c\u4e0d\u80fd\u4f5c\u4e3a\u5e02\u573a\u4e00\u81f4\u9884\u671f\u4f7f\u7528`,
          )}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-[8px] border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
            Reported facts
          </p>
          <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
            {"\u62ab\u9732\u4e8b\u5b9e\u4e0e\u8d8b\u52bf\u9a8c\u8bc1"}
          </h3>
        </div>
        {facts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)] text-xs uppercase tracking-[0.12em] opacity-70">
                  <th className="px-4 py-3 font-semibold">Metric</th>
                  <th className="px-4 py-3 font-semibold">Current status</th>
                  <th className="px-4 py-3 font-semibold">Why it matters</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {facts.map((fact, index) => (
                  <tr className="align-top" key={`${fact.label}-${index}`}>
                    <td className="px-4 py-4 font-semibold">
                      {formatText(fact.label)}
                    </td>
                    <td className="px-4 py-4">
                      <MetricValue metric={fact} />
                    </td>
                    <td className="px-4 py-4 leading-6 opacity-80">
                      {formatText(fact.whyItMatters)}
                    </td>
                    <td className="px-4 py-4 leading-6 opacity-75">
                      {formatText(fact.source)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState>{COPY.disclosureFactsUnavailable}</EmptyState>
          </div>
        )}
      </div>

      <div className="mt-4">
        <BulletList
          emptyText={"\u7f3a\u5931\u9879\u9700\u8981\u540e\u7eed\u8ddf\u8e2a"}
          items={section.missingData}
        />
      </div>
    </SectionShell>
  );
}
