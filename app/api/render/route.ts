import { NextResponse } from "next/server";
import { failure } from "@/lib/server";
import { PlanBody, timelineFor } from "@/lib/plan";
import { SLOTS } from "@/src/youcam/consult";

export const dynamic = "force-dynamic";

// CHOOSE -> AGE (plan): run the deterministic engine and return the timeline at once. No YouCam call is made here.
// The browser then asks /api/frame for each of the 7 renders so every image shows as soon as it lands.
export async function POST(req: Request) {
  try {
    const parsed = PlanBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "That choice was not valid. Pick again." }, { status: 400 });
    return NextResponse.json({ timeline: timelineFor(parsed.data), slots: SLOTS });
  } catch (e) {
    return failure(e);
  }
}
