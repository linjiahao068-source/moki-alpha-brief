import type { IrEvidencePack } from "@/types/evidence";

export function compactIrEvidenceForPrompt(pack?: IrEvidencePack) {
  if (!pack) return undefined;

  return {
    asOf: pack.asOf,
    ticker: pack.ticker,
    companyName: pack.companyName,
    provider: pack.provider,
    dataMode: pack.dataMode,
    sourceCount: pack.sources.length,
    warnings: (pack.warnings || []).slice(0, 5),
    irItems: pack.irItems.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      domain: item.domain,
      sourceType: item.sourceType,
      publishedAt: item.publishedAt,
      retrievedAt: item.retrievedAt,
      dateStatus: item.dateStatus,
      confidence: item.confidence,
      theme: item.theme,
      allowedUse: item.allowedUse,
      snippet: truncate(item.snippet, 350),
    })),
  };
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}
