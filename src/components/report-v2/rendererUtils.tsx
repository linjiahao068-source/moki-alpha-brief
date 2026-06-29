import type { ReactNode } from "react";
import type {
  BuySideMemoV2Metric,
  BuySideMemoV2TextBlock,
  V2Maybe,
  V2SourceKind,
  V2SourceStatus,
  V2ValuationDataSufficiency,
} from "@/lib/report-v2/buySideMemoSchema";

export const COPY = {
  alertRules: "\u76d1\u63a7\u89c4\u5219",
  availableForResearch: "\u53ef\u7528\u4e8e\u7814\u7a76",
  companyNarrativeContext: "\u516c\u53f8\u5b98\u65b9\u53d9\u4e8b\u4e0a\u4e0b\u6587",
  dataInsufficient: "\u6570\u636e\u4e0d\u8db3",
  dataPartiallyAvailable: "\u6570\u636e\u90e8\u5206\u53ef\u7528",
  dataSufficient: "\u6570\u636e\u8f83\u5145\u5206",
  dataUnavailable: "\u6570\u636e\u6682\u4e0d\u53ef\u7528",
  disclosureFactsUnavailable: "\u62ab\u9732\u4e8b\u5b9e\u6682\u4e0d\u53ef\u7528",
  estimateContext: "\u4f30\u8ba1\u4e0a\u4e0b\u6587",
  evidenceVerification: "\u8bc1\u636e\u9a8c\u8bc1",
  highConfidence: "\u9ad8\u7f6e\u4fe1",
  lowConfidence: "\u4f4e\u7f6e\u4fe1",
  marketContext: "\u5e02\u573a\u6570\u636e\u4e0a\u4e0b\u6587",
  mediumConfidence: "\u4e2d\u7b49\u7f6e\u4fe1",
  metricNeedsTracking: "\u8be5\u6307\u6807\u9700\u8981\u540e\u7eed\u8ddf\u8e2a",
  noReliableSource: "\u6682\u65e0\u53ef\u9760\u6765\u6e90",
  officialDisclosureContext: "SEC \u5b98\u65b9\u62ab\u9732\u4e0a\u4e0b\u6587",
  partialForResearch: "\u90e8\u5206\u53ef\u7528",
  publicContext: "\u516c\u5f00\u4fe1\u606f\u4e0a\u4e0b\u6587",
  realConsensusUnavailable:
    "\u771f\u5b9e\u4e00\u81f4\u9884\u671f\u6682\u672a\u63a5\u5165",
  researchContextLimited: "\u7814\u7a76\u4e0a\u4e0b\u6587\u6709\u9650",
  researchPoint: "\u7814\u7a76\u8981\u70b9",
  sourceNeedsTracking: "\u9700\u8981\u540e\u7eed\u8ddf\u8e2a",
  targetNotSupported:
    "\u5f53\u524d\u6570\u636e\u4e0d\u8db3\u4ee5\u652f\u6301\u76ee\u6807\u4ef7\u63a8\u6f14",
  unavailableForTarget:
    "\u76ee\u6807\u4ef7\u548c\u9690\u542b\u56de\u62a5\u9700\u7b49\u5f85\u66f4\u5b8c\u6574\u6570\u636e",
  confidencePending:
    "\u7f6e\u4fe1\u5ea6\u9700\u8981\u540e\u7eed\u590d\u6838",
};

export const BODY_MODULE_ANCHORS = [
  { id: "investment-conclusion", label: "\u6295\u8d44\u7ed3\u8bba" },
  { id: "company-profile", label: "\u516c\u53f8\u753b\u50cf" },
  { id: "fundamental-analysis", label: "\u57fa\u672c\u9762\u5206\u6790" },
  { id: "valuation-framework", label: "\u4f30\u503c\u6846\u67b6" },
  { id: "catalyst-risk", label: "\u50ac\u5316\u98ce\u9669" },
  { id: "monitoring-dashboard", label: "\u76d1\u63a7\u4eea\u8868\u76d8" },
] as const;

export function SectionShell({
  children,
  eyebrow,
  id,
  index,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  id: string;
  index: string;
  title: string;
}) {
  return (
    <section
      className="scroll-mt-8 rounded-[8px] border border-[var(--border)] bg-white p-4 shadow-[0_18px_48px_-44px_rgba(0,0,0,0.42)] sm:p-5"
      id={id}
    >
      <div className="mb-5 flex min-w-0 flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold leading-8 text-[var(--foreground)]">
            {title}
          </h2>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 font-mono text-xs font-semibold text-[var(--brand-ink)]">
          Module {index}
        </span>
      </div>
      {children}
    </section>
  );
}

export function FieldBlock({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] opacity-55">
        {label}
      </p>
      <div className="mt-2 text-sm leading-7 text-[var(--foreground)] sm:text-[15px]">
        {value}
      </div>
    </div>
  );
}

export function InfoPill({
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

export function EmptyState({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-75">
      {children || COPY.dataUnavailable}
    </div>
  );
}

export function TextBlockList({
  blocks,
  emptyText,
}: {
  blocks: V2Maybe<BuySideMemoV2TextBlock[]>;
  emptyText?: string;
}) {
  const items = asArray(blocks);

  if (!items.length) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <div className="grid gap-3">
      {items.map((block, index) => (
        <article
          className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4"
          key={`${formatText(block.title, COPY.researchPoint)}-${index}`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-[15px] font-semibold leading-6 text-[var(--foreground)]">
              {formatText(block.title, COPY.researchPoint)}
            </h3>
            {block.confidence ? (
              <InfoPill>{formatConfidence(block.confidence)}</InfoPill>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-[var(--foreground)] opacity-80">
            {formatText(block.body)}
          </p>
        </article>
      ))}
    </div>
  );
}

export function BulletList({
  items,
  emptyText,
}: {
  items: V2Maybe<string[]>;
  emptyText?: string;
}) {
  const values = asArray(items).map((item) => formatText(item));

  if (!values.length) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <ul className="grid gap-2 text-sm leading-7 text-[var(--foreground)] opacity-80">
      {values.map((item, index) => (
        <li className="flex gap-2" key={`${item}-${index}`}>
          <span className="mt-[0.72em] size-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MetricValue({ metric }: { metric: BuySideMemoV2Metric }) {
  const value = formatText(metric.value, COPY.dataUnavailable);
  const unit = isMeaningful(metric.unit) ? ` ${formatText(metric.unit)}` : "";
  const period = isMeaningful(metric.period)
    ? ` \u00b7 ${formatText(metric.period)}`
    : "";

  return (
    <span>
      {value}
      {unit}
      {period ? (
        <span className="block text-xs leading-5 opacity-60">{period}</span>
      ) : null}
    </span>
  );
}

export function formatText(
  value: unknown,
  fallback = COPY.dataUnavailable,
): string {
  if (!isMeaningful(value)) return fallback;

  return sanitizePublicText(String(value));
}

export function formatConfidence(value: unknown) {
  if (value === "high") return COPY.highConfidence;
  if (value === "medium") return COPY.mediumConfidence;
  if (value === "low") return COPY.lowConfidence;
  return COPY.confidencePending;
}

export function formatDataSufficiency(value: V2ValuationDataSufficiency) {
  if (value === "sufficient") return COPY.dataSufficient;
  if (value === "partial") return COPY.dataPartiallyAvailable;
  return COPY.dataInsufficient;
}

export function formatSourceStatus(
  source: V2SourceKind,
  status?: V2SourceStatus | null,
) {
  if (!status || status.status === "unavailable") return COPY.noReliableSource;
  if (source === "consensus") return COPY.realConsensusUnavailable;
  if (status.status === "available") return COPY.availableForResearch;
  if (status.status === "partial") return COPY.partialForResearch;
  if (status.status === "mock") {
    return source === "sec"
      ? COPY.officialDisclosureContext
      : COPY.researchContextLimited;
  }

  return COPY.sourceNeedsTracking;
}

export function formatDataRole(source: V2SourceKind) {
  if (source === "webSearch") return COPY.publicContext;
  if (source === "sec") return COPY.officialDisclosureContext;
  if (source === "companyIr") return COPY.companyNarrativeContext;
  if (source === "marketData") return COPY.marketContext;
  return COPY.estimateContext;
}

export function asArray<T>(value: V2Maybe<T[]>): T[] {
  return Array.isArray(value) ? value : [];
}

export function firstMeaningful<T>(...values: T[]) {
  return values.find((value) => isMeaningful(value));
}

export function isMeaningful(value: unknown) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    value !== "unavailable"
  );
}

export function sanitizePublicText(value: string) {
  return stripMarkdownScaffolding(value)
    .replace(/\bmock\b/gi, COPY.estimateContext)
    .replace(/\bdemo\b/gi, "\u793a\u4f8b")
    .replace(/\bdraft\b/gi, "\u7814\u7a76\u8fb9\u754c")
    .replace(/\bphase\b/gi, "\u7248\u672c")
    .replace(/\bMVP\b/g, "\u5f53\u524d\u7248\u672c")
    .replace(/\bBriefDocument\b/g, "\u7814\u7a76\u5907\u5fd8\u5f55")
    .replace(/\bPOST API\b/g, "\u751f\u6210\u8bf7\u6c42")
    .replace(/\blocalFallback\b/g, "\u751f\u6210\u8def\u5f84")
    .replace(/\bvalidationFailed\b/g, "\u6821\u9a8c\u672a\u901a\u8fc7")
    .replace(/evidence-draft/gi, "\u7814\u7a76\u8bc1\u636e\u8fb9\u754c")
    .replace(/verified-real-data/gi, "\u5df2\u590d\u6838\u6570\u636e\u8fb9\u754c");
}

function stripMarkdownScaffolding(value: string) {
  return value
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*]\s+\*\*(.*?)\*\*/gm, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}
