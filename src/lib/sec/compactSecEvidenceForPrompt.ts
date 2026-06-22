import type { SecEvidencePack } from "@/types/evidence";

export function compactSecEvidenceForPrompt(
  secEvidencePack: SecEvidencePack,
) {
  return {
    asOf: secEvidencePack.asOf,
    ticker: secEvidencePack.ticker,
    cik: secEvidencePack.cik,
    companyName: secEvidencePack.companyName,
    provider: secEvidencePack.provider,
    dataMode: secEvidencePack.dataMode,
    recentFilingCount: secEvidencePack.recentFilings.length,
    fiscalFactCount: secEvidencePack.fiscalFacts.length,
    warnings: secEvidencePack.warnings || [],
    recentFilings: secEvidencePack.recentFilings.slice(0, 8).map((filing) => ({
      accessionNumber: filing.accessionNumber,
      form: filing.form,
      filingDate: filing.filingDate,
      reportDate: filing.reportDate,
      description: filing.description,
      secUrl: filing.secUrl,
    })),
    fiscalFacts: secEvidencePack.fiscalFacts.slice(0, 18).map((fact) => ({
      concept: fact.concept,
      label: fact.label,
      value: fact.value,
      unit: fact.unit,
      fy: fact.fy,
      fp: fact.fp,
      form: fact.form,
      filed: fact.filed,
      frame: fact.frame,
      periodEnd: fact.periodEnd,
      source: fact.source,
    })),
  };
}
