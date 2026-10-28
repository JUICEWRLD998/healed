const { chromium } = require("playwright");
const PORT = process.argv[2] || "3000";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/judges`);
  const out = {};
  out.chip = await p.locator("[data-mode]").first().innerText();
  out.noHScroll = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  for (const label of ["No face, or a tiny face","Two faces","Microblading on oily skin","A cool black pigment","Unit budget below the floor"]) {
    await p.getByRole("button", { name: label }).click();
    await p.waitForTimeout(400);
    out[label] = (await p.locator("ul li", { has: p.getByRole("button", { name: label }) }).locator("[aria-live]").innerText()).split("\n").slice(0,3).join(" | ");
  }
  await p.screenshot({ path: "evidence/phase7/judges-mobile.png", fullPage: true });
  await p.goto(`http://localhost:${PORT}/`);
  await p.waitForTimeout(600);
  out.snapChip = await p.locator("[data-mode]").first().innerText();
  out.health = await (await p.request.get(`http://localhost:${PORT}/api/health`)).text();
  console.log(JSON.stringify(out, null, 2));
  await b.close();
})();
