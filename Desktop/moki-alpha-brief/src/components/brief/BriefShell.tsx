import { nvdaBrief } from "@/data/nvdaBrief";
import type { BriefDocument } from "@/types/brief";
import { BriefPage } from "./BriefPage";

type BriefShellProps = {
  brief?: BriefDocument;
};

export function BriefShell({ brief = nvdaBrief }: BriefShellProps) {
  return <BriefPage brief={brief} />;
}
