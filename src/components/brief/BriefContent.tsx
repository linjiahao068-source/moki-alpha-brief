import type {
  BriefContentBlock,
  BriefDocument,
  BriefMetric,
  BriefSection,
  CalloutBlock,
  MetricGridBlock,
} from "@/types/brief";
import { MonitoringDashboard } from "./MonitoringDashboard";
import { ScenarioTable } from "./ScenarioTable";
import { SourceNote } from "./SourceNote";

type BriefContentProps = {
  brief: BriefDocument;
};

export function BriefContent({ brief }: BriefContentProps) {
  const orderedSections = [...brief.sections].sort(
    (a, b) => a.order - b.order,
  );
  const beforeScenarios = orderedSections.filter(
    (section) => section.order < brief.scenarioAnalysis.order,
  );
  const beforeDashboard = orderedSections.filter(
    (section) =>
      section.order > brief.scenarioAnalysis.order &&
      section.order < brief.monitoringDashboard.order,
  );
  const afterDashboard = orderedSections.filter(
    (section) => section.order > brief.monitoringDashboard.order,
  );

  return (
    <main className="min-w-0">
      <article className="min-w-0 rounded-[8px] border border-[var(--border)] bg-white px-4 py-6 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:px-6 sm:py-8 lg:px-8">
        <header className="border-b border-[var(--border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
            Research Memo
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-[var(--foreground)] sm:text-[30px]">
            {brief.metadata.title}
          </h1>
        </header>

        <div className="mt-8 space-y-8">
          {beforeScenarios.map((section) => (
            <BriefSectionRenderer key={section.id} section={section} />
          ))}
          <ScenarioTable analysis={brief.scenarioAnalysis} />
          {beforeDashboard.map((section) => (
            <BriefSectionRenderer key={section.id} section={section} />
          ))}
          <MonitoringDashboard dashboard={brief.monitoringDashboard} />
          {afterDashboard.map((section) => (
            <BriefSectionRenderer key={section.id} section={section} />
          ))}
          <SourceNote
            dataMode={brief.metadata.dataMode}
            hasEvidencePack={Boolean(brief.evidencePack)}
            sourceNote={brief.sourceNote}
          />
        </div>
      </article>
    </main>
  );
}

function BriefSectionRenderer({ section }: { section: BriefSection }) {
  if (section.kind === "executive-view") {
    return <ExecutiveView section={section} />;
  }

  if (section.kind === "risks") {
    return <RiskSection section={section} />;
  }

  if (section.kind === "bottom-line") {
    return <BottomLine section={section} />;
  }

  return <MemoSection section={section} />;
}

function ExecutiveView({ section }: { section: BriefSection }) {
  const metricGrid = section.blocks.find(
    (block): block is MetricGridBlock => block.type === "metricGrid",
  );
  const callouts = section.blocks.filter(
    (block): block is CalloutBlock => block.type === "callout",
  );

  return (
    <section
      id={section.id}
      className="scroll-mt-8 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 sm:p-5"
    >
      <SectionHeading section={section} />
      {metricGrid ? <MetricGrid metrics={metricGrid.metrics} brand /> : null}
      <div className="mt-5 space-y-4 text-[15px] leading-7 text-[var(--foreground)]">
        {callouts.map((callout) => {
          const isBreakpoint = callout.title === "Thesis Breakpoint";

          return (
            <p
              key={callout.title}
              className={
                isBreakpoint
                  ? "rounded-[8px] border border-[var(--brand-border)] bg-white p-4"
                  : undefined
              }
            >
              {callout.title ? <strong>{callout.title}: </strong> : null}
              {callout.content}
            </p>
          );
        })}
      </div>
    </section>
  );
}

function MemoSection({ section }: { section: BriefSection }) {
  return (
    <section id={section.id} className="scroll-mt-8">
      <SectionHeading section={section} />
      <div className="space-y-4 text-[15px] leading-[1.7] text-[var(--foreground)] opacity-85">
        {section.blocks.map((block, index) => (
          <ContentBlock key={`${block.type}-${index}`} block={block} />
        ))}
      </div>
    </section>
  );
}

function ContentBlock({ block }: { block: BriefContentBlock }) {
  if (block.type === "paragraph") {
    return <p>{block.content}</p>;
  }

  if (block.type === "bulletList") {
    return (
      <ul className="mt-5 space-y-3">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-7">
            <span className="mt-3 size-1.5 shrink-0 rounded-full bg-[var(--brand-dot)]" />
            <span className="min-w-0 text-[var(--foreground)] opacity-85">
              {item}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "orderedList") {
    return (
      <ol className="mt-5 list-decimal space-y-3 pl-5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }

  if (block.type === "metricGrid") {
    return <MetricGrid metrics={block.metrics} />;
  }

  return (
    <p className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4">
      {block.title ? <strong>{block.title}: </strong> : null}
      {block.content}
    </p>
  );
}

function RiskSection({ section }: { section: BriefSection }) {
  const risks = section.blocks.filter(
    (block): block is CalloutBlock => block.type === "callout",
  );

  return (
    <section id={section.id} className="scroll-mt-8">
      <SectionHeading section={section} />
      <div className="overflow-hidden rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)]">
        {risks.map((risk) => (
          <div
            key={risk.title}
            className="border-b border-[var(--risk-border)] p-4 last:border-b-0 sm:p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-[var(--risk-ink)]">
                {risk.title}
              </h3>
              {risk.label ? (
                <span className="max-w-full w-fit rounded-full border border-[var(--risk-border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--risk-ink)]">
                  {risk.label}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-[15px] leading-7 text-[var(--risk-ink)]">
              {risk.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomLine({ section }: { section: BriefSection }) {
  const paragraphs = section.blocks.filter((block) => block.type === "paragraph");

  return (
    <section
      id={section.id}
      className="scroll-mt-8 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-5 sm:p-6"
    >
      <SectionHeading section={section} />
      <div className="space-y-4">
        {paragraphs.map((block) => (
          <p
            key={block.content}
            className="text-[15px] leading-8 text-[var(--foreground)]"
          >
            {block.content}
          </p>
        ))}
      </div>
    </section>
  );
}

function MetricGrid({
  metrics,
  brand = false,
}: {
  metrics: BriefMetric[];
  brand?: boolean;
}) {
  return (
    <div className="mt-5 grid gap-3 first:mt-0 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`min-w-0 rounded-[8px] border p-4 ${
            brand
              ? "border-[var(--brand-border)] bg-white"
              : "border-[var(--border)] bg-[var(--muted)]"
          }`}
        >
          <p
            className={`text-xs uppercase tracking-[0.14em] opacity-80 ${
              brand ? "text-[var(--brand-ink)]" : "text-[var(--foreground)]"
            }`}
          >
            {metric.label}
          </p>
          <p className="mt-2 font-mono text-lg font-semibold text-[var(--foreground)]">
            {metric.value}
          </p>
          {metric.detail ? (
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
              {metric.detail}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SectionHeading({ section }: { section: BriefSection }) {
  return (
    <div className="mb-4 flex min-w-0 items-start gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[6px] bg-[var(--brand-soft-strong)] font-mono text-xs font-bold text-[var(--brand-ink)]">
        {section.order}
      </span>
      <div className="min-w-0">
        {section.eyebrow ? (
          <p className="text-xs font-medium leading-5 text-[var(--foreground)] opacity-60">
            {section.eyebrow}
          </p>
        ) : null}
        <h2 className="text-[15px] font-semibold leading-6 text-[var(--foreground)]">
          {section.title}
        </h2>
      </div>
    </div>
  );
}
