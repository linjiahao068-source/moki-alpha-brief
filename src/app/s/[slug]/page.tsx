import type { Metadata } from "next";
import { briefMap } from "@/data/briefs";
import { BriefNotFound } from "@/components/brief/BriefNotFound";
import { BriefPage } from "@/components/brief/BriefPage";
import { SavedBriefMetaPanel } from "@/components/brief/SavedBriefMetaPanel";
import { getBriefBySlug as getStaticBriefBySlug } from "@/lib/briefs/getBriefBySlug";
import { getBriefBySlug as getSavedBriefBySlug } from "@/lib/storage/briefStore";
import type { SavedBriefRecord } from "@/types/savedBrief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SharePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type SavedBriefLookup = {
  error?: string;
  savedBrief: SavedBriefRecord | null;
};

export function generateStaticParams() {
  return Object.keys(briefMap).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const savedLookup = await readSavedBrief(slug);
  const savedBrief = savedLookup.savedBrief;

  if (savedBrief) {
    return {
      title: `Moki Alpha Brief - ${savedBrief.ticker}`,
      description: "Saved Moki Alpha Brief public research page.",
    };
  }

  const staticBrief = getStaticDemoBrief(slug);

  if (staticBrief) {
    return {
      title: `Moki Alpha Brief - ${staticBrief.metadata.ticker}`,
      description: "Moki Alpha Brief public research page.",
    };
  }

  return {
    title: "Moki Alpha Brief - Not Found",
    description: "The requested public research brief could not be found.",
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const savedLookup = await readSavedBrief(slug);

  if (savedLookup.savedBrief) {
    return (
      <BriefPage
        brief={savedLookup.savedBrief.briefDocument}
        shareMeta={<SavedBriefMetaPanel savedBrief={savedLookup.savedBrief} />}
      />
    );
  }

  const staticBrief = getStaticDemoBrief(slug);

  if (staticBrief) {
    return <BriefPage brief={staticBrief} />;
  }

  if (savedLookup.error) {
    return (
      <BriefNotFound
        badgeLabel="Storage Error"
        detail="The page did not regenerate or fetch new data. Please try again after storage is available."
        message={savedLookup.error}
        title="Brief storage needs attention"
      />
    );
  }

  return <BriefNotFound />;
}

async function readSavedBrief(slug: string): Promise<SavedBriefLookup> {
  try {
    return {
      savedBrief: await getSavedBriefBySlug(slug),
    };
  } catch (error) {
    return {
      savedBrief: null,
      error:
        error instanceof Error && error.message
          ? error.message
          : "Brief storage read failed.",
    };
  }
}

function getStaticDemoBrief(slug: string) {
  return slug.toLowerCase() === "nvda" ? getStaticBriefBySlug(slug) : undefined;
}
