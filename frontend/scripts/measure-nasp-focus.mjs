/**
 * Быстрый замер только «Наверх» / 7->2 / 7->3 после wrap (шаг 22.3).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseArg = process.argv[2] || "http://127.0.0.1:4210/Portfolio/";
const RUNS = 5;
const POST_SPIN_MS = 980;
const SPIN_ON_MS = 8000;
const SPIN_OFF_MS = 60000;

function stats(arr) {
  if (!arr.length) return { avg: null, p95: null, max: null, over50: 0, over100: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = arr.reduce((a, b) => a + b, 0);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  return {
    avg: Number((sum / arr.length).toFixed(1)),
    p95: Number(p95.toFixed(1)),
    max: Number(Math.max(...arr).toFixed(1)),
    over50: arr.filter((x) => x > 50).length,
    over100: arr.filter((x) => x > 100).length,
  };
}

async function waitSpin(page, on, timeout, label) {
  try {
    await page.waitForFunction(
      (want) => document.body.classList.contains("is-spinning") === want,
      on,
      { timeout },
    );
  } catch (err) {
    throw new Error(`[timeout] waitSpin(${on}) ${timeout}ms ${label}: ${err.message}`);
  }
}

async function measureFrames(page, label, action) {
  await page.evaluate(() => {
    window.__pf = [];
    window.__pfLast = performance.now();
    window.__pfOn = true;
    const tick = (t) => {
      if (!window.__pfOn) return;
      window.__pf.push(t - window.__pfLast);
      window.__pfLast = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const t0 = performance.now();
  await action();
  await waitSpin(page, true, SPIN_ON_MS, `${label} on`);
  await waitSpin(page, false, SPIN_OFF_MS, `${label} off`);
  await page.waitForTimeout(POST_SPIN_MS);
  const frames = await page.evaluate(() => {
    window.__pfOn = false;
    return window.__pf || [];
  });
  const s = stats(frames);
  return {
    label,
    startDelayMs: Number((performance.now() - t0).toFixed(1)),
    frames: frames.length,
    ...s,
  };
}

async function goTo(page, index, label) {
  await page.locator("nav[data-spiral-hud] button").nth(index).click();
  await waitSpin(page, true, SPIN_ON_MS, `${label} on`).catch(async () => {
    /* already there */
  });
  const spinning = await page.evaluate(() => document.body.classList.contains("is-spinning"));
  if (spinning) await waitSpin(page, false, SPIN_OFF_MS, `${label} off`);
  await page.waitForTimeout(POST_SPIN_MS);
}

async function clickTop(page) {
  const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
  if ((await link.count()) > 0) {
    await link.first().click({ force: true });
    return;
  }
  await page.locator("nav[data-spiral-hud] button").first().click();
}

async function open(page, hash) {
  const url = hash ? `${baseArg.replace(/\/?$/, "/")}${hash}` : baseArg;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("[data-spiral-root]", { timeout: 20000 });
  await page.waitForTimeout(900);
}

async function runMatrix(page, meta) {
  const lastIdx = (await page.locator("nav[data-spiral-hud] button").count()) - 1;
  const rows = [];
  for (let run = 1; run <= RUNS; run += 1) {
    for (const from1 of [5, 6, 7]) {
      const from = Math.min(lastIdx, from1 - 1);
      await goTo(page, from, `prep ${from1}#${run}`);
      rows.push(
        await measureFrames(page, `Наверх from ${from1} #${run} [${meta}]`, () => clickTop(page)),
      );
    }
    await goTo(page, lastIdx, `prep 7->2#${run}`);
    rows.push(
      await measureFrames(page, `7->2 #${run} [${meta}]`, () =>
        page.locator("nav[data-spiral-hud] button").nth(1).click(),
      ),
    );
    await goTo(page, lastIdx, `prep 7->3#${run}`);
    rows.push(
      await measureFrames(page, `7->3 #${run} [${meta}]`, () =>
        page.locator("nav[data-spiral-hud] button").nth(2).click(),
      ),
    );
  }
  return rows;
}

async function main() {
  const viewports = [
    { w: 1912, h: 1000, label: "1912x1000" },
    { w: 1440, h: 900, label: "1440x900" },
  ];
  const cpus = [1, 4];
  const hashes = [
    { key: "none", path: "" },
    { key: "contacts", path: "#contacts" },
  ];
  const report = {
    createdAt: new Date().toISOString(),
    base: baseArg,
    runs: RUNS,
    rows: [],
    failures: 0,
  };
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--disable-gpu", "--use-gl=swiftshader"],
  });

  for (const cpu of cpus) {
    for (const vp of viewports) {
      for (const hash of hashes) {
        const meta = `${vp.label}|cpu${cpu}|hash=${hash.key}`;
        console.log(`[run] ${meta}`);
        const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
        const page = await context.newPage();
        const client = await context.newCDPSession(page);
        if (cpu !== 1) await client.send("Emulation.setCPUThrottlingRate", { rate: cpu });
        try {
          await open(page, hash.path);
          const rows = await runMatrix(page, meta);
          report.rows.push(...rows);
        } catch (err) {
          report.failures += 1;
          console.error(`[fail] ${meta}`, err.message || err);
        }
        await context.close();
      }
    }
  }
  await browser.close();

  const summary = {};
  for (const r of report.rows) {
    const fam = r.label.replace(/ #\d+.*/, "");
    if (!summary[fam]) summary[fam] = [];
    summary[fam].push(r.max);
  }
  report.summary = Object.fromEntries(
    Object.entries(summary).map(([k, arr]) => [
      k,
      {
        n: arr.length,
        avg: Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)),
        max: Number(Math.max(...arr).toFixed(1)),
        over100Runs: arr.filter((x) => x > 100).length,
      },
    ]),
  );

  const out = path.resolve("scripts/perf-nasp-focus-22-3.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`[measure] wrote ${out} failures=${report.failures}`);
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.failures) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
