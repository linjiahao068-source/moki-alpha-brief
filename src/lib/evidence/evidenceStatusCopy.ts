import type {
  ConsensusProviderName,
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
  hasConsensusEvidence?: boolean;
  searchProvider?: SearchProviderName | string;
  secProvider?: SecProviderName | string;
  irProvider?: IrProviderName | string;
  marketProvider?: MarketProviderName | string;
  consensusProvider?: ConsensusProviderName | string;
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
  hasConsensusEvidence = false,
  searchProvider,
  secProvider,
  irProvider,
  marketProvider,
  consensusProvider,
}: EvidenceStatusCopyInput): EvidenceStatusCopy {
  const level = resolveEvidenceLevel({
    evidenceLevel,
    hasSearchEvidence,
    hasSecEvidence,
    hasIrEvidence,
    hasMarketEvidence,
    hasConsensusEvidence,
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
    consensusProvider,
    hasSearchEvidence,
    hasSecEvidence,
    hasIrEvidence,
    hasMarketEvidence,
    hasConsensusEvidence,
  });
  const hasMarket = parts.includes("Market");
  const hasConsensus = parts.includes("Consensus");

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
    boundaryDescription: `${label} is attached through Research Evidence Context. Search, SEC, IR, Market, and Consensus keep separate roles: search for recent public context, SEC for official companyfacts / submissions, IR for company official narrative or management commentary, Market for third-party free quote / volume / recent daily kline context, and Consensus for revenue / EPS analyst estimates. ${hasMarket ? "Market provider may be stock-api, global-stock-data, or mock fallback; free market data may be delayed, incomplete, field-limited, or unavailable." : "Market evidence is not connected."} ${hasConsensus ? "Consensus evidence is attached but may be delayed, incomplete, field-limited, or provider-plan-limited." : "Consensus evidence is not connected."} Missing: ${missing}.`,
    warningDescription:
      hasConsensus
        ? "Research Evidence Context is still an MVP. Consensus evidence is attached for revenue / EPS analyst estimates, may be delayed, incomplete, field-limited, or provider-plan-limited, and is not SEC actual data, market price data, verified-real-data, or investment advice. Database persistence, saved share links, manual verification, PDF full-text parsing, and transcript full-text parsing are not connected."
        : hasMarket
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
  hasConsensusEvidence,
}: Pick<
  EvidenceStatusCopyInput,
  | "evidenceLevel"
  | "hasSearchEvidence"
  | "hasSecEvidence"
  | "hasIrEvidence"
  | "hasMarketEvidence"
  | "hasConsensusEvidence"
>): ResearchEvidenceLevel {
  if (evidenceLevel) return evidenceLevel;
  const parts = [
    hasSearchEvidence ? "search" : "",
    hasSecEvidence ? "sec" : "",
    hasIrEvidence ? "ir" : "",
    hasMarketEvidence ? "market" : "",
    hasConsensusEvidence ? "consensus" : "",
  ].filter(Boolean);

  if (!parts.length) return "none";
  if (parts.length === 1) return `${parts[0]}-only` as ResearchEvidenceLevel;
  if (parts.length === 2) {
    return `${parts[0]}-and-${parts[1]}` as ResearchEvidenceLevel;
  }
  return `${parts.slice(0, -1).join("-")}-and-${
    parts[parts.length - 1]
  }` as ResearchEvidenceLevel;
}

function getEvidenceParts(level: ResearchEvidenceLevel) {
  if (level === "none") return [];

  return [
    level.includes("search") ? "Search" : "",
    level.includes("sec") ? "SEC" : "",
    /\bir\b/.test(level) ? "IR" : "",
    level.includes("market") ? "Market" : "",
    level.includes("consensus") ? "Consensus" : "",
  ].filter(Boolean);
}

function getMissingText(level: ResearchEvidenceLevel) {
  const missing: string[] = [];
  const parts = getEvidenceParts(level);

  if (!parts.includes("Market")) missing.unshift("real-time market price");
  if (!parts.includes("Consensus")) missing.push("consensus estimates");
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
  consensusProvider,
  hasSearchEvidence,
  hasSecEvidence,
  hasIrEvidence,
  hasMarketEvidence,
  hasConsensusEvidence,
}: Pick<
  EvidenceStatusCopyInput,
  | "searchProvider"
  | "secProvider"
  | "irProvider"
  | "marketProvider"
  | "consensusProvider"
  | "hasSearchEvidence"
  | "hasSecEvidence"
  | "hasIrEvidence"
  | "hasMarketEvidence"
  | "hasConsensusEvidence"
>) {
  const providers = [
    hasSearchEvidence ? `searchProvider=${searchProvider || "unknown"}` : "",
    hasSecEvidence ? `secProvider=${secProvider || "unknown"}` : "",
    hasIrEvidence ? `irProvider=${irProvider || "unknown"}` : "",
    hasMarketEvidence ? `marketProvider=${marketProvider || "unknown"}` : "",
    hasConsensusEvidence
      ? `consensusProvider=${consensusProvider || "unknown"}`
      : "",
  ].filter(Boolean);

  return providers.length ? `Providers: ${providers.join("; ")}.` : "";
}
