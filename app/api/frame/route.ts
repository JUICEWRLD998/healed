import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, failure } from "@/lib/server";
import { PlanBody, timelineFor } from "@/lib/plan";
import { getYouCam, loadConfig } from "@/src/youcam";
import { renderSlot, SLOTS } from "@/src/youcam/consult";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = PlanBody.extend({ slot: z.enum(SLOTS as unknown as [string, ...string[]]) });

// AGE: one render for one slot. The browser fires the 7 slots in parallel and paints each image as it arrives.
export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "That choice was not valid. Pick again." }, { status: 400 });
    const { slot, ...plan } = parsed.data;
    // A consult that read in replay stays in replay. A live consult does not spend the per-IP cap again.
    const cfg = plan.mode === "replay" ? { ...loadConfig(), mode: "replay" as const } : loadConfig();
    const { yc, reason } = await getYouCam(clientIp(req), cfg, false);
    const url = await renderSlot(yc, { id: plan.fileId }, plan.service, timelineFor(plan), slot as (typeof SLOTS)[number]);
    return NextResponse.json({ slot, url, mode: yc.mode, reason: reason ?? null });
  } catch (e) {
    return failure(e);
  }
}
