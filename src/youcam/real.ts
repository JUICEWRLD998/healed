import { strFromU8, unzipSync } from "fflate";
import { TtlCache, cacheKey, hashBytes } from "./cache";
import { YouCamError, fromApiError, fromHttp } from "./errors";
import { Ledger } from "./ledger";
import * as S from "./schemas";
import type { Feature, FileRef, Fitzpatrick, MakeupEffect, RenderResult, SkinScores, Tones, YouCam } from "./types";

export type RealOptions = {
  apiKey: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  pollMs?: number;
  timeoutMs?: number;
  ledger?: Ledger;
};

const ROMAN: Record<string, Fitzpatrick> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
// Signed result URLs live 2 h; cache for less so a cached URL is never dead.
const RENDER_TTL_MS = 100 * 60 * 1000;

export function createRealYouCam(opts: RealOptions): YouCam & { ledger: Ledger } {
  const f = opts.fetchImpl ?? fetch;
  const pollMs = opts.pollMs ?? 2000;
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const ledger = opts.ledger ?? new Ledger();
  const cache = new TtlCache<unknown>(RENDER_TTL_MS);
  const hashOf = new Map<string, string>(); // file id -> image hash
  const taskIds = new Map<string, string[]>(); // file id -> task ids
  const keysOf = new Map<string, string[]>(); // file id -> cache keys

  async function api(method: string, path: string, body?: unknown): Promise<unknown> {
    const res = await f(opts.baseUrl + path, {
      method,
      headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw fromHttp(res.status, text.slice(0, 200));
    try {
      return JSON.parse(text);
    } catch {
      throw new YouCamError("bad_json", "The analysis service sent an unreadable reply. Try again.", text.slice(0, 80));
    }
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function runTask(endpoint: string, body: Record<string, unknown>, feature: Feature, file: FileRef): Promise<unknown> {
    const created = S.taskCreate.parse(await api("POST", `/s2s/v2.0/task/${endpoint}`, body));
    const id = created.data.task_id;
    taskIds.set(file.id, [...(taskIds.get(file.id) ?? []), id]);
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      await wait(pollMs);
      const poll = S.taskPoll.parse(await api("GET", `/s2s/v2.0/task/${endpoint}/${id}`));
      const { task_status, error, error_message, results } = poll.data;
      if (task_status === "success") {
        ledger.record(feature);
        return results;
      }
      if (task_status === "error") throw fromApiError(error ?? "unknown_error", error_message ?? undefined);
      if (Date.now() > deadline) throw new YouCamError("timeout", "The analysis took too long. Try again.");
    }
  }

  function cached<T>(file: FileRef, feature: string, params: unknown, make: () => Promise<T>): Promise<T> {
    const hash = hashOf.get(file.id) ?? file.id;
    const key = cacheKey(hash, feature, params);
    keysOf.set(file.id, [...(keysOf.get(file.id) ?? []), key]);
    return cache.get(key, make) as Promise<T>;
  }

  return {
    mode: "live",
    ledger,

    async upload(img, contentType = "image/jpeg") {
      const hash = hashBytes(img);
      return cache.get(cacheKey(hash, "upload", {}), async () => {
        const ext = contentType === "image/png" ? "png" : "jpg";
        const created = S.fileCreate.parse(
          await api("POST", "/s2s/v2.0/file", {
            files: [{ content_type: contentType, file_name: `selfie.${ext}`, file_size: img.byteLength }],
          }),
        );
        const file = created.data.files[0];
        const req = file.requests[0];
        const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)]));
        const put = await f(req.url, { method: req.method || "PUT", headers, body: img as BodyInit });
        if (!put.ok) throw fromHttp(put.status, "upload");
        hashOf.set(file.file_id, hash);
        return { id: file.file_id } satisfies FileRef;
      }) as Promise<FileRef>;
    },

    faceTones(file): Promise<Tones> {
      return cached(file, "tone", {}, async () => {
        const r = S.toneResults.parse(
          await runTask("skin-tone-analysis", { src_file_id: file.id, face_angle_strictness_level: "flexible" }, "tone", file),
        );
        return {
          skinHex: r.color.skin_color,
          lipHex: r.color.lip_color,
          browHex: r.color.eyebrow_color,
          hairHex: r.color.hair_color,
          hairName: r.color.hair_color_name,
        };
      });
    },

    fitzpatrick(file): Promise<Fitzpatrick> {
      return cached(file, "fitzpatrick", {}, async () => {
        const r = S.fitzResults.parse(
          await runTask("fitzpatrick-scale-analyzer", { src_file_id: file.id, version: "1.0" }, "fitzpatrick", file),
        );
        return ROMAN[r.fitzpatrick_scale];
      });
    },

    skin(file): Promise<SkinScores> {
      return cached(file, "skin", {}, async () => {
        const out = S.urlResults.parse(
          await runTask(
            "skin-analysis",
            { src_file_id: file.id, face_angle_strictness_level: "flexible", dst_actions: ["oiliness", "pore", "redness", "skin_type"] },
            "skin",
            file,
          ),
        );
        const zip = await f(out.url);
        if (!zip.ok) throw fromHttp(zip.status, "skin result");
        const files = unzipSync(new Uint8Array(await zip.arrayBuffer()));
        const name = Object.keys(files).find((n) => n.endsWith("score_info.json"));
        if (!name) throw new YouCamError("bad_zip", "The skin result was incomplete. Try again.");
        const info = S.skinScoreInfo.parse(JSON.parse(strFromU8(files[name])));
        return {
          oilinessRaw: info.oiliness.raw_score,
          poreRaw: info.pore.raw_score,
          rednessRaw: info.redness.raw_score,
          skinType: {
            whole: info.skin_type.whole.skin_type,
            tZone: info.skin_type.t_zone?.skin_type,
            uZone: info.skin_type.u_zone?.skin_type,
          },
        };
      });
    },

    render(file, effects: MakeupEffect[]): Promise<RenderResult> {
      return cached(file, "render", effects, async () => {
        const out = S.urlResults.parse(
          await runTask("makeup-vto", { src_file_id: file.id, version: "1.0", effects }, "render", file),
        );
        return { url: out.url };
      });
    },

    async remove(file) {
      const ids = taskIds.get(file.id) ?? [];
      const results = await Promise.allSettled(ids.map((task_id) => api("POST", "/s2s/v2.0/task/delete", { task_id })));
      for (const k of keysOf.get(file.id) ?? []) cache.delete(k);
      taskIds.delete(file.id);
      keysOf.delete(file.id);
      if (results.some((r) => r.status === "rejected"))
        throw new YouCamError("delete_failed", "Some uploaded data could not be deleted. It expires on its own within 30 days.");
    },

    async balance() {
      const r = S.credit.parse(await api("GET", "/s2s/v1.0/client/credit"));
      return r.results.reduce((a, x) => a + x.amount_dec, 0);
    },
  };
}
