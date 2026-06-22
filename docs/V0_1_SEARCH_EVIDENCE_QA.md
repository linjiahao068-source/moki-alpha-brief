# V0.1 Search Evidence QA

## Phase 9.1.1 目标

Phase 9.1.1 用于提升 Search Evidence Pack 的来源质量、去重、可信度标记和可审查性。当前搜索证据仍然只是 research draft，不是 verified real data。

本阶段不接入 SEC、实时股价、一致预期、数据库，也不保存生成结果或生成真实分享页。

## 为什么要做搜索证据质量控制

Phase 9.1 已经可以通过 Tavily 搜索公开网页内容，但搜索结果可能包含论坛、AI 聚合页、低质量博客、重复 URL 或缺少发布日期的页面。如果这些内容未经标记就进入 prompt，后续 DeepSeek 生成的研报会更不稳定，也更容易被误读为真实研究结论。

Phase 9.1.1 的目标是让每条来源都可以被审查：

- 来源来自哪个 domain
- 可信度是 high、medium 还是 low
- 日期是 published date 还是 retrieved-only
- 为什么被判定为该可信度
- 是否存在重复、来源过少或低可信来源过多

## 来源质量分级

High confidence 示例：

- `sec.gov`
- `investor.nvidia.com`
- `nvidia.com`
- `reuters.com`
- `apnews.com`
- `cnbc.com`
- `bloomberg.com`
- `wsj.com`
- `ft.com`
- `barrons.com`
- `marketwatch.com`
- `nasdaq.com`
- `businesswire.com`
- `prnewswire.com`
- `investor.*` / `investors.*` / `ir.*` 公司投资者关系子域

Medium confidence 示例：

- `finance.yahoo.com`
- `yahoo.com`
- `seekingalpha.com`
- `fool.com`
- `investing.com`
- `tradingview.com`
- `stockstory.org`
- `morningstar.com`

Low confidence 示例：

- `reddit.com`
- `x.com`
- `twitter.com`
- `stocktwits.com`
- `medium.com`
- `substack.com`
- `quora.com`
- `youtube.com`
- `tiktok.com`
- `perplexity.ai`
- forums、generic AI answer pages、unknown blogs

Low confidence 来源默认不会被完全删除，但会被降权，并在 UI 中明确标记为 discussion or aggregator source。

## retrieved-only 与 published date

如果搜索供应商返回 `publishedAt`，页面显示 `Published: 日期`。

如果没有 `publishedAt`，页面显示 `Retrieved only: retrievedAt`。这表示系统只知道抓取时间，不知道网页原始发布时间，不能把 retrievedAt 当成 published date。

## 去重、排序与数量限制

当前规则：

- 重复 URL 会去重。
- 高度相似标题会去重。
- 同一 domain 最多保留 2 条，避免单一站点占满 Evidence Pack。
- 最终 newsItems 控制在 5 条左右。
- high / medium 来源优先。
- high / medium 来源足够时，low confidence 来源最多只作为少量补充。

## Evidence Warnings

EvidencePack 可能包含以下 warnings：

- `Duplicate search results were removed.`
- `Only low-confidence sources found.`
- `Some sources are retrieved-only because published dates were unavailable.`
- `Low-confidence sources were included because not enough higher-confidence sources were available.`
- `EvidencePack has fewer than 3 source items.`

这些 warnings 不一定代表生成失败，但会提醒后续研究者谨慎使用。

## Prompt 如何使用 EvidencePack

当 evidencePack 存在时，prompt 要求：

- `metadata.dataMode` 必须是 `evidence-draft`。
- Catalysts 至少引用 1-2 条 high / medium confidence search evidence。
- Key Risks 至少引用 1 条 search evidence，或明确说明证据不足。
- Variant Perception 需要结合搜索证据中的近期关注点。
- Reddit、forum、Perplexity、AI aggregator 只能作为市场讨论线索，不能作为事实依据。
- 如果证据不足，应写“待 SEC / IR / 市场数据进一步验证”，不能编造。

## 为什么 evidence-draft 不是 verified-real-data

Search Evidence Draft 只代表“公开网页搜索证据草稿”。它没有接入：

- SEC 官方数据
- 公司 IR 原始文件解析
- 实时股价
- 一致预期
- 数据库保存与人工复核

所以当前不能标记为 `verified-real-data`。

## 后续 Phase 9.2

Phase 9.2 建议进入 SEC 官方数据 MVP：

- 接入 SEC company facts / filings
- 把 SEC evidence 与 web search evidence 区分
- 记录 source id、retrievedAt、publishedAt / filedAt
- 让 Prompt 只基于 evidencePack 中的证据做事实陈述

## 安全边界

当前 Search Evidence QA 仍然不构成投资建议。搜索摘要不能被当成完整事实验证，low confidence 来源不能被当作 verified fact，页面也不能显示 `verified-real-data`。
