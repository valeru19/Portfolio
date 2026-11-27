/**
 * Замер кадров спирали (Chromium / Playwright).
 * Usage: node scripts/measure-spiral-perf.mjs [baseUrl] [--software]
 *
 * Окно: от клика до конца анимаций + 500 мс.
 * 5 прогонов: одиночные ходы, Наверх, ход после Наверх, пружина.
 * Живой blur: data-panel-view=blur + filter:blur на scroll при открытом cover.
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const software = process.argv.includes("--software");
/** После снятия is-spinning: fade cover/veil ~480 + запас 500. */
const POST_SPIN_MS = 480 + 500;
const RUNS = 5;

async function waitSpin(page, on, timeout = 8000) {
  await page
    .waitForFunction((want) => document.body.classList.contains("is-spinning") === want, on, {
      timeout,
    })
    .catch(() => {});
}

async function stopRaf(page) {
  await page.evaluate(() => {
    window.__perfStop = true;
  });
}

function summarize(frames, label, extra = {}) {
  const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
  const sorted = [...frames].sort((a, b) => a - b);
  const p95 = sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
    : 0;
  return {
    label,
    frames: frames.length,
    avg: Number(avg.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
    over33: frames.filter((d) => d > 33).length,
    over50: frames.filter((d) => d > 50).length,
    over100: frames.filter((d) => d > 100).length,
    ...extra,
  };
}

async function measure(page, label, action) {
  await stopRaf(page);
  await page.waitForTimeout(30);
  await page.evaluate(() => {
    window.__perfStop = false;
    window.__perf = {
      frames: [],
      blurMax: 0,
      blurSamples: 0,
      clickAt: 0,
      spinStartAt: 0,
    };
    let last = performance.now();
    const tick = (now) => {
      if (window.__perfStop) return;
      const d = now - last;
      last = now;
      if (d < 2000) window.__perf.frames.push(d);

      if (!window.__perf.spinStartAt && document.body.classList.contains("is-spinning")) {
        window.__perf.spinStartAt = now;
      }

      let liveBlur = 0;
      for (const el of document.querySelectorAll("[data-spiral-section]")) {
        if (el.getAttribute("data-panel-view") !== "blur") continue;
        const cover = el.querySelector("[data-panel-solid-cover]");
        const coverOp = cover ? Number(getComputedStyle(cover).opacity) : 0;
        if (Number.isFinite(coverOp) && coverOp > 0.95) continue;
        const scroll = el.querySelector("[data-panel-scroll]");
        const filter = scroll ? getComputedStyle(scroll).filter || "none" : "none";
        if (filter.includes("blur")) liveBlur += 1;
      }
      window.__perf.blurMax = Math.max(window.__perf.blurMax, liveBlur);
      window.__perf.blurSamples += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await page.evaluate(() => {
    window.__perf.clickAt = performance.now();
  });
  await action();
  await waitSpin(page, true, 3000);
  await waitSpin(page, false, 12000);
  await page.waitForTimeout(POST_SPIN_MS);
  return page.evaluate((lbl) => {
    window.__perfStop = true;
    const frames = (window.__perf.frames || []).filter((d) => d < 2000).slice(1);
    const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    const sorted = [...frames].sort((a, b) => a - b);
    const p95 = sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
      : 0;
    const startDelay =
      window.__perf.spinStartAt && window.__perf.clickAt
        ? window.__perf.spinStartAt - window.__perf.clickAt
        : null;
    return {
      label: lbl,
      frames: frames.length,
      avg: Number(avg.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
      over33: frames.filter((d) => d > 33).length,
      over50: frames.filter((d) => d > 50).length,
      over100: frames.filter((d) => d > 100).length,
      blurMax: window.__perf.blurMax,
      blurSamples: window.__perf.blurSamples,
      startDelayMs: startDelay != null ? Number(startDelay.toFixed(1)) : null,
    };
  }, label);
}

async function goToIndex(page, index) {
  const dots = page.locator("nav[data-spiral-hud] button");
  await dots.nth(index).click();
  await waitSpin(page, true, 3000);
  await waitSpin(page, false, 8000);
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

async function main() {
  console.log(`[measure] base=${base} software=${software} runs=${RUNS} postSpin=${POST_SPIN_MS}`);
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: software ? ["--disable-gpu", "--use-gl=swiftshader"] : [],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(12000);
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);

  const rows = [];
  const lastIdx = (await page.locator("[data-spiral-section]").count()) - 1;

  // Все соседние пары вперёд/назад × RUNS (требование §6).
  for (let run = 0; run < RUNS; run += 1) {
    for (let i = 0; i < lastIdx; i += 1) {
      await goToIndex(page, i);
      rows.push(
        await measure(page, `${i}->${i + 1} #${run + 1}`, async () => {
          await page.keyboard.press("ArrowDown");
          await waitSpin(page, true);
        }),
      );
      rows.push(
        await measure(page, `${i + 1}->${i} #${run + 1}`, async () => {
          await page.keyboard.press("ArrowUp");
          await waitSpin(page, true);
        }),
      );
    }
  }

  for (let run = 0; run < RUNS; run += 1) {
    await goToIndex(page, lastIdx);
    await page.waitForTimeout(120);
    rows.push(
      await measure(page, `Наверх from last #${run + 1}`, async () => {
        await clickTop(page);
        await waitSpin(page, true);
      }),
    );
    rows.push(
      await measure(page, `after-Наверх 0->1 #${run + 1}`, async () => {
        await page.keyboard.press("ArrowDown");
        await waitSpin(page, true);
      }),
    );
  }

  for (let run = 0; run < RUNS; run += 1) {
    await goToIndex(page, lastIdx);
    rows.push(
      await measure(page, `spring last #${run + 1}`, async () => {
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(500);
      }),
    );
  }

  await goToIndex(page, 0);
  rows.push(
    await measure(page, "0->last", async () => {
      await page.locator("nav[data-spiral-hud] button").last().click();
      await waitSpin(page, true);
    }),
  );

  await goToIndex(page, 0);
  const idleBlur = await page.evaluate(() => {
    let liveBlur = 0;
    const detail = [];
    for (const el of document.querySelectorAll("[data-spiral-section]")) {
      const view = el.getAttribute("data-panel-view");
      const cover = el.querySelector("[data-panel-solid-cover]");
      const coverOp = cover ? Number(getComputedStyle(cover).opacity) : 0;
      const scroll = el.querySelector("[data-panel-scroll]");
      const filter = scroll ? getComputedStyle(scroll).filter || "none" : "none";
      const on = view === "blur" && !(coverOp > 0.95) && filter.includes("blur");
      if (on) liveBlur += 1;
      detail.push({ id: el.id, view, filter, coverOp });
    }
    return { liveBlur, detail };
  });

  const violations = rows.filter((r) => r.blurMax > 1);
  const zeroBlurSteps = rows.filter(
    (r) => r.label.includes("0->1") && r.blurMax === 0 && r.frames > 5,
  );

  console.log(
    JSON.stringify(
      {
        mode: software ? "software" : "default",
        postSpinMs: POST_SPIN_MS,
        idleBlur,
        rows,
        violations: violations.map((v) => v.label),
        zeroBlurSteps: zeroBlurSteps.map((v) => v.label),
      },
      null,
      2,
    ),
  );

  if (idleBlur.liveBlur !== 1) {
    console.error(`[invariant] idle blur count=${idleBlur.liveBlur}, expected 1`);
    process.exitCode = 1;
  }
  if (violations.length) {
    console.error(`[invariant] blurMax>1 in: ${violations.map((v) => v.label).join(", ")}`);
    process.exitCode = 1;
  }

  void summarize;
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
