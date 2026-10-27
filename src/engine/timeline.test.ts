import { describe, expect, it } from "vitest";
import { lab } from "./colour";
import { STEPS, renderTimeline } from "./timeline";
import type { Client, Choice } from "./types";

const client: Client = {
  skinHex: "#b3947e",
  browHex: "#a17a63",
  lipHex: "#e0868a",
  hairHex: "#faf0be",
  fitzpatrick: 2,
  oiliness: 30,
  pore: 30,
  redness: 40,
};
const cool: Choice = { service: "powder_brow", pigmentHex: "#4a3f3d" };
const fixed: Choice = { ...cool, modifier: { hex: "#d9822b", ratio: 0.15 } };

const at = (r: ReturnType<typeof renderTimeline>, step: string) => r.steps.find((s) => s.step === step)!;

describe("demo claims", () => {
  it("a cool dark-brown pigment drifts cool by year 2 (b* lower than at day 0)", () => {
    const r = renderTimeline(client, cool);
    expect(at(r, "year2").drift).toBe("cool");
    expect(lab(at(r, "year2").hex).b).toBeLessThan(lab(at(r, "day0").hex).b);
  });

  it.each(["#a17a63", "#6b4f3f", "#c9a58c", "#3b2e28"])(
    "the cool drift holds for natural brow %s: year 2 is cooler than day 0",
    (browHex) => {
      const r = renderTimeline({ ...client, browHex }, cool);
      expect(lab(at(r, "year2").hex).b).toBeLessThan(lab(at(r, "day0").hex).b);
    },
  );

  it("the same pigment plus a 15% warm modifier gives drift none at year 2", () => {
    expect(at(renderTimeline(client, fixed), "year2").drift).toBe("none");
  });

  it("microblading with oiliness 80 recommends powder brows and blurs faster than oiliness 30", () => {
    const mb: Choice = { service: "microblading", pigmentHex: "#6b5546" };
    const oilyClient = { ...client, oiliness: 80 };
    const o = renderTimeline(oilyClient, mb);
    const d = renderTimeline(client, mb);
    expect(o.advice.technique).toBe("powder_brow");
    expect(at(o, "year1").definition!).toBeLessThan(at(d, "year1").definition!);
  });
});

describe("invariants", () => {
  const cases: [string, Client, Choice][] = [
    ["powder cool", client, cool],
    ["powder fixed", client, fixed],
    ["microblading oily", { ...client, oiliness: 90 }, { service: "microblading", pigmentHex: "#6b5546" }],
    ["lips", client, { service: "lip_blush", pigmentHex: "#c98a86" }],
  ];

  it.each(cases)("%s: retention-driven intensity never rises and the band brackets the midpoint", (_n, c, ch) => {
    const r = renderTimeline(c, ch);
    expect(r.steps.map((s) => s.step)).toEqual([...STEPS]);
    for (let i = 1; i < r.steps.length; i++) {
      expect(r.steps[i].colorIntensity).toBeLessThanOrEqual(r.steps[i - 1].colorIntensity);
    }
    for (const s of r.steps) {
      expect(s.band.lighterIntensity).toBeLessThanOrEqual(s.colorIntensity);
      expect(s.band.darkerIntensity).toBeGreaterThanOrEqual(s.colorIntensity);
      expect(s.colorIntensity).toBeGreaterThanOrEqual(0);
      expect(s.colorIntensity).toBeLessThanOrEqual(100);
    }
  });

  it("day0 renders the chosen pigment exactly with no drift", () => {
    const d0 = at(renderTimeline(client, cool), "day0");
    expect(d0.hex).toBe("#4a3f3d");
    expect(d0.drift).toBe("none");
  });

  it("the band lighter bound is lighter than the darker bound in L* once colour has faded", () => {
    const y2 = at(renderTimeline(client, cool), "year2");
    expect(lab(y2.band.lighterHex).l).toBeGreaterThan(lab(y2.band.darkerHex).l);
  });

  it("lip renders carry transparencyIntensity and no definition; brow renders the reverse", () => {
    const lips = renderTimeline(client, { service: "lip_blush", pigmentHex: "#c98a86" });
    const brows = renderTimeline(client, cool);
    expect(lips.steps.every((s) => s.transparencyIntensity !== undefined && s.definition === undefined)).toBe(true);
    expect(brows.steps.every((s) => s.definition !== undefined && s.transparencyIntensity === undefined)).toBe(true);
  });

  it("the same inputs give byte-identical output twice", () => {
    expect(JSON.stringify(renderTimeline(client, fixed))).toBe(JSON.stringify(renderTimeline(client, fixed)));
  });
});
