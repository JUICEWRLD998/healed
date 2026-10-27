import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderTimeline } from "../engine/timeline";
import { TtlCache, cacheKey } from "./cache";
import { renderTimelineImages, toClient } from "./consult";
import { effectFor } from "./effects";
import { explain } from "./errors";
import { PAUSE_MESSAGE, chooseMode, loadConfig } from "./index";
import { IpCap, liveAllowed } from "./ledger";
import { createReplayYouCam } from "./replay";

describe("error mapping", () => {
  it.each([
    ["error_src_face_too_small", /too small/],
    ["error_large_face_angle", /turned or tilted/],
    ["error_face_not_forward_facing", /turned or tilted/],
    ["error_multiple_faces", /One face/],
    ["error_no_face_detected", /No face/],
    ["error_bad_lighting", /lighting/],
    ["error_nsfw", /cannot be used/],
    ["something_new", /could not read this photo/],
  ])("%s", (code, re) => expect(explain(code)).toMatch(re));
});

describe("cache", () => {
  it("keys ignore object key order", () => {
    expect(cacheKey("h", "render", { a: 1, b: [2, { c: 3, d: 4 }] })).toBe(cacheKey("h", "render", { b: [2, { d: 4, c: 3 }], a: 1 }));
    expect(cacheKey("h", "render", { a: 1 })).not.toBe(cacheKey("h", "render", { a: 2 }));
  });
  it("expires after the TTL and de-duplicates in-flight calls", async () => {
    let t = 0;
    const c = new TtlCache<number>(100, () => t);
    let n = 0;
    const make = async () => ++n;
    const [x, y] = await Promise.all([c.get("k", make), c.get("k", make)]);
    expect([x, y, n]).toEqual([1, 1, 1]);
    t = 99;
    expect(await c.get("k", make)).toBe(1);
    t = 101;
    expect(await c.get("k", make)).toBe(2);
  });
  it("does not cache a failure", async () => {
    const c = new TtlCache<number>(1000);
    await expect(
      c.get("k", async () => {
        throw new Error("x");
      }),
    ).rejects.toThrow();
    expect(await c.get("k", async () => 7)).toBe(7);
  });
});

describe("live budget", () => {
  it("pauses below the floor and says why", () => {
    expect(liveAllowed(149, 150)).toBe(false);
    expect(liveAllowed(150, 150)).toBe(true);
    const base = { configured: "live" as const, hasKey: true, floor: 150, ipAllowed: true };
    expect(chooseMode({ ...base, balance: 100 })).toEqual({ mode: "replay", reason: PAUSE_MESSAGE });
    expect(chooseMode({ ...base, balance: 500 })).toEqual({ mode: "live" });
    expect(chooseMode({ ...base, balance: null }).mode).toBe("replay");
    expect(chooseMode({ ...base, balance: 500, ipAllowed: false }).mode).toBe("replay");
    expect(chooseMode({ ...base, balance: 500, hasKey: false }).mode).toBe("replay");
    expect(chooseMode({ ...base, configured: "replay", balance: 500 }).mode).toBe("replay");
  });
  it("caps live consults per IP per day and resets on a new day", () => {
    let day = "2026-11-01";
    const cap = new IpCap(3, () => day);
    expect([1, 2, 3, 4].map(() => cap.allow("1.2.3.4"))).toEqual([true, true, true, false]);
    expect(cap.allow("5.6.7.8")).toBe(true);
    day = "2026-11-02";
    expect(cap.allow("1.2.3.4")).toBe(true);
  });
  it("loads defaults from env", () => {
    expect(loadConfig({ HEALED_MODE: "replay", LIVE_UNIT_FLOOR: "200" })).toMatchObject({ mode: "replay", floor: 200, capPerIp: 3 });
  });
});

const tones = { skinHex: "#b3947e", lipHex: "#e0868a", browHex: "#a17a63", hairHex: "#faf0be" };
const skin = (oilinessRaw: number, whole = "Combination") => ({ oilinessRaw, poreRaw: 80, rednessRaw: 70, skinType: { whole } });

describe("skin score mapping", () => {
  it("inverts YouCam higher-is-healthier scores into the engine higher-is-worse severity", () => {
    const c = toClient(tones, 2, skin(69));
    expect(c.oiliness).toBe(31);
    expect(c.pore).toBe(20);
    expect(c.redness).toBe(30);
  });
  it("a healthy raw score is not oily; a poor one is", () => {
    expect(toClient(tones, 2, skin(95)).oiliness).toBeLessThan(10);
    expect(toClient(tones, 2, skin(20)).oiliness).toBe(80);
  });
  it("a whole-face Oily skin type floors oiliness at 70", () => {
    expect(toClient(tones, 2, skin(69, "Oily")).oiliness).toBe(70);
  });
});

describe("effects and consult rendering", () => {
  const client = toClient(tones, 2, skin(69));

  it("brow effect carries hex, intensity and definition from the engine", () => {
    const tl = renderTimeline(client, { service: "powder_brow", pigmentHex: "#4a3f3d" });
    const e = effectFor("powder_brow", tl.steps[3]) as any;
    expect(e.category).toBe("eyebrows");
    expect(e.palettes[0].color).toBe(tl.steps[3].hex);
    expect(e.pattern.definition).toBe(tl.steps[3].definition);
  });
  it("lip effect uses two sheer palettes with the live-API required fields", () => {
    const tl = renderTimeline(client, { service: "lip_blush", pigmentHex: "#c98a86" });
    const e = effectFor("lip_blush", tl.steps[2]) as any;
    expect(e.palettes).toHaveLength(2);
    expect(e.palettes[0]).toMatchObject({ texture: "sheer", transparencyIntensity: tl.steps[2].transparencyIntensity });
    expect(e.style).toMatchObject({ type: "ombre" });
    expect(e.style.blendStrength).toBeDefined();
    expect(e.style.innerColorRatio).toBeDefined();
  });
  it("renders 5 timeline steps plus 2 band renders in parallel through the replay adapter", async () => {
    const yc = createReplayYouCam(join(process.cwd(), "fixtures", "replay"));
    const tl = renderTimeline(client, { service: "powder_brow", pigmentHex: "#4a3f3d" });
    const r = await renderTimelineImages(yc, { id: "x" }, "powder_brow", tl);
    expect(r.steps.map((s) => s.step)).toEqual(["day0", "week6", "year1", "year2", "year3"]);
    expect(r.band.lighterUrl).toMatch(/brow-/);
    expect(r.band.darkerUrl).toMatch(/brow-/);
  });
});
