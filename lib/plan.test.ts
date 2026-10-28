import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createReplayYouCam } from "../src/youcam/replay";
import { renderSlot, SLOTS } from "../src/youcam/consult";
import { PlanBody, timelineFor } from "./plan";

const body = {
  fileId: "replay-file",
  mode: "replay" as const,
  service: "powder_brow" as const,
  pigmentHex: "#3a3138",
  client: { skinHex: "#b3947e", browHex: "#a17a63", lipHex: "#e0868a", hairHex: "#FAF0BE", fitzpatrick: 2, oiliness: 31, pore: 22, redness: 31 },
};

describe("consult plan", () => {
  it("accepts a valid body and rejects a bad hex, service and modifier ratio", () => {
    expect(PlanBody.safeParse(body).success).toBe(true);
    expect(PlanBody.safeParse({ ...body, pigmentHex: "red" }).success).toBe(false);
    expect(PlanBody.safeParse({ ...body, service: "nope" }).success).toBe(false);
    expect(PlanBody.safeParse({ ...body, modifier: { id: "warm", ratio: 0.9 } }).success).toBe(false);
  });
  it("gives the same timeline twice (the frame route recomputes it)", () => {
    const p = PlanBody.parse(body);
    expect(JSON.stringify(timelineFor(p))).toBe(JSON.stringify(timelineFor(p)));
  });
  it("a warm modifier changes the planned colour", () => {
    const a = timelineFor(PlanBody.parse(body)).steps[0].hex;
    const b = timelineFor(PlanBody.parse({ ...body, modifier: { id: "warm", ratio: 0.2 } })).steps[0].hex;
    expect(a).not.toBe(b);
  });
  it("renders each of the 7 slots through the replay adapter", async () => {
    const yc = createReplayYouCam(join(process.cwd(), "fixtures", "replay"));
    const tl = timelineFor(PlanBody.parse(body));
    for (const slot of SLOTS) expect(await renderSlot(yc, { id: "x" }, "powder_brow", tl, slot)).toMatch(/brow-/);
  });
});
