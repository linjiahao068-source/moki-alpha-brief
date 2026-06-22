# V0.1 Data Boundary

## Phase 8.2 目标

Phase 8.2 建立 LLM Demo 数据边界与防误读机制。

本阶段不接搜索 API、不接 SEC、不接公司 IR、不接实时股价、不接一致预期、不接数据库，也不保存生成结果。

核心目标是：在 Phase 9 接入实时内容搜索和 evidence pack 之前，先让页面、schema、prompt 和校验逻辑都明确区分 mock / LLM demo / evidence draft / verified real data。

## 为什么要做数据边界

Moki Alpha Brief 的页面形态接近正式买方研报。如果 LLM Demo 输出带有价格、收入、EPS、估值倍数、目标价或隐含收益，用户可能误以为这是实时行情、真实财报数据或正式投资建议。

因此 V0.1 必须做到：

- 没有真实来源时，不能标记 verified real data。
- 没有 evidencePack 时，不能声称使用 SEC、IR、实时股价、一致预期或新闻检索。
- 所有 LLM Demo 内容都必须显示 No Live Data。
- 模拟财务数字必须带“模拟”或“示例”语义。
- 页面必须持续显示免责声明。

## dataMode 含义

`metadata.dataMode` 当前支持四种状态：

- `mock`
  - 本地静态 mock 或 mock provider 结果。
  - 不连接实时数据。
  - 当前 `/`、`/s/nvda` 静态示例使用该状态。
- `llm-demo-no-live-data`
  - LLM 生成结果。
  - 没有真实 SEC、IR、实时股价、一致预期或新闻检索。
  - 当前 `/generate` 的 DeepSeek 结果使用该状态。
- `evidence-draft`
  - 未来 Phase 9 预留。
  - 表示有 evidencePack，但仍处于来源草稿或待核验状态。
- `verified-real-data`
  - 未来 Phase 9+ 预留。
  - 表示有 evidencePack、来源时间戳和证据链，且通过产品定义的真实数据校验。

当前允许实际显示的状态只有：

- `mock`
- `llm-demo-no-live-data`

## evidencePack 边界

新增类型 `EvidencePack`，用于未来结构化真实来源：

- SEC
- 公司 IR
- 新闻
- 市场数据
- 一致预期
- 人工来源

当前只定义类型，不实现真实数据抓取。

如果没有 `evidencePack`：

- 不能标记 `verified-real-data`。
- 不能标记 `evidence-draft`。
- 不能声称“根据 SEC 文件”“根据实时行情”“根据最新财报”“使用一致预期”等。

## Prompt 防编造规则

Prompt 已要求模型：

- 只能输出 JSON。
- 输出必须符合 BriefDocument Schema。
- `metadata.dataMode` 必须为 `llm-demo-no-live-data`。
- 不得声称使用 SEC、公司 IR、实时股价、一致预期或新闻检索。
- 不得写“根据最新财报”“根据实时行情”“根据 SEC 文件”等说法。
- 如果出现财务数字、估值倍数、目标价或隐含收益，必须标记为“模拟”或“示例”。
- `sourceNote` 必须说明当前为 LLM Demo，未接入真实数据源。
- `disclaimer` 必须说明不构成投资建议。

## validateBriefDocument 新增检查

`validateBriefDocument` 现在会检查：

- `metadata.dataMode` 必须存在。
- `metadata.dataMode` 必须是允许值之一。
- `verified-real-data` 必须有 `evidencePack`。
- `evidence-draft` 必须有 `evidencePack`。
- 没有 `evidencePack` 时，不能声称使用 SEC、IR、实时股价、一致预期或新闻检索。
- 必须存在 `sourceNote.paragraphs`。
- 必须存在 `disclaimer.text`。

校验不会过度严格阻断所有生成。如果模型输出有问题，`/generate` 会显示 issues，并 fallback 到 mockProvider。

## DataBoundaryNote 组件

新增组件：

```text
src/components/brief/DataBoundaryNote.tsx
```

显示规则：

- `mock`：Mock Demo / No Live Data
- `llm-demo-no-live-data`：LLM Demo / No Live Data
- `evidence-draft`：Evidence Draft / Sources Attached
- `verified-real-data`：Verified Real Data

当前页面实际应只看到：

- Mock Demo / No Live Data
- LLM Demo / No Live Data

该组件会说明：当前未接入实时数据源，数字和判断仅为演示结构。

## Phase 9 预留

Phase 9 可以在此基础上实现 `SearchEvidenceProvider`：

- `searchNews(ticker)`
- `searchCompanyIr(ticker)`
- `fetchSecFacts(ticker)`
- `fetchMarketSnapshot(ticker)`

未来接入后，必须先形成 evidencePack，再允许页面进入 `evidence-draft` 或 `verified-real-data` 状态。

## 当前仍未接入

- SEC
- 公司 IR
- 实时股价
- 一致预期
- 新闻检索
- 数据库
- 保存生成结果
- 真实公开分享链接

## 安全边界

- 当前内容不构成投资建议。
- 不把 LLM Demo 当真实研报。
- 不把模拟数字当真实财务数据。
- 不删除 Sample / Mock / LLM Demo。
- 不删除免责声明。
- 不展示、保存或回传 `reasoning_content`。
