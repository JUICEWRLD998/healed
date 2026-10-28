import { toClient } from "@/src/youcam/consult";
import fitz from "@/fixtures/replay/fitz.json";
import skin from "@/fixtures/replay/skin.json";
import tone from "@/fixtures/replay/tone.json";

/** The recorded Phase 1 consult run through the production mapping (raw score to severity). Replay data, not a person. */
export const LIVE_RECORDED_CLIENT = toClient(
  {
    skinHex: tone.color.skin_color,
    lipHex: tone.color.lip_color,
    browHex: tone.color.eyebrow_color,
    hairHex: tone.color.hair_color,
  },
  ({ I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 } as const)[fitz.fitzpatrick_scale as "II"],
  {
    oilinessRaw: skin.oiliness.raw_score,
    poreRaw: skin.pore.raw_score,
    rednessRaw: skin.redness.raw_score,
    skinType: { whole: skin.skin_type.whole.skin_type },
  },
);
