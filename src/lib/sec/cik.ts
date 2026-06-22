import "server-only";

import { secFetchJson } from "./secClient";
import type { CompanyTickersResponse } from "./types";

const COMPANY_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";

let companyTickersPromise: Promise<CompanyTickersResponse> | undefined;

export function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

export function padCik(cik: string | number) {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

export async function fetchCompanyTickers() {
  companyTickersPromise ??=
    secFetchJson<CompanyTickersResponse>(COMPANY_TICKERS_URL);
  return companyTickersPromise;
}

export async function resolveTickerToCik(ticker: string) {
  const normalized = normalizeTicker(ticker);
  const tickers = await fetchCompanyTickers();
  const match = Object.values(tickers).find(
    (record) => record.ticker.toUpperCase() === normalized,
  );

  if (!match) {
    throw new Error(`CIK mapping not found for ticker ${normalized}`);
  }

  return {
    cik: padCik(match.cik_str),
    companyName: match.title,
    ticker: match.ticker.toUpperCase(),
  };
}
