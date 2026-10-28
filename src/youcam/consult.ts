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

export type Slot = Step | "lighter" | "darker";
export const SLOTS: readonly Slot[] = ["day0", "week6", "year1", "year2", "year3", "lighter", "darker"];
export const BAND_STEP: Step = "year2";

/** The render for one slot: a timeline step, or the lighter or darker bound at the band step. */
export async function renderSlot(yc: YouCam, file: FileRef, service: Service, timeline: Timeline, slot: Slot): Promise<string> {
  if (slot === "lighter" || slot === "darker") {
    const b = timeline.steps.find((s) => s.step === BAND_STEP) ?? timeline.steps[timeline.steps.length - 1];
    const edge = slot === "lighter"
      ? { ...b, hex: b.band.lighterHex, colorIntensity: b.band.lighterIntensity }
      : { ...b, hex: b.band.darkerHex, colorIntensity: b.band.darkerIntensity };
    return (await yc.render(file, [effectFor(service, edge)])).url;
  }
  const s = timeline.steps.find((x) => x.step === slot);
  if (!s) throw new Error("unknown slot");
  return (await yc.render(file, [effectFor(service, s)])).url;
}

/** AGE: 5 timeline renders plus 2 band renders (lighter and darker bound at one step), all in parallel. */
export async function renderTimelineImages(
  yc: YouCam,
  file: FileRef,
  service: Service,
  timeline: Timeline,
  bandStep: Step = BAND_STEP,
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
