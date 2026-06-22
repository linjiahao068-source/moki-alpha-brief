import { assessBriefQuality } from "@/lib/briefs/assessBriefQuality";
import { buildSearchEvidencePack } from "@/lib/search/buildSearchEvidencePack";
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
  if (!input.useSearch || input.evidencePack) {
    return { input, searchMeta: {} };
  }

  const searchResult = await buildSearchEvidencePack({
    ticker: input.ticker,
    companyName: input.companyName,
    maxResults: 5,
  });

  if (!searchResult.evidencePack) {
    return {
      input,
      searchMeta: {
        searchProvider: searchResult.provider,
        searchIsFallback: searchResult.isFallback,
        searchWarnings: searchResult.warnings || [searchResult.error || ""],
      },
    };
  }

  return {
    input: {
      ...input,
      evidencePack: searchResult.evidencePack,
    },
    searchMeta: {
      searchProvider: searchResult.provider,
      searchIsFallback: searchResult.isFallback,
      searchWarnings: searchResult.warnings || [],
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
