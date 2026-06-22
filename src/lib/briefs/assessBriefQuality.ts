import type { BriefDocument, BriefSectionKind } from "@/types/brief";

const liveDataClaimPattern =
  /(\bSEC\b|\bIR\b|real[- ]?time|live data|market data|consensus|news search|latest filing|verified source|实时|行情|股价|一致预期|新闻检索|最新财报|已核验来源)/i;

const liveDataNegationPattern =
  /(no live data|demo|mock|not connected|without|未接入|未接|没有接入|不接入|不接|未使用|不使用|未检索|不代表|不能视为|不是|模拟|示例|待核查)/i;

export function assessBriefQuality(brief: BriefDocument): string[] {
  const warnings: string[] = [];

  if (!findSection(brief, "executive-view")) {
    warnings.push("Quality: missing Executive Investment View section.");
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

  const emptySections = (brief.sections || []).filter(
    (section) => !section.blocks?.length,
  );
  if (emptySections.length) {
    warnings.push(
      `Quality: ${emptySections.length} section(s) have no content blocks.`,
    );
  }

  if (!brief.evidencePack && hasUnsupportedLiveDataClaim(brief)) {
    warnings.push(
      "Quality: brief appears to claim live data, SEC, IR, consensus, or news access without evidencePack.",
    );
  }

  if (brief.evidencePack) {
    const sourceCount =
      brief.evidencePack.newsItems?.length || brief.evidencePack.sources.length;
    const sources = brief.evidencePack.sources || [];
    const lowCount = sources.filter(
      (source) => source.confidence === "low",
    ).length;
    const highOrMediumCount = sources.filter(
      (source) => source.confidence === "high" || source.confidence === "medium",
    ).length;

    if (sourceCount < 3) {
      warnings.push("Quality: evidencePack should include at least 3 sources.");
    }

    if (sources.length && lowCount / sources.length > 0.5) {
      warnings.push(
        "Quality: more than 50% of evidencePack sources are low confidence.",
      );
    }

    if (sources.length && highOrMediumCount === 0) {
      warnings.push(
        "Quality: evidencePack has no high or medium confidence sources.",
      );
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

    if (!sourceNoteMentionsSearchEvidenceDraft(brief)) {
      warnings.push("Quality: sourceNote should explicitly say Search Evidence Draft.");
    }

    if (brief.metadata.dataMode !== "evidence-draft") {
      warnings.push(
        "Quality: evidencePack results should use dataMode evidence-draft.",
      );
    }

    if (sourceNoteStillSaysNoLiveData(brief)) {
      warnings.push(
        "Quality: evidencePack exists, so sourceNote should say Search Evidence Draft rather than only No Live Data.",
      );
    }

    if (!sectionMentionsRecentEvidence(brief, "catalysts")) {
      warnings.push(
        "Quality: Catalysts should reference the recent search evidence at a high level.",
      );
    }

    if (!sectionMentionsRecentEvidence(brief, "risks")) {
      warnings.push(
        "Quality: Key Risks should reference the recent search evidence at a high level.",
      );
    }

    if (treatsLowConfidenceAsStrongFact(brief)) {
      warnings.push(
        "Quality: brief may be treating a low-confidence discussion or aggregator source as a strong fact.",
      );
    }
  }

  if (brief.secEvidencePack) {
    if (brief.secEvidencePack.fiscalFacts.length < 3) {
      warnings.push(
        "Quality: secEvidencePack should include at least 3 fiscal facts.",
      );
    }

    if (brief.secEvidencePack.recentFilings.length < 1) {
      warnings.push(
        "Quality: secEvidencePack should include at least 1 recent filing.",
      );
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

    if (usesSimulatedFinancialsWithSecFacts(brief)) {
      warnings.push(
        "Quality: brief still uses simulated financial wording even though SEC fiscal facts exist.",
      );
    }

    if (valuationLooksLikeRealTargetWithoutMarketData(brief)) {
      warnings.push(
        "Quality: Valuation should avoid real target-price language without real-time price or consensus data.",
      );
    }
  }

  return warnings;
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
  const values = [
    brief.metadata?.title,
    brief.metadata?.briefType,
    brief.metadata?.frameworkName,
    brief.metadata?.shareLabel,
    brief.hero?.subheadline,
    ...(brief.sourceNote?.paragraphs ?? []),
    brief.disclaimer?.text,
  ];

  return values
    .filter(Boolean)
    .join("\n")
    .split(/[。.!?；;\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .some((sentence) => {
      if (!liveDataClaimPattern.test(sentence)) return false;
      return !liveDataNegationPattern.test(sentence);
    });
}

function sourceNoteMentionsSearchProvider(brief: BriefDocument) {
  const text = (brief.sourceNote?.paragraphs ?? []).join(" ").toLowerCase();
  return /searchprovider|search provider|搜索供应商|search evidence/.test(text);
}

function sourceNoteMentionsSearchEvidenceDraft(brief: BriefDocument) {
  const text = (brief.sourceNote?.paragraphs ?? []).join(" ").toLowerCase();
  return /search evidence draft|evidence draft/.test(text);
}

function sourceNoteMentionsCik(brief: BriefDocument) {
  const text = (brief.sourceNote?.paragraphs ?? []).join(" ").toLowerCase();
  return /\bcik\b|sec evidence draft|companyfacts/.test(text);
}

function sourceNoteStillSaysNoLiveData(brief: BriefDocument) {
  const text = (brief.sourceNote?.paragraphs ?? []).join(" ").toLowerCase();
  return /no live data|未接入新闻检索/.test(text) && !/search evidence|搜索证据/.test(text);
}

function sectionMentionsRecentEvidence(
  brief: BriefDocument,
  kind: BriefSectionKind,
) {
  const section = findSection(brief, kind);
  if (!section) return false;
  const text = section.blocks
    .flatMap((block) => {
      if ("content" in block) return [block.content];
      if ("items" in block) return block.items;
      if ("metrics" in block) return block.metrics.map((metric) => metric.value);
      return [];
    })
    .join(" ")
    .toLowerCase();

  return /recent|近期|搜索|source|evidence|证据|公开内容|news/.test(text);
}

function treatsLowConfidenceAsStrongFact(brief: BriefDocument) {
  const text = brief.sections
    .flatMap((section) =>
      section.blocks.flatMap((block) => {
        if ("content" in block) return [block.content];
        if ("items" in block) return block.items;
        if ("metrics" in block) return block.metrics.map((metric) => metric.value);
        return [];
      }),
    )
    .join(" ")
    .toLowerCase();

  return /(reddit|forum|perplexity|stocktwits|x\.com|twitter|social media|aggregator).{0,80}(confirmed|proves|shows|indicates|verified|fact)/.test(
    text,
  );
}

function financialDeepDiveMentionsSecFacts(brief: BriefDocument) {
  const section = findSection(brief, "financial-deep-dive");
  if (!section) return false;
  return sectionText(section).match(/sec|companyfacts|10-k|10-q|fiscal fact|filed|cik/i);
}

function hasRevenueIncomeOrEps(brief: BriefDocument) {
  const labels = (brief.secEvidencePack?.fiscalFacts || [])
    .map((fact) => `${fact.concept} ${fact.label}`.toLowerCase())
    .join(" ");
  return /revenue|revenues|salesrevenuenet|netincome|earningspershare|eps/.test(labels);
}

function usesSimulatedFinancialsWithSecFacts(brief: BriefDocument) {
  if (!brief.secEvidencePack?.fiscalFacts.length) return false;
  const text = brief.sections.map(sectionText).join(" ").toLowerCase();
  return /(模拟|示例|mock|待核查).{0,30}(revenue|收入|eps|net income|净利润|margin|利润率)/i.test(
    text,
  );
}

function valuationLooksLikeRealTargetWithoutMarketData(brief: BriefDocument) {
  const section = findSection(brief, "valuation");
  if (!section) return false;
  const text = sectionText(section).toLowerCase();
  return /(target price|目标价|price target).{0,40}(\$|usd|美元|\d)/i.test(text) &&
    !/(模拟|示例|n\/a|待核查|not a recommendation|非投资建议)/i.test(text);
}

function sectionText(section: NonNullable<ReturnType<typeof findSection>>) {
  return section.blocks
    .flatMap((block) => {
      if ("content" in block) return [block.content];
      if ("items" in block) return block.items;
      if ("metrics" in block) return block.metrics.map((metric) => metric.value);
      return [];
    })
    .join(" ");
}
