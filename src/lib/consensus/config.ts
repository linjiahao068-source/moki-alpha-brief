import type { ConsensusConfig, ConsensusPeriod } from "./types";

export const CONSENSUS_DEFAULT_MAX_PERIODS = 4;

export function getConsensusConfig(): ConsensusConfig {
  const requested = process.env.CONSENSUS_PROVIDER?.trim().toLowerCase();
  const provider: ConsensusConfig["provider"] =
    requested === "mock" || requested === "fmp" || requested === "finnhub"
      ? requested
      : "mock";
  const period = getConsensusPeriod(process.env.CONSENSUS_PERIOD);
  const maxPeriods = Number(process.env.CONSENSUS_MAX_PERIODS);

  return {
    provider,
    period,
    maxPeriods:
      Number.isFinite(maxPeriods) && maxPeriods > 0
        ? Math.min(Math.floor(maxPeriods), 12)
        : CONSENSUS_DEFAULT_MAX_PERIODS,
    fmpApiKey: process.env.FMP_API_KEY?.trim() || undefined,
    finnhubApiKey: process.env.FINNHUB_API_KEY?.trim() || undefined,
  };
}

function getConsensusPeriod(value: string | undefined): ConsensusPeriod {
  const requested = value?.trim().toLowerCase();
  return requested === "annual" ? "annual" : "quarter";
}
