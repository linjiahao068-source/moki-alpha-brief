# V0.1 LLM Generation MVP

## Phase 8 目标

Phase 8 的目标是建立一个最小可用的生成闭环：

用户输入 ticker -> `POST /api/generate-brief` -> 服务端 provider 生成 `BriefDocument` JSON -> `validateBriefDocument` 校验 -> `/generate` 页面预览生成结果。

当前仍然是 MVP，不保存结果，不生成真实 `/s/[slug]` 分享页，不接数据库、不接登录、不接 SEC、不接公司 IR、不接实时股价、不接一致预期。

## 当前实现范围

- 新增 `POST /api/generate-brief`。
- Provider 当前为 `mockProvider` + `deepseekProvider`。
- 默认使用 `mockProvider`，无 API Key 时项目仍可运行。
- DeepSeek 官方 API 兼容 OpenAI SDK，当前继续使用 `openai` npm SDK。
- Phase 8.1 新增 `deepseek-reasoner` 深度推理模式。
- Phase 8.2 新增数据边界机制：`dataMode`、EvidencePack 预留、DataBoundaryNote 和更严格的 No Live Data 校验。
- Phase 8.3 新增 Prompt 质量优化：买方 memo 写作规则、Quality Warnings 和 evidencePack prompt 注入点。
- Phase 9.1 新增 Search Evidence MVP：`useSearch=true` 时先构建 `EvidencePack.newsItems`，再把 EvidencePack 注入 DeepSeek prompt。
- 新增 buy-side memo prompt，要求模型输出 `BriefDocument` JSON。
- 新增轻量 `briefJsonSchema`，用于约束 LLM 输出结构。
- 生成后调用 `validateBriefDocument`。
- 生成后调用 `assessBriefQuality`，返回非阻断的 `qualityWarnings`。
- 新增 `/generate` 内部测试页，用现有 Brief 页面组件预览生成结果。
- `/generate` 可选择 Use real-time web search，当前只生成 Search Evidence Draft，不保存分享页。
- 原 Ark provider 已停用，不再推荐。

## API Route

路径：

```text
POST /api/generate-brief
```

请求示例：

```json
{
  "ticker": "NVDA",
  "companyName": "NVIDIA",
  "language": "zh-CN"
}
```

成功响应示例：

```json
{
  "ok": true,
  "provider": "deepseek",
  "model": "deepseek-chat",
  "isFallback": false,
  "brief": {},
  "issues": [],
  "qualityWarnings": []
}
```

`ticker` 会做基础清洗：`trim`、`uppercase`，只允许 `A-Z`、`0-9`、`.`、`-`，长度 1 到 12。当前接口不会保存生成结果，也不会自动创建公开分享页。

Phase 9.1 后，请求体可增加：

```json
{
  "useSearch": true
}
```

当 `useSearch=true` 时，后端先调用 `buildSearchEvidencePack`，生成 `EvidencePack` 后注入 prompt。成功结果应使用 `metadata.dataMode: "evidence-draft"`，但仍不能标记 `verified-real-data`。

## Provider 说明

### mock provider

默认 provider。它不需要 API Key。

- 输入 `NVDA` 时，基于当前本地 NVDA mock brief 生成 preview。
- 输入其他 ticker 时，使用 NVDA mock 结构做安全替换，生成 demo brief。
- `metadata.isMock` 固定为 `true`。
- `metadata.dataMode` 标记为 `mock`。
- `sourceNote` 明确说明未接入真实 SEC、IR、实时股价或一致预期。

### DeepSeek provider

DeepSeek provider 使用 DeepSeek 官方 API：

```text
https://api.deepseek.com
```

DeepSeek API 兼容 OpenAI SDK，因此项目继续使用 `openai` npm SDK，但 provider 名称是 `deepseekProvider`，返回 provider 名称为 `deepseek`。

只有同时满足以下条件才会尝试调用 DeepSeek：

- `LLM_PROVIDER=deepseek`
- `DEEPSEEK_API_KEY` 已配置

如果 `LLM_PROVIDER=deepseek` 但缺少 key，系统会返回 mock fallback，并在结果中标记 `isFallback: true`，错误信息为 `Missing DEEPSEEK_API_KEY`。

默认模型是 `deepseek-chat`。Phase 8.1 后，`/generate` 页面可以直接选择：

- Fast：使用 `deepseek-chat`，适合快速生成。
- Deep Reasoning：使用 `deepseek-reasoner`，适合复杂研报结构推理，速度可能更慢、成本可能更高。

如果使用 `deepseek-reasoner`，DeepSeek 可能返回 `reasoning_content` 和最终 `content`。本项目只读取最终 `content` 作为 `BriefDocument` JSON 来源，不展示、不保存、不传回 `reasoning_content`。

实现约束：

- `deepseek-chat` 请求可以传 `temperature: 0.3`。
- `deepseek-reasoner` 请求不传 `temperature`、`top_p`、`presence_penalty`、`frequency_penalty`。
- 两种模式都要求 `response_format: { type: "json_object" }`，并设置合理 `max_tokens`，避免 JSON 被截断。
- 如果 `response_format` 在某次请求中不可用，会降级为强 prompt JSON 输出、提取 JSON、`JSON.parse`、再运行 `validateBriefDocument`。

## 环境变量

示例见 `.env.example`：

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# 可选模型：
# DEEPSEEK_MODEL=deepseek-chat
# DEEPSEEK_MODEL=deepseek-reasoner
```

DeepSeek 配置方式：

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

如果要测试推理模型：

```env
DEEPSEEK_MODEL=deepseek-reasoner
```

`DEEPSEEK_API_KEY` 只能放在 `.env.local`。不要使用 `NEXT_PUBLIC_DEEPSEEK_API_KEY`，因为任何 `NEXT_PUBLIC_` 变量都会进入前端包。当前 `.gitignore` 已保护 `.env.local`。

历史说明：Ark / 火山方舟 provider 已停用，不再推荐配置 `ARK_API_KEY`、`ARK_BASE_URL`、`ARK_MODEL`。

## Prompt 结构

Prompt 文件：

```text
src/lib/llm/prompts/buySideEquityResearchPrompt.ts
```

Prompt 要求模型：

- 只输出一个合法 JSON object。
- 不使用 Markdown 包裹符号。
- 输出符合 `BriefDocument` schema。
- 使用 buy-side-equity-research-memo 风格，不写营销文案。
- 中文为主，必要英文术语保留；结论先行，像公开分享版买方 memo，不像普通科普文章。
- 必须包含 Executive View、Company Snapshot、Industry Chain、Competitive Landscape、Financial Deep Dive、Value Drivers、Valuation、Scenario Analysis、Variant Perception、Catalysts、Key Risks、Monitoring Dashboard、Bottom Line。
- Financial Deep Dive 在没有 evidencePack 时只能写分析框架和待核查指标，不能编造真实收入、EPS、利润率或市值。
- Valuation 在没有 evidencePack 时只能写情景估值框架，不能写成真实目标价承诺。
- Bull / Base / Bear 必须有不同假设、概率和触发条件；Monitoring Dashboard 至少 6 个指标。
- 必须标记 `metadata.isMock: true` 和 `metadata.dataMode: "llm-demo-no-live-data"`。
- 不声称已经接入 SEC、IR、实时股价或一致预期。
- 不虚构“已核验来源”。
- `sourceNote` 和 `disclaimer` 必须明确 demo 与非投资建议边界。
- reasoner 模式可以内部进行结构推理，但最终 `content` 只能输出一个合法 JSON 对象。
- 如果出现财务数字、估值倍数、目标价或隐含收益，必须用“模拟”或“示例”标记。

## Brief JSON Schema 与 LLM 输出

`src/lib/briefs/briefJsonSchema.ts` 是给 LLM 使用的轻量 JSON Schema。它的作用是约束输出结构，而不是替代运行时校验。

运行时仍然使用：

```text
src/lib/briefs/validateBrief.ts
```

如果 LLM 输出不是合法 JSON，或没有通过 `validateBriefDocument`，API 不会崩溃，会返回简洁错误并 fallback 到 mock provider。

Phase 8.2 后，`validateBriefDocument` 还会检查 data boundary：

- `metadata.dataMode` 必须存在。
- 没有 evidencePack 时不能使用 `evidence-draft` 或 `verified-real-data`。
- 没有 evidencePack 时不能声称使用 SEC、IR、实时股价、一致预期或新闻检索。
- 必须有 `sourceNote` 和 `disclaimer`。

Phase 8.3 后，`assessBriefQuality` 会补充内容质量提示。它不替代 schema 校验，也不会直接让 API 失败，主要提示缺少关键章节、三情景不足、监控指标不足或没有 evidencePack 却疑似声称使用真实数据源等问题。`/generate` 会把它展示为 Quality Warnings。

## /generate 测试页

访问：

```text
http://localhost:3000/generate
```

使用方式：

1. 输入 ticker，例如 `NVDA`。
2. 可选输入 Company Name。
3. 点击“生成 Brief”。
4. 页面会展示 provider、model、fallback 状态、validation issues。
5. 成功后用现有 Moki Alpha Brief 组件预览生成结果。

该页面是内部测试页，不是正式营销页。当前结果不保存到数据库，也不生成真实公开分享链接。Deep Reasoning 模式不会展示推理过程，只展示最终结构化 BriefDocument。

## 常见错误

- 没有 `DEEPSEEK_API_KEY`：如果 `LLM_PROVIDER=deepseek`，会 fallback 到 mock provider。
- `DEEPSEEK_BASE_URL` 配错：DeepSeek 请求失败后会 fallback 到 mock provider。
- `DEEPSEEK_MODEL` 不存在：返回 `DeepSeek model not found` 并 fallback。
- DeepSeek 鉴权失败：返回 `DeepSeek authentication failed` 并 fallback。
- DeepSeek 额度或限速：返回 `DeepSeek rate limit or quota error` 并 fallback。
- LLM 输出不是 JSON：返回解析错误并 fallback。
- LLM 输出不符合 schema：返回 validation issues 并 fallback。
- ticker 不合法：API 返回 400。

## 当前没有接入的内容

- 没有真实 SEC 数据。
- 没有公司 IR 数据。
- 没有实时股价。
- 没有一致预期。
- 没有数据库。
- 没有登录。
- 没有保存生成结果。
- 没有真实 `/s/[slug]` 分享页生成。

## 后续 Phase 9 计划

Phase 9 可以继续推进：

- 真实数据源接入。
- 数据来源、日期、置信度与证据链结构化。
- 保存生成结果。
- 多股票 brief。
- 真实 `/s/[slug]` 分享页。

## 安全边界

- 不提交 `.env.local`。
- 不泄露 DeepSeek API Key。
- 不把 key 写进前端组件。
- 不使用 `NEXT_PUBLIC_DEEPSEEK_API_KEY`。
- 不使用 `OPENAI_API_KEY`。
- 不使用 `ARK_API_KEY`。
- 不展示 `reasoning_content`。
- 不保存 `reasoning_content`。
- 不把 `reasoning_content` 传回下一轮请求。
- 不让 LLM 输出任意 Markdown 直接渲染。
- 不把 mock / LLM demo 输出当作真实投资建议。
- 页面必须持续显示 Sample / Mock / LLM Demo 与免责声明。
- 没有 evidencePack 时，不能显示 `verified-real-data`。
