import type { EvidenceSource } from "@/types/evidence";
import { normalizeConsensusTicker } from "../normalizeConsensusTicker";
import type { ConsensusProvider } from "../types";

const MOCK_ESTIMATES: Record<
  string,
  Array<{
    fiscalPeriod: string;
    fiscalYear: number;
    periodEnd: string;
    revenueAvg: number;
    revenueLow: number;
    revenueHigh: number;
    epsAvg: number;
    epsLow: number;
    epsHigh: number;
    analystCount: number;
    currency: string;
  }>
> = {
  NVDA: [
    {
      fiscalPeriod: "FY2026 Q2",
      fiscalYear: 2026,
      periodEnd: "2025-07-31",
      revenueAvg: 45_900_000_000,
      revenueLow: 44_800_000_000,
      revenueHigh: 47_200_000_000,
      epsAvg: 0.98,
      epsLow: 0.92,
      epsHigh: 1.04,
      analystCount: 38,
      currency: "USD",
    },
    {
      fiscalPeriod: "FY2026 Q3",
      fiscalYear: 2026,
      periodEnd: "2025-10-31",
      revenueAvg: 49_200_000_000,
      revenueLow: 47_700_000_000,
      revenueHigh: 51_000_000_000,
      epsAvg: 1.07,
      epsLow: 0.99,
      epsHigh: 1.16,
      analystCount: 36,
      currency: "USD",
    },
  ],
  TSLA: [
    {
      fiscalPeriod: "FY2025 Q2",
      fiscalYear: 2025,
      periodEnd: "2025-06-30",
      revenueAvg: 25_800_000_000,
      revenueLow: 24_900_000_000,
      revenueHigh: 26_700_000_000,
      epsAvg: 0.52,
      epsLow: 0.43,
      epsHigh: 0.61,
      analystCount: 31,
      currency: "USD",
    },
  ],
  ORCL: [
    {
      fiscalPeriod: "FY2026 Q1",
      fiscalYear: 2026,
      periodEnd: "2025-08-31",
      revenueAvg: 15_000_000_000,
      revenueLow: 14_600_000_000,
      revenueHigh: 15_500_000_000,
      epsAvg: 1.46,
      epsLow: 1.39,
      epsHigh: 1.52,
      analystCount: 27,
      currency: "USD",
    },
  ],
  SNOW: [
    {
      fiscalPeriod: "FY2026 Q2",
      fiscalYear: 2026,
      periodEnd: "2025-07-31",
      revenueAvg: 1_030_000_000,
      revenueLow: 1_000_000_000,
      revenueHigh: 1_070_000_000,
      epsAvg: 0.22,
      epsLow: 0.17,
      epsHigh: 0.28,
      analystCount: 29,
      currency: "USD",
    },
  ],
  MSFT: [
    {
      fiscalPeriod: "FY2026 Q1",
      fiscalYear: 2026,
      periodEnd: "2025-09-30",
      revenueAvg: 75_400_000_000,
      revenueLow: 73_900_000_000,
      revenueHigh: 77_200_000_000,
      epsAvg: 3.65,
      epsLow: 3.52,
      epsHigh: 3.78,
      analystCount: 41,
      currency: "USD",
    },
  ],
};

export const mockConsensusProvider: ConsensusProvider = {
  async fetchConsensusEvidence(input, config) {
    const ticker = normalizeConsensusTicker(input.ticker);
    const retrievedAt = formatCstTimestamp();
    const rows =
      MOCK_ESTIMATES[ticker] ||
      buildGenericEstimateRows(ticker, input.companyName, config.maxPeriods);
    const estimates = rows.slice(0, config.maxPeriods).map((row, index) => ({
      id: `consensus-mock-${ticker.toLowerCase()}-${index + 1}`,
      fiscalPeriod: row.fiscalPeriod,
      fiscalYear: row.fiscalYear,
      periodEnd: row.periodEnd,
      estimateDate: retrievedAt,
      revenueAvg: row.revenueAvg,
      revenueLow: row.revenueLow,
      revenueHigh: row.revenueHigh,
      epsAvg: row.epsAvg,
      epsLow: row.epsLow,
      epsHigh: row.epsHigh,
      analystCount: row.analystCount,
      currency: row.currency,
      sourceProvider: "mock" as const,
      confidence: "medium" as const,
      allowedUse: "consensus-context" as const,
    }));
    const source: EvidenceSource = {
      id: "consensus-mock",
      title: "Mock Consensus Evidence",
      domain: "moki.local",
      publisher: "Moki Alpha Brief",
      sourceType: "consensus",
      retrievedAt,
      confidence: "medium",
      dateStatus: "retrieved-only",
      qualityReason:
        "Mock consensus evidence for UI, prompt, provider fallback, and validation QA. Not real analyst estimate data.",
      sourceRank: 1,
    };

    return {
      estimates,
      sources: [source],
      warnings: [
        "Mock Consensus Evidence: analyst estimates are simulated and not real provider data.",
        "Consensus data may be delayed or incomplete.",
        "Provider access may depend on API plan.",
        "Consensus evidence is not SEC data or market price data.",
      ],
    };
  },
};

function buildGenericEstimateRows(
  ticker: string,
  companyName: string | undefined,
  count: number,
) {
  void companyName;
  const baseRevenue = ticker.endsWith(".HK") ? 20_000_000_000 : 5_000_000_000;

  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const quarter = index + 1;
    const revenueAvg = baseRevenue * (1 + index * 0.06);
    const epsAvg = 1 + index * 0.04;

    return {
      fiscalPeriod: `FY2026 Q${quarter}`,
      fiscalYear: 2026,
      periodEnd: `2026-${String(quarter * 3).padStart(2, "0")}-30`,
      revenueAvg: round(revenueAvg, 0),
      revenueLow: round(revenueAvg * 0.94, 0),
      revenueHigh: round(revenueAvg * 1.06, 0),
      epsAvg: round(epsAvg, 2),
      epsLow: round(epsAvg * 0.9, 2),
      epsHigh: round(epsAvg * 1.1, 2),
      analystCount: 8,
      currency: ticker.endsWith(".HK") ? "HKD" : "USD",
    };
  });
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
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
