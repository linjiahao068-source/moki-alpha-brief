import type { BriefDocument, BriefSection, BriefSectionKind } from "@/types/brief";

export function assessBriefQuality(brief: BriefDocument): string[] {
  const warnings: string[] = [];
  const context = brief.researchEvidenceContext;
  const evidenceLevel = context?.evidenceLevel;

  addCoreWarnings(brief, warnings);
  addEvidenceWarnings(brief, warnings);
  addSearchWarnings(brief, warnings);
  addSecWarnings(brief, warnings);
  addIrWarnings(brief, warnings);
  addMarketWarnings(brief, warnings);
  addConsensusWarnings(brief, warnings);

  if (context) {
    if (!sourceNoteMentionsEvidenceLevel(brief)) {
      warnings.push("Quality: sourceNote should mention evidenceLevel.");
    }
    if (evidenceLevelIncludesIr(evidenceLevel) && !brief.irEvidencePack && !context.irEvidencePack) {
      warnings.push("Quality: evidenceLevel includes IR but irEvidencePack is missing.");
    }
    if (evidenceLevelIncludesMarket(evidenceLevel) && !brief.marketEvidencePack && !context.marketEvidencePack) {
      warnings.push("Quality: evidenceLevel includes market but marketEvidencePack is missing.");
    }
    if (evidenceLevelIncludesConsensus(evidenceLevel) && !brief.consensusEvidencePack && !context.consensusEvidencePack) {
      warnings.push("Quality: evidenceLevel includes consensus but consensusEvidencePack is missing.");
    }
    if (!context.coverage.hasRevenueFact) {
      warnings.push("Quality: coverage is missing a revenue fact.");
    }
    if (!context.coverage.hasNetIncomeFact) {
      warnings.push("Quality: coverage is missing a net income fact.");
    }
    if (!context.coverage.hasEpsFact) {
      warnings.push("Quality: coverage is missing an EPS fact.");
    }
  }

  if (briefLooksLikeFormalRatingOrTarget(brief)) {
    warnings.push(
      "Quality: brief should not output a formal rating, buy/sell/hold call, or formal target price in this MVP.",
    );
  }
  if (textTreatsIrAsConsensus(brief)) {
    warnings.push("Quality: IR evidence or company guidance context must not be written as consensus.");
  }
  if (textTreatsConsensusAsSecActual(brief)) {
    warnings.push("Quality: consensus evidence must not be described as SEC actual data.");
  }
  if (textTreatsSearchIrMarketAsConsensus(brief)) {
    warnings.push("Quality: Search, IR, or Market numbers must not be written as consensus.");
  }

  return Array.from(new Set(warnings));
}

function addCoreWarnings(brief: BriefDocument, warnings: string[]) {
  if (!findSection(brief, "executive-view")) {
    warnings.push("Quality: missing Executive Investment View section.");
  }
  if (!findSection(brief, "risks")) {
    warnings.push("Quality: missing Key Risks section.");
  }
  if (!findSection(brief, "bottom-line")) {
    warnings.push("Quality: missing Bottom Line section.");
  }
  if (!brief.sourceNote?.paragraphs?.length) {
    warnings.push("Quality: missing Source & Method Note.");
  }
  if (!brief.disclaimer?.text) {
    warnings.push("Quality: missing disclaimer text.");
  }
  if (!brief.metadata?.dataMode) {
    warnings.push("Quality: missing dataMode.");
  }
  if ((brief.scenarioAnalysis?.scenarios?.length ?? 0) < 3) {
    warnings.push("Quality: scenarioAnalysis should include at least 3 scenarios.");
  }
  if ((brief.monitoringDashboard?.metrics?.length ?? 0) < 6) {
    warnings.push("Quality: Monitoring Dashboard should include at least 6 metrics.");
  }
}

function addEvidenceWarnings(brief: BriefDocument, warnings: string[]) {
  if (brief.metadata.dataMode === "verified-real-data") {
    warnings.push("Quality: verified-real-data is not allowed in the current MVP.");
  }
  if (brief.metadata.dataMode === "evidence-draft" && !sourceNoteMentionsDraftBoundaries(brief)) {
    warnings.push("Quality: sourceNote should mention the current evidence-draft boundaries.");
  }
  if (brief.researchEvidenceContext?.coverage.hasConsensus === false && textClaimsConsensusConnected(brief)) {
    warnings.push(
      "Quality: brief claims consensus estimates are connected even though coverage.hasConsensus=false.",
    );
  }
}

function addSearchWarnings(brief: BriefDocument, warnings: string[]) {
  const pack = brief.evidencePack;
  if (!pack) return;

  if ((pack.newsItems?.length || pack.sources.length) < 3) {
    warnings.push("Quality: evidencePack should include at least 3 sources.");
  }
  if (!sourceNoteMentionsSearchProvider(brief)) {
    warnings.push("Quality: sourceNote should mention searchProvider.");
  }
}

function addSecWarnings(brief: BriefDocument, warnings: string[]) {
  const pack = brief.secEvidencePack;
  if (!pack) return;

  if (pack.fiscalFacts.length < 3) {
    warnings.push("Quality: secEvidencePack should include at least 3 fiscal facts.");
  }
  if (!sourceNoteMentionsCik(brief)) {
    warnings.push("Quality: sourceNote should mention SEC CIK.");
  }
  if (!financialDeepDiveMentionsSecFacts(brief)) {
    warnings.push(
      "Quality: Financial Deep Dive should reflect SEC companyfacts when secEvidencePack exists.",
    );
  }
}

function addIrWarnings(brief: BriefDocument, warnings: string[]) {
  const pack = brief.irEvidencePack;
  if (!pack) return;

  if (pack.irItems.length < 2) {
    warnings.push("Quality: irEvidencePack should include at least 2 IR sources.");
  }
  if (!sourceNoteMentionsIrProvider(brief)) {
    warnings.push("Quality: sourceNote should mention irProvider.");
  }
  if (!sectionMentionsIr(brief, "company-snapshot")) {
    warnings.push(
      "Quality: Company Snapshot should reflect IR management commentary or official company narrative when IR evidence exists.",
    );
  }
  if (!sectionMentionsIr(brief, "value-drivers")) {
    warnings.push(
      "Quality: Key Value Drivers should reflect IR product update, management commentary, or company guidance context when IR evidence exists.",
    );
  }
}

function addMarketWarnings(brief: BriefDocument, warnings: string[]) {
  const pack = brief.marketEvidencePack;
  if (!pack) return;

  if (pack.provider === "mock") {
    warnings.push("Quality: market fallback mock is being used.");
  }
  if (!pack.quote) {
    warnings.push("Quality: marketEvidencePack should include quote when useMarket=true.");
  }
  if (!pack.priceHistory?.length) {
    warnings.push("Quality: marketEvidencePack should include recent daily price history.");
  }
  if (!sourceNoteMentionsMarketProvider(brief)) {
    warnings.push("Quality: sourceNote should mention marketProvider.");
  }
  if (!sectionMentionsMarket(brief, "executive-view")) {
    warnings.push(
      "Quality: Investment View should reflect market context when Market Evidence exists.",
    );
  }
  if (!monitoringDashboardMentionsMarket(brief)) {
    warnings.push(
      "Quality: Monitoring Dashboard should include price, volume, refresh, or price-history context when Market Evidence exists.",
    );
  }
}

function addConsensusWarnings(brief: BriefDocument, warnings: string[]) {
  const pack = brief.consensusEvidencePack;
  const context = brief.researchEvidenceContext;

  if (brief.metadata.dataMode === "evidence-draft" && evidenceLevelIncludesConsensus(context?.evidenceLevel) && !pack) {
    warnings.push("Quality: useConsensus/evidenceLevel includes consensus but consensusEvidencePack is missing.");
  }
  if (!pack) return;

  if (pack.provider === "mock") {
    warnings.push("Quality: consensus mock evidence is being used.");
  }
  if (!pack.estimates.length) {
    warnings.push("Quality: consensusEvidencePack should include estimate rows.");
  }
  if (!pack.estimates.some((estimate) => estimate.revenueAvg !== undefined)) {
    warnings.push("Quality: consensusEvidencePack has no revenue consensus average.");
  }
  if (!pack.estimates.some((estimate) => estimate.epsAvg !== undefined)) {
    warnings.push("Quality: consensusEvidencePack has no EPS consensus average.");
  }
  if (!pack.estimates.some((estimate) => estimate.analystCount !== undefined)) {
    warnings.push("Quality: consensusEvidencePack has no analystCount field.");
  }
  if (!sourceNoteMentionsConsensusProvider(brief)) {
    warnings.push("Quality: sourceNote should mention Consensus provider=mock.");
  }
  if (!sectionMentionsConsensus(brief, "financial-deep-dive")) {
    warnings.push(
      "Quality: Consensus Evidence exists but Earnings Expectation / Financial Deep Dive does not reflect it.",
    );
  }
  if (!monitoringDashboardMentionsConsensus(brief)) {
    warnings.push(
      "Quality: Consensus Evidence exists but Monitoring Dashboard does not reflect revenue/EPS/analyst consensus.",
    );
  }
}

function findSection(brief: BriefDocument, kind: BriefSectionKind) {
  return brief.sections?.find((section) => section.kind === kind);
}

function sourceNoteText(brief: BriefDocument) {
  return (brief.sourceNote?.paragraphs ?? []).join(" ");
}

function getBriefText(brief: BriefDocument) {
  return [
    brief.metadata?.title,
    brief.metadata?.briefType,
    brief.metadata?.frameworkName,
    brief.metadata?.shareLabel,
    brief.hero?.subheadline,
    ...brief.sections.map(sectionText),
    ...(brief.sourceNote?.paragraphs ?? []),
    brief.disclaimer?.text,
    ...(brief.scenarioAnalysis?.scenarios || []).flatMap((scenario) => [
      scenario.targetPrice,
      scenario.impliedReturn,
      scenario.keyAssumptions,
    ]),
    ...(brief.monitoringDashboard?.metrics || []).flatMap((metric) => [
      metric.metric,
      metric.whyItMatters,
      metric.threshold,
    ]),
  ]
    .filter(Boolean)
    .join("\n");
}

function sectionText(section: BriefSection) {
  return section.blocks
    .flatMap((block) => {
      if ("content" in block) return [block.content];
      if ("items" in block) return block.items;
      if ("metrics" in block) return block.metrics.map((metric) => `${metric.label} ${metric.value} ${metric.detail || ""}`);
      return [];
    })
    .join(" ");
}

function sourceNoteMentionsSearchProvider(brief: BriefDocument) {
  return /searchprovider|search provider|search evidence/i.test(sourceNoteText(brief));
}

function sourceNoteMentionsCik(brief: BriefDocument) {
  return /\bcik\b|sec evidence draft|companyfacts/i.test(sourceNoteText(brief));
}

function sourceNoteMentionsIrProvider(brief: BriefDocument) {
  return /irprovider|ir evidence draft|company ir|earnings-release/i.test(sourceNoteText(brief));
}

function sourceNoteMentionsMarketProvider(brief: BriefDocument) {
  return /marketprovider|market provider|market evidence draft|third-party free market|free public market data/i.test(
    sourceNoteText(brief),
  );
}

function sourceNoteMentionsConsensusProvider(brief: BriefDocument) {
  return /consensus provider=mock|consensusprovider=mock|consensus evidence draft|consensus is mock evidence/i.test(
    sourceNoteText(brief),
  );
}

function sourceNoteMentionsEvidenceLevel(brief: BriefDocument) {
  return /evidencelevel|evidence level|search-and-sec|search-sec-ir-market-and-consensus|search-sec-ir-and-market|consensus-only|market-and-consensus/i.test(
    sourceNoteText(brief),
  );
}

function sourceNoteMentionsDraftBoundaries(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  const context = brief.researchEvidenceContext;
  const hasMarket = Boolean(brief.marketEvidencePack || evidenceLevelIncludesMarket(context?.evidenceLevel));
  const hasConsensus = Boolean(brief.consensusEvidencePack || evidenceLevelIncludesConsensus(context?.evidenceLevel));
  const marketOk = hasMarket
    ? /market evidence draft|marketprovider|third-party free market|delayed or incomplete/i.test(text)
    : /real-time price|market price|real-time market price/i.test(text);
  const consensusOk = hasConsensus
    ? /consensus evidence draft|consensus provider=mock|consensusprovider=mock|consensus is mock evidence/i.test(text)
    : /consensus|consensus estimates|一致预期/i.test(text);

  return marketOk && consensusOk && /manual verification|manual review|人工校验/i.test(text);
}

function financialDeepDiveMentionsSecFacts(brief: BriefDocument) {
  const section = findSection(brief, "financial-deep-dive");
  if (!section) return false;
  return /sec|companyfacts|10-k|10-q|fiscal fact|filed|cik|company facts/i.test(
    sectionText(section),
  );
}

function sectionMentionsIr(brief: BriefDocument, kind: BriefSectionKind) {
  const section = findSection(brief, kind);
  if (!section) return false;
  return /ir evidence|company ir|management commentary|company guidance|business update|product update|official company|earnings release|investor relations/i.test(
    sectionText(section),
  );
}

function sectionMentionsMarket(brief: BriefDocument, kind: BriefSectionKind) {
  const section = findSection(brief, kind);
  if (!section) return false;
  return /market evidence|market price|price context|volume|price history|kline|daily close|行情|股价|成交量|价格/i.test(
    sectionText(section),
  );
}

function sectionMentionsConsensus(brief: BriefDocument, kind: BriefSectionKind) {
  const section = findSection(brief, kind);
  if (!section) return false;
  return /consensus|revenue consensus|eps consensus|analyst count|expectation gap|一致预期|预期差/i.test(
    sectionText(section),
  );
}

function monitoringDashboardMentionsMarket(brief: BriefDocument) {
  return (brief.monitoringDashboard?.metrics || []).some((metric) =>
    /market price|price|volume|price history|kline|refresh|retrieved|行情|股价|成交量|刷新/i.test(
      `${metric.metric} ${metric.whyItMatters} ${metric.threshold} ${metric.cadence || ""}`,
    ),
  );
}

function monitoringDashboardMentionsConsensus(brief: BriefDocument) {
  return (brief.monitoringDashboard?.metrics || []).some((metric) =>
    /consensus|revenue consensus|eps consensus|analyst count|estimate refresh|一致预期|预期|分析师/i.test(
      `${metric.metric} ${metric.whyItMatters} ${metric.threshold} ${metric.cadence || ""}`,
    ),
  );
}

function textClaimsConsensusConnected(brief: BriefDocument) {
  const cleaned = getBriefText(brief)
    .replace(/no consensus estimates/gi, "")
    .replace(/consensus.*not connected/gi, "")
    .replace(/未接.{0,20}一致预期/gi, "");

  return /(consensus estimates? (are )?(connected|attached|available)|已接.{0,20}一致预期|一致预期.{0,20}(已接|已连接|可用))/i.test(
    cleaned,
  );
}

function textTreatsIrAsConsensus(brief: BriefDocument) {
  const cleaned = getBriefText(brief)
    .replace(/must not[^.。]{0,220}consensus/gi, "")
    .replace(/not[^.。]{0,220}consensus/gi, "")
    .replace(/不能[^。]{0,120}一致预期/gi, "")
    .replace(/不是[^。]{0,120}一致预期/gi, "")
    .replace(/no consensus estimates/gi, "");

  return /(ir evidence|company guidance context|company guidance|management commentary)[^.。]{0,80}(is|are|as|treated as|written as|becomes|作为|写成|视为)[^.。]{0,80}(consensus|consensus estimate|consensus forecast|一致预期)/i.test(
    cleaned,
  );
}

function textTreatsConsensusAsSecActual(brief: BriefDocument) {
  const cleaned = getBriefText(brief)
    .replace(/must not[^.。]{0,160}sec actual/gi, "")
    .replace(/not[^.。]{0,120}sec actual/gi, "")
    .replace(/not[^.。]{0,120}sec official/gi, "")
    .replace(/cannot[^.。]{0,120}sec actual/gi, "")
    .replace(/不得[^。]{0,120}sec/gi, "")
    .replace(/不能[^。]{0,120}sec/gi, "")
    .replace(/不是[^。]{0,60}sec/gi, "");

  return /(consensus|一致预期)[^.。]{0,80}(\b(as|treated as|written as|becomes|from)\b|来自|作为|写成|视为|等同)[^.。]{0,80}(sec actual|sec official|official[- ]financial|companyfacts|官方披露|正式财报)/i.test(
    cleaned,
  );
}

function textTreatsSearchIrMarketAsConsensus(brief: BriefDocument) {
  const cleaned = getBriefText(brief)
    .replace(/never[^.。]{0,160}consensus/gi, "")
    .replace(/must not[^.。]{0,160}consensus/gi, "")
    .replace(/not[^.。]{0,160}consensus/gi, "")
    .replace(/不能[^。]{0,120}一致预期/gi, "")
    .replace(/不是[^。]{0,120}一致预期/gi, "")
    .replace(/不代表[^。]{0,120}一致预期/gi, "");

  return /(search evidence|ir evidence|company guidance|market evidence|market price|搜索证据|公司指引|市场数据)[^.。]{0,80}(\b(as|treated as|written as|becomes|from)\b|来自|作为|写成|视为|等同)[^.。]{0,80}(consensus estimate|consensus|一致预期)/i.test(
    cleaned,
  );
}

function briefLooksLikeFormalRatingOrTarget(brief: BriefDocument) {
  const cleaned = getBriefText(brief)
    .replace(/not a formal rating/gi, "")
    .replace(/not investment advice/gi, "")
    .replace(/不构成投资建议/g, "")
    .replace(/不得输出正式目标价/g, "")
    .replace(/no formal rating/gi, "");

  return /(formal rating|rating:\s*(buy|sell|hold|neutral|overweight|underweight)|\b(buy|sell|hold)\b recommendation|正式评级|买入评级|卖出评级|持有评级|目标价[:：]?\s*(\$|usd|hkd|港元|美元|\d))/i.test(
    cleaned,
  );
}

function evidenceLevelIncludesIr(level: string | undefined) {
  return Boolean(level && /\bir\b/i.test(level));
}

function evidenceLevelIncludesMarket(level: string | undefined) {
  return Boolean(level && /market/i.test(level));
}

function evidenceLevelIncludesConsensus(level: string | undefined) {
  return Boolean(level && /consensus/i.test(level));
}
