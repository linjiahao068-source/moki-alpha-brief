import Link from "next/link";
import { GenerateBriefForm } from "@/components/generate/GenerateBriefForm";

export const metadata = {
  title: "Moki Alpha Brief",
  description:
    "Generate an AI public research brief for US equities with source context, scenario analysis, catalysts, and risk tracking.",
};

export default function GeneratePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-[var(--border)] bg-white text-sm font-semibold">
              M
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">
                Moki
              </p>
              <p className="mt-0.5 text-base font-semibold leading-6">
                Moki Alpha Brief
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold leading-5 text-[var(--brand-ink)]">
              Public Alpha Brief
            </span>
            <Link
              href="/s/nvda"
              className="inline-flex min-h-8 items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold leading-5 text-[var(--foreground)] transition hover:bg-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)]"
            >
              Sample Brief
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        <section className="max-w-[860px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
            Public Research Brief
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-[30px]">
            Moki Alpha Brief
          </h1>
          <p className="mt-3 text-sm leading-7 opacity-75 sm:text-[15px]">
            Enter a US stock ticker to generate an AI buy-side style research
            brief with source context, scenario valuation, catalysts, and risk
            tracking. Saved links open as unlisted public research pages and do
            not regenerate the report on refresh.
          </p>
        </section>

        <div className="mt-6">
          <GenerateBriefForm />
        </div>
      </div>
    </main>
  );
}
