import { NextResponse } from "next/server";
import { VERSION, currentMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ mode: currentMode(), version: VERSION });
}
