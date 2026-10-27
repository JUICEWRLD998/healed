// Phase 1: does POST /s2s/v2.0/task/delete also remove the uploaded input file?
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const call = async (m, p, b) => {
  const r = await fetch(env.YOUCAM_BASE_URL + p, { method: m, headers: { Authorization: "Bearer " + env.YOUCAM_API_KEY, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
  return { http: r.status, json: await r.json().catch(() => null) };
};
const ev = (n) => JSON.parse(readFileSync(new URL(`../evidence/spike/${n}`, import.meta.url), "utf8"));
const tid = ev("04-skin-create.json").json.data.task_id;
const fid = ev("01-file-create.json").json.data.files[0].file_id;
const poll0 = await call("GET", "/s2s/v2.0/task/skin-analysis/" + tid);
console.log("poll before delete", poll0.http, poll0.json?.data?.task_status);
const del = await call("POST", "/s2s/v2.0/task/delete", { task_id: tid });
console.log("delete", JSON.stringify(del));
const poll1 = await call("GET", "/s2s/v2.0/task/skin-analysis/" + tid);
console.log("poll after delete", poll1.http, JSON.stringify(poll1.json).slice(0, 200));
const c = await call("POST", "/s2s/v2.0/task/makeup-vto", { src_file_id: fid, version: "1.0", effects: [{ category: "eyebrows", pattern: { type: "shape", name: "Curved1", curvature: 0, thickness: 0, definition: 50 }, palettes: [{ color: "#6b4a3a", colorIntensity: 50, texture: "matte" }] }] });
console.log("reuse input file after delete: create", c.http, JSON.stringify(c.json).slice(0, 200));
let reuse = null;
const id = c.json?.data?.task_id;
if (id) for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const p = await call("GET", "/s2s/v2.0/task/makeup-vto/" + id);
  const s = p.json?.data?.task_status;
  if (s !== "running") { reuse = { s, e: p.json?.data?.error, m: p.json?.data?.error_message }; console.log("reuse result", JSON.stringify(reuse)); break; }
}
writeFileSync(new URL("../evidence/spike/07-delete-test.json", import.meta.url), JSON.stringify({ poll0: poll0.http, del, poll1, reuse }, null, 2));
