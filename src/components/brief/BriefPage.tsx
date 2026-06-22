import { getBriefTocItems } from "@/lib/briefs/getBriefTocItems";
import { validateBriefDocument } from "@/lib/briefs/validateBrief";
import type { BriefDocument } from "@/types/brief";
import { BriefContent } from "./BriefContent";
import { BriefFooter } from "./BriefFooter";
import { BriefHeader } from "./BriefHeader";
import { BriefHero } from "./BriefHero";
import { BriefToc } from "./BriefToc";

type BriefPageProps = {
  brief: BriefDocument;
  variant?: "full" | "embedded";
};

export function BriefPage({ brief, variant = "full" }: BriefPageProps) {
  const tocItems = getBriefTocItems(brief);
  const validationIssues = validateBriefDocument(brief);
  const isEmbedded = variant === "embedded";

  if (process.env.NODE_ENV !== "production" && validationIssues.length) {
    console.warn("BriefDocument validation issues:", validationIssues);
  }

  return (
    <div
      className={`bg-[var(--background)] text-[var(--foreground)] ${
        isEmbedded ? "" : "min-h-screen"
      }`}
    >
      <BriefHeader metadata={brief.metadata} />
      <BriefHero brief={brief} />
      <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,920px)_232px] lg:items-start">
        <BriefContent brief={brief} />
        <BriefToc items={tocItems} />
      </div>
      <BriefFooter disclaimer={brief.disclaimer} metadata={brief.metadata} />
    </div>
  );
}
