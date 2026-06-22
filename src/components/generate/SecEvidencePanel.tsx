import type { SecEvidencePack } from "@/types/evidence";
import type { ReactNode } from "react";

type SecEvidencePanelProps = {
  secEvidencePack?: SecEvidencePack;
  warnings?: string[];
};

export function SecEvidencePanel({
  secEvidencePack,
  warnings = [],
}: SecEvidencePanelProps) {
  if (!secEvidencePack) return null;

  const combinedWarnings = Array.from(
    new Set([...(secEvidencePack.warnings || []), ...warnings].filter(Boolean)),
  );
  const isMock = secEvidencePack.provider === "mock";

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
            SEC Evidence
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {isMock ? "Mock SEC Evidence" : "SEC Evidence Draft"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
            SEC companyfacts / submissions evidence is attached as a draft. It does not include real-time price, consensus estimates, database save, or manual verification.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill tone="brand">{secEvidencePack.provider}</Pill>
          <Pill>CIK {secEvidencePack.cik}</Pill>
          <Pill>{secEvidencePack.recentFilings.length} filings</Pill>
          <Pill>{secEvidencePack.fiscalFacts.length} facts</Pill>
        </div>
      </div>

      {combinedWarnings.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
          <p className="font-semibold">SEC Warnings: {combinedWarnings.length}</p>
          <ul className="mt-2 space-y-1">
            {combinedWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold leading-6 text-[var(--foreground)]">
          Recent Filings
        </h3>
        <div className="mt-3 overflow-x-auto rounded-[8px] border border-[var(--border)]">
          <table className="min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-[var(--muted)] text-xs uppercase tracking-[0.12em] text-[var(--foreground)] opacity-75">
              <tr>
                <th className="px-3 py-3">Form</th>
                <th className="px-3 py-3">Filing Date</th>
                <th className="px-3 py-3">Report Date</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">SEC Link</th>
              </tr>
            </thead>
            <tbody>
              {secEvidencePack.recentFilings.map((filing) => (
                <tr
                  key={filing.accessionNumber}
                  className="border-t border-[var(--border)]"
                >
                  <td className="px-3 py-3 font-mono font-semibold">
                    {filing.form}
                  </td>
                  <td className="px-3 py-3 font-mono">{filing.filingDate}</td>
                  <td className="px-3 py-3 font-mono">
                    {filing.reportDate || "N/A"}
                  </td>
                  <td className="px-3 py-3">{filing.description || "N/A"}</td>
                  <td className="px-3 py-3">
                    {filing.secUrl ? (
                      <a
                        href={filing.secUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-words underline decoration-[var(--brand-border)] underline-offset-4 hover:text-[var(--brand-ink)]"
                      >
                        SEC filing
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold leading-6 text-[var(--foreground)]">
          Fiscal Facts
        </h3>
        <div className="mt-3 overflow-x-auto rounded-[8px] border border-[var(--border)]">
          <table className="min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-[var(--muted)] text-xs uppercase tracking-[0.12em] text-[var(--foreground)] opacity-75">
              <tr>
                <th className="px-3 py-3">Label</th>
                <th className="px-3 py-3">Value</th>
                <th className="px-3 py-3">Unit</th>
                <th className="px-3 py-3">FY / FP</th>
                <th className="px-3 py-3">Form</th>
                <th className="px-3 py-3">Filed</th>
              </tr>
            </thead>
            <tbody>
              {secEvidencePack.fiscalFacts.map((fact, index) => (
                <tr
                  key={`${fact.concept}-${fact.unit}-${fact.filed}-${index}`}
                  className="border-t border-[var(--border)]"
                >
                  <td className="px-3 py-3">
                    <span className="font-semibold">{fact.label}</span>
                    <span className="mt-1 block font-mono text-xs opacity-60">
                      {fact.concept}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono">
                    {formatFactValue(fact.value)}
                  </td>
                  <td className="px-3 py-3 font-mono">{fact.unit}</td>
                  <td className="px-3 py-3 font-mono">
                    {fact.fy || "N/A"} / {fact.fp || "N/A"}
                  </td>
                  <td className="px-3 py-3 font-mono">{fact.form || "N/A"}</td>
                  <td className="px-3 py-3 font-mono">{fact.filed || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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

function formatFactValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
