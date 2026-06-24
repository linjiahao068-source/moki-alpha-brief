import type {
  ConsensusEvidencePack,
  ConsensusProviderName,
} from "@/types/evidence";

export type ConsensusPeriod = "quarter" | "annual";

export type ConsensusInput = {
  ticker: string;
  companyName?: string;
  period?: ConsensusPeriod;
};

export type ConsensusConfig = {
  provider: ConsensusProviderName;
  period: ConsensusPeriod;
  maxPeriods: number;
  fmpApiKey?: string;
  finnhubApiKey?: string;
};

export type ConsensusProviderPayload = {
  estimates: ConsensusEvidencePack["estimates"];
  sources: ConsensusEvidencePack["sources"];
  warnings: string[];
};

export type ConsensusEvidenceResult = {
  ok: boolean;
  provider: ConsensusProviderName;
  isFallback?: boolean;
  consensusEvidencePack?: ConsensusEvidencePack;
  error?: string;
  providerChain?: ConsensusProviderName[];
  warnings?: string[];
};

export type ConsensusProvider = {
  fetchConsensusEvidence(
    input: ConsensusInput,
    config: ConsensusConfig,
  ): Promise<ConsensusProviderPayload>;
};
