/**
 * Step 21 §2: short flip frame stats (software). 16 singles forward+back pairs.
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

async function measureFlip(page, label, action) {
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
  await action();
  await waitSpin(page, true, 4000);
  await waitSpin(page, false, 12000);
  await page.waitForTimeout(980);
  return page.evaluate((lbl) => {
    window.__perfStop = true;
    const frames = (window.__perf.frames || []).filter((d) => d < 2000).slice(1);
    return {
      label: lbl,
      frames: frames.length,
      avg: frames.length ? Number((frames.reduce((a, b) => a + b, 0) / frames.length).toFixed(2)) : 0,
      max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
      over50: frames.filter((d) => d > 50).length,
      over100: frames.filter((d) => d > 100).length,
    };
  }, label);
}

const browser = await chromium.launch({
  headless: true,
  args: software ? ["--disable-gpu", "--use-gl=swiftshader"] : [],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1600);

// blur screenshot at idle
await page.screenshot({ path: path.join(OUT, "blur-idle-after-filter.png") });

const rows = [];
for (let i = 0; i < 8; i += 1) {
  rows.push(
    await measureFlip(page, `0->1 #${i + 1}`, async () => {
      await page.keyboard.press("ArrowDown");
    }),
  );
  console.log(rows.at(-1));
  rows.push(
    await measureFlip(page, `1->0 #${i + 1}`, async () => {
      await page.keyboard.press("ArrowUp");
    }),
  );
  console.log(rows.at(-1));
}

const maxes = rows.map((r) => r.max).sort((a, b) => a - b);
const medianMax = maxes[Math.floor(maxes.length / 2)];
const report = {
  mode: software ? "software" : "gpu",
  medianMax,
  worst: Math.max(...maxes),
  over100Total: rows.reduce((a, r) => a + r.over100, 0),
  rows,
};
fs.writeFileSync(path.join(OUT, "measure-short.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ medianMax, worst: report.worst, over100Total: report.over100Total }, null, 2));
await browser.close();
