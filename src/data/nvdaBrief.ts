import type { BriefDocument } from "@/types/brief";

export const nvdaBrief: BriefDocument = {
  schemaVersion: "0.1",
  slug: "nvda",
  metadata: {
    ticker: "NVDA",
    companyName: "NVIDIA",
    exchange: "NASDAQ",
    title: "NVIDIA / NVDA Buy-Side Equity Research Memo",
    briefType: "Public Research Brief",
    language: "zh-CN",
    isMock: true,
    generatedAt: "2026-06-12 16:19 CST",
    updatedAt: "2026-06-12 16:22 CST",
    frameworkName: "buy-side-equity-research-memo style workflow",
    frameworkStatus: "mock-reference-only",
    dataMode: "mock",
    brand: "Moki",
    product: "Moki Alpha Brief",
    shareLabel: "Public Research Brief",
  },
  hero: {
    eyebrow: "Alpha洞察 / 买方深度研报",
    headline: "NVDA",
    subheadline: "NVIDIA",
    badges: [
      {
        label: "Public Research Brief",
        tone: "brand",
      },
      {
        label: "Sample / Mock",
        tone: "neutral",
      },
    ],
    metrics: [
      {
        label: "Rating Bias",
        value: "Buy / Accumulate，偏积极但要求纪律性仓位",
      },
      {
        label: "Target Range",
        value: "模拟 Bear $155 / Base $255 / Bull $345",
      },
      {
        label: "Probability Weighted",
        value: "模拟 $257",
      },
    ],
  },
  cta: {
    title: "想生成你自己的研报？",
    description:
      "登录 Moki，创建 Alpha Brief 任务，并把研究结果保存到你的投资工作台。",
    buttonLabel: "生成我的研报",
    buttonHref: "#",
  },
  sections: [
    {
      id: "executive-view",
      order: 0,
      title: "Executive Investment View",
      shortTitle: "Executive View",
      eyebrow: "投资结论",
      kind: "executive-view",
      blocks: [
        {
          type: "metricGrid",
          metrics: [
            {
              label: "Rating Bias",
              value: "Buy / Accumulate，偏积极但要求纪律性仓位",
            },
            {
              label: "Current Price",
              value: "模拟 $204.87",
            },
            {
              label: "12M Target Range",
              value: "模拟 Bear $155 / Base $255 / Bull $345",
            },
            {
              label: "Probability Weighted Target",
              value: "模拟 $257",
            },
          ],
        },
        {
          type: "callout",
          title: "Core Thesis",
          content:
            "NVDA 仍是 AI 基础设施资本开支周期中最强的利润池捕获者。市场已经充分认可 GPU 稀缺性，但可能仍低估机柜级系统、网络互联和软件生态共同带来的平台化价值。",
          tone: "brand",
        },
        {
          type: "callout",
          title: "Key Debate",
          content:
            "当前估值是否已经透支 FY2027-FY2028 增长，取决于 hyperscaler capex 持续性、推理需求兑现速度，以及毛利率能否维持在高位。",
          tone: "brand",
        },
        {
          type: "callout",
          title: "What the Market May Be Missing",
          content:
            "市场容易把 NVDA 当作单一芯片供应商定价，而忽略其从 GPU、网络、整机柜、软件栈到参考架构的系统级锁定。",
          tone: "brand",
        },
        {
          type: "callout",
          title: "Thesis Breakpoint",
          content:
            "若连续两个季度 Data Center 环比增长低于中个位数、毛利率跌破 70%，或主要云厂商 ASIC 替代导致订单/ASP 下修，应重新承销。",
          tone: "brand",
        },
      ],
    },
    {
      id: "company-snapshot",
      order: 1,
      title: "Company Snapshot",
      eyebrow: "业务与披露边界",
      kind: "company-snapshot",
      blocks: [
        {
          type: "paragraph",
          content:
            "NVIDIA 是全球加速计算平台公司，核心业务覆盖 Data Center GPU、网络互联、AI software stack、专业可视化、游戏 GPU 与边缘计算。当前投资讨论的重心几乎完全落在 AI data center 平台化能力。",
        },
        {
          type: "paragraph",
          content:
            "本 V0.1 页面采用离线 mock 假设，不进行实时行情、SEC filing 或 IR 材料核验。数据用于呈现买方 memo 的信息密度和页面形态，而不是作为真实投资输入。",
        },
        {
          type: "metricGrid",
          metrics: [
            {
              label: "Primary Listing",
              value: "NASDAQ: NVDA",
              detail: "U.S. large-cap semiconductor platform",
            },
            {
              label: "Core Segment",
              value: "Data Center",
              detail: "AI accelerators, networking, rack-scale systems",
            },
            {
              label: "Research Horizon",
              value: "12 months",
              detail: "with 3-6 month catalyst tracking",
            },
          ],
        },
        {
          type: "bulletList",
          items: [
            "主要客户包括 hyperscalers、AI clouds、主权 AI 项目、企业 AI 工厂和模型公司。",
            "主要供应约束来自先进制程、HBM、CoWoS/先进封装、电力与数据中心交付周期。",
            "关键披露边界：本页展示产品原型，不声称引用或复现任何实时公司披露。",
          ],
        },
      ],
    },
    {
      id: "industry-chain-position",
      order: 2,
      title: "Industry Chain Position",
      eyebrow: "产业链坐标",
      kind: "industry-chain",
      blocks: [
        {
          type: "paragraph",
          content:
            "NVDA 位于 AI 数据中心价值链中最稀缺的加速计算、网络互联和系统软件层。上游依赖晶圆代工、HBM、先进封装、光模块与 ODM/OEM；下游需求来自云厂商、AI cloud、企业和主权 AI。",
        },
        {
          type: "paragraph",
          content:
            "利润池并不只在 GPU 芯片，而是在 GPU + networking + systems + CUDA/software ecosystem 的组合中。只要客户采购从单卡扩展到 rack-scale AI factory，NVDA 的单位项目价值捕获就会提高。",
        },
        {
          type: "bulletList",
          items: [
            "强势环节：模型训练、推理扩容、数据中心网络和开发者生态迁移成本。",
            "稀缺资源：先进封装产能、HBM 供给、数据中心电力、网络互联效率。",
            "周期风险：若 AI capex 从抢供给转向 ROI 评估，订单能见度和估值倍数会同步承压。",
          ],
        },
      ],
    },
    {
      id: "competitive-landscape",
      order: 3,
      title: "Competitive Landscape",
      eyebrow: "竞争与护城河",
      kind: "competitive-landscape",
      blocks: [
        {
          type: "paragraph",
          content:
            "直接竞争来自 AMD GPU、云厂商自研 ASIC、Broadcom/Marvell 定制芯片、Google TPU、AWS Trainium/Inferentia 以及更专用的推理加速方案。短期竞争点是性能/供给，长期竞争点是 TCO 与软件迁移成本。",
        },
        {
          type: "paragraph",
          content:
            "NVDA 的护城河来自路线图节奏、CUDA 生态、网络互联、系统级交付和开发者心智。买方需要持续跟踪的不是竞争是否存在，而是竞争是否足以改变客户采购默认项。",
        },
        {
          type: "bulletList",
          items: [
            "短期优势：Blackwell/Rubin 路线图、NVLink/InfiniBand/Spectrum-X、成熟软件生态。",
            "中期威胁：hyperscaler 在特定推理 workload 使用自研 ASIC 降低单位 token 成本。",
            "关键观察：若客户开始把核心训练和通用推理以外的负载迁出 NVDA 平台，倍数应下修。",
          ],
        },
      ],
    },
    {
      id: "financial-deep-dive",
      order: 4,
      title: "Financial Statement Deep Dive",
      eyebrow: "财报质量",
      kind: "financial-deep-dive",
      blocks: [
        {
          type: "paragraph",
          content:
            "买方视角下，NVDA 财报的核心不是单季收入是否高增长，而是增长质量是否由 Data Center volume、networking attach rate、gross margin durability 和 FCF conversion 共同支撑。",
        },
        {
          type: "paragraph",
          content:
            "本 mock 假设中，Data Center 仍贡献绝大部分收入增量，毛利率维持高位，自由现金流转化强。潜在压力来自供应承诺、库存节奏、客户集中度和未来产品代际切换中的毛利波动。",
        },
        {
          type: "metricGrid",
          metrics: [
            {
              label: "Revenue Mix",
              value: "Data Center led",
              detail: "模拟：above 85% of incremental revenue",
            },
            {
              label: "Margin Anchor",
              value: "模拟 70%+ GM",
              detail: "示例 threshold for premium multiple",
            },
            {
              label: "FCF Quality",
              value: "High conversion",
              detail: "supports buyback capacity and optionality",
            },
          ],
        },
        {
          type: "bulletList",
          items: [
            "收入：关注 Data Center QoQ，而不是单纯同比高增。",
            "毛利率：70% 是投资判断的重要警戒线，低于该线会改变 EPS 和倍数框架。",
            "资产负债表：净现金和回购能力构成下行缓冲，但无法抵消增长久期下修。",
          ],
        },
      ],
    },
    {
      id: "key-value-drivers",
      order: 5,
      title: "Key Value Drivers",
      eyebrow: "估值变量",
      kind: "value-drivers",
      blocks: [
        {
          type: "paragraph",
          content:
            "NVDA 的估值对少数变量高度敏感。真正驱动 12 个月目标价的不是新闻流，而是 Data Center 环比增速、gross margin、networking attach rate、客户集中度和供应链承诺能否被收入兑现。",
        },
        {
          type: "bulletList",
          items: [
            "Data Center QoQ growth：连续高个位数或双位数环比会延长增长久期。",
            "Gross margin durability：高毛利率是高 P/E 与高 FCF multiple 的基础。",
            "Networking attach rate：验证 NVDA 是否从 GPU 供应商升级为 AI factory platform。",
            "ACIE / enterprise AI expansion：验证需求是否从少数超大客户扩散到更宽客户层。",
            "Inventory and supply commitments：牛市中代表需求能见度，熊市中代表错配风险。",
          ],
        },
      ],
    },
    {
      id: "valuation",
      order: 6,
      title: "Valuation",
      eyebrow: "估值框架",
      kind: "valuation",
      blocks: [
        {
          type: "paragraph",
          content:
            "本页采用 FY2027E non-GAAP EPS 情景 P/E 作为主估值框架，并用 FCF 转化和系统级平台叙事交叉验证。对于 NVDA 当前阶段，P/E 比 EV/Sales 更能反映利润率和股东回报能力。",
        },
        {
          type: "paragraph",
          content:
            "Base case 使用示例假设：收入继续增长但增速正常化，模拟毛利率维持约 75%，市场给予高质量平台型半导体资产模拟约 29x forward P/E。Bull case 需要收入、毛利率和倍数共振；Bear case 则反映 capex 消化和 ASIC 替代压力。",
        },
        {
          type: "metricGrid",
          metrics: [
            {
              label: "Base EPS",
              value: "模拟 $8.8",
              detail: "FY2027E 示例 operating case",
            },
            {
              label: "Base Multiple",
              value: "模拟 29x",
              detail: "示例 platform semiconductor multiple",
            },
            {
              label: "Risk / Reward",
              value: "Asymmetric",
              detail: "upside depends on growth duration",
            },
          ],
        },
      ],
    },
    {
      id: "variant-perception",
      order: 8,
      title: "Variant Perception",
      eyebrow: "差异化判断",
      kind: "variant-perception",
      blocks: [
        {
          type: "paragraph",
          content:
            "市场可能低估的是平台化收入质量：NVDA 的 networking、rack-scale reference architecture 和软件生态提高客户锁定，使其单位 AI factory 项目的价值捕获大于单一 GPU ASP。",
        },
        {
          type: "paragraph",
          content:
            "市场可能高估的是 AI capex 的线性持续性。若客户开始更严格评估模型 ROI、推理成本和内部 ASIC 路线，NVDA 订单节奏会从结构性短缺回到更周期化的半导体节奏。",
        },
        {
          type: "bulletList",
          items: [
            "反向验证：ACIE 增速放缓、客户集中度提高、库存快于收入增长，是增长质量变弱的组合信号。",
            "上行验证：networking revenue 增速持续高于 compute，说明平台价值捕获扩大。",
          ],
        },
      ],
    },
    {
      id: "catalysts",
      order: 9,
      title: "Catalysts: Next 3-6 Months",
      shortTitle: "Catalysts",
      eyebrow: "催化剂",
      kind: "catalysts",
      blocks: [
        {
          type: "paragraph",
          content:
            "未来 3-6 个月的催化剂集中在财报、产品代际切换、云厂商 capex 指引和出口管制变化。买方关注点应从新闻事件本身转向这些事件是否改变 FY2027/FY2028 EPS 路径。",
        },
        {
          type: "bulletList",
          items: [
            "Q2/FY2027 earnings：验证收入指引、毛利率、Data Center 环比和客户集中度。",
            "Blackwell / Rubin ramp commentary：关注良率、机柜级交付和客户部署节奏。",
            "Hyperscaler capex updates：Microsoft、Google、Amazon、Meta、Oracle 的 AI capex 口径。",
            "Export control updates：H20/H200 许可与中国 data center compute 限制变化。",
            "Capital return：新增回购授权执行速度与 SBC 稀释抵消效果。",
          ],
        },
      ],
    },
    {
      id: "key-risks",
      order: 10,
      title: "Key Risks",
      eyebrow: "风险清单",
      kind: "risks",
      blocks: [
        {
          type: "callout",
          title: "Valuation Risk",
          label: "High",
          content:
            "高市值和高倍数意味着增长久期任何下修都会放大股价波动，尤其在盈利仍上修但倍数先压缩的阶段。",
          tone: "risk",
        },
        {
          type: "callout",
          title: "Customer Concentration",
          label: "High",
          content:
            "若前三大客户贡献继续上升，订单质量和议价力会被重新审视，市场可能降低收入可持续性的置信度。",
          tone: "risk",
        },
        {
          type: "callout",
          title: "ASIC Substitution",
          label: "Medium",
          content:
            "云厂商自研 ASIC 在特定推理场景具备成本优势，长期可能侵蚀 NVDA 的超额毛利和默认采购地位。",
          tone: "risk",
        },
        {
          type: "callout",
          title: "Supply Chain",
          label: "Medium",
          content:
            "HBM、先进封装、电力和数据中心建设瓶颈可能限制交付；若供应承诺过快扩张，也会提高错配风险。",
          tone: "risk",
        },
        {
          type: "callout",
          title: "Regulatory / China",
          label: "Watch",
          content:
            "出口管制既可能造成短期收入缺口，也可能推动本土竞争生态形成，是估值中较难建模的政策变量。",
          tone: "risk",
        },
      ],
    },
    {
      id: "bottom-line",
      order: 12,
      title: "Bottom Line",
      eyebrow: "结论",
      kind: "bottom-line",
      blocks: [
        {
          type: "paragraph",
          content:
            "NVDA 仍是 AI infrastructure 周期中质量最高、财务兑现最强的核心资产之一。当前价格不便宜，但只要 Data Center 增长、networking attach rate 和毛利率继续支撑平台化叙事，Base case 仍偏积极。真正的风险不是单季 EPS，而是 2027-2028 年 AI capex 增长久期、客户 ROI 验证和 ASIC 替代对 75% 毛利率假设的挑战。",
        },
      ],
    },
  ],
  scenarioAnalysis: {
    id: "scenarios",
    order: 7,
    title: "Bull / Base / Bear Scenarios",
    shortTitle: "Bull / Base / Bear Scenarios",
    description:
      "Scenario analysis translates core assumptions into a 12-month risk/reward range.",
    currentPrice: "模拟 $204.87",
    probabilityWeightedTarget: "模拟 $257",
    scenarios: [
      {
        tone: "bull",
        name: "Bull",
        label: "Bull",
        probability: "25%",
        keyAssumptions:
          "示例 FY2027 revenue 约 $420B；Data Center 持续强环比；AI factory 订单从 hyperscale 扩散到 enterprise / sovereign AI。",
        operatingSetup: "模拟 Gross margin 75-76%；示例 non-GAAP EPS 约 $10.1；模拟 34x P/E。",
        targetPrice: "模拟 $345",
        impliedReturn: "模拟 +68%",
        trigger: "Blackwell/Rubin ramp 超预期，networking attach rate 继续上行。",
      },
      {
        tone: "base",
        name: "Base",
        label: "Base",
        probability: "55%",
        keyAssumptions:
          "示例 FY2027 revenue 约 $385B；Q2 指引兑现后增速正常化；hyperscale capex 维持高位但不再上修。",
        operatingSetup: "模拟 Gross margin 约 75%；示例 non-GAAP EPS 约 $8.8；模拟 29x P/E。",
        targetPrice: "模拟 $255",
        impliedReturn: "模拟 +24%",
        trigger: "Data Center QoQ 保持中高个位数，毛利率稳定，库存节奏可控。",
      },
      {
        tone: "bear",
        name: "Bear",
        label: "Bear",
        probability: "20%",
        keyAssumptions:
          "示例 FY2027 revenue 约 $345B；云厂商 capex 消化，ASIC 替代升温，订单可见度下降。",
        operatingSetup: "模拟 Gross margin 约 70%；示例 non-GAAP EPS 约 $7.0；模拟 22x P/E。",
        targetPrice: "模拟 $155",
        impliedReturn: "模拟 -24%",
        trigger: "Data Center 连续两季低于 5% QoQ，毛利率跌破 70%。",
      },
    ],
  },
  monitoringDashboard: {
    id: "monitoring-dashboard",
    order: 11,
    title: "Monitoring Dashboard",
    shortTitle: "Monitoring Dashboard",
    description:
      "These metrics define what would confirm or challenge the current thesis.",
    metrics: [
      {
        metric: "Data Center QoQ Growth",
        whyItMatters: "最核心收入驱动，决定增长久期和估值倍数。",
        threshold: "连续两季 <5% 需重估",
        status: "Healthy",
        cadence: "Quarterly",
      },
      {
        metric: "Gross Margin",
        whyItMatters: "EPS 和 FCF 估值锚，平台溢价的底层变量。",
        threshold: "<70% 为警戒线",
        status: "Watch",
        cadence: "Quarterly",
      },
      {
        metric: "Networking Attach Rate",
        whyItMatters: "验证系统级平台价值，而不是单一 GPU ASP。",
        threshold: "增速显著低于 compute",
        status: "Healthy",
        cadence: "Quarterly",
      },
      {
        metric: "ACIE / Enterprise AI",
        whyItMatters: "验证需求是否从少数云厂商扩散到更宽客户层。",
        threshold: "明显低于 hyperscale",
        status: "Watch",
        cadence: "Quarterly",
      },
      {
        metric: "Inventory / Commitments",
        whyItMatters: "衡量需求错配、减值和 ASP 调整风险。",
        threshold: "库存快于收入增长",
        status: "Caution",
        cadence: "Quarterly",
      },
      {
        metric: "Customer Concentration",
        whyItMatters: "影响订单质量、议价力和收入可持续性。",
        threshold: "前三客户占比继续上升",
        status: "Caution",
        cadence: "10-Q / 10-K",
      },
      {
        metric: "China Policy",
        whyItMatters: "同时是上行期权与下行风险，影响长期竞争格局。",
        threshold: "许可放松或限制扩大",
        status: "Trigger",
        cadence: "Event-driven",
      },
    ],
  },
  sourceNote: {
    id: "source-note",
    title: "Source & Method Note",
    paragraphs: [
      "当前页面是静态 mock demo，页面结构参考 buy-side equity research memo 工作流。",
      "当前未接入真实 SEC、公司 IR、实时股价、一致预期或新闻检索。后续版本会把来源、日期、置信度和证据链结构化。",
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    text: "本页面仅供研究和信息参考，不构成投资建议。链接公开分享后，持有链接者可查看该静态研究页面；页面内容为 V0.1 mock，不代表实时行情、正式评级或任何个性化建议。",
  },
};
