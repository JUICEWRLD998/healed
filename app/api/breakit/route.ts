import { NextResponse } from "next/server";
import { BREAK_IDS, runBreak, type BreakId } from "@/src/judges/breakit";

export const dynamic = "force-dynamic";

// Try-to-break-it: runs one named case through the production error mapping, engine or mode choice.
// No image is accepted here and no YouCam call is made, so it costs no units.
export function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!(BREAK_IDS as readonly string[]).includes(id)) return NextResponse.json({ error: "Unknown case." }, { status: 400 });
  return NextResponse.json(runBreak(id as BreakId));
}
