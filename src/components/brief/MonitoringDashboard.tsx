import type { MonitoringDashboardBlock, MonitoringStatus } from "@/types/brief";

type MonitoringDashboardProps = {
  dashboard: MonitoringDashboardBlock;
};

const statusClass: Record<MonitoringStatus, string> = {
  Healthy: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
  Watch:
    "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]",
  Caution:
    "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]",
  Trigger:
    "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]",
};

export function MonitoringDashboard({ dashboard }: MonitoringDashboardProps) {
  return (
    <section className="scroll-mt-8" id={dashboard.id}>
      <SectionHeading
        index={String(dashboard.order)}
        title={formatPublicText(dashboard.title)}
        eyebrow="Monitoring Dashboard"
      />
      <p className="mb-4 text-sm leading-6 text-[var(--foreground)] opacity-75">
        {formatPublicText(dashboard.description)}
      </p>
      <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
            Research Monitoring Checklist
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--foreground)] opacity-80">
            Track whether the thesis remains supported by key operating,
            financial, market, and expectation signals. This is not a real-time
            trading dashboard.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px] sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[13px] uppercase tracking-[0.12em] text-[var(--foreground)] opacity-70">
                <th className="w-[200px] px-4 py-4 font-semibold">Metric</th>
                <th className="px-4 py-4 font-semibold">Why It Matters</th>
                <th className="w-[240px] px-4 py-4 font-semibold">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {dashboard.metrics.map((metric) => (
                <tr key={metric.metric} className="align-top">
                  <td className="px-4 py-5 font-semibold text-[var(--foreground)]">
                    {formatPublicText(metric.metric)}
                  </td>
                  <td className="px-4 py-5 leading-7 text-[var(--foreground)] opacity-85">
                    {formatPublicText(metric.whyItMatters)}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col items-start gap-2">
                      <span className="inline-flex max-w-full whitespace-normal rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-[13px] font-medium leading-5 text-[var(--foreground)]">
                        {formatPublicText(metric.threshold)}
                      </span>
                      {metric.status ? (
                        <span
                          className={`inline-flex max-w-full whitespace-normal rounded-full border px-3 py-1 text-[13px] font-semibold leading-5 ${statusClass[metric.status]}`}
                        >
                          {metric.status}
                          {metric.cadence ? ` / ${formatPublicText(metric.cadence)}` : null}
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  index,
  title,
  eyebrow,
}: {
  index: string;
  title: string;
  eyebrow: string;
}) {
  return (
    <div className="mb-4 flex min-w-0 items-center gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-[var(--brand-soft-strong)] font-mono text-xs font-bold text-[var(--brand-ink)]">
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-5 text-[var(--foreground)] opacity-60">
          {eyebrow}
        </p>
        <h2 className="text-[15px] font-semibold leading-6 text-[var(--foreground)]">
          {title}
        </h2>
      </div>
    </div>
  );
}

function formatPublicText(value: string) {
  return value
    .replace(/Evidence Draft/gi, "Sources Attached")
    .replace(/LLM Demo/gi, "AI Generated")
    .replace(/Mock Consensus Evidence/gi, "Consensus Estimate Context")
    .replace(/mock consensus evidence/gi, "consensus estimate context")
    .replace(/mock evidence/gi, "estimate context")
    .replace(/mock-only/gi, "estimate-context")
    .replace(/MVP/gi, "Current Version")
    .replace(/BriefDocument/gi, "research brief");
}