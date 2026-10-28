import { NextResponse } from "next/server";
import { YouCamError } from "@/src/youcam/errors";

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** One plain sentence for the client. Never leaks the key or a raw upstream body. */
export function failure(e: unknown): NextResponse {
  if (e instanceof YouCamError) return NextResponse.json({ error: e.userMessage, code: e.code }, { status: 422 });
  return NextResponse.json({ error: "Something went wrong on our side. Try again in a moment." }, { status: 500 });
}
