// Drives the built app in headless Chrome over CDP (zero dependencies, Node 24 fetch + WebSocket).
// Usage: node scripts/ui-drive.mjs <port> <outdir> [scheme=light|dark] [widths=comma list]
// Server must run with HEALED_MODE=replay so no live units are spent.
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [port = "3107", outdir = "evidence/ui", scheme = "light", widthArg] = process.argv.slice(2);
const WIDTHS = (widthArg ?? "320,375,414,768,1024,1280,1440,1920").split(",").map(Number);
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DBG = 9333;
const PHOTO = resolve("public/replay/brow-80-90.jpg");
mkdirSync(outdir, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), "healed-ui-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DBG}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome did not expose a devtools endpoint");
}

const ws = new WebSocket(await target());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) pending.get(d.id)(d);
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, (d) => (d.error ? rej(new Error(method + ": " + d.error.message)) : res(d.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description ?? ""));
  return r.result.value;
};
const until = async (expression, ms = 40000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await ev(expression)) return true;
    await sleep(250);
  }
  throw new Error("TIMEOUT waiting for: " + expression);
};
// Click by visible text, never by class (CSS Modules hash class names).
const clickText = (text) =>
  ev(`(()=>{const b=[...document.querySelectorAll('button,label')].find(e=>e.textContent.trim().indexOf(${JSON.stringify(text)})===0&&!e.disabled);if(!b)return false;b.click();return true})()`);
const shot = async (name) => {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outdir, name + ".png"), Buffer.from(r.data, "base64"));
};

const report = [];
try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
  for (const w of WIDTHS) {
    const h = 900;
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 });
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await until("document.readyState==='complete' && document.body.innerText.indexOf('Snap one')>-1");
    await sleep(300);
    await shot(`${scheme}-${w}-1-snap`);
    const { root } = await send("DOM.getDocument");
    const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: "input[type=file]" });
    await send("DOM.setFileInputFiles", { nodeId, files: [PHOTO] });
    await until("document.body.innerText.indexOf('Reading your skin')>-1", 10000).catch(() => {});
    await shot(`${scheme}-${w}-2-read`);
    await until("document.body.innerText.indexOf('Choose the service')>-1");
    await sleep(300);
    await shot(`${scheme}-${w}-3-choose`);
    if (!(await clickText("Show me healed"))) throw new Error("Show me healed not found at " + w);
    await until("!!document.querySelector('[aria-labelledby=age]')");
    await sleep(1600);
    await shot(`${scheme}-${w}-4-age`);
    const drift = await ev("document.querySelector('[aria-labelledby=age]')?.innerText.indexOf('cool')>-1");
    if (drift && (await clickText("Add warm modifier"))) {
      await sleep(1400);
      await shot(`${scheme}-${w}-5-corrected`);
    }
    if (!(await clickText("Make consult card"))) throw new Error("Make consult card not found at " + w);
    await until("document.body.innerText.indexOf('Consult card')>-1");
    await sleep(600);
    await shot(`${scheme}-${w}-6-card`);
    const overflow = await ev("document.documentElement.scrollWidth - document.documentElement.clientWidth");
    report.push({ w, overflowPx: overflow, drift });
  }
  console.log(JSON.stringify(report));
} finally {
  ws.close();
  chrome.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
