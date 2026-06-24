import "server-only";

import type { EvidenceSource } from "@/types/evidence";
import { normalizeConsensusTicker } from "../normalizeConsensusTicker";
import type { ConsensusConfig, ConsensusProvider } from "../types";

type FinnhubEstimateRow = Record<string, unknown>;

export const finnhubConsensusProvider: ConsensusProvider = {
  async fetchConsensusEvidence(input, config) {
    const apiKey = config.finnhubApiKey;
    if (!apiKey) throw new Error("Missing FINNHUB_API_KEY");

    const ticker = normalizeConsensusTicker(input.ticker);
    const retrievedAt = formatCstTimestamp();
    const [epsResult, revenueResult] = await Promise.allSettled([
      fetchFinnhubRows("eps", ticker, config),
      fetchFinnhubRows("revenue", ticker, config),
    ]);
    const epsRows = epsResult.status === "fulfilled" ? epsResult.value : [];
    const revenueRows =
      revenueResult.status === "fulfilled" ? revenueResult.value : [];
    const rows = mergeRowsByPeriod(epsRows, revenueRows).slice(0, config.maxPeriods);

    if (!rows.length) throw new Error("Finnhub returned no EPS or revenue estimate rows.");

    const estimates = rows.map((row, index) => {
      const revenueAvg = numberValue(row.revenueAvg, row.revenueAverage);
      const epsAvg = numberValue(row.epsAvg, row.epsAverage);

      return {
        id: `consensus-finnhub-${ticker.toLowerCase()}-${index + 1}`,
        fiscalPeriod: stringValue(row.period),
        fiscalYear: getFiscalYear(stringValue(row.period)),
        periodEnd: stringValue(row.period),
        estimateDate: retrievedAt,
        revenueAvg,
        revenueLow: numberValue(row.revenueLow),
        revenueHigh: numberValue(row.revenueHigh),
        epsAvg,
        epsLow: numberValue(row.epsLow),
        epsHigh: numberValue(row.epsHigh),
        analystCount: numberValue(
          row.numberAnalysts,
          row.analystCount,
          row.numberAnalyst,
        ),
        currency: stringValue(row.currency) || "USD",
        sourceProvider: "finnhub" as const,
        confidence: "medium" as const,
        allowedUse:
          revenueAvg !== undefined && epsAvg !== undefined
            ? ("expectation-gap" as const)
            : ("consensus-context" as const),
      };
    });
    const warnings = [
      ...(epsResult.status === "rejected"
        ? [`Finnhub EPS estimates request failed: ${getErrorMessage(epsResult.reason)}.`]
        : []),
      ...(revenueResult.status === "rejected"
        ? [
            `Finnhub revenue estimates request failed: ${getErrorMessage(
              revenueResult.reason,
            )}.`,
          ]
        : []),
      "Consensus data may be delayed or incomplete.",
      "Provider access may depend on API plan.",
      "Consensus evidence is not SEC data or market price data.",
    ];
    const sources: EvidenceSource[] = [
      {
        id: "consensus-finnhub-estimates",
        title: "Finnhub company EPS / revenue estimates",
        url: "https://finnhub.io/docs/api/company-eps-estimates",
        domain: "finnhub.io",
        publisher: "Finnhub",
        sourceType: "consensus",
        retrievedAt,
        confidence: "medium",
        dateStatus: "retrieved-only",
        qualityReason:
          "Finnhub estimate endpoints were normalized into revenue / EPS consensus fields. Raw provider response is not exposed.",
        sourceRank: 1,
      },
    ];

    return {
      estimates,
      sources,
      warnings: Array.from(new Set(warnings)),
    };
  },
};

async function fetchFinnhubRows(
  kind: "eps" | "revenue",
  ticker: string,
  config: ConsensusConfig,
) {
  const endpoint =
    kind === "eps"
      ? "https://finnhub.io/api/v1/stock/eps-estimate"
      : "https://finnhub.io/api/v1/stock/revenue-estimate";
  const url = new URL(endpoint);
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("freq", config.period === "annual" ? "annual" : "quarterly");
  url.searchParams.set("token", config.finnhubApiKey || "");

  const response = await fetchJson<unknown>(url.toString());
  return getRows(response);
}

function getRows(value: unknown): FinnhubEstimateRow[] {
  if (Array.isArray(value)) return value as FinnhubEstimateRow[];
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (Array.isArray(object.data)) return object.data as FinnhubEstimateRow[];
  }
  return [];
}

function mergeRowsByPeriod(
  epsRows: FinnhubEstimateRow[],
  revenueRows: FinnhubEstimateRow[],
) {
  const byPeriod = new Map<string, FinnhubEstimateRow>();

  for (const row of revenueRows) {
    const period = stringValue(row.period) || `revenue-${byPeriod.size + 1}`;
    byPeriod.set(period, { ...row });
  }

  for (const row of epsRows) {
    const period = stringValue(row.period) || `eps-${byPeriod.size + 1}`;
    byPeriod.set(period, {
      ...(byPeriod.get(period) || {}),
      ...row,
      numberAnalysts:
        numberValue(row.numberAnalysts) ??
        numberValue(byPeriod.get(period)?.numberAnalysts),
    });
  }

  return Array.from(byPeriod.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, row]) => row);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Finnhub estimate request failed with status ${response.status}.`);
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

function getFiscalYear(period?: string) {
  if (!period) return undefined;
  const match = period.match(/^(\d{4})/);
  if (!match) return undefined;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : undefined;
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown Finnhub error";
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
