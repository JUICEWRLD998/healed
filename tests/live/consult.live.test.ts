// Manual gate check. Spends about 46 live units. Run: LIVE_TEST=1 npx vitest run tests/live
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderTimeline } from "../../src/engine/timeline";
import { readClient, renderTimelineImages } from "../../src/youcam/consult";
import { createRealYouCam } from "../../src/youcam/real";

const root = process.cwd();
const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

describe.skipIf(!process.env.LIVE_TEST)("live consult through the real adapter", () => {
  it("SNAP, READ, AGE end to end, then delete", async () => {
    const yc = createRealYouCam({ apiKey: env.YOUCAM_API_KEY, baseUrl: env.YOUCAM_BASE_URL });
    const before = await yc.balance!();
    const t0 = Date.now();

    const file = await yc.upload(new Uint8Array(readFileSync(join(root, "evidence/spike/selfie2-crop.jpg"))));
    const client = await readClient(yc, file);
    const readMs = Date.now() - t0;
    const timeline = renderTimeline(client, { service: "powder_brow", pigmentHex: "#4a3f3d" });
    const rendered = await renderTimelineImages(yc, file, "powder_brow", timeline);
    const totalMs = Date.now() - t0;

    await yc.remove!(file);
    const after = await yc.balance!();

    const receipt = {
      client,
      advice: timeline.advice,
      steps: timeline.steps.map((s) => ({ step: s.step, hex: s.hex, colorIntensity: s.colorIntensity, definition: s.definition, drift: s.drift })),
      rendered: { steps: rendered.steps.length, bandStep: rendered.band.step },
      ledger: yc.ledger.snapshot(),
      balance: { before, after, spent: before - after },
      ms: { read: readMs, total: totalMs },
    };
    writeFileSync(join(root, "evidence/live-consult-receipt.json"), JSON.stringify(receipt, null, 2));

    expect(rendered.steps).toHaveLength(5);
    expect(yc.ledger.total).toBe(46);
    expect(before - after).toBe(46);
  }, 240_000);
});
