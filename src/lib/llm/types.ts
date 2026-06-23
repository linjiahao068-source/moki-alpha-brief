import type { BriefDocument, BriefLanguage } from "@/types/brief";
import type {
  EvidenceCoverageSummary,
  EvidencePack,
  IrEvidencePack,
  MarketEvidencePack,
  ResearchEvidenceContext,
  ResearchEvidenceLevel,
  SecEvidencePack,
} from "@/types/evidence";

export type DeepSeekModelMode = "chat" | "reasoner";

export type GenerateBriefInput = {
  ticker: string;
  companyName?: string;
  language?: BriefLanguage | "en";
  mode?: "demo" | "llm";
  modelMode?: DeepSeekModelMode;
  model?: string;
  useSearch?: boolean;
  useSec?: boolean;
  useIr?: boolean;
  useMarket?: boolean;
  evidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
  marketEvidencePack?: MarketEvidencePack;
  researchEvidenceContext?: ResearchEvidenceContext;
};

export type GenerateBriefProvider = "mock" | "deepseek";

export type GenerateBriefResult = {
  ok: boolean;
  brief?: BriefDocument;
  issues?: string[];
  error?: string;
  provider: GenerateBriefProvider;
  model?: string;
  modelMode?: DeepSeekModelMode;
  isFallback?: boolean;
  qualityWarnings?: string[];
  searchProvider?: EvidencePack["searchProvider"];
  searchIsFallback?: boolean;
  searchWarnings?: string[];
  secProvider?: SecEvidencePack["provider"];
  secIsFallback?: boolean;
  secWarnings?: string[];
  cik?: string;
  irProvider?: IrEvidencePack["provider"];
  irIsFallback?: boolean;
  irWarnings?: string[];
  marketProvider?: MarketEvidencePack["provider"];
  marketIsFallback?: boolean;
  marketWarnings?: string[];
  researchEvidenceContext?: ResearchEvidenceContext;
  evidenceLevel?: ResearchEvidenceLevel;
  coverage?: EvidenceCoverageSummary;
  evidenceWarnings?: string[];
  jsonRepairStatus?: "not-needed" | "attempted" | "succeeded" | "failed";
  jsonRepairSucceeded?: boolean;
};
