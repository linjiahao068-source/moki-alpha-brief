import type {
  EvidenceConfidence,
  IrEvidenceItem,
  IrEvidencePack,
} from "@/types/evidence";
import type { ReactNode } from "react";

type IrEvidencePanelProps = {
  irEvidencePack?: IrEvidencePack;
  warnings?: string[];
};

export function IrEvidencePanel({
  irEvidencePack,
  warnings = [],
}: IrEvidencePanelProps) {
  if (!irEvidencePack) return null;

  const combinedWarnings = Array.from(
    new Set([...(irEvidencePack.warnings || []), ...warnings].filter(Boolean)),
  );
  const counts = countConfidence(irEvidencePack.irItems);
  const isMock = irEvidencePack.provider === "mock";

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
            Company IR Evidence
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {isMock ? "Mock IR Evidence" : "IR Evidence Draft"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
            Company IR / earnings-release evidence is used only for official company narrative, management commentary, business updates, and company guidance context. It is not SEC official-financial data, consensus, or real-time market data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill tone="brand">{irEvidencePack.provider}</Pill>
          <Pill>{irEvidencePack.irItems.length} sources</Pill>
          <Pill>High {counts.high}</Pill>
          <Pill>Medium {counts.medium}</Pill>
          <Pill>Low {counts.low}</Pill>
        </div>
      </div>

      {combinedWarnings.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
          <p className="font-semibold">IR Warnings: {combinedWarnings.length}</p>
          <ul className="mt-2 space-y-1">
            {combinedWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {irEvidencePack.irItems.map((item, index) => (
          <article
            key={item.id}
            className="rounded-[8px] border border-[var(--border)] bg-[var(--background)] p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="min-w-0 text-sm font-semibold leading-6 text-[var(--foreground)]">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-words underline decoration-[var(--brand-border)] underline-offset-4 hover:text-[var(--brand-ink)]"
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 font-mono text-xs text-[var(--foreground)] opacity-70">
                #{index + 1}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold leading-5">
              <ConfidencePill confidence={item.confidence} />
              <Pill>{item.domain || "domain unknown"}</Pill>
              <Pill>{item.sourceType}</Pill>
              <Pill>{item.theme}</Pill>
              <Pill>{item.allowedUse}</Pill>
              <Pill>{item.dateStatus || "unknown"}</Pill>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs leading-5 text-[var(--foreground)] opacity-70">
              <span>{item.publisher || item.domain || "publisher unknown"}</span>
              <span className="font-mono">retrieved {item.retrievedAt}</span>
              {item.publishedAt ? (
                <span className="font-mono">published {item.publishedAt}</span>
              ) : null}
            </div>

            {item.url ? (
              <p className="mt-2 break-words font-mono text-xs leading-5 text-[var(--foreground)] opacity-60">
                {item.url}
              </p>
            ) : null}

            <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
              {item.snippet}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function countConfidence(items: IrEvidenceItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.confidence] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<EvidenceConfidence, number>,
  );
}

function ConfidencePill({ confidence }: { confidence: EvidenceConfidence }) {
  const label = `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence`;
  const className =
    confidence === "high"
      ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
      : confidence === "medium"
        ? "border-[var(--border)] bg-white text-[var(--foreground)]"
        : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";

  return (
    <span className={`rounded-full border px-3 py-1 ${className}`}>{label}</span>
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
