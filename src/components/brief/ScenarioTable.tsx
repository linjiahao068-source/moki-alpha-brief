import type { ScenarioAnalysisBlock, ScenarioTone } from "@/types/brief";

type ScenarioTableProps = {
  analysis: ScenarioAnalysisBlock;
};

const toneClass: Record<ScenarioTone, string> = {
  bull: "border-[var(--border)] bg-white text-[var(--foreground)]",
  base:
    "border-[var(--brand-border)] bg-[var(--brand-soft-strong)] text-[var(--brand-ink)]",
  bear: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
};

const rowClass: Record<ScenarioTone, string> = {
  bull: "",
  base: "bg-[var(--brand-soft)]",
  bear: "",
};

export function ScenarioTable({ analysis }: ScenarioTableProps) {
  return (
    <section className="scroll-mt-8" id={analysis.id}>
      <SectionHeading
        index={String(analysis.order)}
        title={formatPublicText(analysis.title)}
        eyebrow="Scenario Analysis"
      />
      <p className="mb-4 text-sm leading-6 text-[var(--foreground)] opacity-75">
        {formatPublicText(analysis.description)}
      </p>
      <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] bg-[var(--foreground)] px-4 py-4 text-white sm:px-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-soft-strong)]">
                Scenario Matrix
              </p>
              <h3 className="mt-1 text-base font-semibold sm:text-lg">
                Probability-weighted target:{" "}
                {analysis.probabilityWeightedTarget}
              </h3>
            </div>
            <p className="font-mono text-[13px] leading-5 text-white opacity-70 sm:text-sm">
              Current price: {analysis.currentPrice}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px] sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)] text-[13px] uppercase tracking-[0.12em] text-[var(--foreground)] opacity-75">
                <th className="w-24 px-4 py-4 font-semibold">Scenario</th>
                <th className="w-24 px-4 py-4 font-semibold">Probability</th>
                <th className="px-4 py-4 font-semibold">Key Assumptions</th>
                <th className="w-28 px-4 py-4 font-semibold">Target Price</th>
                <th className="w-28 px-4 py-4 font-semibold">Implied Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {analysis.scenarios.map((scenario) => {
                const tone = scenario.tone ?? "base";

                return (
                  <tr
                    key={scenario.name}
                    className={`align-top ${rowClass[tone]}`}
                  >
                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex max-w-full rounded-full border px-3 py-1 text-[13px] font-semibold leading-5 ${toneClass[tone]}`}
                      >
                        {formatPublicText(scenario.label)}
                      </span>
                    </td>
                    <td className="px-4 py-5 font-mono font-semibold text-[var(--foreground)]">
                      {scenario.probability}
                    </td>
                    <td className="px-4 py-5 leading-7 text-[var(--foreground)] opacity-85">
                      {formatPublicText(scenario.keyAssumptions)}
                      {scenario.operatingSetup ? (
                        <span className="mt-2 block text-[13px] leading-6 opacity-70">
                          {formatPublicText(scenario.operatingSetup)}
                        </span>
                      ) : null}
                      {scenario.trigger ? (
                        <span className="mt-3 block border-t border-[var(--border)] pt-2 text-[13px] leading-6 opacity-75">
                          <span className="font-semibold">Trigger: </span>
                          {formatPublicText(scenario.trigger)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-5 font-mono text-base font-semibold text-[var(--foreground)]">
                      {scenario.targetPrice}
                    </td>
                    <td className="px-4 py-5 font-mono font-semibold text-[var(--foreground)]">
                      {scenario.impliedReturn}
                    </td>
                  </tr>
                );
              })}
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