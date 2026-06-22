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

    if (sourceCount < 3) {
      warnings.push("Quality: evidencePack should include at least 3 sources.");
    }

    if (!sourceNoteMentionsSearchProvider(brief)) {
      warnings.push("Quality: sourceNote should mention searchProvider.");
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
