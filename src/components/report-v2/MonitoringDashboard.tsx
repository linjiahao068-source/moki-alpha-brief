import type { BuySideMemoV2 } from "@/lib/report-v2/buySideMemoSchema";
import {
  asArray,
  BulletList,
  COPY,
  EmptyState,
  formatText,
  MetricValue,
  SectionShell,
} from "./rendererUtils";

type MonitoringDashboardProps = {
  memo: BuySideMemoV2;
};

export function MonitoringDashboard({ memo }: MonitoringDashboardProps) {
  const section = memo.monitoringDashboard;
  const metrics = asArray(section.metrics);

  return (
    <SectionShell
      eyebrow="Thesis tracking"
      id="monitoring-dashboard"
      index="06"
      title={"\u76d1\u63a7\u4eea\u8868\u76d8"}
    >
      <div className="mb-4 flex flex-col gap-2 rounded-[8px] border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">
            Refresh cadence
          </p>
          <p className="mt-1 text-sm leading-6">
            {formatText(section.refreshCadence, "\u66f4\u65b0\u8282\u594f\u9700\u8981\u540e\u7eed\u8ddf\u8e2a")}
          </p>
        </div>
        <div className="text-sm leading-6 opacity-75">
          {formatText(
            memo.investmentConclusion.timeHorizon,
            "3-6 \u4e2a\u6708\u91cd\u65b0\u5b9a\u4ef7\u7a97\u53e3",
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-white">
        {metrics.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)] text-xs uppercase tracking-[0.12em] opacity-70">
                  <th className="px-4 py-3 font-semibold">Metric</th>
                  <th className="px-4 py-3 font-semibold">Why it matters</th>
                  <th className="px-4 py-3 font-semibold">Threshold</th>
                  <th className="px-4 py-3 font-semibold">Current status</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {metrics.map((metric, index) => (
                  <tr className="align-top" key={`${metric.label}-${index}`}>
                    <td className="px-4 py-4 font-semibold">
                      {formatText(metric.label, COPY.metricNeedsTracking)}
                    </td>
                    <td className="px-4 py-4 leading-6 opacity-80">
                      {formatText(metric.whyItMatters, COPY.metricNeedsTracking)}
                    </td>
                    <td className="px-4 py-4 leading-6">
                      {formatText(metric.threshold, COPY.metricNeedsTracking)}
                    </td>
                    <td className="px-4 py-4 leading-6">
                      <MetricValue metric={metric} />
                      <span className="mt-1 block text-xs opacity-60">
                        {formatText(metric.currentStatus, COPY.metricNeedsTracking)}
                      </span>
                    </td>
                    <td className="px-4 py-4 leading-6 opacity-75">
                      {formatText(metric.source, COPY.noReliableSource)}
                      <span className="mt-1 block text-xs opacity-65">
                        {formatText(
                          metric.updateFrequency,
                          "\u66f4\u65b0\u9891\u7387\u9700\u8981\u540e\u7eed\u8ddf\u8e2a",
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState>{COPY.metricNeedsTracking}</EmptyState>
          </div>
        )}
      </div>

      <div className="mt-4">
        <BulletList
          emptyText={"\u9884\u8b66\u89c4\u5219\u9700\u8981\u540e\u7eed\u8ddf\u8e2a"}
          items={section.alertRules}
        />
      </div>
    </SectionShell>
  );
}
