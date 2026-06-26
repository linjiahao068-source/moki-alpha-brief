import type { BriefMetadata, DisclaimerData } from "@/types/brief";

type BriefFooterProps = {
  disclaimer: DisclaimerData;
  metadata: BriefMetadata;
};

export function BriefFooter({ disclaimer, metadata }: BriefFooterProps) {
  return (
    <footer className="mx-auto w-full max-w-[1180px] px-4 pb-10 sm:px-6">
      <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 text-sm leading-7 text-[var(--risk-ink)] sm:p-5">
        <p className="font-semibold">{disclaimer.text}</p>
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--risk-border)] pt-4 text-xs leading-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <span>{metadata.product} / Public Research Brief</span>
          <span className="font-mono">Updated {metadata.updatedAt}</span>
        </div>
      </div>
    </footer>
  );
}
