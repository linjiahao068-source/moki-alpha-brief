import type { BriefMetadata } from "@/types/brief";

type BriefHeaderProps = {
  metadata: BriefMetadata;
};

export function BriefHeader({ metadata }: BriefHeaderProps) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-[var(--border)] bg-white text-sm font-semibold text-[var(--foreground)]">
            M
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-65">
              {metadata.brand}
            </p>
            <p className="mt-0.5 text-base font-semibold leading-6 text-[var(--foreground)]">
              {metadata.product}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex max-w-full min-h-8 items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold leading-5 text-[var(--brand-ink)]">
            {metadata.shareLabel}
          </span>
          <span className="inline-flex max-w-full min-h-8 items-center rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 font-mono text-xs font-semibold leading-5 text-[var(--foreground)]">
            {metadata.ticker}
          </span>
        </div>
      </div>
    </header>
  );
}
