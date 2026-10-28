import { NextResponse } from "next/server";
import { VERSION, currentMode } from "@/lib/config";

export const dynamic = "force-dynamic";

// `mode` is what the next consult will start in: Replay when configured so or when no key exists. The balance floor and
// the per-IP cap are decided per consult (src/youcam/index.ts), so a live consult can still fall back to Replay with a reason.
export function GET() {
  const hasKey = !!process.env.YOUCAM_API_KEY;
  const configured = currentMode();
  return NextResponse.json({ mode: configured === "live" && hasKey ? "live" : "replay", configured, hasKey, version: VERSION });
}
