import { hexFromLab, lab, mixLinear, normHex } from "./colour";
import * as K from "./constants";
import type { Advice, Choice, Client, Drift, Hex, Modifier, Service, Step } from "./types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Rule 1: mix the modifier into the pigment in linear RGB, ratio clamped to 0-MODIFIER_RATIO_MAX.
export function mixPigment(pigmentHex: Hex, modifier?: Modifier): Hex {
  if (!modifier) return normHex(pigmentHex);
  return mixLinear(pigmentHex, modifier.hex, clamp(modifier.ratio, 0, K.MODIFIER_RATIO_MAX));
}

// Rule 2: retention band per step.
export function retentionBand(step: Step, service: Service, client: Client): { lo: number; hi: number } {
  const base = K.RETENTION[step];
  let f = 1;
  if (service === "microblading" && (step === "year2" || step === "year3")) f *= K.MICROBLADING_LATE_FACTOR;
  if (step !== "day0" && client.oiliness >= K.OILY_THRESHOLD) f *= K.OILY_RETENTION_FACTOR;
  return { lo: base.lo * f, hi: base.hi * f };
}

// Rule 3: temperature class from CIELAB b*.
export function classifyTemperature(hex: Hex): { warmth: number; klass: "cool" | "neutral" | "warm" } {
  const warmth = clamp((lab(hex).b - K.WARM_PIVOT_B) / K.WARM_SCALE_B, -1, 1);
  if (Math.abs(warmth) < K.NEUTRAL_DEADBAND) return { warmth, klass: "neutral" };
  return { warmth, klass: warmth < 0 ? "cool" : "warm" };
}

// Rule 4: signed drift strength in -1..1 (negative cool, positive warm). Continuous outside the dead-band.
export function driftStrength(pigmentHex: Hex, skinHex: Hex): number {
  const { warmth } = classifyTemperature(pigmentHex);
  const mag = Math.max(0, Math.abs(warmth) - K.NEUTRAL_DEADBAND) / (1 - K.NEUTRAL_DEADBAND);
  if (mag === 0) return 0;
  const skinFactor = lab(skinHex).b >= K.SKIN_WARM_B ? 1 : K.OFF_SKIN_DRIFT_FACTOR;
  return Math.sign(warmth) * mag * skinFactor;
}

// Apply a signed drift (strength x fade) to a colour in CIELAB.
export function driftHex(hex: Hex, signed: number): Hex {
  if (signed === 0) return normHex(hex);
  const c = lab(hex);
  if (signed < 0) {
    const s = -signed;
    const b = c.b - K.DRIFT_B_COOL * s;
    const k = 1 - K.DRIFT_CHROMA_CUT * s;
    return hexFromLab({ l: c.l, a: c.a * k, b: b * k });
  }
  return hexFromLab({ l: c.l, a: c.a + K.DRIFT_A_WARM * signed, b: c.b + K.DRIFT_B_WARM * signed });
}

export function driftLabel(signed: number): Drift {
  if (Math.abs(signed) < K.DRIFT_VISIBLE) return "none";
  return signed < 0 ? "cool" : "warm";
}

// Rule 5: brow definition at a step.
export function definitionAt(step: Step, service: Service, client: Client): number {
  if (service === "lip_blush") return 0;
  const blur = service === "microblading" && (client.oiliness >= K.OILY_THRESHOLD || client.pore >= K.OILY_THRESHOLD);
  const keep = (blur ? K.DEFINITION_KEEP_BLUR : K.DEFINITION_KEEP)[step];
  return Math.round(K.DEFINITION_DAY0[service] * keep);
}

// Rule 6: sheer lip transparency rises as colour fades.
export function lipTransparency(retention: number): number {
  return clamp(Math.round(K.LIP_TRANSPARENCY_BASE + (1 - retention) * K.LIP_TRANSPARENCY_RISE), 0, 100);
}

// Red-based lip pigments lean pink as they fade.
export function isRedBased(hex: Hex): boolean {
  const c = lab(hex);
  return c.a >= K.LIP_RED_A_MIN && c.a > c.b;
}

// Rule 7: advice.
export function advise(client: Client, choice: Choice): Advice {
  const reasons: string[] = [];
  const flags: string[] = [];
  let technique: Service = choice.service;

  if (choice.service === "microblading" && (client.oiliness >= K.OILY_THRESHOLD || client.pore >= K.OILY_THRESHOLD)) {
    technique = "powder_brow";
    reasons.push(
      "Oily skin or large pores blur microblading strokes within a year (E4); powder brows heal more evenly and outlast them (E8).",
    );
  }
  if (choice.service === "lip_blush" && lab(client.lipHex).l < K.LIP_DARK_L) {
    flags.push("neutralisation session first");
    reasons.push("Dark natural lips shift the pigment; a neutralisation session first is practitioner guidance (uncited).");
  }
  if (client.fitzpatrick >= K.PATCH_TEST_FITZPATRICK) {
    flags.push("patch test first");
    reasons.push("Fitzpatrick IV-VI: a patch test first is practitioner guidance (uncited).");
  }
  return { technique, reasons, flags };
}
