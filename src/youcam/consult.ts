import type { Client, Service, Step, Timeline } from "../engine/types";
import { effectFor } from "./effects";
import type { FileRef, Fitzpatrick, SkinScores, Tones, YouCam } from "./types";

const clamp = (v: number) => Math.min(100, Math.max(0, v));

// YouCam scores are higher = healthier (docs: "A higher score indicates healthier ... skin"; ui_score is deliberately
// inflated), so the engine's higher = worse values are 100 - raw_score.
const severity = (raw: number) => clamp(Math.round(100 - raw));

// A whole-face "Oily" skin type is the observed type, so it floors oiliness at the engine's oily threshold (E4, ASSUMED).
const OILY_FLOOR = 70;

export function toClient(tones: Tones, fitz: Fitzpatrick, skin: SkinScores): Client {
  const oiliness = severity(skin.oilinessRaw);
  return {
    skinHex: tones.skinHex,
    browHex: tones.browHex,
    lipHex: tones.lipHex,
    hairHex: tones.hairHex,
    fitzpatrick: fitz,
    oiliness: skin.skinType.whole === "Oily" ? Math.max(oiliness, OILY_FLOOR) : oiliness,
    pore: severity(skin.poreRaw),
    redness: severity(skin.rednessRaw),
  };
}

/** READ: the three analyses run in parallel on one uploaded file. */
export async function readClient(yc: YouCam, file: FileRef): Promise<Client> {
  const [tones, fitz, skin] = await Promise.all([yc.faceTones(file), yc.fitzpatrick(file), yc.skin(file)]);
  return toClient(tones, fitz, skin);
}

export type Rendered = {
  steps: { step: Step; url: string }[];
  band: { step: Step; lighterUrl: string; darkerUrl: string };
};

/** AGE: 5 timeline renders plus 2 band renders (lighter and darker bound at one step), all in parallel. */
export async function renderTimelineImages(
  yc: YouCam,
  file: FileRef,
  service: Service,
  timeline: Timeline,
  bandStep: Step = "year2",
): Promise<Rendered> {
  const b = timeline.steps.find((s) => s.step === bandStep) ?? timeline.steps[timeline.steps.length - 1];
  const lighter = { ...b, hex: b.band.lighterHex, colorIntensity: b.band.lighterIntensity };
  const darker = { ...b, hex: b.band.darkerHex, colorIntensity: b.band.darkerIntensity };
  const [steps, lo, hi] = await Promise.all([
    Promise.all(timeline.steps.map(async (s) => ({ step: s.step, url: (await yc.render(file, [effectFor(service, s)])).url }))),
    yc.render(file, [effectFor(service, lighter)]),
    yc.render(file, [effectFor(service, darker)]),
  ]);
  return { steps, band: { step: b.step, lighterUrl: lo.url, darkerUrl: hi.url } };
}
