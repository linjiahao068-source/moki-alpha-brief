import {
  DEEPSEEK_DEFAULT_MODEL,
  DEEPSEEK_REASONER_MODEL,
  type LlmConfig,
} from "@/lib/llm/config";
import type { DeepSeekModelMode } from "@/lib/llm/types";
import { BUY_SIDE_MEMO_V2_PROMPT_VERSION } from "./buySideMemoContentRules";

export type BuySideMemoV2GenerationMode =
  | "llm"
  | "localFallback"
  | "validationFailed"
  | "llmError";

export type V2DiagnosticStageStatus =
  | "notRun"
  | "passed"
  | "failed"
  | "notNeeded";

export type V2LlmPathDiagnostics = {
  generationMode: BuySideMemoV2GenerationMode;
  requestedProvider: LlmConfig["provider"];
  resolvedProvider: "deepseek" | "local";
  model: string;
  modelMode: DeepSeekModelMode;
  promptVersion: typeof BUY_SIDE_MEMO_V2_PROMPT_VERSION;
  promptSentToLlm: boolean;
  jsonExtraction: V2DiagnosticStageStatus;
  jsonRepair: V2DiagnosticStageStatus;
  validation: V2DiagnosticStageStatus;
  fallbackReason: string | null;
  missingEnv: string[];
};

export type ResolveV2ModelInput = {
  model?: string;
  modelMode?: DeepSeekModelMode;
};

export function resolveBuySideMemoV2Model(
  input: ResolveV2ModelInput,
  config: LlmConfig,
): {
  model: string;
  modelMode: DeepSeekModelMode;
} {
  const explicitModel = input.model?.trim();

  if (explicitModel) {
    return {
      model: explicitModel,
      modelMode:
        input.modelMode ||
        (explicitModel === DEEPSEEK_REASONER_MODEL ? "reasoner" : "chat"),
    };
  }

  if (input.modelMode === "reasoner") {
    return {
      model: DEEPSEEK_REASONER_MODEL,
      modelMode: "reasoner",
    };
  }

  if (input.modelMode === "chat") {
    return {
      model: DEEPSEEK_DEFAULT_MODEL,
      modelMode: "chat",
    };
  }

  const model = config.deepseekModel || DEEPSEEK_DEFAULT_MODEL;

  return {
    model,
    modelMode: model === DEEPSEEK_REASONER_MODEL ? "reasoner" : "chat",
  };
}

export function getBuySideMemoV2LlmReadiness(config: LlmConfig) {
  const missingEnv: string[] = [];

  if (config.provider !== "deepseek") missingEnv.push("LLM_PROVIDER=deepseek");
  if (!config.deepseekApiKey) missingEnv.push("DEEPSEEK_API_KEY");

  return {
    canUseLlm: missingEnv.length === 0,
    missingEnv,
    fallbackReason:
      missingEnv.length > 0
        ? `Real LLM path is not configured: ${missingEnv.join(", ")}.`
        : null,
  };
}

export function createV2LlmDiagnostics({
  fallbackReason = null,
  generationMode,
  missingEnv = [],
  model,
  modelMode,
  promptSentToLlm = false,
  requestedProvider,
  resolvedProvider,
}: {
  fallbackReason?: string | null;
  generationMode: BuySideMemoV2GenerationMode;
  missingEnv?: string[];
  model: string;
  modelMode: DeepSeekModelMode;
  promptSentToLlm?: boolean;
  requestedProvider: LlmConfig["provider"];
  resolvedProvider: "deepseek" | "local";
}): V2LlmPathDiagnostics {
  return {
    generationMode,
    requestedProvider,
    resolvedProvider,
    model,
    modelMode,
    promptVersion: BUY_SIDE_MEMO_V2_PROMPT_VERSION,
    promptSentToLlm,
    jsonExtraction: "notRun",
    jsonRepair: "notRun",
    validation: "notRun",
    fallbackReason,
    missingEnv,
  };
}

export function withDiagnosticUpdate(
  diagnostics: V2LlmPathDiagnostics,
  updates: Partial<V2LlmPathDiagnostics>,
): V2LlmPathDiagnostics {
  return {
    ...diagnostics,
    ...updates,
  };
}
