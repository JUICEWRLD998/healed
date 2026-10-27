import { mixLinear } from "../engine/colour";
import type { Service } from "../engine/types";
import type { MakeupEffect } from "./types";

// Brow pattern verified live in Phase 1. Lip shape "original" verified live in Phase 1.
export const BROW_PATTERN = "Curved1";
export const LIP_SHAPE = "original";

type StepLike = { hex: string; colorIntensity: number; definition?: number; transparencyIntensity?: number };

/** Makeup VTO effect for one timeline step. The colour comes from our engine, never from a model. */
export function effectFor(service: Service, s: StepLike): MakeupEffect {
  if (service === "lip_blush") {
    // Ombre needs two palettes on the live API (Phase 1): outer colour, then a lighter inner colour.
    const inner = mixLinear(s.hex, "#ffffff", 0.15);
    const palette = (color: string) => ({
      color,
      texture: "sheer",
      colorIntensity: s.colorIntensity,
      transparencyIntensity: s.transparencyIntensity ?? 50,
    });
    return {
      category: "lip_color",
      shape: { name: LIP_SHAPE },
      style: { type: "ombre", blendStrength: 50, innerColorRatio: 40, innerRatio: 40, featherStrength: 60 },
      palettes: [palette(s.hex), palette(inner)],
    };
  }
  return {
    category: "eyebrows",
    pattern: { type: "shape", name: BROW_PATTERN, curvature: 0, thickness: 0, definition: s.definition ?? 50 },
    palettes: [{ color: s.hex, colorIntensity: s.colorIntensity, texture: "matte" }],
  };
}
