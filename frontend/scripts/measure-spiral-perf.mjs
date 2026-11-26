/**
 * Chromium rAF probe for spiral flips (step 17).
 * Usage: node scripts/measure-spiral-perf.mjs [baseUrl] [--software]
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const software = process.argv.includes("--software");

async function waitSettled(page, timeout = 8000) {
  await page
    .waitForFunction(() => !document.body.classList.contains("is-spinning"), { timeout })
    .catch(() => {});
  await page.waitForTimeout(60);
}

async function waitSpinning(page, timeout = 2500) {
  await page
    .waitForFunction(() => document.body.classList.contains("is-spinning"), { timeout })
    .catch(() => {});
}

/** Jump to section index via HUD dots (fallback: ArrowDown spam). */
async function goToIndex(page, index) {
  const clicked = await page.evaluate((idx) => {
    const nav = document.querySelector("nav");
    if (!nav) return false;
    const links = Array.from(nav.querySelectorAll("a"));
    const el = links[idx];
    if (!el) return false;
    el.click();
    return true;
  }, index);
  if (clicked) {
    await waitSpinning(page, 3000);
    await waitSettled(page, 8000);
    return;
  }
  // Fallback: home then downs
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Home");
    await page.waitForTimeout(30);
  }
  await waitSettled(page, 4000);
  for (let i = 0; i < index; i++) {
    await page.keyboard.press("ArrowDown");
    await waitSpinning(page, 2000);
    await waitSettled(page, 4000);
  }
}

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
      /* optional */
    }
  });

  await action();
  await waitSettled(page);
  await page.waitForTimeout(80);

  return page.evaluate((lbl) => {
    window.__perfStop?.();
    window.__perfPo?.disconnect?.();
    const frames = window.__perf.frames.filter((d) => d < 2000).slice(1);
    const max = frames.length ? Math.max(...frames) : 0;
    const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    const longtasks = window.__perf.longtasks || [];
    return {
      label: lbl,
      frames: frames.length,
      avg: Number(avg.toFixed(2)),
      max: Number(max.toFixed(2)),
      over33: frames.filter((d) => d > 33).length,
      over50: frames.filter((d) => d > 50).length,
      over100: frames.filter((d) => d > 100).length,
      longtaskMax: longtasks.length ? Number(Math.max(...longtasks).toFixed(2)) : 0,
      longtaskCount: longtasks.length,
    };
  }, label);
}

async function sampleLayersMidNasp(page) {
  await goToIndex(page, 6);
  await page.waitForTimeout(200);
  const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
  await link.click({ force: true });
  await waitSpinning(page, 3000);
  await page.waitForTimeout(350);
  const sample = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("[data-section-id]"));
    let effectish = 0;
    const detail = [];
    for (const el of sections) {
      const veil = el.querySelector("[class*='panelBlurVeil']");
      const frost = el.querySelector("[class*='panelFrostFill']");
      const bake = el.querySelector("[data-panel-bake]");
      const veilOn =
        !!veil &&
        getComputedStyle(veil).display !== "none" &&
        Number(getComputedStyle(veil).opacity) > 0.01;
      const frostOn =
        !!frost &&
        getComputedStyle(frost).display !== "none" &&
        Number(getComputedStyle(frost).opacity) > 0.01;
      const filterOn = getComputedStyle(el).filter !== "none";
      const bakeOp =
        bake && getComputedStyle(bake).display !== "none"
          ? Number(getComputedStyle(bake).opacity)
          : 0;
      const fading = bakeOp > 0.02 && bakeOp < 0.98;
      if (veilOn || frostOn || filterOn || fading) effectish += 1;
      detail.push({
        id: el.getAttribute("data-section-id"),
        veilOn,
        frostOn,
        filterOn,
        bakeOp: Number(bakeOp.toFixed(2)),
        baked: el.hasAttribute("data-baked"),
        bakeVisible: el.hasAttribute("data-bake-visible"),
        blurTurn: el.getAttribute("data-blur-turn"),
      });
    }
    return {
      spinKind: document.body.dataset.spinKind || "",
      effectishPanels: effectish,
      detail,
    };
  });
  await waitSettled(page, 8000);
  return sample;
}

async function main() {
  console.log(`[measure] base=${base} software=${software}`);
  const browser = await chromium.launch({
    headless: true,
    args: software ? ["--disable-gpu", "--use-gl=swiftshader"] : [],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(10000);
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  console.log("[measure] page ready");

  const rows = [];

  rows.push(
    await measure(page, "0->1", async () => {
      await page.keyboard.press("ArrowDown");
      await waitSpinning(page);
    }),
  );
  console.log("[measure]", rows.at(-1));

  rows.push(
    await measure(page, "1->2", async () => {
      await page.keyboard.press("ArrowDown");
      await waitSpinning(page);
    }),
  );
  console.log("[measure]", rows.at(-1));

  rows.push(
    await measure(page, "1<-2", async () => {
      await page.keyboard.press("ArrowUp");
      await waitSpinning(page);
    }),
  );
  console.log("[measure]", rows.at(-1));

  for (let from = 1; from <= 6; from += 1) {
    await goToIndex(page, from);
    await page.waitForTimeout(150);
    rows.push(
      await measure(page, `Наверх from ${from}`, async () => {
        await page.getByRole("link", { name: /Наверх|Back to top|Top/i }).click({ force: true });
        await waitSpinning(page);
      }),
    );
    console.log("[measure]", rows.at(-1));
  }

  const layers = await sampleLayersMidNasp(page);
  console.log("[measure] layers mid-nasp", JSON.stringify(layers, null, 2));

  const modeBtn = page.getByRole("button", {
    name: /Обычный скролл|Спираль|Normal scroll|Spiral/i,
  });
  rows.push(
    await measure(page, "mode toggle", async () => {
      if (await modeBtn.count()) {
        await modeBtn.first().click();
        await page.waitForTimeout(350);
        await modeBtn.first().click();
      }
    }),
  );
  console.log("[measure]", rows.at(-1));

  const bakeKb = await page.evaluate(() => {
    let bytes = 0;
    for (const img of document.querySelectorAll("[data-panel-bake]")) {
      const src = img.getAttribute("src") || "";
      if (src.startsWith("data:")) bytes += Math.round((src.length * 3) / 4);
    }
    return Math.round(bytes / 1024);
  });

  console.log(
    JSON.stringify(
      {
        mode: software ? "software" : "default",
        bakeTexturesKbApprox: bakeKb,
        effectLayersMidSample: layers,
        rows,
      },
      null,
      2,
    ),
  );
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
