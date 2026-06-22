import type { BriefDocument } from "@/types/brief";
import { nvdaBrief } from "./nvdaBrief";

export const briefMap = {
  [nvdaBrief.slug]: nvdaBrief,
} satisfies Record<string, BriefDocument>;

export type BriefSlug = keyof typeof briefMap;
