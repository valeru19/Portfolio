/**
 * Spiral frame probe + blur invariant (step 18).
 * Usage: node scripts/measure-spiral-perf.mjs [baseUrl] [--software]
 *
 * Stops previous rAF before each scenario. Fails if max live blur layers ≠ 1
 * while a blur panel should exist, or if blur count is 0 when expected.
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const software = process.argv.includes("--software");

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

async function measure(page, label, action) {
  await stopRaf(page);
  await page.waitForTimeout(30);
  await page.evaluate(() => {
    window.__perfStop = false;
    window.__perf = { frames: [], blurMax: 0, blurSamples: 0 };
    let last = performance.now();
    const tick = (now) => {
      if (window.__perfStop) return;
      const d = now - last;
      last = now;
      if (d < 2000) window.__perf.frames.push(d);

      let liveBlur = 0;
      for (const el of document.querySelectorAll("[data-spiral-section]")) {
        const veil =
          el.querySelector("[data-panel-blur-veil]") || el.querySelector("[data-panel-blur-layer]");
        if (!veil) continue;
        const cs = getComputedStyle(veil);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        if (Number(cs.opacity) < 0.02) continue;
        const bf = cs.backdropFilter || cs.webkitBackdropFilter || "none";
        const filter = cs.filter || "none";
        if ((bf && bf !== "none") || (filter && filter !== "none" && filter.includes("blur"))) {
          liveBlur += 1;
        }
      }
      window.__perf.blurMax = Math.max(window.__perf.blurMax, liveBlur);
      window.__perf.blurSamples += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await action();
  await waitSpin(page, false);
  await page.waitForTimeout(80);
  return page.evaluate((lbl) => {
    window.__perfStop = true;
    const frames = (window.__perf.frames || []).filter((d) => d < 2000).slice(1);
    const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    return {
      label: lbl,
      frames: frames.length,
      avg: Number(avg.toFixed(2)),
      max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
      over33: frames.filter((d) => d > 33).length,
      over50: frames.filter((d) => d > 50).length,
      over100: frames.filter((d) => d > 100).length,
      blurMax: window.__perf.blurMax,
      blurSamples: window.__perf.blurSamples,
    };
  }, label);
}

async function goToIndex(page, index) {
  const dots = page.locator("[data-spiral-hud] button");
  await dots.nth(index).click();
  await waitSpin(page, true, 3000);
  await waitSpin(page, false, 8000);
}

async function clickTop(page) {
  const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
  if ((await link.count()) > 0) {
    await link.first().click({ force: true });
    return;
  }
  // Fallback: первая точка HUD = hero.
  await page.locator("[data-spiral-hud] button").first().click();
}

async function main() {
  console.log(`[measure] base=${base} software=${software}`);
  const browser = await chromium.launch({
    headless: true,
    args: software ? ["--disable-gpu", "--use-gl=swiftshader"] : [],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(12000);
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);

  const rows = [];

  for (let run = 0; run < 3; run += 1) {
    await goToIndex(page, 0);
    rows.push(
      await measure(page, `0->1 #${run + 1}`, async () => {
        await page.keyboard.press("ArrowDown");
        await waitSpin(page, true);
      }),
    );
    rows.push(
      await measure(page, `1->0 #${run + 1}`, async () => {
        await page.keyboard.press("ArrowUp");
        await waitSpin(page, true);
      }),
    );
  }

  for (let from = 1; from <= 6; from += 1) {
    await goToIndex(page, from);
    await page.waitForTimeout(120);
    rows.push(
      await measure(page, `Наверх from ${from}`, async () => {
        await clickTop(page);
        await waitSpin(page, true);
      }),
    );
  }

  await goToIndex(page, 0);
  rows.push(
    await measure(page, "0->last", async () => {
      await page.locator("[data-spiral-hud] button").last().click();
      await waitSpin(page, true);
    }),
  );

  // Idle blur invariant on section 0: expect exactly 1 blur
  const idleBlur = await page.evaluate(() => {
    let liveBlur = 0;
    const detail = [];
    for (const el of document.querySelectorAll("[data-spiral-section]")) {
      const view = el.getAttribute("data-panel-view");
      const veil = el.querySelector("[data-panel-blur-veil]");
      const cs = veil ? getComputedStyle(veil) : null;
      const bf = cs ? cs.backdropFilter || cs.webkitBackdropFilter || "none" : "none";
      const on = cs && cs.display !== "none" && Number(cs.opacity) > 0.02 && bf && bf !== "none";
      if (on) liveBlur += 1;
      detail.push({ id: el.id, view, bf, opacity: cs ? Number(cs.opacity) : 0 });
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

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
