import "server-only";

import OpenAI from "openai";
import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/llm/config";
import { parseJsonObject } from "@/lib/llm/extractJson";
import { buildBuySideMemoContentContract } from "./buySideMemoContentRules";
import type {
  BuySideMemoV2,
  BuySideMemoV2ResearchContext,
  V2ValuationDataSufficiency,
} from "./buySideMemoSchema";

type RepairBuySideMemoV2JsonInput = {
  apiKey: string;
  baseURL: string;
  companyName?: string | null;
  language?: "zh-CN" | "en";
  rawText: string;
  researchContext: BuySideMemoV2ResearchContext;
  ticker: string;
  valuationDataSufficiency: V2ValuationDataSufficiency;
};

const REPAIR_MAX_TOKENS = 10000;

export async function repairBuySideMemoV2Json({
  apiKey,
  baseURL,
  companyName,
  language = "zh-CN",
  rawText,
  researchContext,
  ticker,
  valuationDataSufficiency,
}: RepairBuySideMemoV2JsonInput): Promise<Partial<BuySideMemoV2>> {
  const client = new OpenAI({ apiKey, baseURL });
  const company = companyName || researchContext.companyName || ticker;
  const completion = await client.chat.completions.create({
    model: DEEPSEEK_DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "Repair malformed output into one valid BuySideMemoV2 JSON object.",
          "Return exactly one JSON object parseable by JSON.parse.",
          "Do not output Markdown, code fences, comments, or explanations.",
          "Do not add facts that are not present in the supplied research context.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Repair the memo for ${ticker} (${company}).`,
          `Language: ${
            language === "en"
              ? "English"
              : "Chinese with concise English market terms where useful"
          }.`,
          "Required schemaVersion: buy-side-memo-v2.",
          "Set researchContext to null; the server attaches canonical context.",
          buildBuySideMemoContentContract(valuationDataSufficiency),
          "Use these exact labels: 投资结论, 公司画像, 基本面分析, 估值框架, 催化风险, 监控仪表盘, 底部：数据来源.",
          "Compact V2 research context:",
          JSON.stringify(
            {
              ticker: researchContext.ticker,
              companyName: researchContext.companyName,
              evidenceLevel: researchContext.evidenceLevel,
              sourceStatus: researchContext.sourceStatus,
              coverage: researchContext.coverage,
              factsBySection: {
                investmentConclusion:
                  researchContext.factsBySection.investmentConclusion.slice(
                    0,
                    8,
                  ),
                companyProfile:
                  researchContext.factsBySection.companyProfile.slice(0, 8),
                fundamentalAnalysis:
                  researchContext.factsBySection.fundamentalAnalysis.slice(
                    0,
                    10,
                  ),
                valuationFramework:
                  researchContext.factsBySection.valuationFramework.slice(
                    0,
                    10,
                  ),
                catalystRisk:
                  researchContext.factsBySection.catalystRisk.slice(0, 8),
                monitoringDashboard:
                  researchContext.factsBySection.monitoringDashboard.slice(
                    0,
                    8,
                  ),
              },
            },
            null,
            2,
          ),
          "Malformed model output:",
          rawText.slice(0, 50000),
        ].join("\n\n"),
      },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
    max_tokens: REPAIR_MAX_TOKENS,
  });

  const repairedText = completion.choices[0]?.message?.content;
  if (!repairedText) {
    throw new SyntaxError("JSON repair returned an empty response.");
  }

  return parseJsonObject<Partial<BuySideMemoV2>>(repairedText);
}
