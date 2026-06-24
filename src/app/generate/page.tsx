import Link from "next/link";
import { GenerateBriefForm } from "@/components/generate/GenerateBriefForm";

export const metadata = {
  title: "Generate Alpha Brief - Moki",
  description:
    "Internal evidence-draft page for generating, saving, and sharing Moki Alpha Brief documents.",
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
              Evidence Draft
            </span>
            <Link
              href="/s/nvda"
              className="inline-flex min-h-8 items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold leading-5 text-[var(--foreground)] transition hover:bg-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)]"
            >
              View /s/nvda
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        <section className="max-w-[860px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
            Phase 10.0.1 MVP
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-[30px]">
            Generate Alpha Brief
          </h1>
          <p className="mt-3 text-sm leading-7 opacity-75 sm:text-[15px]">
            Generate an evidence-draft BriefDocument, preview it with the
            production Moki brief renderer, then save the rendered document and
            create a real unlisted /s/[slug] share link. Consensus estimates are
            mock evidence in this backfill. Saved share pages read storage only;
            they do not regenerate or fetch evidence again.
          </p>
        </section>

        <div className="mt-6">
          <GenerateBriefForm />
        </div>
      </div>
    </main>
  );
}
