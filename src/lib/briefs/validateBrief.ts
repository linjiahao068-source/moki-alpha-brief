import type { BriefDocument } from "@/types/brief";

const allowedDataModes = new Set([
  "mock",
  "llm-demo-no-live-data",
  "evidence-draft",
  "verified-real-data",
]);

export function validateBriefDocument(brief: BriefDocument): string[] {
  const issues: string[] = [];

  validateRootFields(brief, issues);
  validateCoreContent(brief, issues);
  validateEvidenceShape(brief, issues);
  validateEvidenceBoundaryText(brief, issues);

  return issues;
}

function validateRootFields(brief: BriefDocument, issues: string[]) {
  if (brief.schemaVersion !== "0.1") issues.push("schemaVersion must be 0.1");
  if (!brief.slug) issues.push("slug is required");
  if (!brief.metadata?.ticker) issues.push("metadata.ticker is required");
  if (!brief.metadata?.companyName) issues.push("metadata.companyName is required");
  if (!brief.metadata?.title) issues.push("metadata.title is required");
  if (!brief.metadata?.generatedAt) issues.push("metadata.generatedAt is required");
  if (!brief.metadata?.updatedAt) issues.push("metadata.updatedAt is required");

  if (!brief.metadata?.dataMode) {
    issues.push("metadata.dataMode is required");
  } else if (!allowedDataModes.has(brief.metadata.dataMode)) {
    issues.push(`metadata.dataMode is invalid: ${brief.metadata.dataMode}`);
  }

  if (brief.metadata?.dataMode === "verified-real-data") {
    issues.push("verified-real-data is not supported in the current MVP");
  }

  if (
    brief.metadata?.dataMode === "evidence-draft" &&
    !brief.evidencePack &&
    !brief.secEvidencePack &&
    !brief.irEvidencePack &&
    !brief.marketEvidencePack &&
    !brief.consensusEvidencePack &&
    !brief.researchEvidenceContext
  ) {
    issues.push(
      "evidence-draft requires evidencePack, secEvidencePack, irEvidencePack, marketEvidencePack, consensusEvidencePack, or researchEvidenceContext",
    );
  }
}

function validateCoreContent(brief: BriefDocument, issues: string[]) {
  if (!Array.isArray(brief.sections) || !brief.sections.length) {
    issues.push("sections must be a non-empty array");
  } else {
    const ids = new Set<string>();

    for (const section of brief.sections) {
      if (!section.id) issues.push("section.id is required");
      if (typeof section.order !== "number") {
        issues.push(`section ${section.id || "(unknown)"} order is required`);
      }
      if (!section.title) {
        issues.push(`section ${section.id || "(unknown)"} title is required`);
      }
      if (!section.kind) {
        issues.push(`section ${section.id || "(unknown)"} kind is required`);
      }
      if (!section.blocks?.length) {
        issues.push(`section ${section.id || "(unknown)"} blocks are required`);
      }
      if (section.id) {
        if (ids.has(section.id)) issues.push(`duplicate section id: ${section.id}`);
        ids.add(section.id);
      }
    }
  }

  if (!brief.scenarioAnalysis?.scenarios?.length) {
    issues.push("scenarioAnalysis.scenarios is required");
  }
  if (!brief.monitoringDashboard?.metrics?.length) {
    issues.push("monitoringDashboard.metrics is required");
  }
  if (!brief.sourceNote?.paragraphs?.length) {
    issues.push("sourceNote.paragraphs is required");
  }
  if (!brief.disclaimer?.text) {
    issues.push("disclaimer.text is required");
  }
}

function validateEvidenceShape(brief: BriefDocument, issues: string[]) {
  if (brief.evidencePack) {
    if (brief.evidencePack.dataMode !== "evidence-draft") {
      issues.push("evidencePack.dataMode must be evidence-draft");
    }
    if (!brief.evidencePack.sources?.length) {
      issues.push("evidencePack.sources is required");
    }
    for (const source of brief.evidencePack.sources || []) {
      if (!source.confidence) {
        issues.push(`EvidenceSource ${source.id || "(unknown)"} confidence is required`);
      }
      if (!source.retrievedAt) {
        issues.push(`EvidenceSource ${source.id || "(unknown)"} retrievedAt is required`);
      }
    }
  }

  if (brief.secEvidencePack) {
    if (brief.secEvidencePack.dataMode !== "evidence-draft") {
      issues.push("secEvidencePack.dataMode must be evidence-draft");
    }
    if (!brief.secEvidencePack.cik) issues.push("secEvidencePack.cik is required");
  }

  if (brief.irEvidencePack) {
    if (brief.irEvidencePack.dataMode !== "evidence-draft") {
      issues.push("irEvidencePack.dataMode must be evidence-draft");
    }
    if (!brief.irEvidencePack.irItems?.length) {
      issues.push("irEvidencePack.irItems is required");
    }
    if (!brief.irEvidencePack.sources?.length) {
      issues.push("irEvidencePack.sources is required");
    }
  }

  if (brief.marketEvidencePack) {
    if (brief.marketEvidencePack.dataMode !== "evidence-draft") {
      issues.push("marketEvidencePack.dataMode must be evidence-draft");
    }
    if (
      brief.marketEvidencePack.provider !== "mock" &&
      brief.marketEvidencePack.provider !== "stock-api" &&
      brief.marketEvidencePack.provider !== "global-stock-data"
    ) {
      issues.push("marketEvidencePack.provider is invalid");
    }
    if (!brief.marketEvidencePack.sources?.length) {
      issues.push("marketEvidencePack.sources is required");
    }
  }

  if (brief.consensusEvidencePack) {
    if (brief.consensusEvidencePack.dataMode !== "evidence-draft") {
      issues.push("consensusEvidencePack.dataMode must be evidence-draft");
    }
    if (brief.consensusEvidencePack.provider !== "mock") {
      issues.push("consensusEvidencePack.provider must be mock in this MVP");
    }
    if (!brief.consensusEvidencePack.estimates?.length) {
      issues.push("consensusEvidencePack.estimates is required");
    }
    if (!brief.consensusEvidencePack.sources?.length) {
      issues.push("consensusEvidencePack.sources is required");
    }
    for (const estimate of brief.consensusEvidencePack.estimates || []) {
      if (estimate.sourceProvider !== "mock") {
        issues.push("consensus estimates must use sourceProvider=mock in this MVP");
      }
    }
  }

  const context = brief.researchEvidenceContext;
  if (!context) return;

  if (context.dataMode !== "evidence-draft") {
    issues.push("researchEvidenceContext.dataMode must be evidence-draft");
  }
  if (!context.sourceRegistry?.length) {
    issues.push("researchEvidenceContext.sourceRegistry is required");
  }
  if (!context.factLedger?.length) {
    issues.push("researchEvidenceContext.factLedger is required");
  }
  if (!context.coverage) {
    issues.push("researchEvidenceContext.coverage is required");
  }

  if (evidenceLevelIncludesSearch(context.evidenceLevel) && !brief.evidencePack && !context.searchEvidencePack) {
    issues.push(`${context.evidenceLevel} evidenceLevel requires search evidence`);
  }
  if (evidenceLevelIncludesSec(context.evidenceLevel) && !brief.secEvidencePack && !context.secEvidencePack) {
    issues.push(`${context.evidenceLevel} evidenceLevel requires SEC evidence`);
  }
  if (evidenceLevelIncludesIr(context.evidenceLevel) && !brief.irEvidencePack && !context.irEvidencePack) {
    issues.push(`${context.evidenceLevel} evidenceLevel requires IR evidence`);
  }
  if (evidenceLevelIncludesMarket(context.evidenceLevel) && !brief.marketEvidencePack && !context.marketEvidencePack) {
    issues.push(`${context.evidenceLevel} evidenceLevel requires market evidence`);
  }
  if (evidenceLevelIncludesConsensus(context.evidenceLevel) && !brief.consensusEvidencePack && !context.consensusEvidencePack) {
    issues.push(`${context.evidenceLevel} evidenceLevel requires consensus evidence`);
  }
}

function validateEvidenceBoundaryText(brief: BriefDocument, issues: string[]) {
  const text = getBoundaryText(brief);
  const fullText = getFullBriefText(brief);
  const level = brief.researchEvidenceContext?.evidenceLevel;
  const hasIrEvidence = evidenceLevelIncludesIr(level) || Boolean(brief.irEvidencePack);
  const hasMarketEvidence =
    evidenceLevelIncludesMarket(level) || Boolean(brief.marketEvidencePack);
  const hasConsensusEvidence =
    evidenceLevelIncludesConsensus(level) || Boolean(brief.consensusEvidencePack);

  if (hasForbiddenVerifiedRealDataClaim(text)) {
    issues.push("brief text must not claim verified-real-data");
  }

  if (!hasConsensusEvidence && claimsConsensusConnected(fullText)) {
    issues.push("brief must not claim consensus estimates are connected");
  }
  if (hasConsensusEvidence && claimsNoConsensusEvidence(text)) {
    issues.push("sourceNote contradicts Consensus evidence by saying consensus is not connected");
  }
  if (hasConsensusEvidence && claimsConsensusAsSecActual(fullText)) {
    issues.push("brief must not claim consensus evidence is SEC actual data");
  }
  if (hasConsensusEvidence && claimsNonConsensusProviderAsConsensus(fullText)) {
    issues.push("brief must not write Search, IR, or Market numbers as consensus");
  }

  if (claimsFormalTargetOrRating(fullText)) {
    issues.push("brief must not output a formal rating or formal target price");
  }

  if ((evidenceLevelIncludesSec(level) || brief.secEvidencePack) && claimsNoSec(text)) {
    issues.push("sourceNote contradicts SEC evidence by saying SEC is not connected");
  }
  if (hasMarketEvidence && claimsNoMarketEvidence(text)) {
    issues.push(
      "sourceNote contradicts Market evidence by saying real-time market price or market evidence is not connected",
    );
  }
  if (hasIrEvidence && claimsNoCompanyIr(text)) {
    issues.push("sourceNote contradicts IR evidence by saying Company IR is not connected");
  }
  if (hasIrEvidence && treatsIrAsConsensus(text)) {
    issues.push("brief text must not treat IR evidence or company guidance context as consensus");
  }

  if (
    level === "search-and-sec" &&
    !/search \+ sec evidence draft|search and sec evidence draft/i.test(text)
  ) {
    issues.push("sourceNote must mention Search + SEC Evidence Draft");
  }
  if (
    level === "search-sec-and-ir" &&
    !/search \+ sec \+ ir evidence draft|search.*sec.*ir evidence draft/i.test(text)
  ) {
    issues.push("sourceNote must mention Search + SEC + IR Evidence Draft");
  }
  if (
    level === "search-sec-ir-and-market" &&
    !/search \+ sec \+ ir \+ market evidence draft|search.*sec.*ir.*market evidence draft/i.test(text)
  ) {
    issues.push("sourceNote must mention Search + SEC + IR + Market Evidence Draft");
  }
  if (
    level === "search-sec-ir-market-and-consensus" &&
    !/search \+ sec \+ ir \+ market \+ consensus evidence draft|search.*sec.*ir.*market.*consensus evidence draft/i.test(text)
  ) {
    issues.push("sourceNote must mention Search + SEC + IR + Market + Consensus Evidence Draft");
  }

  if (
    brief.metadata?.dataMode === "evidence-draft" &&
    !mentionsDraftBoundaries(text, { hasConsensusEvidence, hasIrEvidence, hasMarketEvidence })
  ) {
    issues.push("sourceNote must mention the current evidence draft boundaries");
  }
}

function getBoundaryText(brief: BriefDocument) {
  return [
    brief.metadata?.shareLabel,
    ...(brief.hero?.badges || []).map((badge) => badge.label),
    ...(brief.sourceNote?.paragraphs || []),
    brief.disclaimer?.text,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function getFullBriefText(brief: BriefDocument) {
  return [
    getBoundaryText(brief),
    ...(brief.sections || []).flatMap((section) =>
      (section.blocks || []).flatMap((block) => {
        if ("content" in block) return [block.content];
        if ("items" in block) return block.items;
        if ("metrics" in block) {
          return block.metrics.flatMap((metric) => [
            metric.label,
            metric.value,
            metric.detail || "",
          ]);
        }
        return [];
      }),
    ),
    ...(brief.scenarioAnalysis?.scenarios || []).flatMap((scenario) => [
      scenario.name,
      scenario.label,
      scenario.keyAssumptions,
      scenario.targetPrice,
      scenario.impliedReturn,
      scenario.operatingSetup || "",
      scenario.trigger || "",
    ]),
    ...(brief.monitoringDashboard?.metrics || []).flatMap((metric) => [
      metric.metric,
      metric.whyItMatters,
      metric.threshold,
      metric.status || "",
      metric.cadence || "",
    ]),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function claimsNoSec(text: string) {
  return (
    /no sec|without sec|sec.*not connected|not connected.*sec/i.test(text) &&
    !/sec evidence draft|sec companyfacts|secprovider|cik/i.test(text)
  );
}

function claimsNoCompanyIr(text: string) {
  const noIrClaim =
    /no company ir evidence|company ir evidence.*not connected|ir evidence.*not connected|ir not connected/i.test(
      text,
    );
  if (!noIrClaim) return false;
  if (/ir evidence draft|irprovider|ir source count|company ir.*attached/i.test(text)) {
    return false;
  }
  if (/pdf full[- ]?text|transcript full[- ]?text|full[- ]?text parsing/i.test(text)) {
    return false;
  }
  return true;
}

function claimsNoMarketEvidence(text: string) {
  const noMarketClaim =
    /no real-time market price|without real-time market price|market evidence.*not connected|market price.*not connected|real-time market price.*not connected|未接.{0,12}实时股价|实时股价.{0,12}未接/i.test(
      text,
    );
  if (!noMarketClaim) return false;
  return !/market evidence draft|marketprovider|third-party free market|free public market data|market data may be delayed/i.test(
    text,
  );
}

function claimsNoConsensusEvidence(text: string) {
  const noConsensusClaim =
    /no consensus estimates|without consensus estimates|consensus evidence.*not connected|consensus estimates.*not connected|consensus not connected|未接.{0,12}一致预期|一致预期.{0,12}未接/i.test(
      text,
    );
  if (!noConsensusClaim) return false;
  return !/consensus evidence draft|consensusprovider|consensus provider=mock|consensus is mock evidence/i.test(
    text,
  );
}

function treatsIrAsConsensus(text: string) {
  const cleaned = text
    .replace(/must not[^.。]{0,220}consensus/gi, "")
    .replace(/not[^.。]{0,220}consensus/gi, "")
    .replace(/不能[^。]{0,120}一致预期/gi, "")
    .replace(/不是[^。]{0,120}一致预期/gi, "")
    .replace(/no consensus estimates/gi, "");

  return /(ir evidence|company guidance context|company guidance|management commentary)[^.。]{0,80}(is|are|as|treated as|written as|becomes|作为|写成|视为)[^.。]{0,80}(consensus|consensus estimate|consensus forecast|一致预期)/i.test(
    cleaned,
  );
}

function claimsConsensusConnected(text: string) {
  const cleaned = text
    .replace(/no consensus estimates/gi, "")
    .replace(/consensus[^.。]{0,120}(not connected|missing|not available)/gi, "")
    .replace(/未接.{0,20}一致预期/gi, "");

  return /(consensus estimates? (are )?(connected|attached|available)|已接.{0,20}一致预期|一致预期.{0,20}(已接|已连接|可用))/i.test(
    cleaned,
  );
}

function claimsConsensusAsSecActual(text: string) {
  const cleaned = text
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

function claimsNonConsensusProviderAsConsensus(text: string) {
  const cleaned = text
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

function hasForbiddenVerifiedRealDataClaim(text: string) {
  const cleaned = text
    .replace(/not verified-real-data/gi, "")
    .replace(/not\s+verified real data/gi, "")
    .replace(/is not[^.。]{0,80}verified-real-data/gi, "")
    .replace(/不是[^。]{0,80}verified-real-data/gi, "");

  return /(^|[^a-z])verified-real-data/i.test(cleaned);
}

function claimsFormalTargetOrRating(text: string) {
  const cleaned = text
    .replace(/not a formal rating/gi, "")
    .replace(/not investment advice/gi, "")
    .replace(/不构成投资建议/g, "")
    .replace(/不得输出正式目标价/g, "")
    .replace(/no formal rating/gi, "");

  return /(formal rating|rating:\s*(buy|sell|hold|neutral|overweight|underweight)|\b(buy|sell|hold)\b recommendation|正式评级|买入评级|卖出评级|持有评级|目标价[:：]?\s*(\$|usd|hkd|港元|美元|\d))/i.test(
    cleaned,
  );
}

function mentionsDraftBoundaries(
  text: string,
  {
    hasConsensusEvidence,
    hasIrEvidence,
    hasMarketEvidence,
  }: {
    hasConsensusEvidence: boolean;
    hasIrEvidence: boolean;
    hasMarketEvidence: boolean;
  },
) {
  const hasManualBoundary = /manual verification|人工校验|manual review/i.test(text);
  const hasMarketBoundary = hasMarketEvidence
    ? /(market evidence draft|marketprovider|third-party free market|free public market data|market data may be delayed|delayed or incomplete)/i.test(
        text,
      )
    : /(real-time price|market price|real-time market price)/i.test(text);
  const hasConsensusBoundary = hasConsensusEvidence
    ? /(consensus evidence draft|consensusprovider|consensus provider=mock|consensus is mock evidence)/i.test(
        text,
      )
    : /(consensus|consensus estimates|一致预期)/i.test(text);
  const hasIrBoundary = hasIrEvidence
    ? /ir evidence draft|irprovider|company ir.*attached/i.test(text)
    : /(company ir|ir evidence|company ir evidence)/i.test(text);

  return hasManualBoundary && hasMarketBoundary && hasConsensusBoundary && hasIrBoundary;
}

function evidenceLevelIncludesIr(level: string | undefined) {
  return Boolean(level && /\bir\b/i.test(level));
}

function evidenceLevelIncludesSearch(level: string | undefined) {
  return Boolean(level && /search/i.test(level));
}

function evidenceLevelIncludesSec(level: string | undefined) {
  return Boolean(level && /\bsec\b/i.test(level));
}

function evidenceLevelIncludesMarket(level: string | undefined) {
  return Boolean(level && /market/i.test(level));
}

function evidenceLevelIncludesConsensus(level: string | undefined) {
  return Boolean(level && /consensus/i.test(level));
}
