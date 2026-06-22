import type { BriefBadge, BriefDocument } from "@/types/brief";
import { DataBoundaryNote } from "./DataBoundaryNote";

type BriefHeroProps = {
  brief: BriefDocument;
};

export function BriefHero({ brief }: BriefHeroProps) {
  const { metadata, hero, cta } = brief;

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-10">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
        <div className="min-w-0 rounded-[8px] border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {hero.badges.map((badge) => (
              <HeroBadge key={badge.label} badge={badge} />
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="inline-flex max-w-full w-fit rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft-strong)] px-4 py-3 font-mono text-4xl font-semibold leading-none text-[var(--brand-ink)] sm:text-5xl">
              {hero.headline}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-65">
                {hero.subheadline}
              </p>
              <p className="mt-1 text-[15px] font-semibold leading-6 text-[var(--foreground)]">
                {hero.eyebrow}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 text-sm leading-6 text-[var(--foreground)] opacity-75 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <span className="min-w-0">
              生成：
              <span className="font-mono">{metadata.generatedAt}</span>
            </span>
            <span className="min-w-0">
              更新：
              <span className="font-mono">{metadata.updatedAt}</span>
            </span>
          </div>
          <p className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
            Research framework:{" "}
            <span className="font-mono">{metadata.frameworkName}</span>
          </p>
        </div>

        <aside className="min-w-0 rounded-[8px] border border-[var(--border)] bg-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-65">
            Investment View
          </p>
          <div className="mt-4 space-y-3">
            {hero.metrics.map((metric) => (
              <HeroMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="text-base font-semibold leading-6 text-[var(--foreground)]">
              {cta.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
              {cta.description}
            </p>
          </div>
          <a
            href={cta.buttonHref ?? "#"}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          >
            {cta.buttonLabel}
          </a>
        </aside>
      </div>
      <div className="mt-5">
        <DataBoundaryNote brief={brief} compact />
      </div>
    </section>
  );
}

function HeroBadge({ badge }: { badge: BriefBadge }) {
  const className =
    badge.tone === "brand"
      ? "border-[var(--brand-border)] bg-[var(--brand-soft)] font-semibold text-[var(--brand-ink)]"
      : "border-[var(--border)] bg-[var(--muted)] font-medium text-[var(--foreground)] opacity-75";

  return (
    <span
      className={`inline-flex max-w-full min-h-8 items-center rounded-full border px-3 py-1 text-xs leading-5 ${className}`}
    >
      {badge.label}
    </span>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground)] opacity-60">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
