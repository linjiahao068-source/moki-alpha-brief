import { NextResponse } from "next/server";
import { getBriefBySlug } from "@/lib/storage/briefStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BriefBySlugRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, { params }: BriefBySlugRouteContext) {
  const { slug } = await params;

  try {
    const savedBrief = await getBriefBySlug(slug);

    if (!savedBrief) {
      return NextResponse.json(
        {
          ok: false,
          error: "Brief not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      savedBrief,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error && error.message
            ? error.message
            : "Brief storage read failed.",
      },
      { status: 500 },
    );
  }
}
