import { describe, expect, it } from "vitest";
import { deltaE } from "../engine/colour";
import { regionHex, type Rgba } from "./extract";
import { report, type Pair } from "./score";

function paint(w: number, h: number, fill: (x: number, y: number) => [number, number, number]): Rgba {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      const [r, g, b] = fill(x, y);
      data.set([r, g, b, 255], (y * w + x) * 4);
    }
  return { width: w, height: h, data };
}

// Planted positive control: two patches of known colour, one with noise strokes and a glare dot.
// The extractor must return each known colour and reproduce the known difference between them.
const FRESH: [number, number, number] = [60, 50, 55]; // dark fresh brow
const HEALED: [number, number, number] = [120, 100, 90]; // lighter healed brow
const img = paint(40, 20, (x, y) => {
  const inLeft = x < 20;
  if (inLeft && x === 5) return [250, 250, 250]; // glare stripe, dropped by the L* ceiling
  if (inLeft && y === 3) return [0, 0, 0]; // shadow row, dropped by the L* floor
  if (!inLeft && x % 7 === 0) return [20, 20, 20]; // hair strokes, minority, resisted by the median
  return inLeft ? FRESH : HEALED;
});

describe("extractor positive control", () => {
  const hex = (c: [number, number, number]) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  it("recovers each planted colour inside ΔE 1", () => {
    expect(deltaE(regionHex(img, { x: 0, y: 0, w: 20, h: 20 }), hex(FRESH))).toBeLessThan(1);
    expect(deltaE(regionHex(img, { x: 20, y: 0, w: 20, h: 20 }), hex(HEALED))).toBeLessThan(1);
  });
  it("reproduces the known difference between the two patches", () => {
    const got = deltaE(regionHex(img, { x: 0, y: 0, w: 20, h: 20 }), regionHex(img, { x: 20, y: 0, w: 20, h: 20 }));
    expect(Math.abs(got - deltaE(hex(FRESH), hex(HEALED)))).toBeLessThan(1);
  });
  it("throws on an empty region instead of returning a colour", () => {
    expect(() => regionHex(img, { x: 100, y: 100, w: 5, h: 5 })).toThrow();
  });
});

describe("report", () => {
  const base: Pair = {
    id: "p", sourceUrl: "https://example.invalid", service: "powder_brow", ageStep: "year1", split: "test",
    freshHex: "#3a3138", healedHex: "#6b5a50", skinHex: "#c68e6b", naturalHex: "#4a3a30",
  };
  it("returns null with no held-out pairs, so no number can be printed", () => {
    expect(report([])).toBeNull();
    expect(report([{ ...base, split: "train" }])).toBeNull();
  });
  it("scores only the test split and is deterministic", () => {
    const r = report([base, { ...base, id: "q", split: "train" }])!;
    expect(r.n).toBe(1);
    expect(report([base])).toEqual(report([base]));
  });
  it("a healed colour equal to the fresh one gives the naive guess zero error", () => {
    const r = report([{ ...base, healedHex: base.freshHex }])!;
    expect(r.naiveMean).toBe(0);
  });
});
