import type {
  EvidenceSource,
  SecEvidencePack,
  SecFilingSummary,
} from "@/types/evidence";
import { getSecConfig } from "./config";
import { padCik, resolveTickerToCik } from "./cik";
import { extractFiscalFacts } from "./extractFiscalFacts";
import { mockSecProvider } from "./providers/mockSecProvider";
import { secProvider } from "./providers/secProvider";
import { getSafeSecError } from "./secClient";
import type {
  SecEvidenceResult,
  SecInput,
  SecSubmissionRecent,
} from "./types";

export async function buildSecEvidencePack(
  input: SecInput,
): Promise<SecEvidenceResult> {
  const config = getSecConfig();
  const ticker = input.ticker.trim().toUpperCase();

  if (config.provider === "mock") {
    const secEvidencePack = mockSecProvider(input);
    return {
      ok: true,
      provider: "mock",
      secEvidencePack,
      warnings: secEvidencePack.warnings || [],
    };
  }

  try {
    const resolved = await resolveTickerToCik(ticker);
    const cik = padCik(resolved.cik);
    const [submissions, companyFacts] = await Promise.all([
      secProvider.fetchSubmissions(cik),
      secProvider.fetchCompanyFacts(cik),
    ]);
    const asOf = formatCstTimestamp();
    const recentFilings = extractRecentFilings(
      cik,
      submissions.filings?.recent,
      config.maxRecentFilings,
    );
    const fiscalFacts = extractFiscalFacts(companyFacts, 18);
    const sources = buildSecSources(cik, asOf);
    const warnings: string[] = [];

    if (!recentFilings.length) {
      warnings.push("SEC submissions returned no recent 10-K / 10-Q / 8-K filings.");
    }
    if (!fiscalFacts.length) {
      warnings.push("SEC companyfacts extraction returned no fiscal facts.");
    }

    const secEvidencePack: SecEvidencePack = {
      asOf,
      ticker,
      cik,
      companyName: input.companyName?.trim() || submissions.name || resolved.companyName,
      provider: "sec",
      dataMode: "evidence-draft",
      fiscalFacts,
      recentFilings,
      sources,
      warnings,
    };

    return {
      ok: true,
      provider: "sec",
      secEvidencePack,
      warnings,
    };
  } catch (error) {
    console.error("SEC provider error", {
      provider: "sec",
      ticker,
      error: {
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : "SEC request failed",
      },
    });

    const reason = getSafeSecError(error);
    const fallback = mockSecProvider(input);
    const warnings = [
      reason,
      "SEC request failed; using mock SEC evidence.",
      ...(fallback.warnings || []),
    ];

    return {
      ok: true,
      provider: "mock",
      isFallback: true,
      secEvidencePack: {
        ...fallback,
        warnings,
      },
      error: reason,
      warnings,
    };
  }
}

function extractRecentFilings(
  cik: string,
  recent: SecSubmissionRecent | undefined,
  limit: number,
): SecFilingSummary[] {
  if (!recent?.accessionNumber?.length) return [];

  const filings: SecFilingSummary[] = [];

  for (let index = 0; index < recent.accessionNumber.length; index += 1) {
    const form = recent.form?.[index] || "";
    if (form !== "10-K" && form !== "10-Q" && form !== "8-K") continue;

    const accessionNumber = recent.accessionNumber[index];
    const primaryDocument = recent.primaryDocument?.[index];

    filings.push({
      accessionNumber,
      form,
      filingDate: recent.filingDate?.[index] || "",
      reportDate: recent.reportDate?.[index],
      primaryDocument,
      description: recent.primaryDocDescription?.[index],
      secUrl:
        accessionNumber && primaryDocument
          ? buildFilingUrl(cik, accessionNumber, primaryDocument)
          : undefined,
    });

    if (filings.length >= limit) break;
  }

  return filings;
}

function buildSecSources(cik: string, retrievedAt: string): EvidenceSource[] {
  return [
    {
      id: "sec-submissions",
      title: "SEC submissions JSON",
      url: `https://data.sec.gov/submissions/CIK${cik}.json`,
      domain: "data.sec.gov",
      publisher: "SEC EDGAR",
      sourceType: "sec",
      retrievedAt,
      confidence: "high",
      dateStatus: "retrieved-only",
      qualityReason: "Official SEC EDGAR submissions metadata.",
      sourceRank: 1,
    },
    {
      id: "sec-companyfacts",
      title: "SEC companyfacts JSON",
      url: `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      domain: "data.sec.gov",
      publisher: "SEC EDGAR",
      sourceType: "sec",
      retrievedAt,
      confidence: "high",
      dateStatus: "retrieved-only",
      qualityReason: "Official SEC EDGAR XBRL company facts.",
      sourceRank: 2,
    },
  ];
}

function buildFilingUrl(
  cik: string,
  accessionNumber: string,
  primaryDocument: string,
) {
  const cikNoLeadingZeros = String(Number(cik));
  const accessionNoDashes = accessionNumber.replaceAll("-", "");
  return `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionNoDashes}/${primaryDocument}`;
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
