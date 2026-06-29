import type {
  BuySideMemoV2ValuationFramework,
  BuySideMemoV2ValuationScenario,
  V2ValuationDataSufficiency,
} from "./buySideMemoSchema";

export const V2_VALUATION_PROFESSIONAL_PROMPTS: Record<
  Exclude<V2ValuationDataSufficiency, "sufficient">,
  string
> = {
  partial:
    "当前估值证据仍不完整。可以讨论方法、方向性判断和缺失数据，但不要给出目标价、隐含回报或概率加权目标价。",
  insufficient:
    "当前证据不足以形成专业目标价。请先补齐可比公司、历史估值、盈利预测、资本结构、市场价格与人工复核，再输出任何目标价或隐含回报。",
};

export type V2ValuationSafetyDecision = {
  dataSufficiency: V2ValuationDataSufficiency;
  allowScenarioTargets: boolean;
  allowProbabilityWeightedTarget: boolean;
  professionalPrompt: string | null;
  issues: string[];
};

export function getValuationSafetyDecision(
  valuation: Pick<
    BuySideMemoV2ValuationFramework,
    | "dataSufficiency"
    | "scenarios"
    | "probabilityWeightedTargetPrice"
    | "probabilityWeightedImpliedReturnPercent"
    | "professionalPrompt"
  >,
): V2ValuationSafetyDecision {
  const dataSufficiency = valuation.dataSufficiency;
  const issues: string[] = [];

  if (dataSufficiency === "sufficient") {
    return {
      dataSufficiency,
      allowScenarioTargets: true,
      allowProbabilityWeightedTarget: true,
      professionalPrompt: null,
      issues,
    };
  }

  const professionalPrompt = V2_VALUATION_PROFESSIONAL_PROMPTS[dataSufficiency];

  if (hasScenarioTargetOrReturn(valuation.scenarios)) {
    issues.push(
      `${dataSufficiency} valuation cannot include Bear/Base/Bull targetPrice or impliedReturnPercent.`,
    );
  }

  if (valuation.probabilityWeightedTargetPrice !== null) {
    issues.push(
      `${dataSufficiency} valuation requires probabilityWeightedTargetPrice to be null.`,
    );
  }

  if (valuation.probabilityWeightedImpliedReturnPercent !== null) {
    issues.push(
      `${dataSufficiency} valuation requires probabilityWeightedImpliedReturnPercent to be null.`,
    );
  }

  if (dataSufficiency === "insufficient" && !valuation.professionalPrompt?.trim()) {
    issues.push("insufficient valuation requires a professionalPrompt.");
  }

  return {
    dataSufficiency,
    allowScenarioTargets: false,
    allowProbabilityWeightedTarget: false,
    professionalPrompt,
    issues,
  };
}

export function sanitizeValuationForDataSufficiency(
  valuation: BuySideMemoV2ValuationFramework,
): BuySideMemoV2ValuationFramework {
  const decision = getValuationSafetyDecision(valuation);

  if (decision.allowScenarioTargets && decision.allowProbabilityWeightedTarget) {
    return valuation;
  }

  return {
    ...valuation,
    scenarios: valuation.scenarios?.map(nullScenarioTarget) || null,
    probabilityWeightedTargetPrice: null,
    probabilityWeightedImpliedReturnPercent: null,
    professionalPrompt: valuation.professionalPrompt || decision.professionalPrompt,
  };
}

function hasScenarioTargetOrReturn(
  scenarios: BuySideMemoV2ValuationScenario[] | null,
) {
  return Boolean(
    scenarios?.some(
      (scenario) =>
        scenario.targetPrice !== null || scenario.impliedReturnPercent !== null,
    ),
  );
}

function nullScenarioTarget(
  scenario: BuySideMemoV2ValuationScenario,
): BuySideMemoV2ValuationScenario {
  return {
    ...scenario,
    targetPrice: null,
    impliedReturnPercent: null,
  };
}
