import type { SecFiscalFact } from "@/types/evidence";
import type {
  SecCompanyFactConcept,
  SecCompanyFactsResponse,
  SecCompanyFactUnit,
} from "./types";

const CONCEPTS: Array<{ concept: string; label: string }> = [
  { concept: "Revenues", label: "Revenue" },
  {
    concept: "RevenueFromContractWithCustomerExcludingAssessedTax",
    label: "Revenue",
  },
  { concept: "SalesRevenueNet", label: "Sales Revenue Net" },
  { concept: "NetIncomeLoss", label: "Net Income" },
  { concept: "OperatingIncomeLoss", label: "Operating Income" },
  { concept: "EarningsPerShareDiluted", label: "Diluted EPS" },
  { concept: "EarningsPerShareBasic", label: "Basic EPS" },
  { concept: "Assets", label: "Assets" },
  { concept: "Liabilities", label: "Liabilities" },
  {
    concept: "CashAndCashEquivalentsAtCarryingValue",
    label: "Cash and Cash Equivalents",
  },
  { concept: "LongTermDebt", label: "Long-Term Debt" },
  {
    concept: "NetCashProvidedByUsedInOperatingActivities",
    label: "Operating Cash Flow",
  },
  {
    concept: "PaymentsToAcquirePropertyPlantAndEquipment",
    label: "Capital Expenditures",
  },
  {
    concept: "CommonStocksIncludingAdditionalPaidInCapital",
    label: "Common Stock and APIC",
  },
];

export function extractFiscalFacts(
  companyFacts: SecCompanyFactsResponse,
  limit = 18,
): SecFiscalFact[] {
  const usGaap = companyFacts.facts?.["us-gaap"] || {};
  const selected: SecFiscalFact[] = [];
  const seen = new Set<string>();

  for (const { concept, label } of CONCEPTS) {
    const conceptFacts = usGaap[concept];
    if (!conceptFacts?.units) continue;

    const extracted = extractConceptFacts(concept, label, conceptFacts);

    for (const fact of extracted.slice(0, 2)) {
      const key = [
        fact.concept,
        fact.unit,
        fact.fy,
        fact.fp,
        fact.form,
        fact.filed,
        fact.periodEnd,
        fact.frame,
      ].join("|");

      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(fact);
      if (selected.length >= limit) return selected;
    }
  }

  return selected;
}

function extractConceptFacts(
  concept: string,
  fallbackLabel: string,
  conceptFacts: SecCompanyFactConcept,
): SecFiscalFact[] {
  return Object.entries(conceptFacts.units || {})
    .flatMap(([unit, facts]) =>
      facts
        .filter(isUsableFact)
        .map((fact): SecFiscalFact => ({
          concept,
          label: conceptFacts.label || fallbackLabel,
          value: fact.val as number,
          unit,
          fy: fact.fy,
          fp: fact.fp,
          form: fact.form,
          filed: fact.filed,
          frame: fact.frame,
          periodEnd: fact.end,
          confidence: "high",
          source: "sec-companyfacts",
        })),
    )
    .sort(compareFactsByRecency);
}

function isUsableFact(fact: SecCompanyFactUnit) {
  return (
    typeof fact.val === "number" &&
    Boolean(fact.filed) &&
    (fact.form === "10-K" || fact.form === "10-Q")
  );
}

function compareFactsByRecency(left: SecFiscalFact, right: SecFiscalFact) {
  const filedDiff = compareDate(right.filed, left.filed);
  if (filedDiff !== 0) return filedDiff;
  return compareDate(right.periodEnd, left.periodEnd);
}

function compareDate(left?: string, right?: string) {
  return new Date(left || "1900-01-01").getTime() - new Date(right || "1900-01-01").getTime();
}
