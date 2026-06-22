import type { BriefDocument } from "@/types/brief";

const allowedDataModes = new Set([
  "mock",
  "llm-demo-no-live-data",
  "evidence-draft",
  "verified-real-data",
]);

export function validateBriefDocument(brief: BriefDocument): string[] {
  const issues: string[] = [];

  if (brief.schemaVersion !== "0.1") {
    issues.push("schemaVersion must be 0.1");
  }

  if (!brief.slug) issues.push("slug is required");
  if (!brief.metadata?.ticker) issues.push("metadata.ticker is required");
  if (!brief.metadata?.companyName) {
    issues.push("metadata.companyName is required");
  }
  if (!brief.metadata?.title) issues.push("metadata.title is required");
  if (!brief.metadata?.generatedAt) {
    issues.push("metadata.generatedAt is required");
  }
  if (!brief.metadata?.updatedAt) {
    issues.push("metadata.updatedAt is required");
  }
  if (!brief.metadata?.dataMode) {
    issues.push("metadata.dataMode is required");
  } else if (!allowedDataModes.has(brief.metadata.dataMode)) {
    issues.push(`metadata.dataMode is invalid: ${brief.metadata.dataMode}`);
  }

  if (
    (brief.metadata?.dataMode === "verified-real-data" ||
      brief.metadata?.dataMode === "evidence-draft") &&
    !brief.evidencePack
  ) {
    issues.push(
      `${brief.metadata.dataMode} requires evidencePack before it can be displayed.`,
    );
  }

  if (!brief.evidencePack && brief.metadata?.dataMode === "verified-real-data") {
    issues.push("verified-real-data cannot be used without evidencePack");
  }

  if (brief.metadata?.dataMode === "verified-real-data") {
    issues.push("verified-real-data is not supported in the current MVP");
  }

  if (
    brief.metadata?.dataMode === "evidence-draft" &&
    !brief.evidencePack?.newsItems?.length
  ) {
    issues.push("evidence-draft requires evidencePack.newsItems");
  }

  if (brief.metadata?.dataMode === "evidence-draft" && brief.evidencePack) {
    if (brief.evidencePack.dataMode !== "evidence-draft") {
      issues.push("evidencePack.dataMode must be evidence-draft");
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
  }

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
        if (ids.has(section.id)) {
          issues.push(`duplicate section id: ${section.id}`);
        }
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

  if (
    brief.metadata?.dataMode === "evidence-draft" &&
    !hasSearchEvidenceSourceNote(brief)
  ) {
    issues.push("evidence-draft sourceNote must mention search evidence");
  }

  if (!brief.disclaimer?.text) {
    issues.push("disclaimer.text is required");
  }

  if (
    !brief.evidencePack &&
    hasUnsupportedLiveDataClaim([
      brief.metadata?.title,
      brief.metadata?.briefType,
      brief.metadata?.frameworkName,
      brief.metadata?.shareLabel,
      ...(brief.sourceNote?.paragraphs ?? []),
    ])
  ) {
    issues.push(
      "brief claims live SEC, IR, market price, consensus, or news data without evidencePack",
    );
  }

  if (
    brief.evidencePack?.searchProvider &&
    hasUnsupportedVerifiedDataClaim(collectClaimText(brief))
  ) {
    issues.push(
      "search evidence draft claims SEC, real-time price, consensus, or verified financial data",
    );
  }

  return issues;
}

function hasSearchEvidenceSourceNote(brief: BriefDocument) {
  const text = (brief.sourceNote?.paragraphs ?? []).join(" ").toLowerCase();
  return /search evidence|evidence draft|searchprovider|搜索证据|公开网页搜索/.test(
    text,
  );
}

function collectClaimText(brief: BriefDocument) {
  return [
    brief.metadata?.title,
    brief.metadata?.briefType,
    brief.metadata?.frameworkName,
    brief.metadata?.shareLabel,
    ...(brief.sourceNote?.paragraphs ?? []),
    brief.disclaimer?.text,
  ];
}

function hasUnsupportedVerifiedDataClaim(values: Array<string | undefined>) {
  const text = values.filter(Boolean).join("。");
  const sentences = text
    .split(/[。.!?；;\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.some((sentence) => {
    const normalized = sentence.toLowerCase();
    const isNegated =
      /未接入|未接|没有接入|不接入|不接|未使用|不使用|不进行|不代表|不能视为|不是|no live data|demo|模拟|示例|待核查|not connected|without/.test(
        normalized,
      );

    if (isNegated) return false;

    return (
      /(根据|使用|接入|引用|来自|检索|抓取|核验|according to|using|retrieved|fetched).{0,18}(sec|实时股价|实时行情|real-time price|real-time market|一致预期|consensus|最新财报|latest filing)/.test(
        normalized,
      ) ||
      /(sec|实时股价|实时行情|real-time price|real-time market|一致预期|consensus|最新财报|latest filing).{0,18}(显示|表明|verified|已核验|shows|indicates)/.test(
        normalized,
      ) ||
      /verified real data|verified financial/.test(normalized)
    );
  });
}

function hasUnsupportedLiveDataClaim(values: Array<string | undefined>) {
  const text = values.filter(Boolean).join("。");
  const sentences = text
    .split(/[。.!?；;\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.some((sentence) => {
    const normalized = sentence.toLowerCase();
    const mentionsLiveData =
      /sec|ir|实时|real-time|股价|行情|一致预期|consensus|新闻检索|news search|最新财报|latest filing|market data/.test(
        normalized,
      );

    if (!mentionsLiveData) return false;

    const isNegated =
      /未接入|未接|没有接入|不接入|不接|未使用|不使用|不进行|未连接|没有连接|未检索|不检索|不代表|不能视为|不是|no live data|demo|模拟|示例|not connected|not use|without/.test(
        normalized,
      );

    if (isNegated) return false;

    return /根据|基于|使用|接入|引用|来自|检索|抓取|核验|verified|based on|according to|using|retrieved|fetched/.test(
      normalized,
    );
  });
}
