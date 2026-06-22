import { briefMap, type BriefSlug } from "@/data/briefs";
import type { BriefDocument } from "@/types/brief";

export function getBriefBySlug(slug: string): BriefDocument | undefined {
  return briefMap[slug.toLowerCase() as BriefSlug];
}
