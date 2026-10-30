import { deltaE } from "../engine/colour";
import { renderTimeline } from "../engine/timeline";
import type { Client, Hex, Service, Step } from "../engine/types";

export type Pair = {
  id: string;
  /** Where the public photo pair lives. The images themselves are never republished. */
  sourceUrl: string;
  service: Service;
  /** Which timeline step the "healed" photo corresponds to. */
  ageStep: Exclude<Step, "day0">;
  /** Held-out pairs are the only ones reported. Constants are only ever tuned on "train". */
  split: "train" | "test";
  freshHex: Hex;
  healedHex: Hex;
  /** Measured from the same photo: cheek skin and the natural, untreated brow or lip. */
  skinHex: Hex;
  naturalHex: Hex;
  /** The pigment the artist used, if the source states it; otherwise the fresh colour stands in. */
  pigmentHex?: Hex;
};

export type PairScore = { id: string; engineDE: number; naiveDE: number };
export type Report = { n: number; engineMean: number; naiveMean: number; engineBeatsNaive: number; rows: PairScore[] };

// Inputs the photo cannot give (oiliness, pores, Fitzpatrick) are fixed mid values, so they do not move the estimate.
const NEUTRAL_INPUTS = { fitzpatrick: 3 as const, oiliness: 40, pore: 40, redness: 30 };

export function estimateHealed(p: Pair): Hex {
  const client: Client = {
    skinHex: p.skinHex,
    browHex: p.naturalHex,
    lipHex: p.naturalHex,
    hairHex: p.naturalHex,
    ...NEUTRAL_INPUTS,
  };
  const t = renderTimeline(client, { service: p.service, pigmentHex: p.pigmentHex ?? p.freshHex });
  return t.steps.find((s) => s.step === p.ageStep)!.hex;
}

export function scorePair(p: Pair): PairScore {
  return { id: p.id, engineDE: deltaE(estimateHealed(p), p.healedHex), naiveDE: deltaE(p.freshHex, p.healedHex) };
}

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;

/** CIEDE2000 of our estimate and of "fresh = final" against the observed healed colour, on the held-out split only. */
export function report(pairs: Pair[]): Report | null {
  const rows = pairs.filter((p) => p.split === "test").map(scorePair);
  if (rows.length === 0) return null;
  return {
    n: rows.length,
    engineMean: mean(rows.map((r) => r.engineDE)),
    naiveMean: mean(rows.map((r) => r.naiveDE)),
    engineBeatsNaive: rows.filter((r) => r.engineDE < r.naiveDE).length,
    rows,
  };
}
