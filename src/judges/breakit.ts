import { modifierFor } from "../engine/pigments";
import { renderTimeline } from "../engine/timeline";
import type { Client } from "../engine/types";
import { fromApiError } from "../youcam/errors";
import { PAUSE_MESSAGE, chooseMode } from "../youcam";

export type BreakId = "tiny-face" | "two-faces" | "oily-microblading" | "cool-black" | "low-budget";

export type BreakResult = {
  id: BreakId;
  title: string;
  input: string;
  outcome: string;
  detail?: string;
  /** How the input reaches production code. `upstream-code` means the YouCam error code is supplied, not produced by a photo. */
  path: "engine" | "upstream-code" | "mode-choice";
  verified: "LIVE" | "UNVERIFIED";
};

export const BREAK_IDS: readonly BreakId[] = ["tiny-face", "two-faces", "oily-microblading", "cool-black", "low-budget"];

// A fixed warm-skinned client for the engine cases. Hexes are ASSUMED sample values, not a real person.
const WARM_CLIENT: Client = {
  skinHex: "#c68e6b",
  browHex: "#4a3a30",
  lipHex: "#b5706b",
  hairHex: "#3b2f2a",
  fitzpatrick: 3,
  oiliness: 30,
  pore: 30,
  redness: 20,
};

const COOL_BLACK = "#2a2a2e";

/** Run one break-it input through the same functions production uses. Pure and deterministic. */
export function runBreak(id: BreakId): BreakResult {
  switch (id) {
    case "tiny-face": {
      const e = fromApiError("error_src_face_too_small");
      return {
        id,
        title: "A photo with a tiny face",
        input: "YouCam answers error_src_face_too_small (seen live in Phase 1)",
        outcome: e.userMessage,
        path: "upstream-code",
        verified: "LIVE",
      };
    }
    case "two-faces": {
      const e = fromApiError("error_multiple_faces");
      return {
        id,
        title: "A photo with two faces",
        input: "YouCam answers a multiple-faces code",
        outcome: e.userMessage,
        detail: "The exact upstream code for two faces was not captured in Phase 1; the match is by keyword.",
        path: "upstream-code",
        verified: "UNVERIFIED",
      };
    }
    case "oily-microblading": {
      const oily = { ...WARM_CLIENT, oiliness: 82, pore: 75 };
      const t = renderTimeline(oily, { service: "microblading", pigmentHex: "#5a463b" });
      return {
        id,
        title: "Microblading on oily skin",
        input: "Oiliness 82, pores 75, microblading requested",
        outcome: `Recommended technique: ${t.advice.technique === "powder_brow" ? "powder brows" : t.advice.technique}.`,
        detail: t.advice.reasons.join(" "),
        path: "engine",
        verified: "LIVE",
      };
    }
    case "cool-black": {
      const bare = renderTimeline(WARM_CLIENT, { service: "powder_brow", pigmentHex: COOL_BLACK });
      const fixed = renderTimeline(WARM_CLIENT, {
        service: "powder_brow",
        pigmentHex: COOL_BLACK,
        modifier: modifierFor("warm", 0.15),
      });
      const firstBare = bare.steps.find((s) => s.drift !== "none");
      const firstFixed = fixed.steps.find((s) => s.drift !== "none");
      return {
        id,
        title: "A cool black pigment on warm skin",
        input: `Pigment ${COOL_BLACK} on skin ${WARM_CLIENT.skinHex}`,
        outcome: firstBare
          ? `${firstBare.step} drifts ${firstBare.drift}. With a 15% warm modifier: ${firstFixed ? `still ${firstFixed.drift} at ${firstFixed.step}` : "no colour shift expected"}.`
          : "No drift flagged.",
        path: "engine",
        verified: "LIVE",
      };
    }
    case "low-budget": {
      const pick = chooseMode({ configured: "live", hasKey: true, balance: 100, floor: 150, ipAllowed: true });
      return {
        id,
        title: "Unit budget below the floor",
        input: "Balance 100 units, floor 150",
        outcome: `${pick.mode === "replay" ? "Replay takes over" : "Live continues"}. ${pick.reason ?? ""}`.trim(),
        detail: pick.reason === PAUSE_MESSAGE ? undefined : "Unexpected reason.",
        path: "mode-choice",
        verified: "LIVE",
      };
    }
  }
}
