import type { BriefDocument, BriefSection, BriefSectionKind } from "@/types/brief";

const unsupportedLiveClaimPattern =
  /(real[- ]?time|live data|current market price|consensus estimate|verified real data|正式评级|实时股价|实时行情|一致预期|已验证真实数据)/i;

export function assessBriefQuality(brief: BriefDocument): string[] {
  const warnings: string[] = [];
  const context = brief.researchEvidenceContext;
  const evidenceLevel = context?.evidenceLevel;

  addCoreWarnings(brief, warnings);
  addScenarioWarnings(brief, warnings);
  addEvidenceWarnings(brief, warnings);
  addSearchWarnings(brief, warnings);
  addSecWarnings(brief, warnings);
  addIrWarnings(brief, warnings);
  addMarketWarnings(brief, warnings);

  if (context) {
    if (!sourceNoteMentionsEvidenceLevel(brief)) {
      warnings.push("Quality: sourceNote should mention evidenceLevel.");
    }

    if (
      evidenceLevel === "search-and-sec" &&
      !financialDeepDiveMentionsSecFacts(brief)
    ) {
      warnings.push(
        "Quality: search-and-sec evidence should be reflected in Financial Deep Dive through SEC facts.",
      );
    }

    if (
      evidenceLevelIncludesIr(evidenceLevel) &&
      !brief.irEvidencePack &&
      !context.irEvidencePack
    ) {
      warnings.push("Quality: evidenceLevel includes IR but irEvidencePack is missing.");
    }

    if (evidenceLevelIncludesIr(evidenceLevel) && sourceNoteSaysNoIr(brief)) {
      warnings.push("Quality: sourceNote says Company IR is missing even though IR evidence is attached.");
    }

    if (textTreatsIrAsConsensus(brief)) {
      warnings.push("Quality: IR evidence or company guidance context must not be written as consensus.");
    }

    if (
      context.factLedger.some(
        (fact) =>
          fact.sourceKind === "ir" && fact.factType === "official-financial",
      )
    ) {
      warnings.push(
        "Quality: IR evidence should not be classified as SEC official-financial facts.",
      );
    }

    if (
      evidenceLevelIncludesMarket(evidenceLevel) &&
      !brief.marketEvidencePack &&
      !context.marketEvidencePack
    ) {
      warnings.push("Quality: evidenceLevel includes market but marketEvidencePack is missing.");
    }

    if (evidenceLevelIncludesMarket(evidenceLevel) && sourceNoteSaysNoMarket(brief)) {
      warnings.push(
        "Quality: sourceNote says market price is missing even though Market Evidence is attached.",
      );
    }

    if (!context.coverage.hasConsensus && textClaimsConsensusConnected(brief)) {
      warnings.push(
        "Quality: brief claims consensus estimates are connected even though coverage.hasConsensus=false.",
      );
    }

    if (
      evidenceLevel === "search-and-sec" &&
      !sectionMentionsEvidence(brief, "catalysts")
    ) {
      warnings.push(
        "Quality: Catalysts should reference search evidence or recent-development facts.",
      );
    }

    if (
      evidenceLevel === "search-and-sec" &&
      !sectionMentionsEvidence(brief, "risks")
    ) {
      warnings.push(
        "Quality: Key Risks should reflect search evidence or missing coverage.",
      );
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

  if (valuationLooksLikeRealTargetWithoutMarketData(brief)) {
    warnings.push(
      "Quality: Valuation should avoid real target-price language without real-time price or consensus data.",
    );
  }

  if (briefLooksLikeFormalRatingOrTarget(brief)) {
    warnings.push(
      "Quality: brief should not output a formal rating, buy/sell/hold call, or formal target price in this MVP.",
    );
  }

  if (
    !context &&
    !brief.evidencePack &&
    !brief.secEvidencePack &&
    !brief.irEvidencePack &&
    !brief.marketEvidencePack &&
    hasUnsupportedLiveDataClaim(brief)
  ) {
    warnings.push(
      "Quality: brief appears to claim live data, SEC, IR, consensus, or verified data without evidence.",
    );
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

  const emptySections = (brief.sections || []).filter(
    (section) => !section.blocks?.length,
  );
  if (emptySections.length) {
    warnings.push(
      `Quality: ${emptySections.length} section(s) have no content blocks.`,
    );
  }
}

function addScenarioWarnings(brief: BriefDocument, warnings: string[]) {
  if ((brief.scenarioAnalysis?.scenarios?.length ?? 0) < 3) {
    warnings.push("Quality: scenarioAnalysis should include at least 3 scenarios.");
  }
  if (!hasScenarioTone(brief, "bull")) {
    warnings.push("Quality: missing Bull Case scenario.");
  }
  if (!hasScenarioTone(brief, "base")) {
    warnings.push("Quality: missing Base Case scenario.");
  }
  if (!hasScenarioTone(brief, "bear")) {
    warnings.push("Quality: missing Bear Case scenario.");
  }

  if (!brief.monitoringDashboard?.metrics?.length) {
    warnings.push("Quality: missing Monitoring Dashboard metrics.");
  } else if (brief.monitoringDashboard.metrics.length < 6) {
    warnings.push(
      "Quality: Monitoring Dashboard should include at least 6 metrics.",
    );
  }
}

function addEvidenceWarnings(brief: BriefDocument, warnings: string[]) {
  if (brief.metadata.dataMode === "verified-real-data") {
    warnings.push("Quality: verified-real-data is not allowed in the current MVP.");
  }

  if (
    brief.researchEvidenceContext?.evidenceLevel === "search-and-sec" &&
    !sourceNoteMentionsSearchAndSec(brief)
  ) {
    warnings.push("Quality: sourceNote should explicitly say Search + SEC Evidence Draft.");
  }

  if (
    (brief.researchEvidenceContext?.evidenceLevel === "search-and-sec" ||
      brief.researchEvidenceContext?.evidenceLevel === "sec-only" ||
      brief.secEvidencePack) &&
    sourceNoteSaysNoSec(brief)
  ) {
    warnings.push("Quality: sourceNote says SEC is missing even though SEC evidence is attached.");
  }

  if (
    brief.metadata.dataMode === "evidence-draft" &&
    !sourceNoteMentionsMissingMarketBoundariesV2(brief)
  ) {
    warnings.push(
      "Quality: sourceNote should mention missing real-time price, consensus, company IR, and database coverage.",
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
  if (pack.quote && !pack.quote.retrievedAt) {
    warnings.push("Quality: market quote must include retrievedAt.");
  }
  if (pack.quote && !pack.quote.marketTimestamp) {
    warnings.push(
      "Quality: market quote has no marketTimestamp; treat it as retrieved-only and possibly delayed.",
    );
  }
  if (!pack.priceHistory?.length) {
    warnings.push("Quality: marketEvidencePack should include recent daily price history.");
  }
  if (!sourceNoteMentionsMarketProvider(brief)) {
    warnings.push("Quality: sourceNote should mention marketProvider.");
  }
  if (!sourceNoteMentionsMarketDelayWarning(brief)) {
    warnings.push(
      "Quality: sourceNote should mention that free market data may be delayed or incomplete.",
    );
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

function addSearchWarnings(brief: BriefDocument, warnings: string[]) {
  const pack = brief.evidencePack;
  if (!pack) return;

  const sourceCount = pack.newsItems?.length || pack.sources.length;
  const sources = pack.sources || [];
  const lowCount = sources.filter((source) => source.confidence === "low").length;
  const highOrMediumCount = sources.filter(
    (source) => source.confidence === "high" || source.confidence === "medium",
  ).length;

  if (sourceCount < 3) {
    warnings.push("Quality: evidencePack should include at least 3 sources.");
  }
  if (sources.length && lowCount / sources.length > 0.5) {
    warnings.push("Quality: more than 50% of evidencePack sources are low confidence.");
  }
  if (sources.length && highOrMediumCount === 0) {
    warnings.push("Quality: evidencePack has no high or medium confidence sources.");
  }
  if (
    sources.length &&
    sources.every(
      (source) => source.dateStatus === "retrieved-only" || !source.publishedAt,
    )
  ) {
    warnings.push(
      "Quality: all evidencePack sources are retrieved-only; published dates were unavailable.",
    );
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
  if (pack.recentFilings.length < 1) {
    warnings.push("Quality: secEvidencePack should include at least 1 recent filing.");
  }
  if (!sourceNoteMentionsCik(brief)) {
    warnings.push("Quality: sourceNote should mention SEC CIK.");
  }
  if (!financialDeepDiveMentionsSecFacts(brief)) {
    warnings.push(
      "Quality: Financial Deep Dive should reflect SEC companyfacts when secEvidencePack exists.",
    );
  }
  if (!hasRevenueIncomeOrEps(brief)) {
    warnings.push(
      "Quality: SEC companyfacts extraction may need concept fallback improvements for Revenue / Net Income / EPS.",
    );
  }
}

function addIrWarnings(brief: BriefDocument, warnings: string[]) {
  const pack = brief.irEvidencePack;
  if (!pack) return;

  if (pack.irItems.length < 2) {
    warnings.push("Quality: irEvidencePack should include at least 2 IR sources.");
  }
  if (
    pack.irItems.length &&
    pack.irItems.every(
      (item) => item.dateStatus === "retrieved-only" || !item.publishedAt,
    )
  ) {
    warnings.push(
      "Quality: all IR sources are retrieved-only; published dates were unavailable.",
    );
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
  if (textTreatsIrAsConsensus(brief)) {
    warnings.push("Quality: IR guidance must be described as company guidance context, not consensus.");
  }
  if (textTreatsIrAsOfficialFinancial(brief)) {
    warnings.push(
      "Quality: IR numbers should not be written as SEC official-financial facts.",
    );
  }
}

function findSection(brief: BriefDocument, kind: BriefSectionKind) {
  return brief.sections?.find((section) => section.kind === kind);
}

function hasScenarioTone(brief: BriefDocument, tone: "bull" | "base" | "bear") {
  return brief.scenarioAnalysis?.scenarios?.some((scenario) => {
    const text = `${scenario.tone || ""} ${scenario.name || ""} ${
      scenario.label || ""
    }`.toLowerCase();
    return text.includes(tone);
  });
}

function hasUnsupportedLiveDataClaim(brief: BriefDocument) {
  return unsupportedLiveClaimPattern.test(getBriefText(brief));
}

function sourceNoteMentionsSearchProvider(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /searchprovider|search provider|search evidence|搜索证据/i.test(text);
}

function sourceNoteMentionsCik(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /\bcik\b|sec evidence draft|companyfacts/i.test(text);
}

function sourceNoteMentionsIrProvider(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /irprovider|ir evidence draft|company ir|earnings-release/i.test(text);
}

function sourceNoteMentionsMarketProvider(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /marketprovider|market provider|market evidence draft|third-party free market|free public market data/i.test(
    text,
  );
}

function sourceNoteMentionsMarketDelayWarning(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /delayed or incomplete|may be delayed|field[s]? (may be )?missing|free public market data/i.test(
    text,
  );
}

function sourceNoteMentionsMissingMarketBoundariesV2(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  const legacyMatch = sourceNoteMentionsMissingMarketBoundaries(brief);
  if (
    brief.marketEvidencePack ||
    evidenceLevelIncludesMarket(brief.researchEvidenceContext?.evidenceLevel)
  ) {
    return legacyMatch || (
      /(market evidence draft|marketprovider|third-party free market|free public market data|delayed or incomplete)/i.test(
        text,
      ) &&
      /(consensus|consensus estimates)/i.test(text) &&
      /(database|database save)/i.test(text) &&
      /(manual verification)/i.test(text)
    );
  }

  return legacyMatch || (
    /(real-time price|market price|real-time market price)/i.test(text) &&
    /(consensus|consensus estimates)/i.test(text) &&
    /(company ir|ir evidence|company ir evidence)/i.test(text) &&
    /(database|database save)/i.test(text)
  );
}

function sourceNoteMentionsEvidenceLevel(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /evidencelevel|evidence level|search-and-sec|search-sec-ir-and-market|search-only|sec-only|market-only/i.test(
    text,
  );
}

function sourceNoteMentionsSearchAndSec(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /search \+ sec evidence draft|search and sec evidence draft/i.test(text);
}

function sourceNoteSaysNoSec(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /未接入\s*sec|未接\s*sec|no sec|without sec|sec not connected/i.test(
    text,
  );
}

function sourceNoteSaysNoIr(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  const noIrClaim =
    /no company ir evidence|company ir evidence.*not connected|ir evidence.*not connected|ir not connected/i.test(
      text,
    );
  if (!noIrClaim) return false;
  if (/full[- ]?text parsing|pdf full[- ]?text|transcript full[- ]?text/i.test(text)) {
    return false;
  }
  return !/ir evidence draft|irprovider|company ir.*attached/i.test(text);
}

function sourceNoteSaysNoMarket(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  const noMarketClaim =
    /no real-time market price|market evidence.*not connected|market price.*not connected|real-time market price.*not connected|未接实时股价|未接入实时股价/i.test(
      text,
    );
  if (!noMarketClaim) return false;
  return !/market evidence draft|marketprovider|third-party free market|free public market data|delayed or incomplete/i.test(
    text,
  );
}

function sourceNoteMentionsMissingMarketBoundaries(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  if (brief.marketEvidencePack || evidenceLevelIncludesMarket(brief.researchEvidenceContext?.evidenceLevel)) {
    return (
      /(market evidence draft|marketprovider|third-party free market|free public market data|delayed or incomplete)/i.test(
        text,
      ) &&
      /(涓€鑷撮鏈焲consensus)/i.test(text) &&
      /(鏁版嵁搴搢database)/i.test(text) &&
      /(manual verification|人工校验|人工核验)/i.test(text)
    );
  }
  return (
    /(实时股价|real-time price|market price)/i.test(text) &&
    /(一致预期|consensus)/i.test(text) &&
    /(公司 ir|company ir)/i.test(text) &&
    /(数据库|database)/i.test(text)
  );
}

function sectionMentionsEvidence(
  brief: BriefDocument,
  kind: BriefSectionKind,
) {
  const section = findSection(brief, kind);
  if (!section) return false;
  return /recent|search|source|evidence|catalyst|risk|近期|搜索|证据|来源|催化|风险/i.test(
    sectionText(section),
  );
}

function sectionMentionsIr(
  brief: BriefDocument,
  kind: BriefSectionKind,
) {
  const section = findSection(brief, kind);
  if (!section) return false;
  return /ir evidence|company ir|management commentary|company guidance|business update|product update|official company|earnings release|investor relations/i.test(
    sectionText(section),
  );
}

function sectionMentionsMarket(
  brief: BriefDocument,
  kind: BriefSectionKind,
) {
  const section = findSection(brief, kind);
  if (!section) return false;
  return /market evidence|market price|price context|volume|price history|kline|daily close|行情|股价|成交量|价格/i.test(
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

function financialDeepDiveMentionsSecFacts(brief: BriefDocument) {
  const section = findSection(brief, "financial-deep-dive");
  if (!section) return false;
  return /sec|companyfacts|10-k|10-q|fiscal fact|filed|cik|company facts/i.test(
    sectionText(section),
  );
}

function hasRevenueIncomeOrEps(brief: BriefDocument) {
  const labels = (brief.secEvidencePack?.fiscalFacts || [])
    .map((fact) => `${fact.concept} ${fact.label}`.toLowerCase())
    .join(" ");
  return /revenue|revenues|salesrevenuenet|netincome|earningspershare|eps/.test(
    labels,
  );
}

function evidenceLevelIncludesIr(level: string | undefined) {
  return Boolean(level && /\bir\b/i.test(level));
}

function evidenceLevelIncludesMarket(level: string | undefined) {
  return Boolean(level && /market/i.test(level));
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
    .replace(/must not[^.]{0,220}consensus/gi, "")
    .replace(/not[^.]{0,220}consensus/gi, "")
    .replace(/no consensus estimates/gi, "");

  return /(ir evidence|company guidance context|company guidance|management commentary)[^.。]{0,80}(consensus|consensus estimate|consensus forecast)/i.test(
    cleaned,
  );
}

function textTreatsIrAsOfficialFinancial(brief: BriefDocument) {
  const cleaned = getBriefText(brief)
    .replace(/must not[^.]{0,160}(official[- ]financial|companyfacts)/gi, "")
    .replace(/not[^.]{0,160}(official[- ]financial|companyfacts)/gi, "");

  return /(ir evidence|company ir|earnings release|management commentary).{0,100}(sec official|official[- ]financial|official financial fact|companyfacts)/i.test(
    cleaned,
  );
}

function valuationLooksLikeRealTargetWithoutMarketData(brief: BriefDocument) {
  const section = findSection(brief, "valuation");
  if (!section) return false;
  const text = sectionText(section);
  return (
    /(target price|price target|目标价).{0,40}(\$|usd|美元|\d)/i.test(text) &&
    !/(模拟|示例|n\/a|待核查|not a recommendation|非投资建议|缺少实时股价|一致预期)/i.test(
      text,
    )
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
  ]
    .filter(Boolean)
    .join("\n");
}

function sectionText(section: BriefSection) {
  return section.blocks
    .flatMap((block) => {
      if ("content" in block) return [block.content];
      if ("items" in block) return block.items;
      if ("metrics" in block) return block.metrics.map((metric) => metric.value);
      return [];
    })
    .join(" ");
}
