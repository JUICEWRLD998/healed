import { NextResponse } from "next/server";
import { BREAK_IDS, runBreak, type BreakId } from "@/lib/breakit";

export const dynamic = "force-dynamic";

// Runs one break-it case through production code. No image is accepted here, so nothing about a face is stored.
export function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") as BreakId | null;
  if (!id || !BREAK_IDS.includes(id)) return NextResponse.json({ error: "Unknown case." }, { status: 400 });
  return NextResponse.json(runBreak(id));
}
