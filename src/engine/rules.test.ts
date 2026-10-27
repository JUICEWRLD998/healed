import { describe, expect, it } from "vitest";
import { lab } from "./colour";
import {
  advise,
  classifyTemperature,
  definitionAt,
  driftStrength,
  lipTransparency,
  mixPigment,
  retentionBand,
} from "./rules";
import type { Client } from "./types";

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
const oily: Client = { ...client, oiliness: 80 };

describe("rule 1: mixing the modifier", () => {
  it("returns the pigment unchanged with no modifier or ratio 0", () => {
    expect(mixPigment("#4a3f3d")).toBe("#4a3f3d");
    expect(mixPigment("#4a3f3d", { hex: "#d9822b", ratio: 0 })).toBe("#4a3f3d");
  });
  it("moves b* up when a warm modifier is added", () => {
    const mixed = mixPigment("#4a3f3d", { hex: "#d9822b", ratio: 0.15 });
    expect(lab(mixed).b).toBeGreaterThan(lab("#4a3f3d").b + 8);
  });
  it("clamps ratio to 0-0.3", () => {
    expect(mixPigment("#4a3f3d", { hex: "#d9822b", ratio: 0.9 })).toBe(
      mixPigment("#4a3f3d", { hex: "#d9822b", ratio: 0.3 }),
    );
  });
});

describe("rule 2: retention", () => {
  it("is 1 at day0 and matches E8 at week6", () => {
    expect(retentionBand("day0", "powder_brow", client)).toEqual({ lo: 1, hi: 1 });
    expect(retentionBand("week6", "powder_brow", client)).toEqual({ lo: 0.5, hi: 0.7 });
  });
  it("microblading loses a further 20% after year 1", () => {
    const p = retentionBand("year2", "powder_brow", client);
    const m = retentionBand("year2", "microblading", client);
    expect(m.hi).toBeCloseTo(p.hi * 0.8, 10);
    expect(retentionBand("year1", "microblading", client)).toEqual(retentionBand("year1", "powder_brow", client));
  });
  it("oily skin multiplies by 0.85 from week6", () => {
    expect(retentionBand("week6", "powder_brow", oily).hi).toBeCloseTo(0.7 * 0.85, 10);
    expect(retentionBand("day0", "powder_brow", oily)).toEqual({ lo: 1, hi: 1 });
  });
});

describe("rule 3: temperature", () => {
  it("classes a cool dark brown as cool, the same brown plus warm modifier as neutral, an orange-brown as warm", () => {
    expect(classifyTemperature("#4a3f3d").klass).toBe("cool");
    expect(classifyTemperature(mixPigment("#4a3f3d", { hex: "#d9822b", ratio: 0.15 })).klass).toBe("neutral");
    expect(classifyTemperature("#9a6b46").klass).toBe("warm");
  });
});

describe("rule 4: drift strength", () => {
  it("is negative for cool and zero for neutral pigment", () => {
    expect(driftStrength("#4a3f3d", client.skinHex)).toBeLessThan(0);
    expect(driftStrength("#6b5546", client.skinHex)).toBe(0);
  });
  it("cool pigment drifts less on cool skin", () => {
    const coolSkin = "#c9a99b";
    expect(Math.abs(driftStrength("#4a3f3d", coolSkin))).toBeLessThan(Math.abs(driftStrength("#4a3f3d", client.skinHex)));
  });
  it("warm modifier lowers a cool drift smoothly", () => {
    const a = Math.abs(driftStrength(mixPigment("#4a3f3d", { hex: "#d9822b", ratio: 0.05 }), client.skinHex));
    const b = Math.abs(driftStrength(mixPigment("#4a3f3d", { hex: "#d9822b", ratio: 0.1 }), client.skinHex));
    expect(b).toBeLessThanOrEqual(a);
    expect(a).toBeLessThan(Math.abs(driftStrength("#4a3f3d", client.skinHex)));
  });
});

describe("rule 5: sharpness", () => {
  it("microblading blurs faster on oily skin", () => {
    expect(definitionAt("year1", "microblading", oily)).toBeLessThan(definitionAt("year1", "microblading", client));
  });
  it("oily skin does not blur powder brows faster; they start soft", () => {
    expect(definitionAt("day0", "powder_brow", client)).toBeLessThan(definitionAt("day0", "microblading", client));
    expect(definitionAt("year1", "powder_brow", oily)).toBe(definitionAt("year1", "powder_brow", client));
  });
  it("never rises over time", () => {
    const steps = ["day0", "week6", "year1", "year2", "year3"] as const;
    const d = steps.map((s) => definitionAt(s, "microblading", client));
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeLessThanOrEqual(d[i - 1]);
  });
});

describe("rule 6: lips", () => {
  it("transparency rises as colour fades and stays within 0-100", () => {
    expect(lipTransparency(0.3)).toBeGreaterThan(lipTransparency(1));
    expect(lipTransparency(0)).toBeLessThanOrEqual(100);
    expect(lipTransparency(1)).toBeGreaterThanOrEqual(0);
  });
});

describe("rule 7: advice", () => {
  it("recommends powder brows for microblading on oily skin, with the reason", () => {
    const a = advise(oily, { service: "microblading", pigmentHex: "#6b5546" });
    expect(a.technique).toBe("powder_brow");
    expect(a.reasons.join(" ")).toMatch(/oily/i);
  });
  it("keeps microblading on dry skin", () => {
    expect(advise(client, { service: "microblading", pigmentHex: "#6b5546" }).technique).toBe("microblading");
  });
  it("large pores also trigger the powder recommendation", () => {
    const a = advise({ ...client, pore: 85 }, { service: "microblading", pigmentHex: "#6b5546" });
    expect(a.technique).toBe("powder_brow");
  });
  it("flags dark natural lips for neutralisation first", () => {
    const dark = { ...client, lipHex: "#7a4a4a" };
    expect(advise(dark, { service: "lip_blush", pigmentHex: "#c98a86" }).flags).toContain("neutralisation session first");
    expect(advise(client, { service: "lip_blush", pigmentHex: "#c98a86" }).flags).not.toContain("neutralisation session first");
  });
  it("flags Fitzpatrick IV-VI for a patch test", () => {
    expect(advise({ ...client, fitzpatrick: 5 }, { service: "powder_brow", pigmentHex: "#6b5546" }).flags).toContain("patch test first");
    expect(advise({ ...client, fitzpatrick: 3 }, { service: "powder_brow", pigmentHex: "#6b5546" }).flags).not.toContain("patch test first");
  });
});
