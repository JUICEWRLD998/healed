// Phase 6 verification over CDP: console errors, axe, CLS, image probes (with planted controls),
// click-path on the primary journey, reduced-motion end state, scrub filmstrip.
// Usage: node scripts/ui-verify.mjs <port> <outdir>   (server must run with HEALED_MODE=replay)
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [port = "3110", outdir = "evidence/ui/verify"] = process.argv.slice(2);
const DBG = 9334;
const PHOTO = resolve("public/replay/brow-80-90.jpg");
mkdirSync(join(outdir, "film"), { recursive: true });
const AXE = await (await fetch("https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js")).text();

const profile = mkdtempSync(join(tmpdir(), "healed-vf-"));
const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", ["--headless=new", `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i += 1) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${DBG}/json`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl; } catch {}
  await sleep(200);
}
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const consoleErrors = [];
const frames = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) return pending.get(d.id)(d);
  if (d.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + d.params.exceptionDetails.text);
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") consoleErrors.push("console.error: " + d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 200));
  if (d.method === "Log.entryAdded" && d.params.entry.level === "error" && !String(d.params.entry.url).includes("missing-control")) consoleErrors.push("log: " + d.params.entry.text + " " + (d.params.entry.url ?? ""));
  if (d.method === "Page.screencastFrame") {
    frames.push({ t: d.params.metadata.timestamp, data: d.params.data });
    send("Page.screencastFrameAck", { sessionId: d.params.sessionId }).catch(() => {});
  }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const n = ++id;
  pending.set(n, (d) => (d.error ? rej(new Error(method + ": " + d.error.message)) : res(d.result)));
  ws.send(JSON.stringify({ id: n, method, params }));
});
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description ?? ""));
  return r.result.value;
};
const until = async (expr, ms = 40000) => {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await ev(expr)) return true; await sleep(200); }
  throw new Error("TIMEOUT: " + expr);
};
const clickText = (text) => ev(`(()=>{const b=[...document.querySelectorAll('button,label')].find(e=>e.textContent.trim().indexOf(${JSON.stringify(text)})===0&&!e.disabled);if(!b)return false;b.click();return true})()`);
const text = () => ev("document.body.innerText");
const R = { checks: [] };
const check = (name, ok, detail = "") => { R.checks.push({ name, ok: !!ok, detail }); console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  " + detail : "")); };

async function axe(label) {
  await ev(AXE);
  const r = await ev(`axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,t:v.nodes[0].target.join(' ')})))`);
  const bad = r.filter((v) => v.impact === "serious" || v.impact === "critical");
  R["axe_" + label] = r;
  check(`axe ${label}: no serious/critical`, bad.length === 0, JSON.stringify(bad));
}

const imgProbe = () => ev(`(()=>{const out={broken:0,noAlt:0,emptyAlt:0,oversize:0,n:0};for(const i of document.images){if(i.dataset.ctl)continue;out.n++;if(i.complete&&i.naturalWidth===0)out.broken++;if(!i.hasAttribute('alt'))out.noAlt++;else if(i.alt==='')out.emptyAlt++;const w=i.getBoundingClientRect().width;if(w>0&&i.naturalWidth/(w*devicePixelRatio)>2.5)out.oversize++}return out})()`);

try {
  await send("Page.enable"); await send("Runtime.enable"); await send("DOM.enable"); await send("Log.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});` });

  // planted controls: the probes must see these or their negatives mean nothing
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
  await until("document.body.innerText.indexOf('Snap one')>-1");
  await ev(`(()=>{const a=document.createElement('img');a.dataset.ctl='1';a.src='/missing-control.png';document.body.append(a);const b=document.createElement('img');b.dataset.ctl='1';b.src='data:image/gif;base64,R0lGODlhAQABAAAAACw=';document.body.append(b)})()`);
  await sleep(600);
  const ctl = await ev(`(()=>{const [a,b]=[...document.querySelectorAll('img[data-ctl]')];return {brokenSeen:a.complete&&a.naturalWidth===0,noAltSeen:!b.hasAttribute('alt')}})()`);
  check("control: broken-image probe sees a missing file", ctl.brokenSeen);
  check("control: missing-alt probe sees an img with no alt", ctl.noAltSeen);
  await ev("document.querySelectorAll('img[data-ctl]').forEach(e=>e.remove())");
  await axe("snap");

  const { root } = await send("DOM.getDocument");
  const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: "input[type=file]" });
  await send("DOM.setFileInputFiles", { nodeId, files: [PHOTO] });
  await until("document.body.innerText.indexOf('Choose the service')>-1");
  await axe("choose");

  // break: an invalid custom hex must block the primary action
  await ev(`(()=>{const i=document.querySelector('input[type=text]');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'#zzzzzz');i.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await sleep(200);
  check("break: invalid hex disables Show me healed", await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('Show me healed')).disabled`));
  await ev(`(()=>{const i=document.querySelector('input[type=text]');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}))})()`);

  // filmstrip: record the signature moment
  await send("Page.startScreencast", { format: "jpeg", quality: 60, everyNthFrame: 1 });
  check("click: Show me healed", await clickText("Show me healed"));
  await until("!!document.querySelector('[aria-labelledby=age]')");
  await sleep(1800);
  await send("Page.stopScreencast");
  frames.forEach((f, i) => writeFileSync(join(outdir, "film", `f${String(i).padStart(3, "0")}.jpg`), Buffer.from(f.data, "base64")));
  const span = frames.length ? (frames.at(-1).t - frames[0].t) * 1000 : 0;
  check("filmstrip: frames captured during the scrub", frames.length >= 4, `${frames.length} frames over ${Math.round(span)} ms`);
  await axe("age");
  const imgs = await imgProbe();
  check("images: none broken, all have alt, none oversized", imgs.broken === 0 && imgs.noAlt === 0 && imgs.oversize === 0, JSON.stringify(imgs));

  // click-path: every primary-journey button ends in the state its label promises
  const year = () => ev("document.querySelector('[aria-labelledby=age] [class*=year]')?.innerText");
  await clickText("Day 0");
  await sleep(400);
  check("click-path: Day 0 tab shows Day 0", (await year()) === "Day 0", await year());
  await clickText("Year 3");
  await sleep(400);
  check("click-path: Year 3 tab shows Year 3", (await year()) === "Year 3", await year());
  const hadFix = await clickText("Add warm modifier");
  check("click-path: Add warm modifier offered on a cool drift", hadFix);
  await until("document.body.innerText.indexOf('modifier added')>-1");
  await until("document.body.innerText.indexOf('Re-rendering')===-1");
  const t1 = await text();
  check("click-path: modifier ends in a corrected state", t1.indexOf("15% warm modifier added") > -1 && t1.indexOf("Remove modifier") > -1);
  await clickText("Remove modifier");
  await until("document.body.innerText.indexOf('Re-rendering')===-1");
  await sleep(500);
  const t2 = await text();
  check("click-path: Remove modifier restores the offer", t2.indexOf("Add warm modifier 15%") > -1);
  await clickText("Change pigment");
  await until("document.body.innerText.indexOf('Choose the service')>-1");
  check("click-path: Change pigment returns to Choose", true);
  await clickText("Show me healed");
  await until("!!document.querySelector('[aria-labelledby=age]')");
  await clickText("Make consult card");
  await until("document.body.innerText.indexOf('Consult card')>-1");
  await sleep(800);
  await axe("card");
  await ev(`document.querySelector('input[type=checkbox]').click()`);
  await until("document.body.innerText.indexOf('Consent recorded')>-1");
  check("click-path: consent tick records consent", true);
  await until("document.body.innerText.indexOf('Deleting your uploaded photo')===-1", 15000).catch(() => {});
  const t3 = await text();
  check("click-path: deletion outcome is stated after consent", /deleted|could not be confirmed|expires/i.test(t3.split("Consent recorded")[1] ?? ""), (t3.split("Consent recorded")[1] ?? "").slice(0, 140).replace(/\n/g, " "));
  await clickText("Start over");
  await until("document.body.innerText.indexOf('Snap one')>-1");
  check("click-path: Start over returns to Snap", true);
  R.cls = await ev("window.__cls");
  check("CLS under 0.1 across the journey (one page load)", R.cls < 0.1, "cls=" + R.cls.toFixed(4));

  // reduced motion: same end state, verdict text present
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
  await until("document.body.innerText.indexOf('Snap one')>-1");
  const n2 = await send("DOM.querySelector", { nodeId: (await send("DOM.getDocument")).root.nodeId, selector: "input[type=file]" });
  await send("DOM.setFileInputFiles", { nodeId: n2.nodeId, files: [PHOTO] });
  await until("document.body.innerText.indexOf('Choose the service')>-1");
  await clickText("Show me healed");
  await until("!!document.querySelector('[aria-labelledby=age]')");
  await sleep(500);
  const yr = await ev("document.querySelector('[aria-labelledby=age] [class*=year]')?.innerText");
  const verdict = await ev("document.querySelector('[aria-labelledby=age] [aria-live]')?.innerText");
  check("reduced motion: lands on the first drift step at once, verdict text present", yr === "Year 1" && /cool|warm/.test(verdict), `${yr} | ${verdict?.replace(/\n/g, " ")}`);
  // rendered contrast (WCAG ratio for text on its own background) and role-hue distinctness (CIE76 dE),
  // both themes, on the timeline screen. Colours resolve through a canvas pixel so oklch() is read correctly.
  const measure = `(()=>{
    const c=document.createElement('canvas');c.width=c.height=1;const g=c.getContext('2d',{willReadFrequently:true});
    const rgb=s=>{g.clearRect(0,0,1,1);g.fillStyle='#000';g.fillStyle=s;g.fillRect(0,0,1,1);const d=g.getImageData(0,0,1,1).data;return [d[0],d[1],d[2],d[3]/255]};
    const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
    const L=a=>0.2126*lin(a[0])+0.7152*lin(a[1])+0.0722*lin(a[2]);
    const ratio=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
    const lab=a=>{const f=t=>t>0.008856?Math.cbrt(t):7.787*t+16/116;const r=lin(a[0]),gg=lin(a[1]),b=lin(a[2]);
      const X=(0.4124*r+0.3576*gg+0.1805*b)/0.95047,Y=0.2126*r+0.7152*gg+0.0722*b,Z=(0.0193*r+0.1192*gg+0.9505*b)/1.08883;
      return [116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))]};
    const dE=(a,b)=>{const p=lab(a),q=lab(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])};
    const bgOf=el=>{let n=el;let acc=[255,255,255,1];const stack=[];while(n){const b=rgb(getComputedStyle(n).backgroundColor);if(b[3]>0)stack.push(b);if(b[3]>=1)break;n=n.parentElement}
      let out=[255,255,255];for(const b of stack.reverse()){out=[0,1,2].map(i=>b[i]*b[3]+out[i]*(1-b[3]))}return out};
    const style=document.createElement('style');style.textContent='*{transition:none!important;animation:none!important}';document.head.append(style);
    const rows=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const seen=new Set();
    while(walker.nextNode()){const t=walker.currentNode;if(!t.nodeValue.trim())continue;const el=t.parentElement;if(seen.has(el))continue;seen.add(el);
      const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none'||el.closest('.sr,[class*=sr]'))continue;const r=el.getBoundingClientRect();if(r.width<2||r.height<2)continue;
      const fg=rgb(cs.color);const bg=bgOf(el);const a=fg[3];const fgm=[0,1,2].map(i=>fg[i]*a+bg[i]*(1-a));
      const size=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;const large=size>=24||(size>=18.66&&bold);
      rows.push({t:t.nodeValue.trim().slice(0,28),ratio:+ratio(fgm,bg).toFixed(2),need:large?3:4.5})}
    // planted control: text painted in its own background must read ~1:1
    const ctl=document.createElement('p');ctl.textContent='control';ctl.style.cssText='position:fixed;left:0;top:0;color:rgb(120,120,120);background:rgb(121,121,121)';document.body.append(ctl);
    const ctlRatio=ratio(rgb(getComputedStyle(ctl).color),rgb(getComputedStyle(ctl).backgroundColor));ctl.remove();style.remove();
    const root=getComputedStyle(document.documentElement);
    const hue=n=>rgb(root.getPropertyValue(n).trim());
    const names=['--accent','--warm','--cool','--caution'];let min=1e9,pair='';
    for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){const d=dE(hue(names[i]),hue(names[j]));if(d<min){min=d;pair=names[i]+'/'+names[j]}}
    const fails=rows.filter(r=>r.ratio<r.need);
    return {n:rows.length,min:Math.min(...rows.map(r=>r.ratio)),fails:fails.slice(0,6),ctlRatio:+ctlRatio.toFixed(2),minDE:+min.toFixed(1),pair}
  })()`;
  for (const scheme of ["light", "dark"]) {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }, { name: "prefers-reduced-motion", value: "reduce" }] });
    await sleep(400);
    const m = await ev(measure);
    R["contrast_" + scheme] = m;
    check(`control: contrast sampler reads planted 1:1 pair (${scheme})`, m.ctlRatio < 1.5, "ratio=" + m.ctlRatio);
    check(`rendered contrast ${scheme}: all ${m.n} text runs meet AA`, m.fails.length === 0, `min=${m.min.toFixed(2)} fails=${JSON.stringify(m.fails)}`);
    check(`role hues distinct ${scheme}: min dE76 >= 20`, m.minDE >= 20, `${m.minDE} ${m.pair}`);
  }
  check("console: zero errors over the whole run", consoleErrors.length === 0, consoleErrors.join(" || "));
  writeFileSync(join(outdir, "verify.json"), JSON.stringify(R, null, 1));
} finally {
  ws.close(); chrome.kill(); await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
