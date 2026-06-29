import type { BuySideMemoV2 } from "@/lib/report-v2/buySideMemoSchema";
import {
  asArray,
  BulletList,
  COPY,
  FieldBlock,
  formatDataSufficiency,
  formatText,
  InfoPill,
  SectionShell,
} from "./rendererUtils";

type ValuationFrameworkProps = {
  memo: BuySideMemoV2;
};

const SCENARIO_LABELS = {
  bear: "Bear",
  base: "Base",
  bull: "Bull",
} as const;

export function ValuationFramework({ memo }: ValuationFrameworkProps) {
  const section = memo.valuationFramework;
  const scenarios = asArray(section.scenarios);
  const canShowTargets = section.dataSufficiency === "sufficient";

  return (
    <SectionShell
      eyebrow="Valuation discipline"
      id="valuation-framework"
      index="04"
      title={"\u4f30\u503c\u6846\u67b6"}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <InfoPill tone={canShowTargets ? "brand" : "risk"}>
          {formatDataSufficiency(section.dataSufficiency)}
        </InfoPill>
        {!canShowTargets ? (
          <span className="text-sm leading-6 text-[var(--foreground)] opacity-75">
            {COPY.targetNotSupported}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <FieldBlock
          label="Methodology"
          value={
            <BulletList
              emptyText={
                "\u4f30\u503c\u65b9\u6cd5\u9700\u8981\u7b49\u5f85\u66f4\u5b8c\u6574\u6570\u636e"
              }
              items={section.methodology}
            />
          }
        />
        <FieldBlock
          label="What the market may be pricing"
          value={formatText(section.directionalView)}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--muted)]">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
            Bear / Base / Bull
          </p>
          <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
            {"\u60c5\u666f\u4f30\u503c\u6846\u67b6"}
          </h3>
        </div>
        {scenarios.length ? (
          <div className="grid gap-3 p-4 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <article
                className="rounded-[8px] border border-[var(--border)] bg-white p-4"
                key={scenario.name}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-55">
                      Scenario
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {SCENARIO_LABELS[scenario.name]}
                    </h3>
                  </div>
                  <InfoPill>{formatProbability(scenario.probability)}</InfoPill>
                </div>
                <div className="mt-4">
                  <BulletList
                    emptyText={
                      "\u6838\u5fc3\u5047\u8bbe\u9700\u8981\u540e\u7eed\u8ddf\u8e2a"
                    }
                    items={scenario.assumptions}
                  />
                </div>
                {canShowTargets ? (
                  <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4">
                    <MiniMetric
                      label="Target price"
                      value={formatTargetPrice(scenario.targetPrice)}
                    />
                    <MiniMetric
                      label="Implied return"
                      value={formatImpliedReturn(scenario.impliedReturnPercent)}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm leading-7">{COPY.targetNotSupported}</div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {canShowTargets ? (
          <>
            <FieldBlock
              label="Probability-weighted target"
              value={formatTargetPrice(section.probabilityWeightedTargetPrice)}
            />
            <FieldBlock
              label="Probability-weighted return"
              value={formatImpliedReturn(
                section.probabilityWeightedImpliedReturnPercent,
              )}
            />
          </>
        ) : (
          <FieldBlock
            label={"\u4f30\u503c\u7eaa\u5f8b"}
            value={COPY.targetNotSupported}
          />
        )}
        <FieldBlock
          label="Missing inputs"
          value={
            <BulletList
              emptyText={"\u4f30\u503c\u7f3a\u5931\u9879\u9700\u8981\u540e\u7eed\u8ddf\u8e2a"}
              items={section.missingData}
            />
          }
        />
      </div>

      <div className="mt-4">
        <FieldBlock
          label="Key value drivers"
          value={
            <BulletList
              emptyText={"\u4ef7\u503c\u9a71\u52a8\u56e0\u5b50\u9700\u8981\u540e\u7eed\u9a8c\u8bc1"}
              items={section.keyValueDrivers}
            />
          }
        />
      </div>
    </SectionShell>
  );
}

function formatProbability(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "\u6982\u7387\u9700\u8981\u540e\u7eed\u8ddf\u8e2a";
  }

  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(0)}%`;
}

function formatTargetPrice(value: number | null, canShowTargets = true) {
  if (!canShowTargets) return COPY.targetNotSupported;
  if (typeof value !== "number" || Number.isNaN(value)) {
    return COPY.targetNotSupported;
  }

  return `$${value.toFixed(2)}`;
}

function formatImpliedReturn(value: number | null, canShowTargets = true) {
  if (!canShowTargets) return COPY.unavailableForTarget;
  if (typeof value !== "number" || Number.isNaN(value)) {
    return COPY.unavailableForTarget;
  }

  return `${value.toFixed(1)}%`;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-55">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
