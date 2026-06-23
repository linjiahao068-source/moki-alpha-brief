# V0.1 SEC Evidence MVP

## Phase 9.2 目标

Phase 9.2 接入 SEC 官方 EDGAR JSON API，构造 `SecEvidencePack`，让 DeepSeek 可以基于 SEC companyfacts / submissions 生成更可靠的财务分析草稿。

本阶段仍然不接实时股价、一致预期、数据库，不保存生成结果，不生成真实分享链接，也不把 `dataMode` 标记为 `verified-real-data`。

## 为什么接 SEC

Search Evidence Draft 只能提供公开网页近期内容线索。SEC 官方数据提供公司披露层面的结构化事实，适合支撑：

- Financial Statement Deep Dive
- 最近 10-K / 10-Q / 8-K metadata
- Revenue / Net Income / EPS / Assets / Debt 等基础事实

但当前抽取逻辑仍然是 MVP，不是完整 XBRL 财务系统。

## 使用的 SEC JSON Endpoint

当前使用三类 SEC 官方 JSON endpoint：

- `https://www.sec.gov/files/company_tickers.json`
- `https://data.sec.gov/submissions/CIK##########.json`
- `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json`

所有 SEC 请求都通过服务端执行，并带 `User-Agent`。

## CIK 映射

流程：

1. 用户输入 ticker。
2. 后端读取 `company_tickers.json`。
3. 根据 ticker 找到 CIK。
4. CIK 补齐为 10 位，例如 `1045810` -> `0001045810`。

如果 CIK 映射失败，系统会返回 safe error 或 fallback 到 mock SEC evidence，不让页面白屏。

## Submissions

`submissions` 用于提取最近 filing metadata：

- accessionNumber
- form
- filingDate
- reportDate
- primaryDocument
- description
- secUrl

MVP 优先展示 `10-K`、`10-Q`、`8-K`，默认最多 8 条。

## Companyfacts

`companyfacts` 用于提取核心 us-gaap facts。当前优先尝试：

- Revenues
- RevenueFromContractWithCustomerExcludingAssessedTax
- SalesRevenueNet
- NetIncomeLoss
- OperatingIncomeLoss
- EarningsPerShareDiluted
- EarningsPerShareBasic
- Assets
- Liabilities
- CashAndCashEquivalentsAtCarryingValue
- LongTermDebt
- NetCashProvidedByUsedInOperatingActivities
- PaymentsToAcquirePropertyPlantAndEquipment
- CommonStocksIncludingAdditionalPaidInCapital

不要求每家公司都有所有字段。缺失字段不会让页面失败。

## SecEvidencePack 结构

核心字段：

- `asOf`
- `ticker`
- `cik`
- `companyName`
- `provider`: `mock` 或 `sec`
- `dataMode`: 固定为 `evidence-draft`
- `recentFilings`
- `fiscalFacts`
- `sources`
- `warnings`

SEC facts 的 `confidence` 固定为 `high`，但整体数据状态仍然是 `evidence-draft`。

## SEC Evidence UI

`/generate` 新增 `Use SEC official data` 开关。打开后：

- 状态区显示 SEC Provider。
- 显示 CIK。
- 显示 Recent Filings count。
- 显示 Fiscal Facts count。
- 显示 `SecEvidencePanel`。

`SecEvidencePanel` 展示 recent filings 和 fiscal facts。表格在移动端只允许内部横向滚动。

## Prompt 如何使用 SEC Facts

当 `secEvidencePack` 存在时：

- Financial Statement Deep Dive 必须优先使用 SEC fiscalFacts。
- Company Snapshot 可以引用 SEC recentFilings metadata。
- Key Value Drivers 可以结合 SEC facts 和 search evidence，但必须区分来源。
- Valuation 仍不能生成真实目标价承诺，因为没有实时股价和一致预期。
- 如果 Revenue / EPS / Net Income 缺失，必须写“SEC companyfacts 当前未提取到该指标”，不能编造。
- 搜索摘要里的数字不能写成 SEC facts。

## 为什么仍是 evidence-draft

SEC facts 是官方披露数据，但当前系统仍缺少：

- 完整 XBRL 会计重分类
- 实时股价
- 一致预期
- 人工校验
- 数据库保存与审计链

因此 Phase 9.2 不能标记 `verified-real-data`。

## 当前仍未接入

- 实时股价
- 一致预期
- 公司 IR 正文解析
- 数据库
- 人工校验
- 完整 filing HTML 抓取
- 完整财务报表引擎

## 后续计划

Phase 9.3 / 9.4 建议：

- 增加 SEC facts 缓存与请求节流。
- 增加更多 concept fallback。
- 区分年度、季度、TTM 和 point-in-time balance sheet facts。
- 接入实时股价和一致预期后再讨论估值自动化。
- 保存生成结果并生成真实 `/s/[slug]` 分享页。

## 安全边界

SEC facts 是官方披露数据，但抽取逻辑仍是 MVP。本页面仅供研究和信息参考，不构成投资建议。不要把搜索摘要当 SEC facts，不要把 SEC Evidence Draft 当成 verified-real-data。
## Phase 9.3 Research Evidence Context

Phase 9.3 adds `ResearchEvidenceContext`, which keeps Search Evidence and SEC Evidence separate while exposing one unified context to the prompt and `/generate` QA UI.

See: `docs/V0_1_RESEARCH_EVIDENCE_CONTEXT.md`.
