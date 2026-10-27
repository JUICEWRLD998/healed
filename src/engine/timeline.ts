import { mixLinear } from "./colour";
import * as K from "./constants";
import {
  advise,
  definitionAt,
  driftHex,
  driftLabel,
  driftStrength,
  isRedBased,
  lipTransparency,
  mixPigment,
  retentionBand,
} from "./rules";
import type { Choice, Client, Hex, Step, StepRender, Timeline } from "./types";

export const STEPS: readonly Step[] = ["day0", "week6", "year1", "year2", "year3"];

const intensity = (base: number, retention: number) =>
  Math.min(100, Math.max(K.INTENSITY_FLOOR, Math.round(base * retention)));

// Colour and intensity at one retention value, plus the signed drift that produced it.
function atRetention(client: Client, choice: Choice, pigment: Hex, r: number) {
  const fade = 1 - r;
  if (choice.service === "lip_blush") {
    const signed = isRedBased(pigment) ? -K.LIP_PINK_STRENGTH * fade : driftStrength(pigment, client.skinHex) * fade;
    const drifted = driftHex(pigment, signed);
    return { signed, hex: mixLinear(client.lipHex, drifted, r), colorIntensity: intensity(K.LIP_INTENSITY_DAY0, r) };
  }
  const signed = driftStrength(pigment, client.skinHex) * fade;
  const drifted = driftHex(pigment, signed);
  return {
    signed,
    hex: mixLinear(drifted, client.browHex, fade * K.FADE_BLEND_BROW),
    colorIntensity: intensity(K.BROW_INTENSITY_DAY0, r),
  };
}

export function renderTimeline(client: Client, choice: Choice): Timeline {
  const pigment = mixPigment(choice.pigmentHex, choice.modifier);
  const steps: StepRender[] = STEPS.map((step) => {
    const band = retentionBand(step, choice.service, client);
    const mid = (band.lo + band.hi) / 2;
    const m = atRetention(client, choice, pigment, mid);
    const lighter = atRetention(client, choice, pigment, band.lo);
    const darker = atRetention(client, choice, pigment, band.hi);
    const render: StepRender = {
      step,
      hex: m.hex,
      colorIntensity: m.colorIntensity,
      band: {
        lighterHex: lighter.hex,
        darkerHex: darker.hex,
        lighterIntensity: lighter.colorIntensity,
        darkerIntensity: darker.colorIntensity,
      },
      drift: driftLabel(m.signed),
    };
    if (choice.service === "lip_blush") render.transparencyIntensity = lipTransparency(mid);
    else render.definition = definitionAt(step, choice.service, client);
    return render;
  });
  return { steps, advice: advise(client, choice) };
}
