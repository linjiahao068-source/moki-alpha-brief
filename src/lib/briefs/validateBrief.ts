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
    !brief.researchEvidenceContext
  ) {
    issues.push(
      "evidence-draft requires evidencePack, secEvidencePack, irEvidencePack, or researchEvidenceContext",
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

  if (context.evidenceLevel === "search-and-sec") {
    if (!brief.evidencePack && !context.searchEvidencePack) {
      issues.push("search-and-sec evidenceLevel requires search evidence");
    }
    if (!brief.secEvidencePack && !context.secEvidencePack) {
      issues.push("search-and-sec evidenceLevel requires SEC evidence");
    }
  }

  if (context.evidenceLevel === "search-sec-and-ir") {
    if (!brief.evidencePack && !context.searchEvidencePack) {
      issues.push("search-sec-and-ir evidenceLevel requires search evidence");
    }
    if (!brief.secEvidencePack && !context.secEvidencePack) {
      issues.push("search-sec-and-ir evidenceLevel requires SEC evidence");
    }
    if (!brief.irEvidencePack && !context.irEvidencePack) {
      issues.push("search-sec-and-ir evidenceLevel requires IR evidence");
    }
  }

  if (
    (context.evidenceLevel === "ir-only" ||
      context.evidenceLevel === "search-and-ir" ||
      context.evidenceLevel === "sec-and-ir") &&
    !brief.irEvidencePack &&
    !context.irEvidencePack
  ) {
    issues.push(`${context.evidenceLevel} evidenceLevel requires IR evidence`);
  }
}

function validateEvidenceBoundaryText(brief: BriefDocument, issues: string[]) {
  const text = getBoundaryText(brief);
  const level = brief.researchEvidenceContext?.evidenceLevel;
  const hasIrEvidence = evidenceLevelIncludesIr(level) || Boolean(brief.irEvidencePack);

  if (/verified-real-data/i.test(text)) {
    issues.push("brief text must not display verified-real-data");
  }

  if (
    (level === "search-and-sec" ||
      level === "search-sec-and-ir" ||
      level === "sec-and-ir" ||
      level === "sec-only" ||
      brief.secEvidencePack) &&
    claimsNoSec(text)
  ) {
    issues.push("sourceNote contradicts SEC evidence by saying SEC is not connected");
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

  if (hasIrEvidence && claimsNoCompanyIr(text)) {
    issues.push("sourceNote contradicts IR evidence by saying Company IR is not connected");
  }

  if (hasIrEvidence && treatsIrAsConsensus(text)) {
    issues.push("brief text must not treat IR evidence or company guidance context as consensus");
  }

  if (
    brief.metadata?.dataMode === "evidence-draft" &&
    !mentionsMissingMarketBoundaries(text, hasIrEvidence)
  ) {
    issues.push(
      hasIrEvidence
        ? "sourceNote must mention missing real-time price, consensus, database, and manual verification coverage"
        : "sourceNote must mention missing real-time price, consensus, company IR, and database coverage",
    );
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

function treatsIrAsConsensus(text: string) {
  const cleaned = text
    .replace(/must not[^.]{0,220}consensus/gi, "")
    .replace(/not[^.]{0,220}consensus/gi, "")
    .replace(/no consensus estimates/gi, "");

  return /(ir evidence|company guidance context|company guidance|management commentary)[^.。]{0,80}(consensus|consensus estimate|consensus forecast)/i.test(
    cleaned,
  );
}

function mentionsMissingMarketBoundaries(text: string, hasIrEvidence: boolean) {
  const hasCoreMissing =
    /(real-time price|market price|real-time market price)/i.test(text) &&
    /(consensus|consensus estimates)/i.test(text) &&
    /(database|database save)/i.test(text);

  if (!hasCoreMissing) return false;

  if (hasIrEvidence) {
    return /(manual verification|pdf full[- ]?text|transcript full[- ]?text)/i.test(
      text,
    );
  }

  return /(company ir|ir evidence|company ir evidence)/i.test(text);
}

function evidenceLevelIncludesIr(level: string | undefined) {
  return Boolean(level && /\bir\b/i.test(level));
}
