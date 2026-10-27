// Every constant carries a source: an E-item from strategy/CATALOGUE.md, or ASSUMED until Phase 8 calibration.
import type { Step } from "./types";

// Retention: share of fresh colour strength left. Band {lo, hi}. Week 6 from E8 ("about 50% lighter over four weeks").
export const RETENTION: Record<Step, { lo: number; hi: number }> = {
  day0: { lo: 1, hi: 1 }, // E8 (fresh)
  week6: { lo: 0.5, hi: 0.7 }, // E8
  year1: { lo: 0.4, hi: 0.6 }, // ASSUMED
  year2: { lo: 0.3, hi: 0.5 }, // ASSUMED
  year3: { lo: 0.2, hi: 0.4 }, // ASSUMED
};

// Powder brows outlast microblading (E8); the 0.8 factor itself is ASSUMED.
export const MICROBLADING_LATE_FACTOR = 0.8;
// Oiliness at or above this blurs strokes and fades colour faster (E4); threshold ASSUMED.
export const OILY_THRESHOLD = 70;
// Retention multiplier on oily skin (E4 direction; value ASSUMED).
export const OILY_RETENTION_FACTOR = 0.85;
// Largest modifier share of the mix, from the artist-facing 0-30% control (ASSUMED).
export const MODIFIER_RATIO_MAX = 0.3;

// Temperature from CIELAB b*: warmth = (b* - pivot) / scale, clamped to -1..1 (ASSUMED, tuned on Phase 1 tone readings).
export const WARM_PIVOT_B = 14;
// ASSUMED
export const WARM_SCALE_B = 10;
// Warmth inside +-this is neutral and does not drift; the warm modifier moves a cool pigment into it (E5, ASSUMED width).
export const NEUTRAL_DEADBAND = 0.4;
// Skin at or above this b* counts as warm skin (E5: cool pigment on warm skin heals grey-blue; threshold ASSUMED).
export const SKIN_WARM_B = 14;
// Drift is weaker when skin does not match the risk case (E5; value ASSUMED).
export const OFF_SKIN_DRIFT_FACTOR = 0.6;

// Drift magnitudes at full strength and full fade, in CIELAB units (ASSUMED; shape from E1/E2/E5).
export const DRIFT_B_COOL = 22;
// ASSUMED
export const DRIFT_CHROMA_CUT = 0.5;
// Orange heal of warm pigment on warm skin (E5; magnitudes ASSUMED).
export const DRIFT_A_WARM = 6;
// ASSUMED
export const DRIFT_B_WARM = 10;
// Signed drift at or above this is shown as a warning chip (ASSUMED).
export const DRIFT_VISIBLE = 0.45;

// Faded pigment reveals the natural colour underneath: share of fade blended toward the natural brow hex (ASSUMED).
export const FADE_BLEND_BROW = 0.2;

// Brow VTO: colorIntensity at day 0. Phase 1 renders showed 25-80 reads as visible (ASSUMED).
export const BROW_INTENSITY_DAY0 = 80;
// Lowest intensity ever sent, so the render never vanishes (ASSUMED).
export const INTENSITY_FLOOR = 10;
// Brow definition at day 0: powder brows start soft by design, microblading starts crisp (ASSUMED).
export const DEFINITION_DAY0 = { powder_brow: 40, microblading: 90 } as const;
// Share of day-0 definition kept per step on normal skin (ASSUMED).
export const DEFINITION_KEEP: Record<Step, number> = {
  day0: 1, // ASSUMED
  week6: 0.85, // ASSUMED
  year1: 0.6, // ASSUMED
  year2: 0.4, // ASSUMED
  year3: 0.3, // ASSUMED
};
// Microblading on oily skin or large pores: strokes blur within a year (E4; values ASSUMED).
export const DEFINITION_KEEP_BLUR: Record<Step, number> = {
  day0: 1, // E4
  week6: 0.7, // E4
  year1: 0.35, // E4
  year2: 0.2, // E4
  year3: 0.1, // E4
};

// Lips: colorIntensity at day 0 for sheer ombre (ASSUMED, Phase 1 renders at 15-60).
export const LIP_INTENSITY_DAY0 = 60;
// Sheer lip transparency at day 0 and how much it rises as colour fades (ASSUMED).
export const LIP_TRANSPARENCY_BASE = 35;
// ASSUMED
export const LIP_TRANSPARENCY_RISE = 50;
// Red-based lip pigment leans pink as other components fade (E5); a* floor to count as red-based (ASSUMED).
export const LIP_RED_A_MIN = 30;
// Pink lean strength (E5 direction, value ASSUMED).
export const LIP_PINK_STRENGTH = 0.8;
// Natural lips darker than this L* need a neutralisation session first (practitioner guidance, uncited, ASSUMED).
export const LIP_DARK_L = 45;
// Fitzpatrick at or above this gets a patch-test prompt (practitioner guidance, uncited, ASSUMED).
export const PATCH_TEST_FITZPATRICK = 4;
