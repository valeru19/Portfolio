/**
 * Step 21 §1: cold 0→1 vs after-Наверх 0→1; idle snapshot after Наверх vs cold.
 * Usage: node scripts/measure-step21-wrap.mjs [baseUrl] [--software]
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
  for (let i = 0; i < 10; i += 1) {
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

async function snapshotIdle(page) {
  return page.evaluate(() => {
    const spiral = document.querySelector("[data-spiral-root]") || document.querySelector(".spiral");
    const sections = [...document.querySelectorAll("[data-spiral-section]")].map((el) => {
      const cover = el.querySelector("[data-panel-solid-cover]");
      const veil = el.querySelector("[data-panel-blur-veil]");
      const bf = veil
        ? getComputedStyle(veil).backdropFilter || getComputedStyle(veil).webkitBackdropFilter
        : "none";
      const filter = veil ? getComputedStyle(veil).filter : "none";
      const r = el.getBoundingClientRect();
      return {
        id: el.id,
        view: el.getAttribute("data-panel-view"),
        ahead: el.hasAttribute("data-ahead"),
        active: el.hasAttribute("data-active"),
        transform: el.style.transform,
        coverOp: cover ? Number(getComputedStyle(cover).opacity) : null,
        veilOp: veil ? Number(getComputedStyle(veil).opacity) : null,
        bf,
        filter,
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      };
    });
    return {
      spiralTransform: spiral?.style.transform || "",
      bodySpin: document.body.classList.contains("is-spinning"),
      sections,
    };
  });
}

async function measureFlip(page, label, action) {
  await page.evaluate(() => {
    window.__perfStop = false;
    window.__perf = { frames: [], clickAt: 0, spinStartAt: 0 };
    let last = performance.now();
    const tick = (now) => {
      if (window.__perfStop) return;
      const d = now - last;
      last = now;
      if (d < 2000) window.__perf.frames.push(d);
      if (!window.__perf.spinStartAt && document.body.classList.contains("is-spinning")) {
        window.__perf.spinStartAt = now;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.__perf.clickAt = performance.now();
  });
  await action();
  await waitSpin(page, true, 4000);
  await waitSpin(page, false, 12000);
  await page.waitForTimeout(980);
  return page.evaluate((lbl) => {
    window.__perfStop = true;
    const frames = (window.__perf.frames || []).filter((d) => d < 2000).slice(1);
    const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    const sorted = [...frames].sort((a, b) => a - b);
    const p95 = sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
      : 0;
    return {
      label: lbl,
      frames: frames.length,
      avg: Number(avg.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
      over50: frames.filter((d) => d > 50).length,
      over100: frames.filter((d) => d > 100).length,
      startDelayMs:
        window.__perf.spinStartAt && window.__perf.clickAt
          ? Number((window.__perf.spinStartAt - window.__perf.clickAt).toFixed(1))
          : null,
    };
  }, label);
}

const browser = await chromium.launch({
  headless: true,
  args: software ? ["--disable-gpu", "--use-gl=swiftshader"] : [],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);

const rows = [];
const coldIdle = await snapshotIdle(page);
fs.writeFileSync(path.join(OUT, "idle-cold.json"), JSON.stringify(coldIdle, null, 2));
await page.screenshot({ path: path.join(OUT, "idle-cold.png") });

for (let i = 1; i <= 5; i += 1) {
  // ensure on 0
  await page.keyboard.press("Home").catch(() => {});
  await page.waitForTimeout(100);
  // if not on 0, click first HUD or Наверх from wherever
  rows.push(
    await measureFlip(page, `cold 0->1 #${i}`, async () => {
      await page.keyboard.press("ArrowDown");
    }),
  );
  console.log(rows.at(-1));
  // back to 0
  await page.keyboard.press("ArrowUp");
  await waitSpin(page, true, 4000);
  await waitSpin(page, false, 8000);
  await page.waitForTimeout(300);
}

// climb to last + Наверх + measure 0->1
await goLast(page);
await page.waitForTimeout(400);
rows.push(
  await measureFlip(page, "Наверх from last", async () => {
    await page.getByRole("link", { name: /Наверх|Back to top/i }).click();
  }),
);
console.log(rows.at(-1));
await page.waitForTimeout(1000);
const afterNaspIdle = await snapshotIdle(page);
fs.writeFileSync(path.join(OUT, "idle-after-nasp.json"), JSON.stringify(afterNaspIdle, null, 2));
await page.screenshot({ path: path.join(OUT, "idle-after-nasp.png") });

for (let i = 1; i <= 5; i += 1) {
  rows.push(
    await measureFlip(page, `after-nasp 0->1 #${i}`, async () => {
      await page.keyboard.press("ArrowDown");
    }),
  );
  console.log(rows.at(-1));
  await page.keyboard.press("ArrowUp");
  await waitSpin(page, true, 4000);
  await waitSpin(page, false, 8000);
  await page.waitForTimeout(300);
}

const report = { mode: software ? "software" : "gpu", base, rows, coldIdle, afterNaspIdle };
fs.writeFileSync(path.join(OUT, "measure-wrap.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ summary: rows }, null, 2));
await browser.close();
