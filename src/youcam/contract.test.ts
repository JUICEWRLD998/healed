import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { createRealYouCam } from "./real";
import { createReplayYouCam } from "./replay";
import type { YouCam } from "./types";

const DIR = join(process.cwd(), "fixtures", "replay");
const fx = (n: string) => JSON.parse(readFileSync(join(DIR, n), "utf8"));

type Call = { method: string; url: string; body?: string };

// A fake network that answers from the SAME recorded fixtures the replay adapter reads, with the Phase 1 response shapes.
function fakeFetch(calls: Call[], opts: { failTask?: string } = {}): typeof fetch {
  const skinZip = zipSync({ "skinanalysisResult/score_info.json": strToU8(JSON.stringify(fx("skin.json"))) });
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ method, url, body: typeof init?.body === "string" ? init.body : undefined });
    if (url.endsWith("/s2s/v2.0/file")) {
      return json({
        status: 200,
        data: { files: [{ file_id: "FILE1", requests: [{ method: "PUT", url: "https://upload.test/put", headers: { "Content-Type": "image/jpeg" } }] }] },
      });
    }
    if (url === "https://upload.test/put") return new Response("", { status: 200 });
    if (url === "https://result.test/skin.zip") return new Response(skinZip as BodyInit, { status: 200 });
    if (url.endsWith("/s2s/v2.0/task/delete")) return json({ status: 200 });
    if (url.endsWith("/client/credit")) return json({ status: 200, results: [{ amount_dec: 1000 }, { amount_dec: 40 }] });
    const create = url.match(/\/s2s\/v2\.0\/task\/([a-z-]+)$/);
    if (create && method === "POST") return json({ status: 200, data: { task_id: create[1] + "-T" } });
    const poll = url.match(/\/s2s\/v2\.0\/task\/([a-z-]+)\/[^/]+$/);
    if (poll && method === "GET") {
      const ep = poll[1];
      if (ep === opts.failTask) {
        return json({ status: 200, data: { task_status: "error", error: "error_large_face_angle", error_message: "tilted", results: null } });
      }
      const results =
        ep === "skin-tone-analysis"
          ? fx("tone.json")
          : ep === "fitzpatrick-scale-analyzer"
            ? fx("fitz.json")
            : ep === "skin-analysis"
              ? { url: "https://result.test/skin.zip" }
              : { url: "https://result.test/render.jpg" };
      return json({ status: 200, data: { task_status: "success", error: null, results } });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

const img = new Uint8Array([1, 2, 3, 4]);
const makeReal = (opts: { failTask?: string } = {}) => {
  const calls: Call[] = [];
  const ledger = new Ledger();
  const yc = createRealYouCam({ apiKey: "k", baseUrl: "https://api.test", fetchImpl: fakeFetch(calls, opts), pollMs: 0, ledger });
  return { yc, calls, ledger };
};

const adapters: [string, () => YouCam][] = [
  ["replay", () => createReplayYouCam(DIR)],
  ["real", () => makeReal().yc],
];

describe.each(adapters)("YouCam contract: %s adapter", (_name, make) => {
  it("returns the same shapes and the same recorded values through the same interface", async () => {
    const yc = make();
    const f = await yc.upload(img);
    expect(typeof f.id).toBe("string");

    const tones = await yc.faceTones(f);
    for (const h of [tones.skinHex, tones.lipHex, tones.browHex, tones.hairHex]) expect(h).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tones.browHex.toLowerCase()).toBe(fx("tone.json").color.eyebrow_color.toLowerCase());

    expect(await yc.fitzpatrick(f)).toBe(2);

    const skin = await yc.skin(f);
    expect(skin.oilinessRaw).toBeCloseTo(fx("skin.json").oiliness.raw_score, 6);
    expect(skin.skinType.whole).toBe("Combination");

    const r = await yc.render(f, [{ category: "eyebrows", palettes: [{ colorIntensity: 80 }] }]);
    expect(typeof r.url).toBe("string");
    expect(r.url.length).toBeGreaterThan(0);
  });
});

describe("real adapter specifics", () => {
  it("one consult costs 39 units for the reads plus 1 per render, matching Phase 1", async () => {
    const { yc, ledger } = makeReal();
    const f = await yc.upload(img);
    await Promise.all([yc.faceTones(f), yc.fitzpatrick(f), yc.skin(f)]);
    expect(ledger.total).toBe(39);
    await yc.render(f, [{ category: "eyebrows" }]);
    expect(ledger.snapshot()).toMatchObject({ tone: 20, fitzpatrick: 10, skin: 9, render: 1, total: 40 });
  });

  it("caches: the same render twice makes one task, and the same upload is reused", async () => {
    const { yc, calls } = makeReal();
    const a = await yc.upload(img);
    const b = await yc.upload(img);
    expect(b).toEqual(a);
    await yc.render(a, [{ category: "eyebrows", palettes: [{ colorIntensity: 50 }] }]);
    await yc.render(a, [{ category: "eyebrows", palettes: [{ colorIntensity: 50 }] }]);
    expect(calls.filter((c) => c.method === "POST" && c.url.endsWith("/task/makeup-vto")).length).toBe(1);
    expect(calls.filter((c) => c.url.endsWith("/s2s/v2.0/file")).length).toBe(1);
  });

  it("maps an API error code to one plain sentence", async () => {
    const { yc } = makeReal({ failTask: "skin-analysis" });
    const f = await yc.upload(img);
    await expect(yc.skin(f)).rejects.toMatchObject({
      code: "error_large_face_angle",
      userMessage: expect.stringMatching(/turned or tilted/),
    });
  });

  it("remove deletes every task made on the file", async () => {
    const { yc, calls } = makeReal();
    const f = await yc.upload(img);
    await yc.faceTones(f);
    await yc.render(f, [{ category: "eyebrows" }]);
    await yc.remove!(f);
    const dels = calls.filter((c) => c.url.endsWith("/task/delete")).map((c) => JSON.parse(c.body!).task_id);
    expect(dels.sort()).toEqual(["makeup-vto-T", "skin-tone-analysis-T"]);
  });

  it("reads the balance as the sum of unit buckets", async () => {
    expect(await makeReal().yc.balance!()).toBe(1040);
  });
});
