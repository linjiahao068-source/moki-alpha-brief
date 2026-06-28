import {
  BUY_SIDE_MEMO_V2_SCHEMA_VERSION,
  BUY_SIDE_MEMO_V2_SECTION_LABELS,
  BUY_SIDE_MEMO_V2_SECTION_ORDER,
  V2_UNAVAILABLE,
} from "./buySideMemoSchema";
import type {
  BuySideMemoV2,
  BuySideMemoV2SectionKey,
  BuySideMemoV2ValuationScenario,
  V2ModuleAvailability,
  V2SourceKind,
  V2SourceStatusValue,
  V2ValuationDataSufficiency,
} from "./buySideMemoSchema";
import {
  getValuationSafetyDecision,
  type V2ValuationSafetyDecision,
} from "./valuationSafety";

export type BuySideMemoValidationResult = {
  ok: boolean;
  issues: string[];
  warnings: string[];
  valuationSafety?: V2ValuationSafetyDecision;
};

const MODULE_AVAILABILITY = new Set<V2ModuleAvailability>([
  "available",
  "partial",
  "unavailable",
]);

const VALUATION_DATA_SUFFICIENCY = new Set<V2ValuationDataSufficiency>([
  "sufficient",
  "partial",
  "insufficient",
]);

const SOURCE_STATUS_VALUES = new Set<V2SourceStatusValue>([
  "available",
  "partial",
  "mock",
  "unavailable",
]);

const SOURCE_KINDS: V2SourceKind[] = [
  "webSearch",
  "sec",
  "companyIr",
  "marketData",
  "consensus",
];

export function validateBuySideMemo(
  value: unknown,
): BuySideMemoValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const memo = asRecord(value);

  if (!memo) {
    return {
      ok: false,
      issues: ["BuySideMemoV2 must be an object."],
      warnings,
    };
  }

  validateRoot(memo, issues);
  validateMetadata(memo.metadata, issues);

  for (const sectionKey of BUY_SIDE_MEMO_V2_SECTION_ORDER) {
    validateModule(memo[sectionKey], sectionKey, issues);
  }

  const valuationSafety = validateValuationFramework(
    memo.valuationFramework,
    issues,
    warnings,
  );
  validateResearchContext(memo.researchContext, issues, warnings);

  if (containsForbiddenVerifiedRealData(memo)) {
    issues.push("BuySideMemoV2 must not claim verified-real-data.");
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
    valuationSafety,
  };
}

export function isBuySideMemoV2(value: unknown): value is BuySideMemoV2 {
  return validateBuySideMemo(value).ok;
}

function validateRoot(memo: Record<string, unknown>, issues: string[]) {
  if (memo.schemaVersion !== BUY_SIDE_MEMO_V2_SCHEMA_VERSION) {
    issues.push('schemaVersion must be "buy-side-memo-v2".');
  }
}

function validateMetadata(value: unknown, issues: string[]) {
  const metadata = asRecord(value);

  if (!metadata) {
    issues.push("metadata is required.");
    return;
  }

  if (metadata.dataMode !== "evidence-draft") {
    issues.push('metadata.dataMode must be "evidence-draft".');
  }

  if (!isNullableString(metadata.generatedAt)) {
    issues.push("metadata.generatedAt must be a string or null.");
  }

  if (!isNullableString(metadata.updatedAt)) {
    issues.push("metadata.updatedAt must be a string or null.");
  }
}

function validateModule(
  value: unknown,
  sectionKey: BuySideMemoV2SectionKey,
  issues: string[],
) {
  const sectionModule = asRecord(value);
  const expectedLabel = BUY_SIDE_MEMO_V2_SECTION_LABELS[sectionKey];

  if (!sectionModule) {
    issues.push(`${sectionKey} module is required.`);
    return;
  }

  if (sectionModule.label !== expectedLabel) {
    issues.push(`${sectionKey}.label must be "${expectedLabel}".`);
  }

  if (
    !MODULE_AVAILABILITY.has(
      sectionModule.availability as V2ModuleAvailability,
    )
  ) {
    issues.push(
      `${sectionKey}.availability must be available, partial, or unavailable.`,
    );
  }
}

function validateValuationFramework(
  value: unknown,
  issues: string[],
  warnings: string[],
) {
  const valuation = asRecord(value);

  if (!valuation) {
    issues.push("valuationFramework module is required.");
    return undefined;
  }

  if (
    !VALUATION_DATA_SUFFICIENCY.has(
      valuation.dataSufficiency as V2ValuationDataSufficiency,
    )
  ) {
    issues.push(
      "valuationFramework.dataSufficiency must be sufficient, partial, or insufficient.",
    );
    return undefined;
  }

  const dataSufficiency =
    valuation.dataSufficiency as V2ValuationDataSufficiency;
  const scenarios = readValuationScenarios(valuation.scenarios, issues);
  const safety = getValuationSafetyDecision({
    dataSufficiency,
    scenarios,
    probabilityWeightedTargetPrice: readNullableNumber(
      valuation.probabilityWeightedTargetPrice,
      "valuationFramework.probabilityWeightedTargetPrice",
      issues,
    ),
    probabilityWeightedImpliedReturnPercent: readNullableNumber(
      valuation.probabilityWeightedImpliedReturnPercent,
      "valuationFramework.probabilityWeightedImpliedReturnPercent",
      issues,
    ),
    professionalPrompt: readNullableString(valuation.professionalPrompt),
  });

  issues.push(...safety.issues);

  if (dataSufficiency === "partial" && !hasMissingData(valuation.missingData)) {
    warnings.push(
      "partial valuation should include missingData explaining why target prices are blocked.",
    );
  }

  if (dataSufficiency === "insufficient" && !safety.professionalPrompt) {
    issues.push("insufficient valuation requires a professional safety prompt.");
  }

  return safety;
}

function validateResearchContext(
  value: unknown,
  issues: string[],
  warnings: string[],
) {
  if (value === null || value === undefined || value === V2_UNAVAILABLE) {
    warnings.push("researchContext is unavailable; all sourceStatus values should be unavailable.");
    return;
  }

  const context = asRecord(value);

  if (!context) {
    issues.push("researchContext must be an object, null, or unavailable.");
    return;
  }

  if (context.dataMode !== "evidence-draft") {
    issues.push('researchContext.dataMode must be "evidence-draft".');
  }

  validateSourceStatus(context.sourceStatus, issues);
}

function validateSourceStatus(value: unknown, issues: string[]) {
  const sourceStatus = asRecord(value);

  if (!sourceStatus) {
    issues.push("researchContext.sourceStatus is required.");
    return;
  }

  for (const source of SOURCE_KINDS) {
    const status = asRecord(sourceStatus[source]);

    if (!status) {
      issues.push(`researchContext.sourceStatus.${source} is required.`);
      continue;
    }

    if (!SOURCE_STATUS_VALUES.has(status.status as V2SourceStatusValue)) {
      issues.push(
        `researchContext.sourceStatus.${source}.status is invalid.`,
      );
    }

    if (source === "consensus") {
      validateConsensusStatus(status, issues);
    }
  }
}

function validateConsensusStatus(
  status: Record<string, unknown>,
  issues: string[],
) {
  if (status.status !== "mock" && status.status !== "unavailable") {
    issues.push("Consensus sourceStatus must be mock or unavailable in this phase.");
  }

  if (status.provider !== null && status.provider !== "mock") {
    issues.push("Consensus provider must be mock or null in this phase.");
  }

  if (status.dataRole !== "estimateContext") {
    issues.push("Consensus dataRole must be estimateContext.");
  }
}

function readValuationScenarios(
  value: unknown,
  issues: string[],
): BuySideMemoV2ValuationScenario[] | null {
  if (value === null || value === undefined || value === V2_UNAVAILABLE) {
    return null;
  }

  if (!Array.isArray(value)) {
    issues.push("valuationFramework.scenarios must be an array, null, or unavailable.");
    return null;
  }

  return value.map((item, index) => readValuationScenario(item, index, issues));
}

function readValuationScenario(
  value: unknown,
  index: number,
  issues: string[],
): BuySideMemoV2ValuationScenario {
  const scenario = asRecord(value);
  const path = `valuationFramework.scenarios[${index}]`;
  const name = scenario?.name;

  if (name !== "bear" && name !== "base" && name !== "bull") {
    issues.push(`${path}.name must be bear, base, or bull.`);
  }

  return {
    name: name === "bear" || name === "base" || name === "bull" ? name : "base",
    targetPrice: readNullableNumber(scenario?.targetPrice, `${path}.targetPrice`, issues),
    impliedReturnPercent: readNullableNumber(
      scenario?.impliedReturnPercent,
      `${path}.impliedReturnPercent`,
      issues,
    ),
    probability: readNullableNumber(scenario?.probability, `${path}.probability`, issues),
    assumptions: Array.isArray(scenario?.assumptions)
      ? scenario.assumptions.filter((item): item is string => typeof item === "string")
      : null,
    sourceFactIds: Array.isArray(scenario?.sourceFactIds)
      ? scenario.sourceFactIds.filter((item): item is string => typeof item === "string")
      : null,
  };
}

function readNullableNumber(
  value: unknown,
  path: string,
  issues: string[],
) {
  if (value === null || value === undefined || value === V2_UNAVAILABLE) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) return value;

  issues.push(`${path} must be a finite number, null, or unavailable.`);
  return null;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isNullableString(value: unknown) {
  return value === null || value === undefined || typeof value === "string";
}

function hasMissingData(value: unknown) {
  if (value === V2_UNAVAILABLE || value === null || value === undefined) {
    return false;
  }

  return Array.isArray(value) && value.some((item) => typeof item === "string");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function containsForbiddenVerifiedRealData(value: unknown): boolean {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "verified-real-data" ||
      /(^|[^a-z])is verified-real-data([^a-z]|$)/i.test(value) ||
      /(^|[^a-z])as verified-real-data([^a-z]|$)/i.test(value)
    );
  }

  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsForbiddenVerifiedRealData);

  return Object.entries(value).some(([key, childValue]) => {
    const normalizedKey = key.replace(/[-_\s]/g, "").toLowerCase();
    if (normalizedKey === "datamode" && childValue === "verified-real-data") {
      return true;
    }

    return containsForbiddenVerifiedRealData(childValue);
  });
}
