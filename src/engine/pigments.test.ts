import { describe, expect, it } from "vitest";
import { BROW_PIGMENTS, LIP_PIGMENTS, MODIFIERS, modifierFor, pigmentsFor } from "./pigments";
import { classifyTemperature } from "./rules";

const hexRe = /^#[0-9a-f]{6}$/;

describe("pigment library", () => {
  it("has the four brow and four lip pigments and two modifiers", () => {
    expect(BROW_PIGMENTS).toHaveLength(4);
    expect(LIP_PIGMENTS).toHaveLength(4);
    expect(MODIFIERS).toHaveLength(2);
  });
  it("uses valid hex values and unique ids", () => {
    const all = [...BROW_PIGMENTS, ...LIP_PIGMENTS, ...MODIFIERS];
    for (const p of all) expect(p.hex).toMatch(hexRe);
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });
  it("names match the engine's temperature reading", () => {
    const k = (id: string) => classifyTemperature(BROW_PIGMENTS.find((p) => p.id === id)!.hex).klass;
    expect(k("cool-dark-brown")).toBe("cool");
    expect(k("warm-light-brown")).toBe("warm");
  });
  it("picks the library by service", () => {
    expect(pigmentsFor("lip_blush")).toBe(LIP_PIGMENTS);
    expect(pigmentsFor("powder_brow")).toBe(BROW_PIGMENTS);
  });
  it("builds a modifier only for a known id and a positive ratio", () => {
    expect(modifierFor("warm", 0.15)).toEqual({ hex: "#d9822b", ratio: 0.15 });
    expect(modifierFor("warm", 0)).toBeUndefined();
    expect(modifierFor("nope", 0.1)).toBeUndefined();
  });
});
