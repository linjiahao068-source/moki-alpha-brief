# V0.1 Mobile QA Report

## 本阶段目标

Phase 5 的目标不是增加新功能，而是确认 Moki Alpha Brief 在手机、平板和桌面上都像一个可公开分享的专业研报页面。重点检查页面是否横向溢出、表格是否只在内部滚动、Header / Hero / CTA 是否在小屏上自然换行，以及风险、免责声明和 not found 页面是否保持 Moki 黑白金视觉规范。

## 检查过的页面路径

- `http://localhost:3000`
- `http://localhost:3000/s/nvda`
- `http://localhost:3000/s/test`

## 检查过的视口尺寸

- Mobile S: `320 x 568`
- Mobile: `375 x 812`
- Mobile L: `430 x 932`
- Tablet: `768 x 1024`
- Desktop: `1280 x 720`
- Wide: `1440 x 900`

## 修复过的问题

- 全局布局不再依赖 `html/body overflow-x: hidden` 来掩盖问题，改为给核心容器增加 `min-width: 0` 和自然换行规则，方便后续真实发现横向溢出。
- Bull / Base / Bear Scenarios 表格从 6 列收敛为 5 列，符合当前公开研报页要求；`Trigger` 信息保留在 Key Assumptions 内，避免小屏和桌面端表格过宽。
- 两个核心表格的最小宽度调整为更适合移动端内部滚动的范围，手机端只滚动表格区域，不推动整个页面横向滚动。
- 表格表头、状态胶囊和辅助说明的字号从 12px 提升到 13px，保持移动端可读。
- Monitoring Dashboard 的 Threshold 胶囊增加最大宽度和自然换行，避免长阈值撑破单元格。
- Header、Hero、Ticker、状态标签、日期和 CTA 增加收缩与换行约束，320px 宽度下不会互相挤压。
- BriefToc 在桌面端保持右侧显示，在 `lg` 以下隐藏；目录文本增加收缩约束，避免影响正文宽度。
- 正文小卡片、列表项、风险标签和章节标题增加移动端收缩细节，长英文 token 和中英文混排内容可自然换行。
- `/s/test` 改为直接渲染 Moki 风格 not found 状态页，避免本地开发环境因 `notFound()` 触发 Next dev overlay，方便非技术验收。
- README 已清理 create-next-app 默认说明，改为 Moki Alpha Brief 项目说明。

## 当前仍未做的内容

- 仍未接入真实登录、数据库、API、LLM 生成、SEC 数据、公司 IR 数据或实时股价。
- 右侧目录暂未实现滚动 active 状态。
- 当前只支持本地 mock 数据中的 `nvda` brief，未来才会扩展更多 slug。
- 本阶段未引入截图回归测试工具，验收以本地浏览器测量、lint 和 build 为主。

## 后续 Phase 6 文档沉淀建议

- 补充一份 `docs/V0_1_PRODUCT_SPEC.md`，记录页面信息架构、路由约定、mock 数据边界和未来动态化方案。
- 补充一份 `docs/V0_1_DESIGN_QA_CHECKLIST.md`，把 Moki Market 色彩、圆角、表格、风险模块和免责声明规则整理成可复用清单。
- 为后续 `/s/[slug]` 动态 brief 准备数据字段说明，明确哪些字段来自生成任务、哪些字段来自证据链、哪些字段必须显示 mock/source 状态。
- 如果后续进入真实数据阶段，建议先定义 source / date / confidence / evidence chain 的结构，再接入外部数据。

## lint / build 结果

- `npm.cmd run lint`: 通过
- `npm.cmd run build`: 通过
