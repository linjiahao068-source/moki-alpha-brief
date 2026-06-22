import type { BriefDocument, BriefLanguage } from "@/types/brief";
import type { EvidencePack, SecEvidencePack } from "@/types/evidence";

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
  evidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
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
};
