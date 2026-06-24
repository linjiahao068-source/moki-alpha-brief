import type { ConsensusConfig, ConsensusPeriod } from "./types";

export const CONSENSUS_DEFAULT_MAX_PERIODS = 4;

export function getConsensusConfig(): ConsensusConfig {
  const provider: ConsensusConfig["provider"] = "mock";
  const period = getConsensusPeriod(process.env.CONSENSUS_PERIOD);
  const maxPeriods = Number(process.env.CONSENSUS_MAX_PERIODS);

  return {
    provider,
    period,
    maxPeriods:
      Number.isFinite(maxPeriods) && maxPeriods > 0
        ? Math.min(Math.floor(maxPeriods), CONSENSUS_DEFAULT_MAX_PERIODS)
        : CONSENSUS_DEFAULT_MAX_PERIODS,
  };
}

function getConsensusPeriod(value: string | undefined): ConsensusPeriod {
  const requested = value?.trim().toLowerCase();
  return requested === "annual" ? "annual" : "quarter";
}
