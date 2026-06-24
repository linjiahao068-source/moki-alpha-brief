import Link from "next/link";

type BriefNotFoundProps = {
  badgeLabel?: string;
  detail?: string;
  message?: string;
  title?: string;
};

export function BriefNotFound({
  badgeLabel = "Unlisted Share Page",
  detail = "The current V0.1 app can show the static /s/nvda demo or a saved Phase 10 share link.",
  message = "This public brief link does not exist, has not been saved, or is unavailable.",
  title = "Brief not found",
}: BriefNotFoundProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6">
      <section className="mx-auto w-full max-w-[980px] rounded-[8px] border border-[var(--border)] bg-white p-5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
              Moki Alpha Brief
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[30px]">
              {title}
            </h1>
          </div>
          <span className="inline-flex max-w-full w-fit min-h-8 items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold leading-5 text-[var(--brand-ink)]">
            {badgeLabel}
          </span>
        </div>

        <div className="mt-6 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-[15px] leading-7 text-[var(--foreground)] sm:p-5">
          <p>{message}</p>
          <p className="mt-3 text-sm opacity-75">{detail}</p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] focus:ring-offset-2 focus:ring-offset-[var(--background)] sm:w-auto"
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
