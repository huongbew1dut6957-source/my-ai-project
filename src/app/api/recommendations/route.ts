import { NextResponse } from "next/server";
import { buildRecommendations } from "@/lib/recommendations";
import { normalizeResumeProfile } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const resume = normalizeResumeProfile(payload);
    const items = buildRecommendations(resume);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { message: "Invalid resume payload." },
      { status: 400 },
    );
  }
}
