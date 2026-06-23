# V0.1 Search Evidence MVP

## Phase 9.1 目标

Phase 9.1 的目标是给 DeepSeek 生成闭环增加第一版实时网页内容搜索能力：

用户输入 ticker -> 后端搜索近期公开网页内容 -> 生成 `EvidencePack.newsItems` -> DeepSeek 基于 EvidencePack 生成 `BriefDocument` -> `/generate` 页面显示 Search Evidence Draft 和来源列表。

本阶段不接 SEC、实时股价、一致预期、数据库，不保存生成结果，也不生成真实 `/s/[slug]` 分享页。

## 为什么先做实时搜索，不直接做 SEC

实时搜索适合作为低成本证据草稿，用来验证：

- 前端如何展示来源列表。
- Prompt 如何只基于外部证据包做近期内容判断。
- `dataMode` 如何从 `llm-demo-no-live-data` 升级到 `evidence-draft`。
- 搜索失败时如何 fallback，不让页面白屏。

SEC 官方数据需要更严格的公司映射、filing 解析、字段标准化和证据链校验，适合放到后续 Phase 9.2。

## Search Evidence Pack 结构

核心类型位于：

```text
src/types/evidence.ts
```

Phase 9.1 的 EvidencePack 重点字段：

- `asOf`：搜索证据包生成时间。
- `ticker`：股票代码。
- `companyName`：可选公司名。
- `dataMode`：本阶段只能是 `evidence-draft`。
- `searchProvider`：`mock` 或 `tavily`。
- `querySet`：后端生成的搜索查询集合。
- `sources`：标准化来源元数据。
- `newsItems`：供 prompt 使用的近期公开网页内容摘要。
- `warnings`：搜索 fallback 或 mock evidence 提示。

`evidence-draft` 只代表搜索证据草稿，不代表事实已验证。

## Provider

### mockSearchProvider

默认 provider。不需要 API key，用于本地开发和无搜索 key 环境。

特点：

- 返回 3-5 条模拟搜索结果。
- title / snippet 明确写 `Mock search result` 或“模拟搜索结果”。
- EvidencePack 使用 `searchProvider: "mock"`。
- warnings 说明这是 mock search evidence。

### tavilySearchProvider

真实搜索 provider。使用 Tavily Search API，只有在配置以下环境变量时启用：

```env
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=你的 Tavily API Key
TAVILY_SEARCH_DEPTH=basic
TAVILY_MAX_RESULTS=5
```

`TAVILY_API_KEY` 只能放在 `.env.local`，不能放进代码、README、docs、`.env.example` 或前端组件。

## 环境变量

默认配置：

```env
SEARCH_PROVIDER=mock
TAVILY_API_KEY=
TAVILY_SEARCH_DEPTH=basic
TAVILY_MAX_RESULTS=5
```

如果使用 Tavily：

```env
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=你的 Tavily API Key
```

禁止使用：

```env
NEXT_PUBLIC_TAVILY_API_KEY=
```

## API

### POST /api/search-evidence

Request:

```json
{
  "ticker": "NVDA",
  "companyName": "NVIDIA",
  "maxResults": 5
}
```

Response:

```json
{
  "ok": true,
  "provider": "mock",
  "isFallback": false,
  "evidencePack": {},
  "warnings": []
}
```

缺少 Tavily key 或搜索失败时会 fallback 到 `mockSearchProvider`，不会暴露 API key，也不会保存结果。

### POST /api/generate-brief useSearch=true

Request:

```json
{
  "ticker": "NVDA",
  "companyName": "NVIDIA",
  "language": "zh-CN",
  "modelMode": "chat",
  "useSearch": true
}
```

流程：

1. 后端先调用 `buildSearchEvidencePack`。
2. 得到 `EvidencePack`。
3. 把 `EvidencePack` 注入 DeepSeek prompt。
4. DeepSeek 生成 `BriefDocument`。
5. `validateBriefDocument` 和 `assessBriefQuality` 继续执行。
6. `/generate` 显示 Source Evidence 面板。

## dataMode 说明

- `llm-demo-no-live-data`：没有 evidencePack，只是 LLM Demo。
- `evidence-draft`：有搜索证据草稿，但未完成事实验证。
- `verified-real-data`：当前禁止使用，未来必须有更完整 evidencePack、SEC / IR / 市场数据链路和校验后才允许。

`evidence-draft` 不是 `verified-real-data`。它不能被理解为真实买方研报、正式评级或投资建议。

## 当前仍未接入

- SEC
- 实时股价
- 一致预期
- 数据库
- 保存分享页
- 登录系统
- 真实 `/s/[slug]` 保存发布

## 后续 Phase 9.2

Phase 9.2 建议做 SEC 官方数据 MVP：

- ticker -> CIK 映射。
- SEC company facts / filings 获取。
- filing 时间戳和 URL 结构化。
- EvidencePack 增加 `secData`。
- Prompt 只允许基于 EvidencePack 做 SEC 事实陈述。

## 安全边界

- 不构成投资建议。
- 不伪造来源。
- 不把搜索摘要当完整事实验证。
- 不把 Tavily / mock 搜索结果标记为 `verified-real-data`。
- 不把 Tavily key 放到前端。
- 不展示或保存 `reasoning_content`。

## Phase 9.1.1 Search Evidence QA

Phase 9.1.1 adds source quality control on top of the Search Evidence MVP:

- `src/lib/search/sourceQuality.ts` normalizes URLs, extracts domains, classifies source confidence, dedupes results, ranks sources, and caps repeated domains.
- Evidence sources now include `domain`, `confidence`, `dateStatus`, `qualityReason`, and `sourceRank`.
- Source Evidence UI shows High / Medium / Low counts and no longer shows raw `date n/a`; missing publish dates are shown as `Retrieved only`.
- Low-confidence sources such as Reddit, Perplexity, forums, social media, and generic AI answer pages are marked as draft discussion signals, not fact bases.
- Prompt rules ask DeepSeek to use high / medium confidence evidence for Catalysts and Key Risks, and to avoid strong conclusions from low-confidence sources.

Full handoff: `docs/V0_1_SEARCH_EVIDENCE_QA.md`.

## Phase 9.2 SEC Evidence MVP

Phase 9.2 adds a separate SEC Evidence Draft path using SEC EDGAR JSON endpoints. Search Evidence Pack remains available and can be combined with SEC Evidence Draft, but the two evidence types remain separate in data and prompt rules.

See: `docs/V0_1_SEC_EVIDENCE_MVP.md`.

## Phase 9.3 Research Evidence Context

Phase 9.3 keeps Search Evidence as a recent-context draft and merges it with SEC Evidence through `ResearchEvidenceContext`.

Search snippets remain separate from official SEC financial facts. See: `docs/V0_1_RESEARCH_EVIDENCE_CONTEXT.md`.

## Phase 9.3.1 Evidence Status Copy Fix

Phase 9.3.1 clarifies the Source Evidence panel copy. When Search Evidence and SEC Evidence are both attached, the Source Evidence panel now says it only displays web search evidence, while SEC companyfacts / submissions are shown separately in the SEC / Research Evidence sections. Search evidence remains draft context and is not SEC data, real-time price data, consensus data, or verification-grade real data.
