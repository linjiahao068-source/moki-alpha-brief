import type { BriefDocument, BriefTocItem } from "@/types/brief";

export function getBriefTocItems(brief: BriefDocument): BriefTocItem[] {
  return [
    ...brief.sections
      .filter((section) => section.kind !== "bottom-line")
      .map((section) => ({
        id: section.id,
        label: section.shortTitle ?? section.title,
        order: section.order,
      })),
    {
      id: brief.scenarioAnalysis.id,
      label: brief.scenarioAnalysis.shortTitle ?? brief.scenarioAnalysis.title,
      order: brief.scenarioAnalysis.order,
    },
    {
      id: brief.monitoringDashboard.id,
      label:
        brief.monitoringDashboard.shortTitle ?? brief.monitoringDashboard.title,
      order: brief.monitoringDashboard.order,
    },
    ...brief.sections
      .filter((section) => section.kind === "bottom-line")
      .map((section) => ({
        id: section.id,
        label: section.shortTitle ?? section.title,
        order: section.order,
      })),
  ].sort((a, b) => a.order - b.order);
}
