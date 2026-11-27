/**
 * Step 21 §4: edge spring on last section — transform-only, views/hash unchanged.
 * Usage: node scripts/measure-step21-spring.mjs [baseUrl] [--software]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] || "http://127.0.0.1:4191/Portfolio/";
const software = process.argv.includes("--software");
const OUT = path.resolve("scripts/shots-step21");
fs.mkdirSync(OUT, { recursive: true });

async function waitSpin(page, on, timeout = 12000) {
  await page
    .waitForFunction((want) => document.body.classList.contains("is-spinning") === want, on, {
      timeout,
    })
    .catch(() => {});
}

async function goLast(page) {
  for (let i = 0; i < 12; i += 1) {
    const onLast = await page.evaluate(() => {
      const active = document.querySelector("[data-spiral-section][data-active]");
      return active?.id === "contacts";
    });
    if (onLast) return;
    await page.keyboard.press("ArrowDown");
    await waitSpin(page, true, 4000);
    await waitSpin(page, false, 8000);
    await page.waitForTimeout(200);
  }
}

async function snapshotState(page) {
  return page.evaluate(() => {
    const spiral = document.querySelector("[data-spiral-root]") || document.querySelector(".spiral");
    const sections = [...document.querySelectorAll("[data-spiral-section]")].map((el) => ({
      id: el.id,
      view: el.getAttribute("data-panel-view"),
      active: el.hasAttribute("data-active"),
      ahead: el.hasAttribute("data-ahead"),
    }));
    return {
      hash: location.hash,
      spiralTransform: spiral?.style.transform || getComputedStyle(spiral || document.body).transform,
      bodySpin: document.body.classList.contains("is-spinning"),
      sections,
    };
  });
}

const browser = await chromium.launch({
  headless: true,
  args: software ? ["--disable-gpu", "--use-gl=swiftshader"] : [],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1600);
await goLast(page);
await page.waitForTimeout(400);

const before = await snapshotState(page);
const runs = [];

for (let i = 0; i < 5; i += 1) {
  await page.evaluate(() => {
    window.__perfStop = false;
    window.__perf = { frames: [] };
    let last = performance.now();
    const tick = (now) => {
      if (window.__perfStop) return;
      const d = now - last;
      last = now;
      if (d < 2000) window.__perf.frames.push(d);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const midPromise = page.waitForTimeout(160).then(() => snapshotState(page));
  await page.keyboard.press("ArrowDown");
  const mid = await midPromise;
  await page.waitForTimeout(650);

  const stats = await page.evaluate((lbl) => {
    window.__perfStop = true;
    const frames = (window.__perf.frames || []).filter((d) => d < 2000).slice(1);
    const sorted = [...frames].sort((a, b) => a - b);
    const p95 = sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
      : 0;
    return {
      label: lbl,
      frames: frames.length,
      avg: frames.length
        ? Number((frames.reduce((a, b) => a + b, 0) / frames.length).toFixed(2))
        : 0,
      p95: Number(Number(p95).toFixed(2)),
      max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
      over50: frames.filter((d) => d > 50).length,
      over100: frames.filter((d) => d > 100).length,
    };
  }, `spring #${i + 1}`);

  const after = await snapshotState(page);
  const viewsSame =
    JSON.stringify(before.sections) === JSON.stringify(after.sections) &&
    before.hash === after.hash &&
    !after.bodySpin;
  const midMoved = Boolean(mid.spiralTransform && mid.spiralTransform !== before.spiralTransform);

  runs.push({ ...stats, viewsSame, midMoved, hash: after.hash });
  console.log(runs.at(-1));
  await page.waitForTimeout(250);
}

const afterAll = await snapshotState(page);
const outPath = path.join(OUT, "measure-spring.json");
fs.writeFileSync(outPath, JSON.stringify({ before, afterAll, runs }, null, 2));
console.log("wrote", outPath);
await browser.close();
