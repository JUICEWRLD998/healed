import { z } from "zod";
import { modifierFor } from "@/src/engine/pigments";
import { renderTimeline } from "@/src/engine/timeline";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** The consult inputs the browser sends. The engine is deterministic, so every route recomputes the same timeline. */
export const PlanBody = z.object({
  fileId: z.string().min(1).max(200),
  mode: z.enum(["live", "replay"]),
  service: z.enum(["powder_brow", "microblading", "lip_blush"]),
  pigmentHex: hex,
  modifier: z.object({ id: z.enum(["warm", "cool"]), ratio: z.number().min(0).max(0.3) }).optional(),
  client: z.object({
    skinHex: hex, browHex: hex, lipHex: hex, hairHex: hex,
    fitzpatrick: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    oiliness: z.number().min(0).max(100), pore: z.number().min(0).max(100), redness: z.number().min(0).max(100),
  }),
});
export type Plan = z.infer<typeof PlanBody>;

export function timelineFor(b: Plan) {
  return renderTimeline(b.client, {
    service: b.service,
    pigmentHex: b.pigmentHex,
    modifier: b.modifier ? modifierFor(b.modifier.id, b.modifier.ratio) : undefined,
  });
}
