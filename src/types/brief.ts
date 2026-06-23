import type {
  EvidenceCoverageSummary,
  EvidencePack,
  IrEvidencePack,
  ResearchEvidenceContext,
  SecEvidencePack,
} from "./evidence";

export type BriefSchemaVersion = "0.1";

export type BriefLanguage = "zh-CN" | "en-US";

export type BriefFrameworkStatus = "mock-reference-only" | "connected";

export type BriefDataMode =
  | "mock"
  | "llm-demo-no-live-data"
  | "evidence-draft"
  | "verified-real-data";

export type BriefSectionKind =
  | "executive-view"
  | "company-snapshot"
  | "industry-chain"
  | "competitive-landscape"
  | "financial-deep-dive"
  | "value-drivers"
  | "valuation"
  | "variant-perception"
  | "catalysts"
  | "risks"
  | "bottom-line";

export type BriefContentBlockType =
  | "paragraph"
  | "bulletList"
  | "orderedList"
  | "callout"
  | "metricGrid";

export type ScenarioTone = "bull" | "base" | "bear";

export type CalloutTone = "neutral" | "brand" | "risk";

export type MonitoringStatus = "Healthy" | "Watch" | "Caution" | "Trigger";

export type BriefMetadata = {
  ticker: string;
  companyName: string;
  exchange?: string;
  title: string;
  briefType: string;
  language: BriefLanguage;
  isMock: boolean;
  generatedAt: string;
  updatedAt: string;
  frameworkName: string;
  frameworkStatus: BriefFrameworkStatus;
  dataMode: BriefDataMode;
  brand: string;
  product: string;
  shareLabel: string;
};

export type BriefBadge = {
  label: string;
  tone: "brand" | "neutral";
};

export type BriefMetric = {
  label: string;
  value: string;
  detail?: string;
};

export type BriefHeroData = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  badges: BriefBadge[];
  metrics: BriefMetric[];
};

export type BriefCtaData = {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref?: string;
};

export type ParagraphBlock = {
  type: "paragraph";
  content: string;
};

export type BulletListBlock = {
  type: "bulletList";
  items: string[];
};

export type OrderedListBlock = {
  type: "orderedList";
  items: string[];
};

export type CalloutBlock = {
  type: "callout";
  title?: string;
  content: string;
  tone?: CalloutTone;
  label?: string;
};

export type MetricGridBlock = {
  type: "metricGrid";
  metrics: BriefMetric[];
};

export type BriefContentBlock =
  | ParagraphBlock
  | BulletListBlock
  | OrderedListBlock
  | CalloutBlock
  | MetricGridBlock;

export type BriefSection = {
  id: string;
  order: number;
  title: string;
  shortTitle?: string;
  eyebrow?: string;
  kind: BriefSectionKind;
  summary?: string;
  blocks: BriefContentBlock[];
};

export type Scenario = {
  name: string;
  label: string;
  probability: string;
  keyAssumptions: string;
  targetPrice: string;
  impliedReturn: string;
  tone?: ScenarioTone;
  operatingSetup?: string;
  trigger?: string;
};

export type ScenarioAnalysisBlock = {
  id: string;
  order: number;
  title: string;
  shortTitle?: string;
  description: string;
  currentPrice?: string;
  probabilityWeightedTarget?: string;
  scenarios: Scenario[];
};

export type MonitoringMetric = {
  metric: string;
  whyItMatters: string;
  threshold: string;
  status?: MonitoringStatus;
  cadence?: string;
};

export type MonitoringDashboardBlock = {
  id: string;
  order: number;
  title: string;
  shortTitle?: string;
  description: string;
  metrics: MonitoringMetric[];
};

export type SourceNoteData = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type DisclaimerData = {
  title?: string;
  text: string;
};

export type BriefDocument = {
  schemaVersion: BriefSchemaVersion;
  slug: string;
  metadata: BriefMetadata;
  hero: BriefHeroData;
  cta: BriefCtaData;
  sections: BriefSection[];
  scenarioAnalysis: ScenarioAnalysisBlock;
  monitoringDashboard: MonitoringDashboardBlock;
  evidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
  researchEvidenceContext?: ResearchEvidenceContext;
  evidenceSummary?: EvidenceCoverageSummary;
  sourceNote: SourceNoteData;
  disclaimer: DisclaimerData;
};

export type BriefTocItem = {
  id: string;
  label: string;
  order: number;
};

export type BriefData = BriefDocument;
