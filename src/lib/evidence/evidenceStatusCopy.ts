import type {
  IrProviderName,
  MarketProviderName,
  ResearchEvidenceLevel,
  SearchProviderName,
  SecProviderName,
} from "@/types/evidence";

type EvidenceStatusCopyInput = {
  evidenceLevel?: ResearchEvidenceLevel;
  hasSearchEvidence?: boolean;
  hasSecEvidence?: boolean;
  hasIrEvidence?: boolean;
  hasMarketEvidence?: boolean;
  searchProvider?: SearchProviderName | string;
  secProvider?: SecProviderName | string;
  irProvider?: IrProviderName | string;
  marketProvider?: MarketProviderName | string;
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
  hasMarketEvidence = false,
  searchProvider,
  secProvider,
  irProvider,
  marketProvider,
}: EvidenceStatusCopyInput): EvidenceStatusCopy {
  const level = resolveEvidenceLevel({
    evidenceLevel,
    hasSearchEvidence,
    hasSecEvidence,
    hasIrEvidence,
    hasMarketEvidence,
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
    marketProvider,
    hasSearchEvidence,
    hasSecEvidence,
    hasIrEvidence,
    hasMarketEvidence,
  });
  const hasMarket = parts.includes("Market");

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
    boundaryDescription: `${label} is attached through Research Evidence Context. Search, SEC, IR, and Market keep separate roles: search for recent public context, SEC for official companyfacts / submissions, IR for company official narrative or management commentary, and Market for third-party free quote / volume / recent daily kline context. ${hasMarket ? "Market provider may be stock-api, global-stock-data, or mock fallback; free market data may be delayed, incomplete, field-limited, or unavailable." : "Market evidence is not connected."} Missing: ${missing}.`,
    warningDescription:
      hasMarket
        ? "Research Evidence Context is still an MVP. Third-party free market evidence may come from stock-api, global-stock-data, or mock fallback and may be delayed, incomplete, field-limited, or unavailable. Consensus estimates, database persistence, saved share links, manual verification, PDF full-text parsing, and transcript full-text parsing are not connected."
        : "Research Evidence Context is still an MVP. It does not include market evidence, consensus estimates, database persistence, saved share links, manual verification, PDF full-text parsing, or transcript full-text parsing.",
    mvpLabel: "Research Evidence Context MVP",
  };
}

function resolveEvidenceLevel({
  evidenceLevel,
  hasSearchEvidence,
  hasSecEvidence,
  hasIrEvidence,
  hasMarketEvidence,
}: Pick<
  EvidenceStatusCopyInput,
  | "evidenceLevel"
  | "hasSearchEvidence"
  | "hasSecEvidence"
  | "hasIrEvidence"
  | "hasMarketEvidence"
>): ResearchEvidenceLevel {
  if (evidenceLevel) return evidenceLevel;
  if (hasSearchEvidence && hasSecEvidence && hasIrEvidence && hasMarketEvidence) {
    return "search-sec-ir-and-market";
  }
  if (hasSearchEvidence && hasSecEvidence && hasMarketEvidence) {
    return "search-sec-and-market";
  }
  if (hasSearchEvidence && hasIrEvidence && hasMarketEvidence) {
    return "search-ir-and-market";
  }
  if (hasSecEvidence && hasIrEvidence && hasMarketEvidence) {
    return "sec-ir-and-market";
  }
  if (hasSearchEvidence && hasSecEvidence && hasIrEvidence) {
    return "search-sec-and-ir";
  }
  if (hasSearchEvidence && hasMarketEvidence) return "search-and-market";
  if (hasSecEvidence && hasMarketEvidence) return "sec-and-market";
  if (hasIrEvidence && hasMarketEvidence) return "ir-and-market";
  if (hasSearchEvidence && hasSecEvidence) return "search-and-sec";
  if (hasSearchEvidence && hasIrEvidence) return "search-and-ir";
  if (hasSecEvidence && hasIrEvidence) return "sec-and-ir";
  if (hasSearchEvidence) return "search-only";
  if (hasSecEvidence) return "sec-only";
  if (hasIrEvidence) return "ir-only";
  if (hasMarketEvidence) return "market-only";
  return "none";
}

function getEvidenceParts(level: ResearchEvidenceLevel) {
  switch (level) {
    case "search-sec-ir-and-market":
      return ["Search", "SEC", "IR", "Market"];
    case "search-sec-and-market":
      return ["Search", "SEC", "Market"];
    case "search-ir-and-market":
      return ["Search", "IR", "Market"];
    case "sec-ir-and-market":
      return ["SEC", "IR", "Market"];
    case "search-sec-and-ir":
      return ["Search", "SEC", "IR"];
    case "search-and-market":
      return ["Search", "Market"];
    case "sec-and-market":
      return ["SEC", "Market"];
    case "ir-and-market":
      return ["IR", "Market"];
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
    case "market-only":
      return ["Market"];
    case "none":
    default:
      return [];
  }
}

function getMissingText(level: ResearchEvidenceLevel) {
  const missing = ["consensus estimates"];
  const parts = getEvidenceParts(level);

  if (!parts.includes("Market")) missing.unshift("real-time market price");
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
  marketProvider,
  hasSearchEvidence,
  hasSecEvidence,
  hasIrEvidence,
  hasMarketEvidence,
}: Pick<
  EvidenceStatusCopyInput,
  | "searchProvider"
  | "secProvider"
  | "irProvider"
  | "marketProvider"
  | "hasSearchEvidence"
  | "hasSecEvidence"
  | "hasIrEvidence"
  | "hasMarketEvidence"
>) {
  const providers = [
    hasSearchEvidence ? `searchProvider=${searchProvider || "unknown"}` : "",
    hasSecEvidence ? `secProvider=${secProvider || "unknown"}` : "",
    hasIrEvidence ? `irProvider=${irProvider || "unknown"}` : "",
    hasMarketEvidence ? `marketProvider=${marketProvider || "unknown"}` : "",
  ].filter(Boolean);

  return providers.length ? `Providers: ${providers.join("; ")}.` : "";
}
