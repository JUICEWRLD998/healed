import { readFileSync } from "node:fs";
import { join } from "node:path";
import { YouCamError } from "./errors";
import * as S from "./schemas";
import type { FileRef, Fitzpatrick, MakeupEffect, RenderResult, SkinScores, Tones, YouCam } from "./types";

const ROMAN: Record<string, Fitzpatrick> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };

type Recorded = { category: string; colorIntensity: number; url: string };

/** Replays recorded real responses. Never touches the network and needs no key. */
export function createReplayYouCam(dir: string): YouCam {
  const read = (n: string) => JSON.parse(readFileSync(join(dir, n), "utf8"));
  const tone = S.toneResults.parse(read("tone.json"));
  const fitz = S.fitzResults.parse(read("fitz.json"));
  const skin = S.skinScoreInfo.parse(read("skin.json"));
  const renders = read("renders.json") as Recorded[];

  return {
    mode: "replay",
    async upload(): Promise<FileRef> {
      return { id: "replay-file" };
    },
    async faceTones(): Promise<Tones> {
      const c = tone.color;
      return { skinHex: c.skin_color, lipHex: c.lip_color, browHex: c.eyebrow_color, hairHex: c.hair_color, hairName: c.hair_color_name };
    },
    async fitzpatrick() {
      return ROMAN[fitz.fitzpatrick_scale];
    },
    async skin(): Promise<SkinScores> {
      return {
        oilinessRaw: skin.oiliness.raw_score,
        poreRaw: skin.pore.raw_score,
        rednessRaw: skin.redness.raw_score,
        skinType: { whole: skin.skin_type.whole.skin_type, tZone: skin.skin_type.t_zone?.skin_type, uZone: skin.skin_type.u_zone?.skin_type },
      };
    },
    async render(_f, effects: MakeupEffect[]): Promise<RenderResult> {
      const e = effects[0] as { category?: string; palettes?: { colorIntensity?: number }[] } | undefined;
      const category = e?.category ?? "";
      const want = e?.palettes?.[0]?.colorIntensity ?? 50;
      const pool = renders.filter((r) => r.category === category);
      if (pool.length === 0) throw new YouCamError("replay_miss", `No recorded render for ${category || "this effect"}.`);
      const best = pool.reduce((a, b) => (Math.abs(b.colorIntensity - want) < Math.abs(a.colorIntensity - want) ? b : a));
      return { url: best.url };
    },
  };
}
