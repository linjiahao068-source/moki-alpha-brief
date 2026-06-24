import type { ConsensusEvidencePack, ConsensusProviderName } from "@/types/evidence";
import { getConsensusConfig } from "./config";
import { normalizeConsensusTicker } from "./normalizeConsensusTicker";
import { mockConsensusProvider } from "./providers/mockConsensusProvider";
import type {
  ConsensusEvidenceResult,
  ConsensusInput,
  ConsensusProvider,
} from "./types";

const consensusProviders: Record<ConsensusProviderName, ConsensusProvider> = {
  mock: mockConsensusProvider,
};

const CORE_WARNINGS = [
  "Consensus estimates are mock evidence in this MVP.",
  "Consensus evidence is not SEC actual data.",
  "Consensus evidence is not market price data.",
  "Consensus evidence is not verified-real-data.",
];

export async function buildConsensusEvidencePack(
  input: ConsensusInput,
): Promise<ConsensusEvidenceResult> {
  const config = getConsensusConfig();
  const period = input.period || config.period;
  const ticker = normalizeConsensusTicker(input.ticker);
  const providerChain = getProviderChain(config.provider);
  const fallbackWarnings = [
    "Using mock consensus evidence; no FMP or Finnhub provider request was run in this MVP.",
  ];
  const failureReasons: string[] = [];

  for (let index = 0; index < providerChain.length; index += 1) {
    const providerName = providerChain[index];
    const provider = consensusProviders[providerName];
    const nextProvider = providerChain[index + 1];

    try {
      const consensusEvidencePack = await collectConsensusEvidence({
        config: { ...config, period },
        input: { ...input, ticker, period },
        provider,
        providerName,
        providerChain,
        isFallback: true,
        warnings: fallbackWarnings,
      });

      return {
        ok: true,
        provider: providerName,
        isFallback: consensusEvidencePack.isFallback || false,
        consensusEvidencePack,
        error: failureReasons[0],
        providerChain,
        warnings: consensusEvidencePack.warnings || [],
      };
    } catch (error) {
      const reason = getErrorMessage(error, "Consensus evidence provider failed");
      failureReasons.push(`${providerName}: ${reason}`);
      logProviderError({ providerName, ticker, error });

      if (nextProvider) {
        fallbackWarnings.push(
          `${providerName} failed; falling back to ${nextProvider}.`,
        );
      } else {
        fallbackWarnings.push(`${providerName} failed.`);
      }
    }
  }

  return {
    ok: false,
    provider: "mock",
    isFallback: true,
    error: failureReasons[0] || "All consensus evidence providers failed.",
    providerChain,
    warnings: Array.from(new Set([...fallbackWarnings, ...CORE_WARNINGS])),
  };
}

async function collectConsensusEvidence({
  config,
  input,
  isFallback,
  provider,
  providerChain,
  providerName,
  warnings,
}: {
  config: ReturnType<typeof getConsensusConfig>;
  input: ConsensusInput;
  isFallback: boolean;
  provider: ConsensusProvider;
  providerChain: ConsensusProviderName[];
  providerName: ConsensusProviderName;
  warnings: string[];
}) {
  const payload = await provider.fetchConsensusEvidence(input, config);
  const normalizedEstimates = payload.estimates.slice(0, config.maxPeriods).map(
    (estimate, index) => ({
      ...estimate,
      id: estimate.id || `consensus-${providerName}-${index + 1}`,
      sourceProvider: providerName,
      confidence: "medium" as const,
      allowedUse: estimate.allowedUse || ("consensus-context" as const),
    }),
  );
  const consensusWarnings = Array.from(
    new Set([...warnings, ...(payload.warnings || []), ...CORE_WARNINGS]),
  );

  return {
    asOf: payload.sources[0]?.retrievedAt || formatCstTimestamp(),
    ticker: normalizeConsensusTicker(input.ticker),
    companyName: input.companyName?.trim(),
    provider: providerName,
    dataMode: "evidence-draft",
    period: input.period || config.period,
    estimates: normalizedEstimates,
    sources: payload.sources,
    warnings: consensusWarnings,
    isFallback,
    providerChain,
  } satisfies ConsensusEvidencePack;
}

function getProviderChain(
  provider: ConsensusProviderName,
) {
  void provider;
  return ["mock"] satisfies ConsensusProviderName[];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

function logProviderError({
  error,
  providerName,
  ticker,
}: {
  error: unknown;
  providerName: ConsensusProviderName;
  ticker: string;
}) {
  console.error("Consensus evidence provider error", {
    provider: providerName,
    ticker,
    error: {
      name: error instanceof Error ? error.name : "Error",
      message: getErrorMessage(error, "Analyst estimate request failed"),
    },
  });
}

function formatCstTimestamp() {
  const value = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return `${value} CST`;
}
