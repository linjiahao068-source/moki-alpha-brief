import type { Metadata } from "next";
import { briefMap } from "@/data/briefs";
import { BriefNotFound } from "@/components/brief/BriefNotFound";
import { BriefPage } from "@/components/brief/BriefPage";
import { getBriefBySlug } from "@/lib/briefs/getBriefBySlug";

type SharePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(briefMap).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const brief = getBriefBySlug(slug);

  if (!brief) {
    return {
      title: "Moki Alpha Brief - Not Found",
      description: "The requested public research brief could not be found.",
    };
  }

  return {
    title: "Moki Alpha Brief - NVDA Research Memo",
    description: "Public buy-side style research memo demo for NVDA.",
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const brief = getBriefBySlug(slug);

  if (!brief) {
    return <BriefNotFound />;
  }

  return <BriefPage brief={brief} />;
}
