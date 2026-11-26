/**
 * Chromium rAF + longtask probe for spiral flips (step 14).
 * Usage: node scripts/measure-spiral-perf.mjs [baseUrl]
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";

async function measure(page, label, action) {
  await page.evaluate(() => {
    window.__perf = { frames: [], longtasks: [] };
    const frames = window.__perf.frames;
    let last = performance.now();
    let running = true;
    window.__perfStop = () => {
      running = false;
    };
    const tick = (now) => {
      if (!running) return;
      frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__perf.longtasks.push(e.duration);
        }
      });
      po.observe({ entryTypes: ["longtask"] });
      window.__perfPo = po;
    } catch {
      /* longtask may be unavailable */
    }
  });

  await action();
  await page.waitForFunction(() => !document.body.classList.contains("is-spinning"), {
    timeout: 5000,
  }).catch(() => {});
  await page.waitForTimeout(120);
  const stats = await page.evaluate(() => {
    window.__perfStop?.();
    window.__perfPo?.disconnect?.();
    const frames = window.__perf.frames.filter((d) => d < 2000).slice(1);
    const max = frames.length ? Math.max(...frames) : 0;
    const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    const over50 = frames.filter((d) => d > 50).length;
    const over100 = frames.filter((d) => d > 100).length;
    const longtasks = window.__perf.longtasks || [];
    return {
      frames: frames.length,
      avg: Number(avg.toFixed(2)),
      max: Number(max.toFixed(2)),
      over50,
      over100,
      longtaskMax: longtasks.length ? Number(Math.max(...longtasks).toFixed(2)) : 0,
      longtaskCount: longtasks.length,
    };
  });
  return { label, ...stats };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Prefer keyboard: reliable across locales / HUD markup.
  const rows = [];

  rows.push(
    await measure(page, "0->1", async () => {
      await page.keyboard.press("ArrowDown");
    }),
  );

  rows.push(
    await measure(page, "1->0", async () => {
      await page.keyboard.press("ArrowUp");
    }),
  );

  rows.push(
    await measure(page, "0->last", async () => {
      // Jump via last HUD/dot or repeated downs capped by timeout.
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(1600);
    }),
  );

  rows.push(
    await measure(page, "Наверх", async () => {
      await page.getByRole("link", { name: /Наверх|Back to top|Top/i }).click({ force: true });
    }),
  );

  const modeBtn = page.getByRole("button", { name: /Обычный скролл|Спираль|Normal scroll|Spiral/i });
  rows.push(
    await measure(page, "mode toggle", async () => {
      if (await modeBtn.count()) {
        await modeBtn.first().click();
        await page.waitForTimeout(400);
        await modeBtn.first().click();
      }
    }),
  );

  console.log(JSON.stringify(rows, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
