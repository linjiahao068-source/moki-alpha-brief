import type { Metadata } from "next";
import Link from "next/link";
import { BuySideMemoV2Renderer } from "@/components/report-v2/BuySideMemoV2Renderer";
import {
  getBuySideMemoV2BySlug,
  type SavedBuySideMemoV2Record,
} from "@/lib/report-v2/buySideMemoV2Store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShareV2PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type SavedMemoLookup = {
  error?: string;
  record: SavedBuySideMemoV2Record | null;
};

export async function generateMetadata({
  params,
}: ShareV2PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await readSavedMemo(slug);

  if (lookup.record) {
    return {
      title: `Moki Alpha Brief - ${lookup.record.ticker}`,
      description: "Saved buy-side research memo.",
    };
  }

  return {
    title: "Moki Alpha Brief - Memo unavailable",
    description: "The requested research memo is not available.",
  };
}

export default async function ShareV2Page({ params }: ShareV2PageProps) {
  const { slug } = await params;
  const lookup = await readSavedMemo(slug);

  if (lookup.record) {
    return <BuySideMemoV2Renderer record={lookup.record} />;
  }

  return <MemoUnavailable error={lookup.error} />;
}

async function readSavedMemo(slug: string): Promise<SavedMemoLookup> {
  try {
    return {
      record: await getBuySideMemoV2BySlug(slug),
    };
  } catch (error) {
    return {
      record: null,
      error:
        error instanceof Error && error.message
          ? error.message
          : "Saved memo storage read failed.",
    };
  }
}

function MemoUnavailable({ error }: { error?: string }) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)] sm:px-6">
      <div className="mx-auto max-w-[720px] rounded-[8px] border border-[var(--border)] bg-white p-6 shadow-[0_22px_60px_-52px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
          Moki Alpha Brief
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
          {"\u7814\u7a76\u5907\u5fd8\u5f55\u6682\u4e0d\u53ef\u7528"}
        </h1>
        <p className="mt-4 text-sm leading-7 opacity-78 sm:text-base">
          {"\u8be5\u94fe\u63a5\u5c1a\u672a\u627e\u5230\u5df2\u4fdd\u5b58\u7684 V2 \u4e70\u65b9\u7814\u62a5\u6570\u636e\uff0c\u9875\u9762\u672a\u91cd\u65b0\u751f\u6210\u6216\u6293\u53d6\u4efb\u4f55\u5916\u90e8\u4fe1\u606f\u3002"}
        </p>
        {error ? (
          <p className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm leading-6 opacity-75">
            {error}
          </p>
        ) : null}
        <div className="mt-6">
          <Link
            className="inline-flex items-center rounded-[6px] bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-88"
            href="/generate"
          >
            {"\u8fd4\u56de\u751f\u6210\u9875"}
          </Link>
        </div>
      </div>
    </main>
  );
}
