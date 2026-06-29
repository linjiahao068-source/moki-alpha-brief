import type { BuySideMemoV2 } from "@/lib/report-v2/buySideMemoSchema";
import {
  BulletList,
  COPY,
  FieldBlock,
  formatConfidence,
  formatDataSufficiency,
  formatText,
  InfoPill,
  TextBlockList,
} from "./rendererUtils";

type InvestmentConclusionProps = {
  companyName: string;
  memo: BuySideMemoV2;
  savedAt: string;
  sourceCoverage: string;
  ticker: string;
};

export function InvestmentConclusion({
  companyName,
  memo,
  savedAt,
  sourceCoverage,
  ticker,
}: InvestmentConclusionProps) {
  const section = memo.investmentConclusion;
  const stance = inferStance(section.conclusion || section.thesis);
  const bias = inferResearchBias(section.conclusion || section.variantView);
  const dataSufficiency = memo.valuationFramework.dataSufficiency;

  return (
    <section
      className="mx-auto w-full max-w-[1180px] px-4 pt-6 sm:px-6 sm:pt-8"
      id="investment-conclusion"
    >
      <div className="rounded-[8px] border border-[var(--foreground)] bg-white shadow-[0_24px_60px_-48px_rgba(0,0,0,0.55)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                  Buy-side memo summary
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="inline-flex rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft-strong)] px-4 py-3 font-mono text-4xl font-semibold leading-none text-[var(--brand-ink)] sm:text-5xl">
                    {ticker}
                  </div>
                  <div className="min-w-0 pb-1">
                    <h1 className="text-xl font-semibold leading-7 text-[var(--foreground)] sm:text-2xl">
                      {companyName}
                    </h1>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
                      {formatText(memo.metadata.title, "Buy-side memo")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-1 text-sm leading-6 opacity-70 sm:text-right">
                <span>Saved memo</span>
                <span className="font-mono">{savedAt}</span>
              </div>
            </div>

            <div className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
                Core thesis
              </p>
              <p className="mt-2 text-[15px] leading-8 text-[var(--foreground)] sm:text-base">
                {formatText(section.thesis)}
              </p>
            </div>
          </div>

          <aside className="border-t border-[var(--border)] bg-[var(--muted)] p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <Signal label="Stance" value={stance} tone="brand" />
              <Signal label="Research bias" value={bias} />
              <Signal
                label="Confidence"
                value={formatConfidence(section.confidence)}
              />
              <Signal
                label="Data sufficiency"
                value={formatDataSufficiency(dataSufficiency)}
                tone={dataSufficiency === "sufficient" ? "brand" : "risk"}
              />
              <Signal label="Source coverage" value={sourceCoverage} />
            </div>
          </aside>
        </div>

        <div className="grid gap-4 border-t border-[var(--border)] p-5 lg:grid-cols-[1fr_1fr_1.2fr] sm:p-6">
          <FieldBlock label="Conclusion" value={formatText(section.conclusion)} />
          <FieldBlock label="Key debate" value={formatText(section.keyDebate)} />
          <FieldBlock
            label="Thesis breakpoint"
            value={
              <BulletList
                emptyText={
                  "\u8be5 thesis \u7684\u5931\u6548\u6761\u4ef6\u9700\u8981\u540e\u7eed\u8ddf\u8e2a"
                }
                items={section.whatWouldChangeMind}
              />
            }
          />
        </div>

        <div className="grid gap-4 border-t border-[var(--border)] p-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:p-6">
            <FieldBlock
              label="Variant perception"
              value={formatText(section.variantView)}
            />
            <TextBlockList
              blocks={section.keyPoints}
              emptyText={
                "\u5173\u952e\u5224\u65ad\u4ecd\u9700\u8981\u66f4\u591a\u53ef\u9760\u6765\u6e90\u652f\u6491"
              }
            />
        </div>
      </div>
    </section>
  );
}

function Signal({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "brand" | "neutral" | "risk";
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[var(--border)] bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55">
        {label}
      </p>
      <div className="mt-2">
        <InfoPill tone={tone || "neutral"}>{value}</InfoPill>
      </div>
    </div>
  );
}

function inferStance(value: unknown) {
  const text = formatText(value, "").toLowerCase();
  if (text.includes("\u504f\u79ef\u6781") || text.includes("positive")) {
    return "\u504f\u79ef\u6781";
  }
  if (text.includes("\u8c28\u614e") || text.includes("cautious")) {
    return "\u8c28\u614e";
  }
  if (text.includes("\u4e2d\u6027") || text.includes("neutral")) {
    return "\u4e2d\u6027";
  }
  return "\u89c2\u5bdf";
}

function inferResearchBias(value: unknown) {
  const text = formatText(value, "").toLowerCase();
  if (text.includes("\u4e0a\u4fee") || text.includes("bull")) {
    return "\u4e0a\u884c\u9a8c\u8bc1";
  }
  if (text.includes("\u4e0b\u4fee") || text.includes("bear")) {
    return "\u4e0b\u884c\u9a8c\u8bc1";
  }
  return COPY.evidenceVerification;
}
