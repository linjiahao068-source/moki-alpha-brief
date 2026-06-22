import type { BriefTocItem } from "@/types/brief";

type BriefTocProps = {
  items: BriefTocItem[];
};

export function BriefToc({ items }: BriefTocProps) {
  return (
    <aside className="hidden min-w-0 lg:block">
      <nav className="sticky top-6 rounded-[8px] border border-[var(--border)] bg-white p-3">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
          Contents
        </p>
        <ol className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex min-h-9 items-start gap-2 rounded-[6px] px-2 py-2 text-sm leading-5 text-[var(--foreground)] opacity-75 transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand-ink)] hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand-hover)] focus:ring-offset-2 focus:ring-offset-white"
              >
                <span className="mt-0.5 w-5 shrink-0 font-mono text-xs font-semibold text-[var(--brand-ink)]">
                  {item.order}
                </span>
                <span className="min-w-0">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
