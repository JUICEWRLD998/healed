import { PAUSE_MESSAGE, chooseMode } from "@/src/youcam";
import { explain } from "@/src/youcam/errors";
import { advise } from "@/src/engine/rules";
import { renderTimeline } from "@/src/engine/timeline";
import { LIVE_RECORDED_CLIENT } from "./sample";
import type { Client } from "@/src/engine/types";

export type BreakId = "no-face" | "two-faces" | "oily-microblading" | "cool-black" | "low-budget";

export type BreakResult = {
  id: BreakId;
  /** The input as a judge would supply it, in plain words. */
  input: string;
  /** What the production code answered. */
  outcome: string;
  /** Where the answer came from, so a judge can find it in the repo. */
  source: string;
  /** True when the response code is a Phase 1 live observation, false when matched by keyword and UNVERIFIED live. */
  observedLive: boolean;
  detail?: string[];
};

const OILY: Client = { ...LIVE_RECORDED_CLIENT, oiliness: 82, pore: 76 };

/** Each case calls the same functions the consult routes call. Nothing here is a canned string. */
export function runBreak(id: BreakId): BreakResult {
  switch (id) {
    case "no-face":
      return {
        id,
        input: "A photo with no face, or a face that is a few pixels wide",
        outcome: explain("error_src_face_too_small"),
        source: "src/youcam/errors.ts explain()",
        observedLive: true,
      };
    case "two-faces":
      return {
        id,
        input: "A photo with two faces in it",
        outcome: explain("error_multiple_faces"),
        source: "src/youcam/errors.ts explain()",
        observedLive: false,
      };
    case "oily-microblading": {
      const a = advise(OILY, { service: "microblading", pigmentHex: "#5a463b" });
      return {
        id,
        input: "Microblading requested on oily skin with large pores",
        outcome: a.technique === "powder_brow" ? "Powder brows recommended instead of microblading." : "Microblading kept.",
        source: "src/engine/rules.ts advise()",
        observedLive: true,
        detail: a.reasons,
      };
    }
    case "cool-black": {
      const cool = renderTimeline(LIVE_RECORDED_CLIENT, { service: "powder_brow", pigmentHex: "#1c1c22" });
      const fixed = renderTimeline(LIVE_RECORDED_CLIENT, {
        service: "powder_brow",
        pigmentHex: "#1c1c22",
        modifier: { hex: "#d9822b", ratio: 0.15 },
      });
      const worst = (t: typeof cool) => t.steps.reduce((m, s) => (s.drift !== "none" ? s.drift : m), "none" as string);
      return {
        id,
        input: "A cool black pigment on brows",
        outcome: `Without a modifier the engine warns: ${worst(cool)} drift by year 3. With 15% warm modifier: ${worst(fixed)}.`,
        source: "src/engine/rules.ts driftLabel(), pigments.ts modifierFor()",
        observedLive: true,
        detail: cool.steps.map((s) => `${s.step}: ${s.drift}`),
      };
    }
    case "low-budget": {
      const pick = chooseMode({ configured: "live", hasKey: true, balance: 40, floor: 150, ipAllowed: true });
      return {
        id,
        input: "Unit balance of 40 against a floor of 150",
        outcome: `${pick.mode === "replay" ? "Replay takes over" : "Live continues"}: ${pick.reason ?? "no reason"}`,
        source: "src/youcam/index.ts chooseMode()",
        observedLive: true,
      };
    }
  }
}

export const BREAK_IDS: readonly BreakId[] = ["no-face", "two-faces", "oily-microblading", "cool-black", "low-budget"];
export { PAUSE_MESSAGE };
