import type {
  DeepSeekModelMode,
  GenerateBriefInput,
  GenerateBriefProvider,
} from "./types";

export const DEEPSEEK_DEFAULT_BASE_URL = "https://api.deepseek.com";
export const DEEPSEEK_DEFAULT_MODEL = "deepseek-chat";
export const DEEPSEEK_REASONER_MODEL = "deepseek-reasoner";

export type LlmConfig = {
  provider: GenerateBriefProvider;
  deepseekApiKey?: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
};

export function getLlmConfig(): LlmConfig {
  const requestedProvider =
    process.env.LLM_PROVIDER === "deepseek" ? "deepseek" : "mock";

  return {
    provider: requestedProvider,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY?.trim(),
    deepseekBaseUrl:
      process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_DEFAULT_BASE_URL,
    deepseekModel:
      process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_DEFAULT_MODEL,
  };
}

export function getDeepSeekConfigIssue(
  config = getLlmConfig(),
): string | undefined {
  if (config.provider !== "deepseek") return undefined;
  if (!config.deepseekApiKey) return "Missing DEEPSEEK_API_KEY";
  return undefined;
}

export function resolveDeepSeekModel(
  input: GenerateBriefInput,
  config = getLlmConfig(),
): {
  model: string;
  modelMode: DeepSeekModelMode;
} {
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

  const model = input.model?.trim() || config.deepseekModel;

  return {
    model,
    modelMode: model === DEEPSEEK_REASONER_MODEL ? "reasoner" : "chat",
  };
}
