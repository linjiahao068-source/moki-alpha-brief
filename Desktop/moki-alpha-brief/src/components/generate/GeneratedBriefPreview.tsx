"use client";

import { BriefPage } from "@/components/brief/BriefPage";
import type { BriefDocument } from "@/types/brief";

type GeneratedBriefPreviewProps = {
  brief: BriefDocument;
};

export function GeneratedBriefPreview({ brief }: GeneratedBriefPreviewProps) {
  return (
    <section className="mt-8 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-white px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
          Generated Preview
        </p>
        <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
          {brief.metadata.ticker} / {brief.metadata.title}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-[var(--brand-ink)]">
            Data: {brief.metadata.dataMode}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-[var(--foreground)] opacity-75">
            Evidence Pack: {brief.evidencePack ? "Attached" : "None / No Live Data"}
          </span>
        </div>
      </div>
      <div className="max-h-none">
        <BriefPage brief={brief} variant="embedded" />
      </div>
    </section>
  );
}
