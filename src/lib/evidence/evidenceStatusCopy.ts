import type {
  IrProviderName,
  ResearchEvidenceLevel,
  SearchProviderName,
  SecProviderName,
} from "@/types/evidence";

type EvidenceStatusCopyInput = {
  evidenceLevel?: ResearchEvidenceLevel;
  hasSearchEvidence?: boolean;
  hasSecEvidence?: boolean;
  hasIrEvidence?: boolean;
  searchProvider?: SearchProviderName | string;
  secProvider?: SecProviderName | string;
  irProvider?: IrProviderName | string;
};

export type EvidenceStatusCopy = {
  label: string;
  shortDescription: string;
  boundaryDescription: string;
  warningDescription: string;
  mvpLabel: string;
};

export function getEvidenceStatusCopy({
  evidenceLevel,
  hasSearchEvidence = false,
  hasSecEvidence = false,
  hasIrEvidence = false,
  searchProvider,
  secProvider,
  irProvider,
}: EvidenceStatusCopyInput): EvidenceStatusCopy {
  const level = resolveEvidenceLevel({
    evidenceLevel,
    hasSearchEvidence,
    hasSecEvidence,
    hasIrEvidence,
  });
  const parts = getEvidenceParts(level);
  const label =
    parts.length > 0 ? `${parts.join(" + ")} Evidence Draft` : "LLM Demo / No Live Data";
  const connected = parts.length > 0 ? parts.join(" + ") : "no external evidence";
  const missing = getMissingText(level);
  const providerText = getProviderText({
    searchProvider,
    secProvider,
    irProvider,
    hasSearchEvidence,
    hasSecEvidence,
    hasIrEvidence,
  });

  if (level === "none") {
    return {
      label,
      shortDescription:
        "LLM Demo / No Live Data. Search, SEC, Company IR, real-time market price, consensus estimates, database save, and manual verification are not connected.",
      boundaryDescription:
        "No evidence context is attached. The generated brief must stay in demo mode and must not claim live data, SEC facts, Company IR evidence, consensus, or verified real data.",
      warningDescription:
        "Current phase is an internal generation demo. It is for research workflow testing only and does not constitute investment advice.",
      mvpLabel: "LLM Demo MVP",
    };
  }

  return {
    label,
    shortDescription: `${label}: connected evidence = ${connected}. ${providerText} Missing: ${missing}. This remains evidence-draft and is not investment advice.`,
    boundaryDescription: `${label} is attached through Research Evidence Context. Search, SEC, and Company IR keep separate roles: search for recent public context, SEC for official companyfacts / submissions, and IR for company official narrative or management commentary. Missing: ${missing}.`,
    warningDescription:
      "Research Evidence Context is still an MVP. It does not include real-time market price, consensus estimates, database persistence, saved share links, manual verification, PDF full-text parsing, or transcript full-text parsing.",
    mvpLabel: "Research Evidence Context MVP",
  };
}

function resolveEvidenceLevel({
  evidenceLevel,
  hasSearchEvidence,
  hasSecEvidence,
  hasIrEvidence,
}: Pick<
  EvidenceStatusCopyInput,
  "evidenceLevel" | "hasSearchEvidence" | "hasSecEvidence" | "hasIrEvidence"
>): ResearchEvidenceLevel {
  if (evidenceLevel) return evidenceLevel;
  if (hasSearchEvidence && hasSecEvidence && hasIrEvidence) {
    return "search-sec-and-ir";
  }
  if (hasSearchEvidence && hasSecEvidence) return "search-and-sec";
  if (hasSearchEvidence && hasIrEvidence) return "search-and-ir";
  if (hasSecEvidence && hasIrEvidence) return "sec-and-ir";
  if (hasSearchEvidence) return "search-only";
  if (hasSecEvidence) return "sec-only";
  if (hasIrEvidence) return "ir-only";
  return "none";
}

function getEvidenceParts(level: ResearchEvidenceLevel) {
  switch (level) {
    case "search-sec-and-ir":
      return ["Search", "SEC", "IR"];
    case "search-and-sec":
      return ["Search", "SEC"];
    case "search-and-ir":
      return ["Search", "IR"];
    case "sec-and-ir":
      return ["SEC", "IR"];
    case "search-only":
      return ["Search"];
    case "sec-only":
      return ["SEC"];
    case "ir-only":
      return ["IR"];
    case "none":
    default:
      return [];
  }
}

function getMissingText(level: ResearchEvidenceLevel) {
  const missing = ["real-time market price", "consensus estimates"];
  const parts = getEvidenceParts(level);

  if (!parts.includes("Search")) missing.push("recent public web context");
  if (!parts.includes("SEC")) missing.push("SEC companyfacts / submissions");
  if (!parts.includes("IR")) missing.push("Company IR / earnings release evidence");
  missing.push("database save", "manual verification");

  return missing.join(", ");
}

function getProviderText({
  searchProvider,
  secProvider,
  irProvider,
  hasSearchEvidence,
  hasSecEvidence,
  hasIrEvidence,
}: Pick<
  EvidenceStatusCopyInput,
  | "searchProvider"
  | "secProvider"
  | "irProvider"
  | "hasSearchEvidence"
  | "hasSecEvidence"
  | "hasIrEvidence"
>) {
  const providers = [
    hasSearchEvidence ? `searchProvider=${searchProvider || "unknown"}` : "",
    hasSecEvidence ? `secProvider=${secProvider || "unknown"}` : "",
    hasIrEvidence ? `irProvider=${irProvider || "unknown"}` : "",
  ].filter(Boolean);

  return providers.length ? `Providers: ${providers.join("; ")}.` : "";
}
