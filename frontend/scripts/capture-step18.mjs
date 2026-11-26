import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const outDir = path.join("scripts", "step18-shots");
fs.mkdirSync(outDir, { recursive: true });

async function waitSpin(page, on, timeout = 6000) {
  await page
    .waitForFunction((want) => document.body.classList.contains("is-spinning") === want, on, {
      timeout,
    })
    .catch(() => {});
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);
await page.screenshot({ path: path.join(outDir, "00-idle-0.png") });

// step forward
await page.keyboard.press("ArrowDown");
await waitSpin(page, true);
for (let i = 0; i < 6; i += 1) {
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outDir, `fwd-${String(i).padStart(2, "0")}.png`) });
  if (!(await page.evaluate(() => document.body.classList.contains("is-spinning")))) break;
}
await waitSpin(page, false);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, "fwd-land.png") });

// step back
await page.keyboard.press("ArrowUp");
await waitSpin(page, true);
for (let i = 0; i < 6; i += 1) {
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outDir, `back-${String(i).padStart(2, "0")}.png`) });
  if (!(await page.evaluate(() => document.body.classList.contains("is-spinning")))) break;
}
await waitSpin(page, false);
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(outDir, "back-land-blur.png") });

// go to last + Наверх
for (let i = 0; i < 6; i += 1) {
  await page.keyboard.press("ArrowDown");
  await waitSpin(page, true, 2500);
  await waitSpin(page, false, 5000);
}
await page.screenshot({ path: path.join(outDir, "nasp-before.png") });
await page.getByRole("link", { name: /Наверх|Back to top|Top/i }).click({ force: true });
await waitSpin(page, true);
for (let i = 0; i < 12; i += 1) {
  await page.waitForTimeout(160);
  const snap = await page.evaluate(() => {
    let blur = 0;
    const views = [];
    for (const el of document.querySelectorAll("[data-spiral-section]")) {
      views.push(`${el.id}:${el.getAttribute("data-panel-view")}`);
      const veil = el.querySelector("[data-panel-blur-veil]");
      if (!veil) continue;
      const cs = getComputedStyle(veil);
      const bf = cs.backdropFilter || cs.webkitBackdropFilter || "none";
      if (cs.display !== "none" && Number(cs.opacity) > 0.02 && bf !== "none") blur += 1;
    }
    return { kind: document.body.dataset.spinKind, blur, views };
  });
  console.log("nasp", i, JSON.stringify(snap));
  await page.screenshot({ path: path.join(outDir, `nasp-${String(i).padStart(2, "0")}.png`) });
  if (!(await page.evaluate(() => document.body.classList.contains("is-spinning")))) break;
}
await waitSpin(page, false);
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(outDir, "nasp-land.png") });

console.log("done", outDir);
await browser.close();
