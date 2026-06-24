import "server-only";

import type { EvidenceSource } from "@/types/evidence";
import { normalizeConsensusTicker } from "../normalizeConsensusTicker";
import type { ConsensusProvider } from "../types";

type FmpEstimateRow = Record<string, unknown>;

export const fmpConsensusProvider: ConsensusProvider = {
  async fetchConsensusEvidence(input, config) {
    const apiKey = config.fmpApiKey;
    if (!apiKey) throw new Error("Missing FMP_API_KEY");

    const ticker = normalizeConsensusTicker(input.ticker);
    const retrievedAt = formatCstTimestamp();
    const url = new URL(
      `https://financialmodelingprep.com/api/v3/analyst-estimates/${encodeURIComponent(
        ticker,
      )}`,
    );
    url.searchParams.set("period", config.period);
    url.searchParams.set("limit", String(config.maxPeriods));
    url.searchParams.set("apikey", apiKey);

    const response = await fetchJson<unknown>(url.toString());
    const rows = getRows(response).slice(0, config.maxPeriods);
    if (!rows.length) throw new Error("FMP returned no analyst estimate rows.");

    const estimates = rows.map((row, index) => {
      const fiscalYear = numberValue(
        row.fiscalYear,
        row.calendarYear,
        row.year,
        row.fy,
      );
      const fiscalPeriod = stringValue(
        row.period,
        row.fiscalPeriod,
        row.fiscalQuarter,
        row.quarter,
      );
      const periodEnd = stringValue(
        row.fiscalDateEnding,
        row.periodEnd,
        row.date,
      );
      const revenueAvg = numberValue(
        row.estimatedRevenueAvg,
        row.revenueAvg,
        row.revenueAverage,
      );
      const epsAvg = numberValue(
        row.estimatedEpsAvg,
        row.epsAvg,
        row.epsAverage,
      );

      return {
        id: `consensus-fmp-${ticker.toLowerCase()}-${index + 1}`,
        fiscalPeriod: [fiscalYear ? `FY${fiscalYear}` : "", fiscalPeriod]
          .filter(Boolean)
          .join(" "),
        fiscalYear,
        periodEnd,
        estimateDate: stringValue(row.date, row.estimateDate) || retrievedAt,
        revenueAvg,
        revenueLow: numberValue(
          row.estimatedRevenueLow,
          row.revenueLow,
          row.revenueEstimateLow,
        ),
        revenueHigh: numberValue(
          row.estimatedRevenueHigh,
          row.revenueHigh,
          row.revenueEstimateHigh,
        ),
        epsAvg,
        epsLow: numberValue(row.estimatedEpsLow, row.epsLow, row.epsEstimateLow),
        epsHigh: numberValue(row.estimatedEpsHigh, row.epsHigh, row.epsEstimateHigh),
        analystCount: numberValue(
          row.numberAnalystEstimatedRevenue,
          row.numberAnalystEstimatedEps,
          row.numberAnalysts,
          row.analystCount,
        ),
        currency: stringValue(row.currency) || "USD",
        sourceProvider: "fmp" as const,
        confidence: "medium" as const,
        allowedUse: getAllowedUse(revenueAvg, epsAvg),
      };
    });
    const sources: EvidenceSource[] = [
      {
        id: "consensus-fmp-analyst-estimates",
        title: "Financial Modeling Prep analyst estimates",
        url: "https://financialmodelingprep.com/developer/docs",
        domain: "financialmodelingprep.com",
        publisher: "Financial Modeling Prep",
        sourceType: "consensus",
        retrievedAt,
        confidence: "medium",
        dateStatus: "retrieved-only",
        qualityReason:
          "FMP analyst estimates were normalized into revenue / EPS consensus fields. Raw provider response is not exposed.",
        sourceRank: 1,
      },
    ];

    return {
      estimates,
      sources,
      warnings: [
        "Consensus data may be delayed or incomplete.",
        "Provider access may depend on API plan.",
        "Consensus evidence is not SEC data or market price data.",
      ],
    };
  },
};

function getRows(value: unknown): FmpEstimateRow[] {
  if (Array.isArray(value)) return value as FmpEstimateRow[];
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (Array.isArray(object.data)) return object.data as FmpEstimateRow[];
    if (Array.isArray(object.analystEstimates)) {
      return object.analystEstimates as FmpEstimateRow[];
    }
  }
  return [];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`FMP analyst estimates request failed with status ${response.status}.`);
  }
  return (await response.json()) as T;
}

async function fetchWithTimeout(url: string, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function getAllowedUse(
  revenueAvg: number | undefined,
  epsAvg: number | undefined,
): "expectation-gap" | "consensus-context" {
  if (revenueAvg !== undefined && epsAvg !== undefined) return "expectation-gap";
  return "consensus-context";
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replaceAll(",", ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
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
