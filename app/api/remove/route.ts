import { NextResponse } from "next/server";
import { z } from "zod";
import { getYouCam } from "@/src/youcam";
import { clientIp } from "@/lib/server";

export const dynamic = "force-dynamic";

// CONSENT: delete the uploaded file and its tasks from YouCam after the consult. Best effort; data expires on its own.
export async function POST(req: Request) {
  const parsed = z.object({ fileId: z.string().min(1).max(200) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing file." }, { status: 400 });
  try {
    const { yc } = await getYouCam(clientIp(req), undefined, false);
    await yc.remove?.({ id: parsed.data.fileId });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ deleted: false, note: "Some uploaded data could not be deleted. It expires on its own within 30 days." });
  }
}
