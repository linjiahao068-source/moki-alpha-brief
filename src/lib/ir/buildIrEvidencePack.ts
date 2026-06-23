import type { EvidenceQuery, IrEvidencePack } from "@/types/evidence";
import {
  dedupeSearchResults,
  filterAndRankSearchResults,
} from "@/lib/search/sourceQuality";
import type { SearchResult } from "@/lib/search/types";
import { getIrConfig, getIrConfigIssue } from "./config";
import {
  irItemToEvidenceSource,
  searchResultToIrItem,
} from "./classifyIrSource";
import { mockIrProvider } from "./providers/mockIrProvider";
import { createSearchIrProvider } from "./providers/searchIrProvider";
import type { IrEvidenceResult, IrInput, IrProvider } from "./types";

export async function buildIrEvidencePack(
  input: IrInput,
): Promise<IrEvidenceResult> {
  const config = getIrConfig();
  const ticker = input.ticker.trim().toUpperCase();
  const querySet = buildIrQueries(ticker, input.companyName);
  const configIssue = getIrConfigIssue(config);

  if (config.provider === "mock" || configIssue) {
    const result = await collectIrEvidence({
      input,
      provider: mockIrProvider,
      providerName: "mock",
      querySet,
      warnings: [
        configIssue || "Using mock IR evidence; no live IR search was run.",
      ],
      maxResults: config.maxResults,
    });

    return {
      ...result,
      isFallback: Boolean(configIssue),
      error: configIssue,
    };
  }

  try {
    return await collectIrEvidence({
      input,
      provider: createSearchIrProvider(config),
      providerName: "search",
      querySet,
      warnings: [],
      maxResults: config.maxResults,
    });
  } catch (error) {
    console.error("IR evidence provider error", {
      provider: "search",
      hasTavilyApiKey: Boolean(process.env.TAVILY_API_KEY),
      error: {
        name: getErrorField(error, "name") || "Error",
        message: getErrorField(error, "message") || "IR search request failed",
      },
    });

    const reason = getSafeIrError(error);
    const fallback = await collectIrEvidence({
      input,
      provider: mockIrProvider,
      providerName: "mock",
      querySet,
      warnings: [reason, "IR search failed; using mock IR evidence."],
      maxResults: config.maxResults,
    });

    return {
      ...fallback,
      isFallback: true,
      error: reason,
    };
  }
}

function buildIrQueries(ticker: string, companyName?: string): EvidenceQuery[] {
  const name = companyName?.trim() || ticker;

  return [
    {
      id: "ir-quarterly-results",
      query: `${name} investor relations quarterly results earnings release`,
      purpose: "company-ir",
    },
    {
      id: "ir-guidance",
      query: `${name} earnings release guidance investor relations`,
      purpose: "company-ir",
    },
    {
      id: "ir-presentation-letter",
      query: `${name} investor presentation shareholder letter quarterly results`,
      purpose: "company-ir",
    },
    {
      id: "ir-press-release",
      query: `${name} official press release earnings guidance`,
      purpose: "company-ir",
    },
  ];
}

async function collectIrEvidence({
  input,
  provider,
  providerName,
  querySet,
  warnings,
  maxResults,
}: {
  input: IrInput;
  provider: IrProvider;
  providerName: "mock" | "search";
  querySet: EvidenceQuery[];
  warnings: string[];
  maxResults: number;
}): Promise<IrEvidenceResult> {
  const ticker = input.ticker.trim().toUpperCase();
  const retrievedAt = formatCstTimestamp();
  const results: SearchResult[] = [];

  for (const query of querySet) {
    const queryResults = await provider.search(query.query, {
      ...input,
      maxResults: Math.min(input.maxResults || maxResults, 5),
    });

    for (const result of queryResults.slice(0, 5)) {
      results.push(result);
    }
  }

  const deduped = dedupeSearchResults(results);
  const selected = filterAndRankSearchResults(
    deduped,
    Math.min(input.maxResults || maxResults, 5),
  );
  const irItems = selected.map((result, index) =>
    searchResultToIrItem({
      id: `ir-${index + 1}`,
      result,
      retrievedAt,
    }),
  );
  const sources = irItems.map(irItemToEvidenceSource);
  const evidenceWarnings = [...warnings];

  if (providerName === "mock") {
    evidenceWarnings.push(
      "Mock IR Evidence: items are simulated and not live company IR search.",
    );
  }
  if (irItems.length < 2) {
    evidenceWarnings.push("IrEvidencePack has fewer than 2 IR source items.");
  }
  if (
    irItems.length &&
    irItems.every((item) => item.dateStatus === "retrieved-only" || !item.publishedAt)
  ) {
    evidenceWarnings.push(
      "All IR evidence items are retrieved-only because published dates were unavailable.",
    );
  }
  if (deduped.length < results.length) {
    evidenceWarnings.push("Duplicate IR search results were removed.");
  }
  if (irItems.length && irItems.every((item) => item.confidence === "low")) {
    evidenceWarnings.push("Only low-confidence IR sources found.");
  }
  evidenceWarnings.push(
    "IR Evidence Draft stores search snippets and metadata only; it does not download PDFs or parse transcripts.",
  );

  const irEvidencePack: IrEvidencePack = {
    asOf: retrievedAt,
    ticker,
    companyName: input.companyName?.trim(),
    provider: providerName,
    dataMode: "evidence-draft",
    irItems,
    sources,
    warnings: Array.from(new Set(evidenceWarnings)),
  };

  return {
    ok: true,
    provider: providerName,
    irEvidencePack,
    warnings: irEvidencePack.warnings,
  };
}

function getSafeIrError(error: unknown) {
  const message = getErrorField(error, "message");
  if (typeof message === "string" && message.includes("TAVILY_API_KEY")) {
    return "Missing TAVILY_API_KEY for IR_PROVIDER=search";
  }
  if (typeof message === "string" && message.includes("status")) {
    return message;
  }
  return "IR search provider request failed";
}

function getErrorField(error: unknown, field: string) {
  if (!error || typeof error !== "object") return undefined;
  return (error as Record<string, unknown>)[field];
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
