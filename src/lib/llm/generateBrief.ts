import { assessBriefQuality } from "@/lib/briefs/assessBriefQuality";
import { buildSearchEvidencePack } from "@/lib/search/buildSearchEvidencePack";
import { buildSecEvidencePack } from "@/lib/sec/buildSecEvidencePack";
import { getDeepSeekConfigIssue, getLlmConfig } from "./config";
import { deepseekProvider } from "./providers/deepseekProvider";
import { mockProvider } from "./providers/mockProvider";
import type { GenerateBriefInput, GenerateBriefResult } from "./types";

export async function generateBrief(
  input: GenerateBriefInput,
): Promise<GenerateBriefResult> {
  const config = getLlmConfig();
  const { input: preparedInput, searchMeta } = await prepareEvidenceInput(input);

  if (config.provider === "mock") {
    return withQualityWarnings(await mockProvider(preparedInput), searchMeta);
  }

  const configIssue = getDeepSeekConfigIssue(config);

  if (configIssue) {
    return fallbackToMock(preparedInput, configIssue, [], searchMeta);
  }

  const deepseekResult = await deepseekProvider(preparedInput, config);

  if (deepseekResult.ok) {
    return withQualityWarnings(deepseekResult, searchMeta);
  }

  return fallbackToMock(
    preparedInput,
    deepseekResult.error ||
      "DeepSeek provider failed; returned mock fallback.",
    deepseekResult.issues,
    searchMeta,
  );
}

async function prepareEvidenceInput(
  input: GenerateBriefInput,
): Promise<{
  input: GenerateBriefInput;
  searchMeta: Partial<GenerateBriefResult>;
}> {
  if ((!input.useSearch || input.evidencePack) && (!input.useSec || input.secEvidencePack)) {
    return { input, searchMeta: {} };
  }

  const [searchResult, secResult] = await Promise.all([
    input.useSearch && !input.evidencePack
      ? buildSearchEvidencePack({
          ticker: input.ticker,
          companyName: input.companyName,
          maxResults: 5,
        })
      : Promise.resolve(undefined),
    input.useSec && !input.secEvidencePack
      ? buildSecEvidencePack({
          ticker: input.ticker,
          companyName: input.companyName,
        })
      : Promise.resolve(undefined),
  ]);

  return {
    input: {
      ...input,
      evidencePack: input.evidencePack || searchResult?.evidencePack,
      secEvidencePack: input.secEvidencePack || secResult?.secEvidencePack,
    },
    searchMeta: {
      ...(searchResult
        ? {
            searchProvider: searchResult.provider,
            searchIsFallback: searchResult.isFallback,
            searchWarnings:
              searchResult.warnings || [searchResult.error || ""].filter(Boolean),
          }
        : {}),
      ...(secResult
        ? {
            secProvider: secResult.provider,
            secIsFallback: secResult.isFallback,
            secWarnings: secResult.warnings || [secResult.error || ""].filter(Boolean),
            cik: secResult.secEvidencePack?.cik,
          }
        : {}),
    },
  };
}

async function fallbackToMock(
  input: GenerateBriefInput,
  reason: string,
  providerIssues: string[] = [],
  searchMeta: Partial<GenerateBriefResult> = {},
): Promise<GenerateBriefResult> {
  const fallback = await mockProvider(input);

  return withQualityWarnings(
    {
      ...fallback,
      isFallback: true,
      error: reason,
      issues: [reason, ...providerIssues, ...(fallback.issues ?? [])].filter(
        Boolean,
      ),
    },
    searchMeta,
  );
}

function withQualityWarnings(
  result: GenerateBriefResult,
  searchMeta: Partial<GenerateBriefResult> = {},
): GenerateBriefResult {
  return {
    ...result,
    ...searchMeta,
    qualityWarnings: result.brief
      ? assessBriefQuality(result.brief)
      : (result.qualityWarnings ?? []),
  };
}
