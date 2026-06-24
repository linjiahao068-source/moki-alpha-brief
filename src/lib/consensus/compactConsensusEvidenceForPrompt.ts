import type { ConsensusEvidencePack } from "@/types/evidence";

export function compactConsensusEvidenceForPrompt(
  consensusEvidencePack?: ConsensusEvidencePack,
) {
  if (!consensusEvidencePack) return undefined;

  return {
    asOf: consensusEvidencePack.asOf,
    ticker: consensusEvidencePack.ticker,
    companyName: consensusEvidencePack.companyName,
    provider: consensusEvidencePack.provider,
    dataMode: consensusEvidencePack.dataMode,
    period: consensusEvidencePack.period,
    isFallback: consensusEvidencePack.isFallback,
    providerChain: consensusEvidencePack.providerChain,
    warnings: (consensusEvidencePack.warnings || []).slice(0, 6),
    estimates: consensusEvidencePack.estimates.slice(0, 8).map((estimate) => ({
      id: estimate.id,
      fiscalPeriod: estimate.fiscalPeriod,
      fiscalYear: estimate.fiscalYear,
      periodEnd: estimate.periodEnd,
      estimateDate: estimate.estimateDate,
      revenueAvg: estimate.revenueAvg,
      revenueLow: estimate.revenueLow,
      revenueHigh: estimate.revenueHigh,
      epsAvg: estimate.epsAvg,
      epsLow: estimate.epsLow,
      epsHigh: estimate.epsHigh,
      analystCount: estimate.analystCount,
      currency: estimate.currency,
      sourceProvider: estimate.sourceProvider,
      confidence: estimate.confidence,
      allowedUse: estimate.allowedUse,
    })),
  };
}
