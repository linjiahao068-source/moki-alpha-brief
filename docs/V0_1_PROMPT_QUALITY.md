# V0.1 Prompt Quality Report

## Phase 8.3 目标

Phase 8.3 的目标是优化 DeepSeek 生成质量，让 `/generate` 输出的 Alpha Brief 更接近公开分享版买方深度研报页，同时继续保留 LLM Demo / No Live Data 数据边界。

本阶段只优化 prompt、质量自检和生成页展示，不接实时搜索、SEC、公司 IR、实时股价、一致预期、数据库，也不保存生成结果。

## 为什么要做 Prompt 质量优化

Phase 8 已经跑通生成闭环，但“能生成 JSON”不等于“像一份买方 memo”。Prompt 质量优化解决三个问题：

- 让章节有明确研究功能，而不是普通科普文章。
- 让 Bull / Base / Bear、Monitoring Dashboard、Key Risks 等核心模块更稳定。
- 在没有 evidencePack 的情况下，防止模型把模拟内容写成真实财务事实或实时行情。

## deepseek-chat 与 deepseek-reasoner

- `deepseek-chat`：Fast 模式，适合快速生成，重点是结构稳定、JSON 合法、内容简洁。
- `deepseek-reasoner`：Deep Reasoning 模式，适合复杂研报结构推理，内容可以更完整，但最终只能返回 BriefDocument JSON。

Deep Reasoning 可能产生 `reasoning_content`，本项目不展示、不保存、不传回下一轮请求，只读取最终 `content` 作为 BriefDocument JSON 来源。

## 当前仍未接入实时数据

当前生成结果没有接入：

- SEC
- 公司 IR
- 实时股价
- 一致预期
- 新闻检索
- 数据库

因此 DeepSeek 生成结果必须使用：

```text
metadata.dataMode = "llm-demo-no-live-data"
```

## Prompt 数据边界规则

Prompt 强制要求：

- 输出必须是一个合法 JSON 对象。
- 输出必须符合 BriefDocument Schema。
- 不输出 Markdown、代码围栏、解释性前言或对话式内容。
- 不得声称使用 SEC、IR、实时股价、一致预期或新闻检索。
- 不得写“根据最新财报”“根据实时行情”“根据 SEC 文件”“市场一致预期显示”等说法。
- 不得伪造 citation、URL、来源编号、SEC 链接或新闻来源。
- 涉及收入、EPS、估值倍数、目标价、隐含收益、市场份额等数字时，必须标记“模拟”“示例”“待核查”或 `N/A`。
- `sourceNote` 必须写明当前为 LLM Demo / No Live Data。
- `disclaimer` 必须写明不构成投资建议。

## 各章节质量要求

Prompt 要求生成以下结构：

- Executive Investment View：像投资委员会摘要，结论先行。
- Company Snapshot：说明业务结构，但不虚构实时财务数字。
- Industry Chain Position：说明产业链位置、上下游、利润池和瓶颈。
- Competitive Landscape：说明竞争者、护城河、替代风险和生态位置。
- Financial Statement Deep Dive：没有 evidencePack 时只写分析框架和待核查指标。
- Key Value Drivers：说明估值与市场认知真正受什么驱动。
- Valuation：只写情景估值框架，不写真实目标价承诺。
- Variant Perception：说明市场可能误判什么。
- Catalysts：写未来 3-6 个月需要观察的事件类型。
- Key Risks：风险要克制、具体、可跟踪。
- Monitoring Dashboard：像投资跟踪清单。
- Bottom Line：收束结论，并说明后续需要 evidencePack 才能升级为真实研究。

每个 section 应包含 1-3 个 blocks。段落控制在 2-4 句，关键点使用 `bulletList`，核心判断或争议点可使用 `callout`。

## Bull / Base / Bear 输出要求

- 必须包含 Bull、Base、Bear 三种情景。
- 概率合计应接近 100%。
- Base Case 应是最中性、最可信的路径。
- 假设要具体，但数字必须标记模拟、示例、待核查或 N/A。
- Target Price 和 Implied Return 不能像真实投资建议，应写成“模拟目标价”“示例区间”或“N/A - 待接入真实数据”。

## Monitoring Dashboard 输出要求

- 至少 6 个指标。
- 每个指标包含 `metric`、`whyItMatters`、`threshold`。
- Threshold 必须可观察。
- 没有真实数据时，threshold 使用“待接入数据后跟踪”“示例阈值”或“N/A - 待核查”。

## assessBriefQuality 检查项

新增：

```text
src/lib/briefs/assessBriefQuality.ts
```

它导出：

```ts
assessBriefQuality(brief: BriefDocument): string[]
```

它不是强制校验，不会替代 `validateBriefDocument`。它只返回质量提示，例如：

- 是否缺少 Executive View。
- 是否缺少 Bull / Base / Bear。
- 是否缺少 Monitoring Dashboard。
- 是否缺少 Key Risks。
- 是否缺少 Bottom Line。
- 是否缺少 sourceNote 或 disclaimer。
- 是否缺少 dataMode。
- Monitoring Dashboard 是否少于 6 个指标。
- scenarioAnalysis 是否少于 3 个情景。
- 没有 evidencePack 时是否出现疑似实时数据、SEC、IR、一致预期或新闻检索声称。

## 如何在 /generate 页面验收

打开：

```text
http://localhost:3000/generate
```

检查：

- Fast / `deepseek-chat` 可以生成。
- Deep Reasoning / `deepseek-reasoner` 可以生成。
- 页面显示 `dataMode`。
- 页面显示 Evidence Pack: `None / No Live Data`。
- 页面显示 Validation Issues。
- 页面显示 Quality Warnings。
- 页面不展示 `reasoning_content`。
- 页面不声称使用实时数据。

## Phase 9.1 evidencePack 注入点

Prompt builder 已预留：

```ts
evidencePack?: EvidencePack
```

Phase 9.1 已接入 Search Evidence MVP。`useSearch=true` 时，后端会生成 `EvidencePack.newsItems` 并注入 prompt。

有 evidencePack 时，prompt 要求：

- `metadata.dataMode = "evidence-draft"`。
- 只能基于 `evidencePack.newsItems` 和 `evidencePack.sources` 讨论近期内容。
- 不得把搜索证据草稿写成 `verified-real-data`。
- 不得声称接入 SEC、实时股价、一致预期或数据库。
- 不得基于搜索摘要推导真实财务数字。

没有 evidencePack 时，仍然保持 `llm-demo-no-live-data`。

## 当前禁止事项

- 不伪造 SEC。
- 不伪造实时股价。
- 不伪造一致预期。
- 不伪造新闻来源。
- 不把 demo 当真实投资建议。
- 不把 LLM Demo 标记成 verified-real-data。
- 不保存生成结果。
- 不生成真实公开分享链接。
