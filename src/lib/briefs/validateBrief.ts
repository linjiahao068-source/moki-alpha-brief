import type { BriefDocument } from "@/types/brief";

const allowedDataModes = new Set([
  "mock",
  "llm-demo-no-live-data",
  "evidence-draft",
  "verified-real-data",
]);

export function validateBriefDocument(brief: BriefDocument): string[] {
  const issues: string[] = [];

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

  if (
    brief.metadata?.dataMode === "evidence-draft" &&
    !brief.evidencePack &&
    !brief.secEvidencePack
  ) {
    issues.push("evidence-draft requires evidencePack or secEvidencePack");
  }

  if (brief.metadata?.dataMode === "verified-real-data") {
    issues.push("verified real-data mode is not supported in the current MVP");
  }

  validateSearchEvidence(brief, issues);
  validateSecEvidence(brief, issues);
  validateCoreContent(brief, issues);
  validateDataBoundaryClaims(brief, issues);

  return issues;
}

function validateSearchEvidence(brief: BriefDocument, issues: string[]) {
  if (brief.metadata?.dataMode !== "evidence-draft" || !brief.evidencePack) {
    return;
  }

  if (brief.evidencePack.dataMode !== "evidence-draft") {
    issues.push("evidencePack.dataMode must be evidence-draft");
  }

  if (!brief.evidencePack.newsItems?.length) {
    issues.push("evidence-draft requires evidencePack.newsItems");
  }

  if (!brief.evidencePack.sources?.length) {
    issues.push("evidence-draft requires evidencePack.sources");
  }

  for (const source of brief.evidencePack.sources || []) {
    if (!source.confidence) {
      issues.push(`EvidenceSource ${source.id || "(unknown)"} confidence is required`);
    } else if (!["high", "medium", "low"].includes(source.confidence)) {
      issues.push(`EvidenceSource ${source.id || "(unknown)"} confidence is invalid`);
    }

    if (!source.retrievedAt) {
      issues.push(`EvidenceSource ${source.id || "(unknown)"} retrievedAt is required`);
    }
  }

  if (!hasSearchEvidenceSourceNote(brief)) {
    issues.push("evidence-draft sourceNote must mention search evidence");
  }
}

function validateSecEvidence(brief: BriefDocument, issues: string[]) {
  if (brief.metadata?.dataMode !== "evidence-draft" || !brief.secEvidencePack) {
    return;
  }

  if (brief.secEvidencePack.dataMode !== "evidence-draft") {
    issues.push("secEvidencePack.dataMode must be evidence-draft");
  }

  if (!brief.secEvidencePack.cik) {
    issues.push("secEvidencePack.cik is required");
  }

  for (const fact of brief.secEvidencePack.fiscalFacts || []) {
    if (!fact.unit) {
      issues.push(`SEC fiscal fact ${fact.concept || "(unknown)"} unit is required`);
    }
    if (!fact.form) {
      issues.push(`SEC fiscal fact ${fact.concept || "(unknown)"} form is required`);
    }
    if (!fact.filed) {
      issues.push(`SEC fiscal fact ${fact.concept || "(unknown)"} filed is required`);
    }
  }

  if (!hasSecEvidenceSourceNote(brief)) {
    issues.push("SEC evidence sourceNote must mention SEC Evidence Draft and CIK");
  }
}

function validateCoreContent(brief: BriefDocument, issues: string[]) {
  if (!Array.isArray(brief.sections)) {
    issues.push("sections must be an array");
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

function validateDataBoundaryClaims(brief: BriefDocument, issues: string[]) {
  const hasSearch = Boolean(brief.evidencePack);
  const hasSec = Boolean(brief.secEvidencePack);
  const claimText = collectClaimText(brief);

  if (!hasSearch && !hasSec && hasPositiveClaim(claimText, liveDataPattern)) {
    issues.push(
      "brief appears to claim live data, SEC, IR, market price, consensus, or news access without evidence",
    );
  }

  if (hasSearch && !hasSec && hasPositiveClaim(claimText, secDataPattern)) {
    issues.push("search-only evidence draft appears to claim SEC official data");
  }

  if (
    (hasSearch || hasSec) &&
    hasPositiveClaim(claimText, realTimeOrConsensusPattern)
  ) {
    issues.push(
      "evidence draft appears to claim real-time price, consensus, or verification-grade data",
    );
  }
}

function hasSearchEvidenceSourceNote(brief: BriefDocument) {
  const text = (brief.sourceNote?.paragraphs ?? []).join(" ").toLowerCase();
  return /search evidence|searchprovider|search provider|evidence draft/.test(text);
}

function hasSecEvidenceSourceNote(brief: BriefDocument) {
  const text = (brief.sourceNote?.paragraphs ?? []).join(" ").toLowerCase();
  return /sec evidence draft|sec provider|secprovider|cik|companyfacts|submissions/.test(
    text,
  );
}

function collectClaimText(brief: BriefDocument) {
  return [
    brief.metadata?.title,
    brief.metadata?.briefType,
    brief.metadata?.frameworkName,
    brief.metadata?.shareLabel,
    brief.hero?.subheadline,
    ...(brief.sourceNote?.paragraphs ?? []),
    brief.disclaimer?.text,
  ]
    .filter(Boolean)
    .join("\n");
}

const liveDataPattern =
  /\b(sec|ir|real[- ]?time|market data|consensus|news search|latest filing|companyfacts|submissions)\b|实时|行情|股价|一致预期|新闻检索|最新财报|官方披露/i;

const secDataPattern =
  /\b(sec|companyfacts|submissions|10-k|10-q|cik)\b|官方披露|财报/i;

const realTimeOrConsensusPattern =
  /\b(real[- ]?time|live price|market data|consensus|verified real data|verification-grade|verified financial)\b|实时股价|实时行情|一致预期|已验证真实数据/i;

const positiveVerbPattern =
  /\b(using|uses|based on|according to|retrieved|fetched|verified|shows|indicates|connected|sourced from)\b|根据|基于|使用|接入|引用|来自|抓取|显示|表明|已验证/i;

const negationPattern =
  /\b(no|not|without|never|cannot|demo|draft|mock|sample|unverified|not connected|not supported)\b|未|没有|不|不可|不能|并未|仅为|模拟|示例|待核查|草稿|演示/i;

function hasPositiveClaim(text: string, claimPattern: RegExp) {
  return text
    .split(/[。.!?；;\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .some((sentence) => {
      if (!claimPattern.test(sentence)) return false;
      if (negationPattern.test(sentence)) return false;
      return positiveVerbPattern.test(sentence);
    });
}
