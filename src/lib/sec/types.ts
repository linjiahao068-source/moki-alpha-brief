import type { SecEvidencePack } from "@/types/evidence";

export type SecProviderName = "mock" | "sec";

export type SecInput = {
  ticker: string;
  companyName?: string;
};

export type SecConfig = {
  provider: SecProviderName;
  userAgent: string;
  maxRecentFilings: number;
};

export type SecEvidenceResult = {
  ok: boolean;
  provider: SecProviderName;
  isFallback?: boolean;
  secEvidencePack?: SecEvidencePack;
  error?: string;
  warnings?: string[];
};

export type CompanyTickerRecord = {
  cik_str: number;
  ticker: string;
  title: string;
};

export type CompanyTickersResponse = Record<string, CompanyTickerRecord>;

export type SecSubmissionRecent = {
  accessionNumber?: string[];
  form?: string[];
  filingDate?: string[];
  reportDate?: string[];
  primaryDocument?: string[];
  primaryDocDescription?: string[];
};

export type SecSubmissionsResponse = {
  cik: string;
  name?: string;
  tickers?: string[];
  filings?: {
    recent?: SecSubmissionRecent;
  };
};

export type SecCompanyFactUnit = {
  val?: number;
  accn?: string;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  frame?: string;
  end?: string;
};

export type SecCompanyFactConcept = {
  label?: string;
  description?: string;
  units?: Record<string, SecCompanyFactUnit[]>;
};

export type SecCompanyFactsResponse = {
  cik: number;
  entityName?: string;
  facts?: {
    "us-gaap"?: Record<string, SecCompanyFactConcept>;
  };
};

export type SecProvider = {
  fetchSubmissions(cik: string): Promise<SecSubmissionsResponse>;
  fetchCompanyFacts(cik: string): Promise<SecCompanyFactsResponse>;
};
