import { NextResponse } from "next/server";
import { clientIp, failure } from "@/lib/server";
import { getYouCam } from "@/src/youcam";
import { readClient } from "@/src/youcam/consult";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png"]);

// SNAP -> READ: upload the photo, run the three analyses in parallel, return the Client for the engine.
// The image is held in memory for this request only. It is never written to disk.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return NextResponse.json({ error: "Add a photo to continue." }, { status: 400 });
    if (!TYPES.has(file.type)) return NextResponse.json({ error: "Use a JPEG or PNG photo." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is over 8 MB. Use a smaller one." }, { status: 400 });

    const { yc, reason } = await getYouCam(clientIp(req));
    const ref = await yc.upload(new Uint8Array(await file.arrayBuffer()), file.type);
    const client = await readClient(yc, ref);
    return NextResponse.json({ fileId: ref.id, client, mode: yc.mode, reason: reason ?? null });
  } catch (e) {
    return failure(e);
  }
}
