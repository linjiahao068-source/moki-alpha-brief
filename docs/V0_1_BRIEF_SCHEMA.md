# V0.1 Brief Schema

## 本阶段目标

Phase 7 只做研报数据结构标准化，不接数据库、不调用真实 serenity-skill，也不生成真实研报。

本阶段的目标是把当前 NVDA mock brief 整理成未来 LLM / serenity-skill 可以直接输出的 `BriefDocument` JSON 结构，同时保证现有 `/`、`/s/nvda`、`/s/test` 页面继续正常渲染。

Phase 8 已在此 schema 之上新增 LLM / DeepSeek 生成闭环 MVP。新增的 `src/lib/briefs/briefJsonSchema.ts` 用于提示模型输出结构化 JSON，运行时仍使用 `validateBriefDocument` 做轻量校验。Phase 8.1 支持 `deepseek-chat` 与 `deepseek-reasoner` 两种模式，两者输出都必须符合同一个 `BriefDocument` schema。

Phase 8.2 新增数据边界字段和 EvidencePack 预留。当前没有 evidencePack 时，只允许显示 `mock` 或 `llm-demo-no-live-data`，不能显示 `verified-real-data`。

Phase 8.3 新增 Prompt 质量优化。`BriefDocument` schema 仍然是唯一渲染契约；`assessBriefQuality` 只生成 Quality Warnings，用来提示内容是否像一份完整买方 memo，不替代 `validateBriefDocument`。

Phase 9.1 新增 Search Evidence Pack。`useSearch=true` 时，后端生成 `EvidencePack.newsItems` 并注入 prompt，生成结果应使用 `metadata.dataMode: "evidence-draft"`。这仍然不是 `verified-real-data`。

## 为什么要标准化 Brief Schema

标准化 schema 的目的不是增加复杂度，而是让后续开发有稳定接口：

- 让前端渲染稳定，不再依赖散落在组件里的内容字段。
- 让未来 LLM 输出 JSON 时有明确目标格式。
- 避免把研报正文、表格、风险、来源说明硬编码在 JSX 中。
- 为多股票、多 slug、多分享页做准备。
- 为后续校验、修复、证据链和来源状态显示做准备。

## BriefDocument 总体结构

当前主类型定义在 `src/types/brief.ts`。

```ts
export type BriefDocument = {
  schemaVersion: "0.1";
  slug: string;
  metadata: BriefMetadata;
  hero: BriefHeroData;
  cta: BriefCtaData;
  sections: BriefSection[];
  scenarioAnalysis: ScenarioAnalysisBlock;
  monitoringDashboard: MonitoringDashboardBlock;
  sourceNote: SourceNoteData;
  disclaimer: DisclaimerData;
};
```

字段用途：

- `schemaVersion`：当前 schema 版本。V0.1 固定为 `"0.1"`。
- `slug`：公开分享页的 slug，例如 `nvda`。
- `metadata`：ticker、公司名、标题、生成时间、更新时间、mock 状态、研究框架等元信息。
- `hero`：页面 Hero 区展示数据，包括 headline、subheadline、badges 和顶部摘要指标。
- `cta`：CTA 文案和按钮数据。当前按钮不接真实登录逻辑。
- `sections`：正文长文 sections，包括 Executive View、Company Snapshot、Risks、Bottom Line 等。
- `scenarioAnalysis`：Bull / Base / Bear 情景分析表格。
- `monitoringDashboard`：研究监控清单表格。
- `sourceNote`：研究方法和来源状态说明。
- `disclaimer`：投资风险免责声明。

## Metadata 结构

`metadata` 用于页面级信息和分享页基础信息。

关键字段：

- `ticker`
- `companyName`
- `exchange`
- `title`
- `briefType`
- `language`
- `isMock`
- `generatedAt`
- `updatedAt`
- `frameworkName`
- `frameworkStatus`
- `dataMode`
- `brand`
- `product`
- `shareLabel`

当前 NVDA 示例中 `isMock: true`，`frameworkStatus: "mock-reference-only"`，表示页面只参考 buy-side memo 工作流结构，并未真实接入 serenity-skill。Phase 8.2 后，生成结果会使用明确的 dataMode，避免被误读为真实研究数据。

Phase 8.2 后，`dataMode` 收敛为：

- `mock`
- `llm-demo-no-live-data`
- `evidence-draft`
- `verified-real-data`

当前实际使用：

- 静态示例和 mock provider：`mock`
- DeepSeek 生成结果：`llm-demo-no-live-data`

`evidence-draft` 和 `verified-real-data` 只为 Phase 9 之后预留，没有 evidencePack 时不能使用。

## Section 结构

```ts
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
```

字段说明：

- `id`：稳定 anchor id，用于目录跳转，例如 `executive-view`。
- `order`：页面显示顺序，也用于目录排序。
- `title`：正文标题。
- `shortTitle`：目录里的短标题，可选。
- `eyebrow`：章节上方的小标签，可选。
- `kind`：章节类型，用于前端决定是否使用特殊样式。
- `summary`：未来可用于卡片摘要或 LLM 校验，可选。
- `blocks`：章节内容块数组。

当前支持的 `kind`：

- `executive-view`
- `company-snapshot`
- `industry-chain`
- `competitive-landscape`
- `financial-deep-dive`
- `value-drivers`
- `valuation`
- `variant-perception`
- `catalysts`
- `risks`
- `bottom-line`

## Content Block 结构

当前支持五种简单 block，避免过度嵌套：

### paragraph

普通段落。

```ts
{ type: "paragraph", content: string }
```

### bulletList

无序列表。

```ts
{ type: "bulletList", items: string[] }
```

### orderedList

有序列表。

```ts
{ type: "orderedList", items: string[] }
```

### callout

重点提示或风险项。`tone` 可用于区分中性、品牌或风险语义。

```ts
{
  type: "callout";
  title?: string;
  content: string;
  tone?: "neutral" | "brand" | "risk";
  label?: string;
}
```

### metricGrid

指标网格，用于 Company Snapshot、Executive View、Financial Deep Dive、Valuation 等模块。

```ts
{
  type: "metricGrid";
  metrics: Array<{
    label: string;
    value: string;
    detail?: string;
  }>;
}
```

## Scenario Analysis 结构

`scenarioAnalysis` 用于 Bull / Base / Bear 表格。

关键字段：

- `id`
- `order`
- `title`
- `shortTitle`
- `description`
- `currentPrice`
- `probabilityWeightedTarget`
- `scenarios`

每个 scenario 包含：

- `name`
- `label`
- `probability`
- `keyAssumptions`
- `targetPrice`
- `impliedReturn`
- `tone`
- `operatingSetup`
- `trigger`

当前页面仍是 mock demo，表格中的价格、概率和回报只用于页面结构展示，不构成投资建议。

## Monitoring Dashboard 结构

`monitoringDashboard` 用于研究监控清单。

关键字段：

- `id`
- `order`
- `title`
- `shortTitle`
- `description`
- `metrics`

每个 metric 包含：

- `metric`
- `whyItMatters`
- `threshold`
- `status`
- `cadence`

V0.1 中 `status` 和 `cadence` 仍是 mock 展示字段，不代表实时监控结果。

## Source Note 与 Disclaimer

`sourceNote` 和 `disclaimer` 的语义不同，不能混用。

`sourceNote` 是研究方法和数据状态说明：

- 当前公开分享页是静态 mock demo；`/generate` 可以生成 mock / LLM demo preview。
- 页面结构参考 buy-side equity research memo 工作流。
- 当前未接入真实 SEC、公司 IR、实时股价或一致预期。
- 后续会把来源、日期、置信度和证据链结构化。

`disclaimer` 是投资风险免责声明：

- 页面仅供研究和信息参考。
- 不构成投资建议。
- 不代表实时行情、正式评级或个性化建议。

## EvidencePack 预留

Phase 8.2 新增：

```text
src/types/evidence.ts
```

当前只定义类型，不接真实 API。

未来 EvidencePack 可包含：

- `asOf`
- `ticker`
- `dataMode`
- `searchProvider`
- `querySet`
- `sources`
- `newsItems`
- `marketData`
- `secData`
- `irItems`
- `consensusData`

没有 EvidencePack 时，页面不能进入 `evidence-draft` 或 `verified-real-data`。

## 当前 NVDA mock 数据说明

当前 `src/data/nvdaBrief.ts` 已符合 `BriefDocument`。

但 NVDA 内容仍然是 mock demo：

- 不是真实研报。
- 不使用真实 SEC / IR / 股价 / 一致预期。
- 默认不调用真实数据源；只有本地配置 DeepSeek 环境变量后，`/generate` 才会尝试调用 DeepSeek provider。`deepseek-reasoner` 的 `reasoning_content` 不会展示、保存或传回下一轮请求。
- 不执行 serenity-skill。
- 不保存真实分享页。

页面必须继续显示 `Sample / Mock` 和免责声明。

## 轻量校验

当前校验函数位于：

- `src/lib/briefs/validateBrief.ts`

导出：

```ts
validateBriefDocument(brief: BriefDocument): string[]
```

当前只做关键字段校验，例如：

- `schemaVersion`
- `slug`
- `metadata.ticker`
- `metadata.companyName`
- `metadata.title`
- `metadata.generatedAt`
- `metadata.updatedAt`
- `sections`
- section 的 `id / order / title / kind`
- section id 是否重复
- `scenarioAnalysis.scenarios`
- `monitoringDashboard.metrics`
- `disclaimer.text`

Phase 8.3 还新增了内容质量提示函数：

- `src/lib/briefs/assessBriefQuality.ts`

它导出：

```ts
assessBriefQuality(brief: BriefDocument): string[]
```

它检查 Executive View、Bull/Base/Bear、Monitoring Dashboard、Key Risks、Bottom Line、sourceNote、disclaimer、dataMode，以及没有 evidencePack 时是否疑似声称使用真实数据源。它返回的是 Quality Warnings，不会替代 schema validation。

校验返回 issues 数组。在开发环境中页面会 `console.warn`，但不会因为 mock 数据小问题直接崩溃。

## Phase 8 当前如何使用这个 schema

Phase 8 已经新增 LLM / DeepSeek 生成闭环 MVP，当前流程是：

1. `/generate` 页面提交 ticker。
2. `POST /api/generate-brief` 调用 `generateBrief(input)`。
3. `generateBrief` 根据环境变量和 `modelMode` 选择 `mockProvider` 或 `deepseekProvider`。
4. prompt 使用 `briefJsonSchema` 要求模型输出 `BriefDocument` JSON。
5. 服务端 `JSON.parse` 后调用 `validateBriefDocument`。
6. 服务端调用 `assessBriefQuality` 生成非阻断的 `qualityWarnings`。
7. 校验通过后前端复用当前 Brief 组件渲染。
8. 校验失败或 DeepSeek 配置缺失时返回可读原因，并 fallback 到 mock provider。

`modelMode` 可选：

- `chat`：使用 `deepseek-chat`，偏快速生成。
- `reasoner`：使用 `deepseek-reasoner`，偏深度结构推理。只读取最终 `content`，不使用 `reasoning_content` 作为页面内容。

## 开发边界

- 不要把 API Key 写进前端组件。
- 不要使用 `NEXT_PUBLIC_DEEPSEEK_API_KEY`。
- 不要把真实 `.env.local` 提交到 GitHub。
- 不要直接让 LLM 输出任意 Markdown 替代 schema。
- 不要把真实数据和 mock / LLM demo 数据混在一起且不标记。
- 不要删除 `Sample / Mock`、`LLM Demo` 或 `No Live Data` 状态。
- 不要删除免责声明。
- 不要把当前 mock 目标价、评级、回报写成真实投资建议。

## Phase 9.2 SEC Evidence Extension

`BriefDocument` now supports an optional `secEvidencePack` alongside search `evidencePack`.

SEC evidence includes:

- `ticker`
- `cik`
- `provider`
- `recentFilings`
- `fiscalFacts`
- `sources`
- `warnings`

`secEvidencePack.dataMode` remains `evidence-draft`. SEC companyfacts are official disclosure data, but the current extraction layer is still MVP and must not be presented as `verified-real-data`.

See: `docs/V0_1_SEC_EVIDENCE_MVP.md`.

## Phase 9.3 ResearchEvidenceContext Extension

`BriefDocument` can now optionally carry:

- `researchEvidenceContext`
- `evidenceSummary`

`ResearchEvidenceContext` includes `evidenceLevel`, `sourceRegistry`, `factLedger`, `coverage`, and `warnings`.

It keeps search draft items, SEC official facts, and missing data boundaries separate. `dataMode` remains `evidence-draft`; `verified-real-data` is still not allowed in the current MVP.

See: `docs/V0_1_RESEARCH_EVIDENCE_CONTEXT.md`.

## Phase 9.4 Company IR Evidence Extension

`BriefDocument` now supports an optional `irEvidencePack` alongside search `evidencePack`, `secEvidencePack`, and `researchEvidenceContext`.

`IrEvidencePack` includes:

- `ticker`
- `companyName`
- `provider`
- `dataMode`
- `irItems`
- `sources`
- `warnings`

New `ResearchEvidenceContext.evidenceLevel` values:

- `ir-only`
- `search-and-ir`
- `sec-and-ir`
- `search-sec-and-ir`

New coverage fields:

- `hasCompanyIr`
- `hasEarningsRelease`
- `hasManagementCommentary`
- `hasGuidanceContext`

IR evidence is an evidence draft for company official narrative, management commentary, business updates, and company guidance context. It cannot be treated as SEC official-financial data, consensus estimates, real-time market price, or `verified-real-data`.

See: `docs/V0_1_COMPANY_IR_EVIDENCE_MVP.md`.

## Phase 9.5 Market Evidence Extension

`BriefDocument` now supports an optional `marketEvidencePack` alongside search `evidencePack`, `secEvidencePack`, `irEvidencePack`, and `researchEvidenceContext`.

`MarketEvidencePack` includes:

- `ticker`
- `companyName`
- `provider`
- `dataMode`
- `quote`
- `priceHistory`
- `sources`
- `warnings`

`MarketQuote` includes normalized quote context such as price, previous close, open, high, low, volume, change, percent change, market cap, currency, exchange, `marketTimestamp`, `retrievedAt`, `dateStatus`, and `confidence`.

New `ResearchEvidenceContext.evidenceLevel` values:

- `market-only`
- `search-and-market`
- `sec-and-market`
- `ir-and-market`
- `search-sec-and-market`
- `search-ir-and-market`
- `sec-ir-and-market`
- `search-sec-ir-and-market`

New coverage fields:

- `hasMarketPrice`
- `hasMarketVolume`
- `hasMarketPriceHistory`
- `hasMarketCap`

Market evidence is an evidence draft for third-party free market context only. It cannot be treated as SEC official-financial data, consensus estimates, a formal trading quote, a formal rating, a trading signal, or verified-real-data.

See: `docs/V0_1_MARKET_DATA_MVP.md`.

## Phase 10 SavedBriefRecord Extension

Phase 10 adds `SavedBriefRecord` as a persistence wrapper around a renderable `BriefDocument`.

Type location:

```text
src/types/savedBrief.ts
```

Shape:

```ts
type SavedBriefRecord = {
  id: string;
  slug: string;
  title: string;
  ticker: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  dataMode: "evidence-draft";
  evidenceLevel: string;
  modelProvider?: string;
  modelName?: string;
  isFallback?: boolean;
  briefDocument: BriefDocument;
  evidenceSummary?: object;
  sourceCounts?: object;
  warnings?: string[];
  disclaimer?: string;
};
```

Rules:

- `SavedBriefRecord.dataMode` is always `evidence-draft`.
- `briefDocument.metadata.dataMode` must be `evidence-draft` before save.
- `verified-real-data` is rejected.
- The saved record must be renderable directly at `/s/[slug]`.
- The saved record must not contain API keys, `reasoning_content`, raw model output, raw provider responses, internal error stacks, or debug fields.
- The saved share page may display compact `evidenceSummary` and `sourceCounts`, but not raw provider panels or raw JSON.

See: `docs/V0_1_SAVED_BRIEF_SHARE_MVP.md`.

## Phase 10.0.1 ConsensusEvidencePack Extension

`BriefDocument` now supports an optional `consensusEvidencePack` alongside Search, SEC, IR, Market, and `researchEvidenceContext`.

`ConsensusEvidencePack` includes:

- `ticker`
- `companyName`
- `provider: "mock"`
- `dataMode: "evidence-draft"`
- `period`
- `estimates`
- `sources`
- `warnings`
- `isFallback`
- `providerChain`

`ConsensusEstimate` includes normalized revenue / EPS estimate fields, analyst count, currency, `sourceProvider: "mock"`, `confidence: "medium"`, and allowed-use boundaries.

New consensus-aware `evidenceLevel` values include `consensus-only`, `market-and-consensus`, and `search-sec-ir-market-and-consensus`.

Rules:

- Consensus Evidence is mock-only in Phase 10.0.1.
- It is not SEC actual data.
- It is not market price data.
- It is not verified-real-data.
- It must not produce a formal target price or formal rating.
- Saved BriefDocuments may keep the normalized consensus pack, but must not keep raw provider responses or `reasoning_content`.

See: `docs/V0_1_CONSENSUS_ESTIMATES_BACKFILL.md`.
