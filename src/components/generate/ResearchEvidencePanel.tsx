import { getEvidenceStatusCopy } from "@/lib/evidence/evidenceStatusCopy";
import type {
  EvidenceConfidence,
  ResearchEvidenceContext,
  ResearchEvidenceFact,
} from "@/types/evidence";
import type { ReactNode } from "react";

type ResearchEvidencePanelProps = {
  context?: ResearchEvidenceContext;
  warnings?: string[];
};

export function ResearchEvidencePanel({
  context,
  warnings = [],
}: ResearchEvidencePanelProps) {
  if (!context) return null;

  const confidence = countConfidence(context);
  const factCounts = countFactTypes(context);
  const evidenceStatus = getEvidenceStatusCopy({
    evidenceLevel: context.evidenceLevel,
    hasSearchEvidence: context.coverage.hasSearchEvidence,
    hasSecEvidence: context.coverage.hasSecEvidence,
    hasIrEvidence: context.coverage.hasCompanyIr,
    hasMarketEvidence: context.coverage.hasMarketPrice || Boolean(context.marketEvidencePack),
    hasConsensusEvidence: context.coverage.hasConsensus,
    searchProvider: context.searchEvidencePack?.searchProvider,
    secProvider: context.secEvidencePack?.provider,
    irProvider: context.irEvidencePack?.provider,
    marketProvider: context.marketEvidencePack?.provider,
    consensusProvider: context.consensusEvidencePack?.provider,
  });
  const combinedWarnings = Array.from(
    new Set([...(context.warnings || []), ...warnings].filter(Boolean)),
  );

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
            Research Evidence Context
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {evidenceStatus.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
            {evidenceStatus.boundaryDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill tone="brand">{context.evidenceLevel}</Pill>
          <Pill>{context.sourceRegistry.length} sources</Pill>
          <Pill>{context.factLedger.length} facts</Pill>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Search" value={context.coverage.hasSearchEvidence ? "yes" : "no"} />
        <Stat label="SEC" value={context.coverage.hasSecEvidence ? "yes" : "no"} />
        <Stat label="Company IR" value={context.coverage.hasCompanyIr ? "yes" : "no"} />
        <Stat label="Earnings Release" value={context.coverage.hasEarningsRelease ? "yes" : "no"} />
        <Stat label="Market Price" value={context.coverage.hasMarketPrice ? "yes" : "no"} />
        <Stat label="Market Volume" value={context.coverage.hasMarketVolume ? "yes" : "no"} />
        <Stat label="Market History" value={context.coverage.hasMarketPriceHistory ? "yes" : "no"} />
        <Stat label="Market Cap" value={context.coverage.hasMarketCap ? "yes" : "no"} />
        <Stat label="Consensus" value={context.coverage.hasConsensus ? "yes" : "no"} />
        <Stat label="Revenue Consensus" value={context.coverage.hasRevenueConsensus ? "yes" : "no"} />
        <Stat label="EPS Consensus" value={context.coverage.hasEpsConsensus ? "yes" : "no"} />
        <Stat label="Analyst Count" value={context.coverage.hasAnalystCount ? "yes" : "no"} />
        <Stat label="Revenue Fact" value={context.coverage.hasRevenueFact ? "yes" : "no"} />
        <Stat label="Net Income Fact" value={context.coverage.hasNetIncomeFact ? "yes" : "no"} />
        <Stat label="EPS Fact" value={context.coverage.hasEpsFact ? "yes" : "no"} />
        <Stat label="Guidance Context" value={context.coverage.hasGuidanceContext ? "yes" : "no"} />
        <Stat label="Management Commentary" value={context.coverage.hasManagementCommentary ? "yes" : "no"} />
      </div>

      {context.coverage.missing.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Missing Data
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold leading-5">
            {context.coverage.missing.map((item) => (
              <Pill key={item}>{item}</Pill>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SummaryBlock title="Source Registry Summary">
          <SummaryRow label="Search sources" value={String(context.searchEvidencePack?.sources.length || 0)} />
          <SummaryRow label="SEC sources" value={String(context.secEvidencePack?.sources.length || 0)} />
          <SummaryRow label="IR sources" value={String(context.irEvidencePack?.sources.length || 0)} />
          <SummaryRow label="Market sources" value={String(context.marketEvidencePack?.sources.length || 0)} />
          <SummaryRow label="Consensus sources" value={String(context.consensusEvidencePack?.sources.length || 0)} />
          <SummaryRow label="Consensus estimates" value={String(context.consensusEvidencePack?.estimates.length || 0)} />
          <SummaryRow
            label="Market provider chain"
            value={context.marketEvidencePack?.providerChain?.join(" -> ") || "n/a"}
          />
          <SummaryRow label="High / Medium / Low" value={`${confidence.high} / ${confidence.medium} / ${confidence.low}`} />
        </SummaryBlock>

        <SummaryBlock title="Fact Ledger Summary">
          <SummaryRow label="Official financial" value={String(factCounts["official-financial"] || 0)} />
          <SummaryRow label="Filing metadata" value={String(factCounts["filing-metadata"] || 0)} />
          <SummaryRow label="Recent development" value={String(factCounts["recent-development"] || 0)} />
          <SummaryRow label="Risk catalyst" value={String(factCounts["risk-catalyst"] || 0)} />
          <SummaryRow label="Management commentary" value={String(factCounts["management-commentary"] || 0)} />
          <SummaryRow label="Company guidance context" value={String(factCounts["company-guidance-context"] || 0)} />
          <SummaryRow label="Business update" value={String(factCounts["business-update"] || 0)} />
          <SummaryRow label="Market price" value={String(factCounts["market-price"] || 0)} />
          <SummaryRow label="Market history" value={String(factCounts["market-price-history"] || 0)} />
          <SummaryRow label="Consensus revenue" value={String(factCounts["consensus-revenue"] || 0)} />
          <SummaryRow label="Consensus EPS" value={String(factCounts["consensus-eps"] || 0)} />
          <SummaryRow label="Consensus range" value={String(factCounts["consensus-range"] || 0)} />
          <SummaryRow label="Analyst count" value={String(factCounts["analyst-count"] || 0)} />
        </SummaryBlock>
      </div>

      {combinedWarnings.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
          <p className="font-semibold">
            Evidence Warnings: {combinedWarnings.length}
          </p>
          <ul className="mt-2 space-y-1">
            {combinedWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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

function SummaryBlock({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--background)] p-4">
      <h3 className="text-sm font-semibold leading-6 text-[var(--foreground)]">
        {title}
      </h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm leading-6">
      <span className="min-w-0 text-[var(--foreground)] opacity-70">{label}</span>
      <span className="shrink-0 font-mono font-semibold text-[var(--foreground)]">
        {value}
      </span>
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

function countConfidence(context: ResearchEvidenceContext) {
  return context.sourceRegistry.reduce(
    (acc, source) => {
      acc[source.confidence] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<EvidenceConfidence, number>,
  );
}

function countFactTypes(context: ResearchEvidenceContext) {
  return context.factLedger.reduce(
    (acc, fact) => {
      acc[fact.factType] = (acc[fact.factType] || 0) + 1;
      return acc;
    },
    {} as Partial<Record<ResearchEvidenceFact["factType"], number>>,
  );
}
