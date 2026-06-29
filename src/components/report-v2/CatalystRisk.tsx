import type {
  BuySideMemoV2,
  BuySideMemoV2TextBlock,
} from "@/lib/report-v2/buySideMemoSchema";
import {
  asArray,
  BulletList,
  COPY,
  formatText,
  SectionShell,
} from "./rendererUtils";

type CatalystRiskProps = {
  memo: BuySideMemoV2;
};

export function CatalystRisk({ memo }: CatalystRiskProps) {
  const section = memo.catalystRisk;
  const catalysts = asArray(section.catalysts);
  const risks = asArray(section.risks);
  const triggers = asArray(section.scenarioTriggers);
  const metrics = asArray(memo.monitoringDashboard.metrics);

  return (
    <SectionShell
      eyebrow="3-6 month repricing map"
      id="catalyst-risk"
      index="05"
      title={"\u50ac\u5316\u98ce\u9669"}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[var(--brand-border)] bg-white">
          <div className="border-b border-[var(--border)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
              Catalysts
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
              {"\u53ef\u80fd\u6539\u53d8\u5b9a\u4ef7\u7684\u4e8b\u4ef6"}
            </h3>
          </div>
          <div className="grid gap-3 p-4">
            {catalysts.length ? (
              catalysts.map((item, index) => (
                <EventCard
                  bodyLabel="Why it matters"
                  detailLabel="Repricing path"
                  detailValue={triggers[index]}
                  item={item}
                  key={`${formatText(item.title)}-${index}`}
                  titleFallback={"\u50ac\u5316\u4e8b\u4ef6"}
                />
              ))
            ) : (
              <p className="text-sm leading-7 opacity-75">
                {"\u50ac\u5316\u5242\u9700\u8981\u540e\u7eed\u8ddf\u8e2a\u53ef\u9760\u6765\u6e90"}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--risk-border)] bg-white">
          <div className="border-b border-[var(--border)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--risk-ink)]">
              Risks
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
              {"thesis \u5931\u6548\u6761\u4ef6\u4e0e\u89e6\u53d1\u4fe1\u53f7"}
            </h3>
          </div>
          <div className="grid gap-3 p-4">
            {risks.length ? (
              risks.map((item, index) => (
                <RiskCard
                  item={item}
                  key={`${formatText(item.title)}-${index}`}
                  metric={metrics[index]?.label}
                  trigger={triggers[index]}
                />
              ))
            ) : (
              <p className="text-sm leading-7 opacity-75">
                {"\u98ce\u9669\u9879\u9700\u8981\u540e\u7eed\u8ddf\u8e2a\u53ef\u9760\u6765\u6e90"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <BulletList
          emptyText={"\u60c5\u666f\u89e6\u53d1\u4fe1\u53f7\u9700\u8981\u540e\u7eed\u9a8c\u8bc1"}
          items={section.scenarioTriggers}
        />
      </div>
    </SectionShell>
  );
}

function EventCard({
  bodyLabel,
  detailLabel,
  detailValue,
  item,
  titleFallback,
}: {
  bodyLabel: string;
  detailLabel: string;
  detailValue: unknown;
  item: BuySideMemoV2TextBlock;
  titleFallback: string;
}) {
  return (
    <article className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4">
      <h4 className="text-[15px] font-semibold leading-6">
        {formatText(item.title, titleFallback)}
      </h4>
      <dl className="mt-3 grid gap-3 text-sm leading-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-55">
            {bodyLabel}
          </dt>
          <dd className="mt-1">{formatText(item.body)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-55">
            {detailLabel}
          </dt>
          <dd className="mt-1">
            {formatText(detailValue, COPY.metricNeedsTracking)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function RiskCard({
  item,
  metric,
  trigger,
}: {
  item: BuySideMemoV2TextBlock;
  metric: unknown;
  trigger: unknown;
}) {
  return (
    <article className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4">
      <h4 className="text-[15px] font-semibold leading-6">
        {formatText(item.title, "\u98ce\u9669\u9879")}
      </h4>
      <dl className="mt-3 grid gap-3 text-sm leading-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-55">
            Why it matters
          </dt>
          <dd className="mt-1">{formatText(item.body)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-55">
            Trigger
          </dt>
          <dd className="mt-1">{formatText(trigger, COPY.metricNeedsTracking)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-55">
            Metric to watch
          </dt>
          <dd className="mt-1">{formatText(metric, COPY.metricNeedsTracking)}</dd>
        </div>
      </dl>
    </article>
  );
}
