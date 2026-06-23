# Moki Alpha Brief V0.1 Handoff

## 1. 项目背景

项目名称：Moki Alpha Brief

当前版本：V0.1

当前定位：公开分享版买方深度研报页静态复刻。

参考网页：K2AI Public Research Brief 页面。

参考研究框架：`buy-side-equity-research-memo style workflow`。

重要说明：当前页面只是静态 mock demo，并未真实接入 serenity-skill，也未执行真实研究工作流。页面里的 NVDA 内容用于验证公开分享研报的信息架构、阅读体验、组件拆分和 Moki 黑白金视觉系统，不可理解为真实投资研究结论。

本文档面向非技术产品负责人、后续 Codex / Claude Code、后续前端开发，以及未来接入 LLM / serenity-skill 的开发者。

## 2. 当前已完成阶段

- Phase 0：新建 Next.js 项目与本地运行。
- Phase 1：完成静态研报页骨架，移除 create-next-app 默认首页内容。
- Phase 2：按照 Moki Market 黑白金 UI 规范完成视觉二次打磨。
- Phase 3：新增公开分享路由 `/s/nvda`，并为未来 `/s/[slug]` 动态分享页预留结构。
- Phase 4：完成页面结构高保真复刻，加入桌面目录、Source & Method Note、长文阅读结构。
- Phase 5：完成移动端 QA、视觉细节修复、表格内部滚动、not-found 页面移动端检查。
- Phase 6：当前文档沉淀与项目交接。
- Phase 7：完成研报数据结构标准化，建立 `BriefDocument` schema、schema 文档和轻量校验工具。
- Phase 8：完成 LLM / DeepSeek 生成闭环 MVP，新增 `/generate` 内部测试页、`POST /api/generate-brief`、mock provider、deepseek provider 与生成文档。
- Phase 8.1：新增 DeepSeek 模型模式选择，支持 Fast / `deepseek-chat` 与 Deep Reasoning / `deepseek-reasoner`。
- Phase 8.2：新增 LLM Demo 数据边界，明确 `dataMode`、EvidencePack 预留、DataBoundaryNote 和防真实数据误读校验。
- Phase 8.3：完成 Prompt 质量优化，强化 buy-side memo 写作规则、数据边界、Quality Warnings 和 evidencePack prompt 注入点。
- Phase 9.1：完成实时网页内容搜索 MVP，新增 Search Evidence Pack、mock/Tavily search provider、`/api/search-evidence` 和 `/generate` Source Evidence 面板。

## 3. 页面访问路径

- `http://localhost:3000`
  - 显示 demo brief。
- `http://localhost:3000/s/nvda`
  - 显示正式公开分享路径下的 NVDA brief。
- `http://localhost:3000/s/test`
  - 显示 Moki 风格的 not found 状态页。
- `http://localhost:3000/generate`
  - 内部生成测试页。用户输入 ticker 并选择 Fast 或 Deep Reasoning 后调用 `POST /api/generate-brief`，返回 `BriefDocument` JSON 并在页面内预览。

当前只有 `nvda` 是有效分享 slug。其他 slug 不会访问数据库，也不会尝试生成真实内容。`/generate` 只做临时预览，不保存结果，也不会自动创建真实 `/s/[slug]`。

## 4. 技术栈

- Next.js `16.2.9`
- React `19.2.4`
- TypeScript
- Tailwind CSS v4
- App Router
- 本地 mock 数据
- `POST /api/generate-brief` 最小生成 API route
- 可选 DeepSeek provider，默认 mock provider
- 当前无数据库
- 当前无登录系统

## 5. 项目目录结构

以下为当前 V0.1 相关核心文件，按真实项目结构记录：

```text
moki-alpha-brief/
├─ .env.example
├─ .gitignore
├─ README.md
├─ docs/
│  ├─ V0_1_ALPHA_BRIEF_HANDOFF.md
│  ├─ V0_1_BRIEF_SCHEMA.md
│  ├─ V0_1_DATA_BOUNDARY.md
│  ├─ V0_1_LLM_GENERATION_MVP.md
│  ├─ V0_1_MOBILE_QA_REPORT.md
│  ├─ V0_1_PROMPT_QUALITY.md
│  └─ V0_1_SEARCH_EVIDENCE_MVP.md
└─ src/
   ├─ app/
   │  ├─ api/
   │  │  ├─ generate-brief/
   │  │  │  └─ route.ts
   │  │  └─ search-evidence/
   │  │     └─ route.ts
   │  ├─ generate/
   │  │  └─ page.tsx
   │  ├─ globals.css
   │  ├─ layout.tsx
   │  ├─ not-found.tsx
   │  ├─ page.tsx
   │  └─ s/
   │     └─ [slug]/
   │        └─ page.tsx
   ├─ components/
   │  └─ brief/
   │     ├─ BriefContent.tsx
   │     ├─ BriefFooter.tsx
   │     ├─ BriefHeader.tsx
   │     ├─ BriefHero.tsx
   │     ├─ BriefNotFound.tsx
   │     ├─ BriefPage.tsx
   │     ├─ BriefShell.tsx
   │     ├─ BriefToc.tsx
   │     ├─ DataBoundaryNote.tsx
   │     ├─ MonitoringDashboard.tsx
   │     ├─ ScenarioTable.tsx
   │     └─ SourceNote.tsx
   │  └─ generate/
   │     ├─ GenerateBriefForm.tsx
   │     ├─ GeneratedBriefPreview.tsx
   │     └─ SourceEvidenceList.tsx
   ├─ data/
   │  ├─ briefs.ts
   │  └─ nvdaBrief.ts
   ├─ lib/
   │  ├─ briefs/
   │  │  ├─ assessBriefQuality.ts
   │  │  ├─ briefJsonSchema.ts
   │  │  ├─ getBriefBySlug.ts
   │  │  ├─ getBriefTocItems.ts
   │  │  └─ validateBrief.ts
   │  ├─ llm/
   │  │  ├─ config.ts
   │  │  ├─ generateBrief.ts
   │  │  ├─ types.ts
   │  │  ├─ prompts/
   │  │  │  └─ buySideEquityResearchPrompt.ts
   │  │  └─ providers/
   │  │     ├─ deepseekProvider.ts
   │  │     └─ mockProvider.ts
   │  └─ search/
   │     ├─ buildSearchEvidencePack.ts
   │     ├─ config.ts
   │     ├─ types.ts
   │     └─ providers/
   │        ├─ mockSearchProvider.ts
   │        └─ tavilySearchProvider.ts
   └─ types/
      ├─ brief.ts
      └─ evidence.ts
```

## 6. 页面结构说明

当前页面从上到下为：

- Header：显示 Moki、Moki Alpha Brief、Public Research Brief、ticker 状态。
- Hero：显示 NVDA、NVIDIA、页面类型、生成时间、更新时间、Sample / Mock、研究框架来源。
- CTA：提示“想生成你自己的研报？”，按钮为“生成我的研报”，当前无登录逻辑。
- Main Brief Content：白色主阅读卡片，承载研报正文。
- Executive Investment View：浅金重点观点区。
- Company Snapshot：公司概览。
- Industry Chain Position：产业链位置。
- Competitive Landscape：竞争格局。
- Financial Statement Deep Dive：财务深挖。
- Key Value Drivers：核心价值驱动。
- Valuation：估值框架。
- Bull / Base / Bear Scenarios：核心情景分析表格。
- Variant Perception：差异化判断。
- Catalysts：未来 3-6 个月催化剂。
- Key Risks：红棕风险语义模块。
- Monitoring Dashboard：研究监控清单表格。
- Bottom Line：结论收束卡片。
- Source & Method Note：说明当前是 mock / LLM demo、未接真实数据源。
- Disclaimer / Footer：免责声明与更新时间。
- Desktop Table of Contents：桌面端右侧目录，移动端隐藏。

## 7. 组件职责说明

- `BriefPage`
  - 页面总装组件。接收一个 `BriefDocument`，组合 Header、Hero、正文、桌面目录和 Footer。当前 `/` 与 `/s/nvda` 都复用它，并在开发环境中执行轻量 schema 校验。
- `BriefShell`
  - demo 默认壳组件。默认读取 `nvdaBrief`，让首页可以用最少逻辑展示当前 mock brief。
- `BriefHeader`
  - 顶部品牌栏。负责 Moki 品牌、产品名、Public Research Brief 状态标签和 ticker 标签。
- `BriefHero`
  - 顶部信息层级与 CTA 区。负责 ticker、公司名、页面类型、时间、Sample / Mock、研究框架提示、Investment View 摘要和主 CTA。
- `BriefContent`
  - 主研报正文容器。负责按数据渲染 Executive View、普通章节、风险模块、Bottom Line，并插入 ScenarioTable、MonitoringDashboard 和 SourceNote。
- `BriefToc`
  - 桌面端右侧目录。目录项来自 `getBriefTocItems(brief)`，点击后跳转到对应 section anchor；`lg` 以下隐藏。
- `ScenarioTable`
  - Bull / Base / Bear Scenarios 表格。数据来自 `brief.scenarioAnalysis.scenarios`，Base Case 使用浅金高亮，移动端在表格容器内部横向滚动。
- `MonitoringDashboard`
  - 研究监控清单表格。数据来自 `brief.monitoringDashboard.metrics`，Threshold 和 status 使用中性或浅金胶囊样式。
- `SourceNote`
  - 轻量来源与方法说明。说明当前为 mock / LLM demo、参考 buy-side memo 工作流、未接真实 SEC / IR / 股价 / 一致预期。
- `BriefFooter`
  - 页脚与免责声明。数据来自 `brief.disclaimer` 和 `brief.metadata`，保留“本页面仅供研究和信息参考，不构成投资建议。”并显示 Mock Research Page 和更新时间。
- `BriefNotFound`
  - Moki 风格 not-found 状态页。被 `src/app/not-found.tsx` 和 `/s/[slug]` 的未知 slug 分支复用。

## 8. 数据结构说明

### `nvdaBrief`

`src/data/nvdaBrief.ts` 是当前唯一的本地 mock brief 数据。它承担 NVDA 示例研报的全部内容输入，包括标题、元信息、章节、情景表格、风险、监控指标和结论。

当前关键字段包括：

- `schemaVersion`
- `slug`
- `metadata`
- `hero`
- `cta`
- `sections`
- `scenarioAnalysis`
- `monitoringDashboard`
- `sourceNote`
- `disclaimer`

注意：Phase 7 后，当前代码已经有独立的 `scenarioAnalysis`、`monitoringDashboard`、`sourceNote` 和 `disclaimer` 字段。`BriefFooter` 从 `brief.disclaimer` 读取免责声明，`ScenarioTable` 和 `MonitoringDashboard` 也分别从 schema block 读取数据。

### `briefMap`

`src/data/briefs.ts` 导出 `briefMap`：

```ts
export const briefMap = {
  [nvdaBrief.slug]: nvdaBrief,
} satisfies Record<string, BriefDocument>;
```

当前 slug 映射逻辑是：

1. `/s/[slug]` 读取路由参数。
2. `getBriefBySlug(slug)` 将 slug 转小写。
3. 从 `briefMap` 中读取对应 brief。
4. 只有 `nvda` 返回 `nvdaBrief`。
5. 其他 slug 渲染 `BriefNotFound`。

### 为什么不把数据硬编码进组件

当前组件只负责展示，数据从 `nvdaBrief` / `briefMap` 读取。这样做有几个好处：

- 后续可以新增更多 ticker 的 mock brief，而不用复制页面 JSX。
- Phase 7 可以把 brief 数据结构升级为稳定 JSON Schema。
- Phase 8 接入 LLM 后，可以要求模型输出结构化 JSON，再复用同一套渲染组件。
- Phase 9 接入真实数据源后，也可以把 SEC / IR / 股价 / 一致预期转成同一份 BriefDocument。

### Phase 7 为什么要继续标准化 schema

当前 `BriefDocument` 已经能支撑 V0.1 页面，但还不是面向生产生成链路的最终 schema。Phase 7 需要进一步明确：

- metadata 字段哪些必填、哪些可选。
- sections 是否统一支持 table、quote、source、confidence。
- risks 是否需要结构化 severity、evidence、mitigation。
- sourceNotes 是否进入数据结构，而不是只由组件写死。
- disclaimer 是否进入数据结构或保持产品固定文案。
- LLM 输出 JSON 如何校验、修复和拒绝脏数据。

## 9. Moki UI 规范使用说明

当前主要设计令牌定义在 `src/app/globals.css`：

- 暖白背景：`#FCFAF6`
- 深墨正文：`#0C140F`
- 品牌金：`#F2A618`
- hover 金：`#E58900`
- 浅金：`#FFF1CE`
- 强浅金：`#FFE8B8`
- 品牌边框：`#E8CDA1`
- 品牌深棕文字：`#5E3000`
- 风险浅底：`#FFF6F2`
- 风险边框：`#F4CDC6`
- 风险文字：`#65362E`
- 中性边框：`#E0DED8`

当前页面规则：

- 主圆角优先 `8px`。
- 胶囊标签允许 `999px` / `rounded-full`。
- 移动端单列。
- 320px 宽度不允许页面级横向滚动。
- 表格只允许表格容器内部横向滚动。
- 不使用红绿涨跌刺激。
- 不大面积使用金色渐变。
- 主 CTA 每个视觉区域只保留一个。
- 风险模块使用红棕语义色，不使用品牌金表达风险。

## 10. 响应式规则与 QA 结果

Phase 5 已检查以下视口：

- `320 x 568`
- `375 x 812`
- `430 x 932`
- `768 x 1024`
- `1280 x 720`
- `1440 x 900`

QA 结果摘要：

- 移动端目录隐藏。
- 桌面端目录显示。
- 表格在移动端只在表格容器内部横向滚动。
- 页面根节点无横向滚动。
- CTA 移动端可点击，高度为 44px。
- `/s/test` 的 Moki 风格 not-found 页面在移动端正常显示。
- Source & Method Note 和免责声明均正常显示。

详细移动端 QA 记录见：

- `docs/V0_1_MOBILE_QA_REPORT.md`

BriefDocument schema 说明见：

- `docs/V0_1_BRIEF_SCHEMA.md`

LLM / DeepSeek 生成闭环 MVP 说明见：

- `docs/V0_1_LLM_GENERATION_MVP.md`

LLM Demo 数据边界说明见：

- `docs/V0_1_DATA_BOUNDARY.md`

Prompt 质量优化说明见：

- `docs/V0_1_PROMPT_QUALITY.md`

Search Evidence MVP 说明见：

- `docs/V0_1_SEARCH_EVIDENCE_MVP.md`

## 11. 当前明确没有做的内容

为避免后续误解，当前 V0.1 明确没有做：

- 没有提交任何 LLM API Key。
- 没有使用 `NEXT_PUBLIC_DEEPSEEK_API_KEY` 或任何前端可见 key。
- 没有接入 OpenAI provider；Phase 8 的可选 provider 是 DeepSeek。
- 没有接入 Anthropic。
- 没有接入 serenity-skill 真实执行。
- 没有接入 SEC。
- 没有接入公司 IR。
- 没有接入实时股价。
- 没有接入一致预期。
- 没有数据库。
- 没有登录。
- 没有正式用户生成任务或保存逻辑。
- 没有保存真实分享页。
- `/generate` 只做内部临时预览，不生成真实公开链接。
- 当前 NVDA 内容和无 key 生成结果都是 mock demo。

## 12. 本地运行方式

首次安装依赖：

```bash
npm install
```

启动本地开发服务：

```bash
npm run dev
```

访问：

- `http://localhost:3000`
- `http://localhost:3000/s/nvda`
- `http://localhost:3000/s/test`
- `http://localhost:3000/generate`

质量检查：

```bash
npm run lint
npm run build
```

Windows PowerShell 如果遇到 `npm.ps1` 执行策略限制，可以使用：

```bash
npm.cmd run lint
npm.cmd run build
```

## 13. 环境变量说明

当前默认使用 mock provider，不需要任何 API Key。若本地测试 DeepSeek provider，只能在 `.env.local` 中配置真实 key。

项目提供 `.env.example`：

```text
LLM_PROVIDER=mock
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# 可选模型：
# DEEPSEEK_MODEL=deepseek-chat
# DEEPSEEK_MODEL=deepseek-reasoner
```

真实密钥只能放在 `.env.local`。当前 `.gitignore` 使用 `.env*` 和 `.env.local` 保护真实环境变量文件，并通过 `!.env.example` 允许提交示例文件。

历史说明：Ark / 火山方舟 provider 已停用，不再推荐配置 `ARK_API_KEY`、`ARK_BASE_URL`、`ARK_MODEL`。

## 14. 质量检查结果

本阶段最终检查结果：

- `npm run lint`：通过。
- `npm run build`：通过。

在当前 Windows / Codex 环境中，实际执行使用的是：

- `npm.cmd run lint`
- `npm.cmd run build`

## 15. 后续开发路线

### Phase 7：研报数据结构标准化

状态：已完成 V0.1 schema 标准化。

已完成：

- 把 `nvdaBrief` 重构成更稳定的 Brief JSON Schema。
- 明确 `sections`、`tables`、`risks`、`sourceNotes`、`metadata` 的统一格式。
- 为后续 LLM 输出 JSON 做准备。
- 不接真实 API。

已输出：

- `src/types/brief.ts` 的 schema 收敛。
- `src/data/nvdaBrief.ts` 已符合 `BriefDocument`。
- `docs/V0_1_BRIEF_SCHEMA.md`。
- `src/lib/briefs/validateBrief.ts` 轻量校验函数。

### Phase 8：LLM / DeepSeek 生成闭环 MVP

状态：已完成 MVP。

已完成：

- 新增 `POST /api/generate-brief`。
- 新增 `mockProvider`，无 key 环境默认可用。
- 新增 `deepseekProvider`，当 `LLM_PROVIDER=deepseek` 且配置 `DEEPSEEK_API_KEY` 时可调用 DeepSeek 官方 API。
- 支持 `deepseek-chat` 快速生成模式。
- 支持 `deepseek-reasoner` 深度推理模式。
- `/generate` 页面可选择 Fast / Deep Reasoning。
- reasoner 可能返回 `reasoning_content`，但本项目不展示、不保存、不传回，只读取最终 `content` 渲染 `BriefDocument`。
- 新增 `metadata.dataMode` 数据边界。当前实际使用 `mock` 和 `llm-demo-no-live-data`。
- 新增 `EvidencePack` 类型，为 Phase 9 实时搜索和证据链预留，但当前不接真实数据源。
- 新增 `DataBoundaryNote` 组件，公开页与生成页都显示 No Live Data 状态。
- `validateBriefDocument` 会检查 dataMode、sourceNote、disclaimer，以及没有 evidencePack 时不能声称使用真实数据源。
- Phase 8.3 重构 buy-side-equity-research-memo prompt，强化公开分享版买方 memo 写作规则、章节质量要求和 No Live Data 边界。
- 新增 `assessBriefQuality`，用于生成 Quality Warnings；它不替代 `validateBriefDocument`，只提示内容质量问题。
- Prompt builder 已预留 `evidencePack?: EvidencePack` 注入点，供 Phase 9.1 实时内容搜索后使用。
- 输入 ticker，输出结构化 `BriefDocument` JSON。
- 生成后调用 `validateBriefDocument`。
- 前端 `/generate` 复用当前 Brief 组件渲染结果，并区分显示 Validation Issues 与 Quality Warnings。
- 输出 `docs/V0_1_LLM_GENERATION_MVP.md`。
- 输出 `docs/V0_1_PROMPT_QUALITY.md`。

注意：Phase 8 只完成生成闭环 MVP，不保存生成结果，不生成真实 `/s/[slug]`，不接真实数据源，也不执行 serenity-skill。

### Phase 9.1：Search Evidence Pack MVP

状态：已完成 MVP。

已完成：

- 新增 `SEARCH_PROVIDER=mock|tavily` 配置。
- 新增 `mockSearchProvider`，无 Tavily key 时默认可用。
- 新增 `tavilySearchProvider`，只在服务端读取 `TAVILY_API_KEY`。
- 新增 `buildSearchEvidencePack`，生成 `EvidencePack.newsItems` 与 `sources`。
- 新增 `POST /api/search-evidence`。
- `POST /api/generate-brief` 支持 `useSearch=true`。
- DeepSeek prompt 支持注入 `evidencePack`，并要求 `dataMode="evidence-draft"`。
- `/generate` 新增 Use real-time web search 开关和 Source Evidence 面板。
- `validateBriefDocument` 与 `assessBriefQuality` 增加 Search Evidence Draft 边界检查。
- 输出 `docs/V0_1_SEARCH_EVIDENCE_MVP.md`。

注意：Phase 9.1 只是搜索证据草稿，不接 SEC、实时股价、一致预期、数据库，不保存生成结果，也不能标记 `verified-real-data`。

### Phase 9：真实数据源与多股票生成

目标：

- 接 SEC / IR / 财报 / 股价 / 一致预期。
- 支持多股票 brief。
- 保存生成结果。
- 生成真实 `/s/[slug]` 分享页。

建议在 Phase 9 开始前先确定：

- 数据源优先级。
- 引用证据结构。
- 数据时间戳。
- 置信度与缺失数据展示方式。
- 分享页保存和权限边界。

## 16. 重要边界

- 默认不要接 API Key；本地测试 DeepSeek 时只能放在 `.env.local`。
- 不能把 API Key 写进前端组件。
- 不能提交真实 `.env.local` 到 GitHub。
- 不能使用 `NEXT_PUBLIC_DEEPSEEK_API_KEY`。
- 当前所有生成内容都是 mock / LLM demo / no-live-data，不可作为投资建议。
- 页面必须持续显示 Sample / Mock / LLM Demo 和免责声明。
- 不要用当前 NVDA 文案暗示真实评级、真实目标价或个性化建议。
- 后续接入真实数据源前，必须先完成证据链、来源日期、置信度和缺失数据展示方案。

### Phase 9.1.1: Search Evidence QA

Status: completed in this iteration.

Added source quality control for Search Evidence Draft:

- `src/lib/search/sourceQuality.ts` for URL normalization, domain classification, confidence scoring, dedupe, ranking, and repeated-domain caps.
- EvidencePack sources/newsItems now carry `domain`, `confidence`, `dateStatus`, `qualityReason`, and `sourceRank`.
- `/generate` Source Evidence panel displays High / Medium / Low counts, evidence warnings, domain, confidence, and `Published` vs `Retrieved only` dates.
- Prompt, `validateBriefDocument`, and `assessBriefQuality` now understand evidence source confidence and Search Evidence Draft quality warnings.
- New doc: `docs/V0_1_SEARCH_EVIDENCE_QA.md`.

### Phase 9.2: SEC Evidence MVP

Status: completed in this iteration.

Added SEC EDGAR JSON evidence support:

- `src/lib/sec/*` for SEC config, CIK mapping, SEC fetch client, real/mock SEC providers, companyfacts extraction, and compact prompt payloads.
- `POST /api/sec-evidence` returns `SecEvidencePack` with CIK, recent filings, fiscal facts, sources, and warnings.
- `POST /api/generate-brief` supports `useSec=true` and can combine Search Evidence Draft with SEC Evidence Draft.
- `/generate` adds `Use SEC official data` and a `SecEvidencePanel`.
- `BriefDocument` can now carry `secEvidencePack` separately from search `evidencePack`.
- `metadata.dataMode` remains `evidence-draft`; `verified-real-data` remains forbidden.

Full handoff: `docs/V0_1_SEC_EVIDENCE_MVP.md`.

### Phase 9.3: Research Evidence Context

Status: completed in this iteration.

Added a unified evidence context layer:

- `ResearchEvidenceContext` combines Search Evidence and SEC Evidence without mixing their factual roles.
- `sourceRegistry` provides a unified source list with confidence, source kind, source type, and linked facts.
- `factLedger` separates official SEC financial facts, SEC filing metadata, recent search developments, risk catalysts, and low-confidence market discussion.
- `coverage` explicitly marks missing real-time market price, consensus estimates, and company IR narrative.
- `/generate` adds `ResearchEvidencePanel` and displays Evidence Level, Coverage, Missing Data, Source Registry Summary, and Fact Ledger Summary.
- Prompt injection now uses compact ResearchEvidenceContext rather than separate raw search/SEC payloads.

Full handoff: `docs/V0_1_RESEARCH_EVIDENCE_CONTEXT.md`.

### Phase 9.3.1: Evidence Status Copy Fix

Status: completed in this iteration.

This phase does not add data sources or generation features. It fixes user-facing evidence status copy for `evidenceLevel=search-and-sec` so the page no longer says SEC is missing when `SEC Provider=sec` or `secEvidencePack` is attached.

The copy now distinguishes:

- `none`: LLM Demo / No Live Data.
- `search-only`: Search Evidence Draft.
- `sec-only`: SEC Evidence Draft.
- `search-and-sec`: Search + SEC Evidence Draft.

`dataMode` remains `evidence-draft`; real-time market price, consensus estimates, company IR narrative parsing, database save, and manual verification remain out of scope.

### Phase 9.4: Company IR / Earnings Release Evidence MVP

Status: completed in this iteration.

Added Company IR / earnings-release evidence support:

- `IrEvidencePack` and `IrEvidenceItem` types.
- `src/lib/ir/*` provider layer with `mock` and `search` modes.
- `IR_PROVIDER=search` reuses existing Tavily/search capability and does not add a new API key.
- `POST /api/ir-evidence`.
- `POST /api/generate-brief` supports `useIr=true`.
- `ResearchEvidenceContext` can combine Search + SEC + IR evidence.
- New evidence levels: `ir-only`, `search-and-ir`, `sec-and-ir`, `search-sec-and-ir`.
- Coverage now includes Company IR, earnings release, management commentary, and guidance context flags.
- `/generate` adds `Use Company IR / earnings release` and `IrEvidencePanel`.
- Prompt rules distinguish Search, SEC, and IR evidence roles.

Important boundaries:

- IR evidence is company official narrative / management commentary / business-update context only.
- IR evidence must not become SEC official-financial facts.
- IR guidance must be called company guidance context, not consensus.
- The project still does not connect real-time market price, consensus estimates, database persistence, saved share links, PDF full-text parsing, transcript full-text parsing, or manual verification.
- `dataMode` remains `evidence-draft`; `verified-real-data` remains forbidden.

Full handoff: `docs/V0_1_COMPANY_IR_EVIDENCE_MVP.md`.

### Phase 9.5: Free Market Evidence MVP

Status: completed in this iteration.

Added Market Evidence support based on public `global-stock-data` request patterns:

- `MarketEvidencePack`, `MarketQuote`, and `MarketPricePoint` types.
- `src/lib/market/*` provider layer with `mock` and `global-stock-data` modes.
- `MARKET_PROVIDER=auto-free`, `MARKET_MAX_DAILY_POINTS=30`, and `MARKET_DATA_REGION=auto`.
- `POST /api/market-evidence`.
- `POST /api/generate-brief` supports `useMarket=true`.
- `ResearchEvidenceContext` can combine Search + SEC + IR + Market evidence.
- New evidence levels include `market-only`, `search-and-market`, `sec-and-market`, `ir-and-market`, and `search-sec-ir-and-market`.
- Coverage now includes Market Price, Market Volume, Market Price History, and Market Cap flags.
- `/generate` adds `Use Market Data` and `MarketEvidencePanel`.
- Prompt rules distinguish Search, SEC, IR, and Market roles.

Important boundaries:

- Market evidence is quote / volume / recent daily kline context only.
- Market evidence is not SEC official-financial data.
- Market evidence is not consensus.
- Market evidence is not a formal trading quote, trading signal, formal rating, or formal target price.
- Consensus estimates, database persistence, saved share links, and manual verification remain missing.
- `dataMode` remains `evidence-draft`.

Full handoff: `docs/V0_1_MARKET_DATA_MVP.md`.

### Phase 9.5.1: stock-api provider + auto-free fallback

Status: completed in this iteration.

Added `stock-api` as a server-side Market Evidence provider:

- Installed `stock-api`.
- Added `stockApiMarketProvider`.
- Added `MARKET_PROVIDER=auto-free` as the recommended default.
- `auto-free` fallback order is `stock-api -> global-stock-data -> mock`.
- `/api/market-evidence` returns `providerChain`, `attemptedProviders`, and fallback warnings.
- `/generate` remains compatible with Search + SEC + IR + Market Evidence Draft.
- `ResearchEvidenceContext` shape is unchanged except for the market provider fields.
- Market Evidence remains evidence-draft only, not verified-real-data, not consensus, not a formal trading quote, not a formal target price, and not a formal rating.

Future commercial-grade providers such as Twelve Data, Polygon, or Finnhub remain out of scope for this phase.
