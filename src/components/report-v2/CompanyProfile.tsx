import type { BuySideMemoV2 } from "@/lib/report-v2/buySideMemoSchema";
import {
  FieldBlock,
  firstMeaningful,
  formatText,
  SectionShell,
  TextBlockList,
} from "./rendererUtils";

type CompanyProfileProps = {
  memo: BuySideMemoV2;
};

export function CompanyProfile({ memo }: CompanyProfileProps) {
  const section = memo.companyProfile;
  const investorFocus = firstMeaningful(
    section.moat,
    section.customerDemand,
    section.businessSummary,
  );

  return (
    <SectionShell
      eyebrow="Business economics"
      id="company-profile"
      index="02"
      title={"\u516c\u53f8\u753b\u50cf"}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <FieldBlock
          label="How it makes money"
          value={formatText(section.businessSummary)}
        />
        <FieldBlock
          label="Revenue and profit drivers"
          value={formatText(section.customerDemand)}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <FieldBlock
          label="Value-chain position"
          value={formatText(
            section.managementNarrative,
            "\u8be5\u516c\u53f8\u7684\u4ea7\u4e1a\u94fe\u4f4d\u7f6e\u9700\u8981\u540e\u7eed\u8ddf\u8e2a\u53ef\u9760\u6765\u6e90",
          )}
        />
        <FieldBlock
          label="Moat and vulnerability"
          value={formatText(section.moat)}
        />
        <FieldBlock
          label="Why investors care"
          value={formatText(
            investorFocus,
            "\u6295\u8d44\u5173\u6ce8\u70b9\u9700\u8981\u540e\u7eed\u8ddf\u8e2a",
          )}
        />
      </div>

      <div className="mt-4">
        <TextBlockList
          blocks={section.segmentNotes}
          emptyText={
            "\u4e1a\u52a1\u7ed3\u6784\u8bc1\u636e\u6682\u4e0d\u53ef\u7528"
          }
        />
      </div>
    </SectionShell>
  );
}
