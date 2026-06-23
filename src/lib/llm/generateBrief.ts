import { assessBriefQuality } from "@/lib/briefs/assessBriefQuality";
import { buildResearchEvidenceContext } from "@/lib/evidence/buildResearchEvidenceContext";
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
  if (
    (!input.useSearch || input.evidencePack) &&
    (!input.useSec || input.secEvidencePack)
  ) {
    const researchEvidenceContext =
      input.researchEvidenceContext ||
      buildResearchEvidenceContext({
        ticker: input.ticker,
        companyName: input.companyName,
        searchEvidencePack: input.evidencePack,
        secEvidencePack: input.secEvidencePack,
      });

    return {
      input: {
        ...input,
        researchEvidenceContext,
      },
      searchMeta: buildEvidenceMeta(researchEvidenceContext),
    };
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

  const evidencePack = input.evidencePack || searchResult?.evidencePack;
  const secEvidencePack = input.secEvidencePack || secResult?.secEvidencePack;
  const researchEvidenceContext =
    input.researchEvidenceContext ||
    buildResearchEvidenceContext({
      ticker: input.ticker,
      companyName: input.companyName,
      searchEvidencePack: evidencePack,
      secEvidencePack,
    });

  return {
    input: {
      ...input,
      evidencePack,
      secEvidencePack,
      researchEvidenceContext,
    },
    searchMeta: {
      ...buildEvidenceMeta(researchEvidenceContext),
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

function buildEvidenceMeta(
  researchEvidenceContext: GenerateBriefInput["researchEvidenceContext"],
): Partial<GenerateBriefResult> {
  if (!researchEvidenceContext) return {};

  return {
    researchEvidenceContext,
    evidenceLevel: researchEvidenceContext.evidenceLevel,
    coverage: researchEvidenceContext.coverage,
    evidenceWarnings: researchEvidenceContext.warnings || [],
  };
}

async function fallbackToMock(
  input: GenerateBriefInput,
  reason: string,
  providerIssues: string[] = [],
  searchMeta: Partial<GenerateBriefResult> = {},
): Promise<GenerateBriefResult> {
  void providerIssues;
  const fallback = await mockProvider(input);

  return withQualityWarnings(
    {
      ...fallback,
      isFallback: true,
      error: reason,
      issues: fallback.issues ?? [],
      jsonRepairStatus: reason.toLowerCase().includes("repair failed")
        ? "failed"
        : "not-needed",
      jsonRepairSucceeded: false,
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
    isFallback: result.isFallback || false,
    qualityWarnings: result.brief
      ? [
          ...assessBriefQuality(result.brief),
          ...(result.jsonRepairSucceeded
            ? ["DeepSeek output was repaired into valid JSON."]
            : []),
        ]
      : (result.qualityWarnings ?? []),
    jsonRepairStatus: result.jsonRepairStatus || "not-needed",
    jsonRepairSucceeded: result.jsonRepairSucceeded || false,
  };
}
