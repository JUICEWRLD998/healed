// Phase 1 access spike. Usage: node scripts/spike.mjs <selfie.jpg> [step,step,...]
// Steps: upload, tone, fitz, skin, brows, lips, credit. Raw responses land in evidence/spike/.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, extname } from "node:path";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const BASE = env.YOUCAM_BASE_URL;
const OUT = new URL("../evidence/spike/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const photo = process.argv[2];
const only = process.argv[3]?.split(",");
const want = (s) => !only || only.includes(s);
const save = (name, data) =>
  writeFileSync(new URL(name, OUT), typeof data === "string" ? data : JSON.stringify(data, null, 2));

async function api(method, path, body) {
  const t0 = performance.now();
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${env.YOUCAM_API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { http: r.status, ms: Math.round(performance.now() - t0), json };
}

async function credit() {
  const r = await api("GET", "/s2s/v1.0/client/credit");
  return (r.json.results ?? []).reduce((a, x) => a + (x.amount_dec ?? 0), 0);
}

async function upload(path) {
  const bytes = readFileSync(path);
  const ct = extname(path).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const r = await api("POST", "/s2s/v2.0/file", {
    files: [{ content_type: ct, file_name: basename(path), file_size: bytes.length }],
  });
  save("01-file-create.json", r);
  const f = r.json?.data?.files?.[0] ?? r.json?.files?.[0];
  if (!f) throw new Error("file create failed: " + JSON.stringify(r.json));
  const req = f.requests[0];
  const put = await fetch(req.url, { method: req.method || "PUT", headers: req.headers, body: bytes });
  save("01-file-put.json", { http: put.status, requestHeaders: req.headers });
  if (!put.ok) throw new Error("PUT failed " + put.status);
  return f.file_id;
}

async function task(label, endpoint, body) {
  const before = await credit();
  const t0 = performance.now();
  const c = await api("POST", `/s2s/v2.0/task/${endpoint}`, body);
  save(`${label}-create.json`, { ...c, request: body });
  const id = c.json?.data?.task_id ?? c.json?.task_id;
  if (!id) return { ok: false, create: c };
  let last;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    last = await api("GET", `/s2s/v2.0/task/${endpoint}/${id}`);
    const st = last.json?.data?.task_status ?? last.json?.task_status;
    if (st === "success" || st === "error") break;
  }
  const after = await credit();
  const ms = Math.round(performance.now() - t0);
  save(`${label}-result.json`, { ...last, totalMs: ms, unitsUsed: +(before - after).toFixed(2) });
  return { ok: (last.json?.data?.task_status ?? last.json?.task_status) === "success", last, ms, units: before - after };
}

async function download(url, name) {
  const r = await fetch(url);
  writeFileSync(new URL(name, OUT), Buffer.from(await r.arrayBuffer()));
}

const start = await credit();
console.log("units at start:", start);
if (!photo) process.exit(0);

const id = await upload(photo);
console.log("uploaded, file_id length", id.length);

const log = (k, r) => console.log(k, r.ok ? "OK" : "FAIL", `${r.ms ?? "-"}ms`, `${r.units?.toFixed?.(2) ?? "-"}u`);

if (want("tone")) log("tone", await task("02-tone", "skin-tone-analysis", { src_file_id: id, face_angle_strictness_level: "flexible" }));
if (want("fitz")) log("fitz", await task("03-fitz", "fitzpatrick-scale-analyzer", { src_file_id: id, version: "1.0" }));
if (want("skin")) log("skin", await task("04-skin", "skin-analysis", { src_file_id: id, face_angle_strictness_level: "flexible", dst_actions: ["oiliness", "pore", "redness", "skin_type"] }));

const brow = (intensity, definition) => ({
  category: "eyebrows",
  pattern: { type: "shape", name: "Curved1", curvature: 0, thickness: 0, definition },
  palettes: [{ color: "#6b4a3a", colorIntensity: intensity, texture: "matte" }],
});
if (want("brows")) {
  for (const [i, d] of [[80, 90], [50, 50], [25, 20]]) {
    const r = await task(`05-brow-${i}-${d}`, "makeup-vto", { src_file_id: id, version: "1.0", effects: [brow(i, d)] });
    log(`brow ${i}/${d}`, r);
    const url = r.last?.json?.data?.results?.url ?? r.last?.json?.results?.url;
    if (url) await download(url, `05-brow-${i}-${d}.jpg`);
  }
}
if (want("lips")) {
  for (const i of [60, 35, 15]) {
    const r = await task(`06-lip-${i}`, "makeup-vto", {
      src_file_id: id, version: "1.0",
      effects: [{ category: "lip_color", shape: { name: "original" }, style: { type: "ombre", blendStrength: 50, innerColorRatio: 40, innerRatio: 40, featherStrength: 60 },
        palettes: [{ color: "#c4707a", texture: "sheer", colorIntensity: i, transparencyIntensity: 50 }, { color: "#d98a93", texture: "sheer", colorIntensity: i, transparencyIntensity: 50 }] }],
    });
    log(`lip ${i}`, r);
    const url = r.last?.json?.data?.results?.url ?? r.last?.json?.results?.url;
    if (url) await download(url, `06-lip-${i}.jpg`);
  }
}
console.log("units at end:", await credit());
