import type { SecEvidencePack } from "@/types/evidence";
import { padCik } from "../cik";
import type { SecInput } from "../types";

const MOCK_CIKS: Record<string, { cik: string; companyName: string }> = {
  NVDA: { cik: "1045810", companyName: "NVIDIA Corporation" },
  TSLA: { cik: "1318605", companyName: "Tesla, Inc." },
  MSFT: { cik: "789019", companyName: "Microsoft Corporation" },
  ORCL: { cik: "1341439", companyName: "Oracle Corporation" },
  SNOW: { cik: "1640147", companyName: "Snowflake Inc." },
};

export function mockSecProvider(input: SecInput): SecEvidencePack {
  const ticker = input.ticker.trim().toUpperCase();
  const mock = MOCK_CIKS[ticker] || {
    cik: "0000000",
    companyName: input.companyName || `${ticker} Demo Company`,
  };
  const cik = padCik(mock.cik);
  const companyName = input.companyName || mock.companyName;
  const asOf = formatCstTimestamp();

  return {
    asOf,
    ticker,
    cik,
    companyName,
    provider: "mock",
    dataMode: "evidence-draft",
    recentFilings: [
      {
        accessionNumber: "0000000000-26-000001",
        form: "10-Q",
        filingDate: "2026-05-30",
        reportDate: "2026-04-30",
        primaryDocument: "mock-10q.htm",
        description: "Mock SEC filing summary for UI and prompt QA.",
        secUrl: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/mock/mock-10q.htm`,
      },
      {
        accessionNumber: "0000000000-26-000002",
        form: "8-K",
        filingDate: "2026-05-22",
        reportDate: "2026-05-22",
        primaryDocument: "mock-8k.htm",
        description: "Mock SEC 8-K summary; not a real filing.",
        secUrl: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/mock/mock-8k.htm`,
      },
    ],
    fiscalFacts: [
      {
        concept: "RevenueFromContractWithCustomerExcludingAssessedTax",
        label: "Mock Revenue",
        value: 100000000,
        unit: "USD",
        fy: 2026,
        fp: "Q1",
        form: "10-Q",
        filed: "2026-05-30",
        periodEnd: "2026-04-30",
        confidence: "high",
        source: "sec-companyfacts",
      },
      {
        concept: "NetIncomeLoss",
        label: "Mock Net Income",
        value: 18000000,
        unit: "USD",
        fy: 2026,
        fp: "Q1",
        form: "10-Q",
        filed: "2026-05-30",
        periodEnd: "2026-04-30",
        confidence: "high",
        source: "sec-companyfacts",
      },
      {
        concept: "Assets",
        label: "Mock Assets",
        value: 250000000,
        unit: "USD",
        fy: 2026,
        fp: "Q1",
        form: "10-Q",
        filed: "2026-05-30",
        periodEnd: "2026-04-30",
        confidence: "high",
        source: "sec-companyfacts",
      },
    ],
    sources: [
      {
        id: "sec-mock-submissions",
        title: "Mock SEC submissions metadata",
        url: `https://data.sec.gov/submissions/CIK${cik}.json`,
        domain: "data.sec.gov",
        publisher: "SEC EDGAR mock",
        sourceType: "sec",
        retrievedAt: asOf,
        confidence: "high",
        dateStatus: "retrieved-only",
        qualityReason: "Mock SEC evidence; structure only, not real SEC data.",
        sourceRank: 1,
      },
      {
        id: "sec-mock-companyfacts",
        title: "Mock SEC companyfacts JSON",
        url: `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
        domain: "data.sec.gov",
        publisher: "SEC EDGAR mock",
        sourceType: "sec",
        retrievedAt: asOf,
        confidence: "high",
        dateStatus: "retrieved-only",
        qualityReason: "Mock SEC companyfacts; values are simulated.",
        sourceRank: 2,
      },
    ],
    warnings: [
      "Mock SEC Evidence: values and filing summaries are simulated for development.",
    ],
  };
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
