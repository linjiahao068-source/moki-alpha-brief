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

  if (
    !context &&
    !brief.evidencePack &&
    !brief.secEvidencePack &&
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
    !sourceNoteMentionsMissingMarketBoundaries(brief)
  ) {
    warnings.push(
      "Quality: sourceNote should mention missing real-time price, consensus, company IR, and database coverage.",
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

function sourceNoteMentionsEvidenceLevel(brief: BriefDocument) {
  const text = sourceNoteText(brief);
  return /evidencelevel|evidence level|search-and-sec|search-only|sec-only/i.test(
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

function sourceNoteMentionsMissingMarketBoundaries(brief: BriefDocument) {
  const text = sourceNoteText(brief);
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
