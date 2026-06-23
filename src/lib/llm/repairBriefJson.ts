import "server-only";

import OpenAI from "openai";
import { briefJsonSchemaText } from "@/lib/briefs/briefJsonSchema";
import { compactResearchEvidenceForPrompt } from "@/lib/evidence/compactResearchEvidenceForPrompt";
import type { BriefDocument } from "@/types/brief";
import type { GenerateBriefInput } from "./types";
import { parseJsonObject } from "./extractJson";

type RepairBriefJsonInput = {
  rawText: string;
  input: GenerateBriefInput;
  apiKey: string;
  baseURL: string;
};

const REPAIR_MAX_TOKENS = 10000;

export async function repairBriefJson({
  rawText,
  input,
  apiKey,
  baseURL,
}: RepairBriefJsonInput): Promise<BriefDocument> {
  const client = new OpenAI({ apiKey, baseURL });
  const context = input.researchEvidenceContext;
  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: [
          "You repair malformed JSON into one valid BriefDocument JSON object.",
          "You must output exactly one valid JSON object parseable by JSON.parse.",
          "Do not output Markdown, code fences, explanations, comments, or prose.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Repair the following model output into valid BriefDocument JSON.",
          'Keep metadata.dataMode as "evidence-draft" when evidence exists.',
          context
            ? `Keep evidenceLevel as ${context.evidenceLevel}.`
            : "No evidence context exists.",
          "If evidenceLevel is search-and-sec, sourceNote must say Search + SEC Evidence Draft, include SEC CIK, recent filing count, fiscal fact count, search source count, and say no real-time price, no consensus estimates, no company IR narrative parsing, and no database save.",
          "Never use verified-real-data.",
          "Never claim real-time price or consensus estimates are connected.",
          "The repaired JSON must fit this schema:",
          briefJsonSchemaText,
          context
            ? `Compact ResearchEvidenceContext:\n${JSON.stringify(
                compactResearchEvidenceForPrompt(context),
                null,
                2,
              )}`
            : "",
          "Malformed output to repair:",
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

  return parseJsonObject<BriefDocument>(repairedText);
}
