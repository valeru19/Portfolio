import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const outDir = path.join("scripts", "step17-shots");
fs.mkdirSync(outDir, { recursive: true });

async function waitSpin(page, on, timeout = 5000) {
  await page
    .waitForFunction((want) => document.body.classList.contains("is-spinning") === want, on, {
      timeout,
    })
    .catch(() => {});
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);

for (let i = 0; i < 6; i += 1) {
  await page.keyboard.press("ArrowDown");
  await waitSpin(page, true, 2500);
  await waitSpin(page, false, 5000);
  await page.waitForTimeout(80);
}

const at = await page.evaluate(() => ({
  section: document.body.getAttribute("data-section"),
  active: document.querySelector("[data-spiral-section][data-active]")?.id,
}));
console.log("at", at);
await page.screenshot({ path: path.join(outDir, "10-before-nasp.png") });

await page.evaluate(() => {
  window.__f = [];
  let last = performance.now();
  const tick = (n) => {
    window.__f.push(n - last);
    last = n;
    if (document.body.classList.contains("is-spinning") || window.__f.length < 4) {
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
});

await page.getByRole("link", { name: /Наверх|Back to top|Top/i }).click({ force: true });
await page.waitForFunction(
  () =>
    document.body.classList.contains("is-spinning") && document.body.dataset.spinKind === "nasp",
  { timeout: 4000 },
);

const samples = [];
for (let i = 0; i < 10; i += 1) {
  await page.waitForTimeout(160);
  const snap = await page.evaluate(() => {
    const secs = Array.from(document.querySelectorAll("[data-spiral-section]"));
    let fading = 0;
    let opaqueBake = 0;
    let veil = 0;
    let frost = 0;
    const detail = secs.map((el) => {
      const bake = el.querySelector("[data-panel-bake]");
      const v = el.querySelector("[class*=panelBlurVeil]");
      const f = el.querySelector("[class*=panelFrostFill]");
      const bakeOp =
        bake && getComputedStyle(bake).display !== "none"
          ? Number(getComputedStyle(bake).opacity)
          : 0;
      const veilOn =
        v && getComputedStyle(v).display !== "none" && Number(getComputedStyle(v).opacity) > 0.01;
      const frostOn =
        f && getComputedStyle(f).display !== "none" && Number(getComputedStyle(f).opacity) > 0.01;
      if (veilOn) veil += 1;
      if (frostOn) frost += 1;
      if (bakeOp > 0.02 && bakeOp < 0.98) fading += 1;
      if (bakeOp >= 0.98) opaqueBake += 1;
      return {
        id: el.id,
        bakeOp: Number(bakeOp.toFixed(2)),
        veilOn: Boolean(veilOn),
        frostOn: Boolean(frostOn),
        turn: el.getAttribute("data-blur-turn"),
      };
    });
    return {
      spinKind: document.body.dataset.spinKind,
      veil,
      frost,
      fading,
      opaqueBake,
      effectBudget: fading + veil + frost,
      detail,
    };
  });
  samples.push(snap);
  await page.screenshot({
    path: path.join(outDir, `nasp2-${String(i).padStart(2, "0")}.png`),
  });
  if (!(await page.evaluate(() => document.body.classList.contains("is-spinning")))) break;
}

await waitSpin(page, false, 8000);
const stats = await page.evaluate(() => {
  const f = (window.__f || []).filter((d) => d < 2000).slice(1);
  const avg = f.length ? f.reduce((a, b) => a + b, 0) / f.length : 0;
  return {
    frames: f.length,
    avg: Number(avg.toFixed(2)),
    max: f.length ? Number(Math.max(...f).toFixed(2)) : 0,
    over100: f.filter((d) => d > 100).length,
    over50: f.filter((d) => d > 50).length,
    over33: f.filter((d) => d > 33).length,
  };
});
await page.screenshot({ path: path.join(outDir, "11-after-nasp.png") });
console.log("stats", stats);
console.log(JSON.stringify(samples, null, 2));
await browser.close();
