import { z } from "zod";

// Shapes validated against the raw responses saved in evidence/spike/ (Phase 1).

export const fileCreate = z.object({
  data: z.object({
    files: z
      .array(
        z.object({
          file_id: z.string(),
          requests: z.array(z.object({ method: z.string(), url: z.string(), headers: z.record(z.string(), z.unknown()) })).min(1),
        }),
      )
      .min(1),
  }),
});

export const taskCreate = z.object({ data: z.object({ task_id: z.string() }) });

export const taskPoll = z.object({
  data: z.object({
    task_status: z.string(),
    error: z.string().nullable().optional(),
    error_message: z.string().nullable().optional(),
    results: z.unknown().optional(),
  }),
});

export const toneResults = z.object({
  color: z.object({
    skin_color: z.string(),
    lip_color: z.string(),
    eyebrow_color: z.string(),
    hair_color: z.string(),
    hair_color_name: z.string().optional(),
  }),
});

export const fitzResults = z.object({ fitzpatrick_scale: z.enum(["I", "II", "III", "IV", "V", "VI"]) });

const concern = z.object({ raw_score: z.number(), ui_score: z.number() });
export const skinScoreInfo = z.object({
  oiliness: concern,
  pore: concern,
  redness: concern,
  skin_type: z.object({
    whole: z.object({ skin_type: z.string() }),
    t_zone: z.object({ skin_type: z.string() }).optional(),
    u_zone: z.object({ skin_type: z.string() }).optional(),
  }),
});

export const urlResults = z.object({ url: z.string() });

export const credit = z.object({ results: z.array(z.object({ amount_dec: z.number() })) });
