import type {
  BuySideMemoV2,
  V2SourceKind,
} from "@/lib/report-v2/buySideMemoSchema";
import {
  asArray,
  BulletList,
  COPY,
  formatDataRole,
  formatSourceStatus,
} from "./rendererUtils";

type DataSourcesFooterProps = {
  memo: BuySideMemoV2;
};

const SOURCE_ORDER: V2SourceKind[] = [
  "webSearch",
  "sec",
  "companyIr",
  "marketData",
  "consensus",
];

export function DataSourcesFooter({ memo }: DataSourcesFooterProps) {
  const footer = memo.sourceFooter;
  const sourceStatus =
    footer.sourceStatus || memo.researchContext?.sourceStatus || null;
  const notes = asArray(footer.sourceNotes);
  const caveats = asArray(footer.caveats);

  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto grid w-full max-w-[1180px] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
            Data sources
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {"\u5e95\u90e8\uff1a\u6570\u636e\u6765\u6e90"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SOURCE_ORDER.map((source) => {
              const status = sourceStatus?.[source];

              return (
                <div
                  className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-3"
                  key={source}
                >
                  <p className="text-sm font-semibold">
                    {formatDataRole(source)}
                  </p>
                  <p className="mt-1 text-sm leading-6 opacity-75">
                    {formatSourceStatus(source, status)}
                  </p>
                  <p className="mt-2 text-xs leading-5 opacity-60">
                    {formatSourceCount(status?.sourceCount, status?.factCount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">
              Method note
            </p>
            <div className="mt-2">
              <BulletList
                emptyText={
                  "\u6765\u6e90\u65b9\u6cd5\u8bf4\u660e\u9700\u8981\u540e\u7eed\u8865\u5145"
                }
                items={notes}
              />
            </div>
          </div>

          <div className="rounded-[8px] border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">
              Disclaimer
            </p>
            <div className="mt-2">
              <BulletList
                emptyText={
                  "\u672c\u9875\u4ec5\u5c55\u793a\u5df2\u4fdd\u5b58\u7684\u7814\u7a76\u5907\u5fd8\u5f55\uff0c\u6570\u636e\u7f3a\u53e3\u9700\u8981\u540e\u7eed\u8ddf\u8e2a"
                }
                items={caveats}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function formatSourceCount(sourceCount?: number, factCount?: number) {
  if (!sourceCount && !factCount) return COPY.noReliableSource;

  return `${sourceCount || 0} sources / ${factCount || 0} facts`;
}
