import type { EvidencePack } from "@/types/evidence";

type SourceEvidenceListProps = {
  evidencePack?: EvidencePack;
  warnings?: string[];
};

export function SourceEvidenceList({
  evidencePack,
  warnings = [],
}: SourceEvidenceListProps) {
  if (!evidencePack) return null;

  const items = evidencePack.newsItems?.length
    ? evidencePack.newsItems
    : evidencePack.sources.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
        publishedAt: source.publishedAt,
        retrievedAt: source.retrievedAt,
        snippet: "Source metadata only; snippet unavailable.",
      }));
  const isMock = evidencePack.searchProvider === "mock";

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
            Source Evidence
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {isMock ? "Mock Search Evidence" : "Search Evidence Draft"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-[var(--brand-ink)]">
            {evidencePack.searchProvider || "mock"}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-[var(--foreground)] opacity-75">
            {items.length} sources
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-75">
        搜索证据仅用于辅助研究草稿，未接 SEC、实时股价、一致预期或数据库，不构成投资建议。
      </p>

      {warnings.length || evidencePack.warnings?.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
          {[...warnings, ...(evidencePack.warnings || [])]
            .filter(Boolean)
            .map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-[8px] border border-[var(--border)] bg-[var(--background)] p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="min-w-0 text-sm font-semibold leading-6 text-[var(--foreground)]">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-words underline decoration-[var(--brand-border)] underline-offset-4 hover:text-[var(--brand-ink)]"
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 font-mono text-xs text-[var(--foreground)] opacity-70">
                {item.publishedAt || "date n/a"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs leading-5 text-[var(--foreground)] opacity-70">
              <span>{item.publisher || "publisher n/a"}</span>
              <span className="font-mono">retrieved {item.retrievedAt}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
              {item.snippet}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
