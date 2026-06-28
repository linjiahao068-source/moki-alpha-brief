import type {
  EvidenceConfidence,
  EvidenceCoverageSummary,
  ResearchEvidenceFact,
  ResearchEvidenceLevel,
  ResearchEvidenceSource,
} from "@/types/evidence";

export const BUY_SIDE_MEMO_V2_SCHEMA_VERSION = "buy-side-memo-v2" as const;
export const BUY_SIDE_MEMO_V2_RESEARCH_CONTEXT_VERSION =
  "buy-side-memo-v2-research-context" as const;

export const V2_UNAVAILABLE = "unavailable" as const;

export const BUY_SIDE_MEMO_V2_SECTION_LABELS = {
  investmentConclusion: "投资结论",
  companyProfile: "公司画像",
  fundamentalAnalysis: "基本面分析",
  valuationFramework: "估值框架",
  catalystRisk: "催化风险",
  monitoringDashboard: "监控仪表盘",
  sourceFooter: "底部：数据来源",
} as const;

export const BUY_SIDE_MEMO_V2_SECTION_ORDER = [
  "investmentConclusion",
  "companyProfile",
  "fundamentalAnalysis",
  "valuationFramework",
  "catalystRisk",
  "monitoringDashboard",
  "sourceFooter",
] as const;

export type BuySideMemoV2SectionKey =
  (typeof BUY_SIDE_MEMO_V2_SECTION_ORDER)[number];

export type BuySideMemoV2SchemaVersion =
  typeof BUY_SIDE_MEMO_V2_SCHEMA_VERSION;

export type BuySideMemoV2ResearchContextVersion =
  typeof BUY_SIDE_MEMO_V2_RESEARCH_CONTEXT_VERSION;

export type V2Unavailable = typeof V2_UNAVAILABLE;

export type V2Maybe<T> = T | null | V2Unavailable;

export type V2ModuleAvailability = "available" | "partial" | "unavailable";

export type V2SourceKind =
  | "webSearch"
  | "sec"
  | "companyIr"
  | "marketData"
  | "consensus";

export type V2SourceStatusValue =
  | "available"
  | "partial"
  | "mock"
  | "unavailable";

export type V2SourceDataRole =
  | "recentPublicContext"
  | "officialDisclosure"
  | "companyNarrative"
  | "marketContext"
  | "estimateContext";

export type V2SourceStatus = {
  source: V2SourceKind;
  label: string;
  status: V2SourceStatusValue;
  provider: string | null;
  dataRole: V2SourceDataRole;
  sourceCount: number;
  factCount: number;
  asOf: string | null;
  missing: string[];
  warnings: string[];
  caveat: string | null;
  isFallback: boolean | null;
};

export type V2SourceStatusMap = Record<V2SourceKind, V2SourceStatus>;

export type V2ConsensusContext = {
  status: "mock" | "unavailable";
  provider: "mock" | null;
  role: "estimateContext";
  estimateCount: number;
  asOf: string | null;
  warnings: string[];
  caveat: string;
};

export type BuySideMemoV2ResearchContext = {
  schemaVersion: BuySideMemoV2ResearchContextVersion;
  ticker: string;
  companyName: string | null;
  asOf: string | null;
  dataMode: "evidence-draft";
  evidenceLevel: ResearchEvidenceLevel;
  sourceStatus: V2SourceStatusMap;
  sources: ResearchEvidenceSource[];
  facts: ResearchEvidenceFact[];
  factsBySection: Record<BuySideMemoV2SectionKey, ResearchEvidenceFact[]>;
  coverage: EvidenceCoverageSummary | null;
  warnings: string[];
  consensus: V2ConsensusContext;
};

export type BuySideMemoV2Metadata = {
  ticker: V2Maybe<string>;
  companyName: V2Maybe<string>;
  title: V2Maybe<string>;
  generatedAt: string | null;
  updatedAt: string | null;
  language: "zh-CN" | "en" | null;
  dataMode: "evidence-draft";
};

export type BuySideMemoV2TextBlock = {
  title: V2Maybe<string>;
  body: V2Maybe<string>;
  sourceFactIds: string[] | null;
  confidence: EvidenceConfidence | null;
};

export type BuySideMemoV2Metric = {
  label: V2Maybe<string>;
  value: V2Maybe<string | number>;
  unit: V2Maybe<string>;
  period: V2Maybe<string>;
  whyItMatters: V2Maybe<string>;
  threshold: V2Maybe<string>;
  currentStatus: V2Maybe<string>;
  source: V2Maybe<string>;
  updateFrequency: V2Maybe<string>;
  sourceFactIds: string[] | null;
  confidence: EvidenceConfidence | null;
};

export type BuySideMemoV2BaseModule = {
  label: string;
  availability: V2ModuleAvailability;
  unavailableReason: string | null;
  evidenceNotes: V2Maybe<string[]>;
};

export type BuySideMemoV2InvestmentConclusion =
  BuySideMemoV2BaseModule & {
    label: "投资结论";
    thesis: V2Maybe<string>;
    conclusion: V2Maybe<string>;
    confidence: EvidenceConfidence | null;
    timeHorizon: V2Maybe<string>;
    keyDebate: V2Maybe<string>;
    variantView: V2Maybe<string>;
    whatWouldChangeMind: V2Maybe<string[]>;
    keyPoints: V2Maybe<BuySideMemoV2TextBlock[]>;
  };

export type BuySideMemoV2CompanyProfile = BuySideMemoV2BaseModule & {
  label: "公司画像";
  businessSummary: V2Maybe<string>;
  segmentNotes: V2Maybe<BuySideMemoV2TextBlock[]>;
  moat: V2Maybe<string>;
  customerDemand: V2Maybe<string>;
  managementNarrative: V2Maybe<string>;
  missingData: V2Maybe<string[]>;
};

export type BuySideMemoV2FundamentalAnalysis = BuySideMemoV2BaseModule & {
  label: "基本面分析";
  revenueQuality: V2Maybe<string>;
  marginStructure: V2Maybe<string>;
  cashFlow: V2Maybe<string>;
  balanceSheet: V2Maybe<string>;
  growthDrivers: V2Maybe<string[]>;
  secFacts: V2Maybe<BuySideMemoV2Metric[]>;
  consensusContext: V2Maybe<string>;
  missingData: V2Maybe<string[]>;
};

export type V2ValuationDataSufficiency =
  | "sufficient"
  | "partial"
  | "insufficient";

export type V2ValuationScenarioName = "bear" | "base" | "bull";

export type BuySideMemoV2ValuationScenario = {
  name: V2ValuationScenarioName;
  targetPrice: number | null;
  impliedReturnPercent: number | null;
  probability: number | null;
  assumptions: V2Maybe<string[]>;
  sourceFactIds: string[] | null;
};

export type BuySideMemoV2ValuationFramework =
  BuySideMemoV2BaseModule & {
    label: "估值框架";
    dataSufficiency: V2ValuationDataSufficiency;
    methodology: V2Maybe<string[]>;
    directionalView: V2Maybe<string>;
    keyValueDrivers: V2Maybe<string[]>;
    missingData: V2Maybe<string[]>;
    scenarios: BuySideMemoV2ValuationScenario[] | null;
    probabilityWeightedTargetPrice: number | null;
    probabilityWeightedImpliedReturnPercent: number | null;
    professionalPrompt: string | null;
  };

export type BuySideMemoV2CatalystRisk = BuySideMemoV2BaseModule & {
  label: "催化风险";
  catalysts: V2Maybe<BuySideMemoV2TextBlock[]>;
  risks: V2Maybe<BuySideMemoV2TextBlock[]>;
  scenarioTriggers: V2Maybe<string[]>;
  missingData: V2Maybe<string[]>;
};

export type BuySideMemoV2MonitoringDashboard = BuySideMemoV2BaseModule & {
  label: "监控仪表盘";
  metrics: V2Maybe<BuySideMemoV2Metric[]>;
  refreshCadence: V2Maybe<string>;
  alertRules: V2Maybe<string[]>;
  missingData: V2Maybe<string[]>;
};

export type BuySideMemoV2SourceFooter = BuySideMemoV2BaseModule & {
  label: "底部：数据来源";
  sourceStatus: V2SourceStatusMap | null;
  sourceNotes: V2Maybe<string[]>;
  caveats: V2Maybe<string[]>;
  missingData: V2Maybe<string[]>;
};

export type BuySideMemoV2 = {
  schemaVersion: BuySideMemoV2SchemaVersion;
  metadata: BuySideMemoV2Metadata;
  researchContext: BuySideMemoV2ResearchContext | null;
  investmentConclusion: BuySideMemoV2InvestmentConclusion;
  companyProfile: BuySideMemoV2CompanyProfile;
  fundamentalAnalysis: BuySideMemoV2FundamentalAnalysis;
  valuationFramework: BuySideMemoV2ValuationFramework;
  catalystRisk: BuySideMemoV2CatalystRisk;
  monitoringDashboard: BuySideMemoV2MonitoringDashboard;
  sourceFooter: BuySideMemoV2SourceFooter;
};
