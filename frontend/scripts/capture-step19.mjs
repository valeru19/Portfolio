/**
 * Покадровая выборка видов панелей (step 19).
 * Usage: node scripts/capture-step19.mjs [baseUrl] [outDir]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const outDir = process.argv[3] || path.join("scripts", "shots-step19");

async function waitSpin(page, on, timeout = 8000) {
  await page
    .waitForFunction((want) => document.body.classList.contains("is-spinning") === want, on, {
      timeout,
    })
    .catch(() => {});
}

async function sampleViews(page) {
  return page.evaluate(() => {
    const rows = [];
    for (const el of document.querySelectorAll("[data-spiral-section]")) {
      const cover =
        el.querySelector("[data-panel-solid-cover]") || el.querySelector("[data-panel-frost-fill]");
      const veil = el.querySelector("[data-panel-blur-veil]");
      const scroll = el.querySelector("[data-panel-scroll]");
      rows.push({
        id: el.id,
        view: el.getAttribute("data-panel-view"),
        cover: cover ? Number(getComputedStyle(cover).opacity) : null,
        veil: veil ? Number(getComputedStyle(veil).opacity) : null,
        veilDisplay: veil ? getComputedStyle(veil).display : null,
        cv: scroll ? getComputedStyle(scroll).contentVisibility : null,
      });
    }
    return {
      t: performance.now(),
      spinning: document.body.classList.contains("is-spinning"),
      rows,
    };
  });
}

async function recordScenario(page, name, action, ms = 2200) {
  const samples = [];
  let stop = false;
  const loop = (async () => {
    while (!stop) {
      samples.push(await sampleViews(page));
      await page.waitForTimeout(16);
    }
  })();
  await action();
  await page.waitForTimeout(ms);
  stop = true;
  await loop;
  const file = path.join(outDir, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(samples, null, 2));
  console.log(`[capture] ${name}: ${samples.length} samples → ${file}`);
  return samples;
}

async function goTo(page, index) {
  await page.locator("[data-spiral-hud] button").nth(index).click();
  await waitSpin(page, true, 3000);
  await waitSpin(page, false, 8000);
  await page.waitForTimeout(600);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);

  await goTo(page, 0);
  await recordScenario(page, "forward-0-1", async () => {
    await page.keyboard.press("ArrowDown");
  });

  await goTo(page, 1);
  await recordScenario(
    page,
    "back-1-0",
    async () => {
      await page.keyboard.press("ArrowUp");
    },
    1800,
  );

  await goTo(page, 0);
  // Hover next blur panel
  await recordScenario(
    page,
    "hover-blur",
    async () => {
      const next = page.locator('[data-spiral-section][data-panel-view="blur"]').first();
      await next.hover({ force: true });
      await page.waitForTimeout(500);
      await page.mouse.move(10, 10);
    },
    1400,
  );

  await goTo(page, 6);
  await recordScenario(
    page,
    "nasp-from-6",
    async () => {
      const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
      if ((await link.count()) > 0) await link.first().click({ force: true });
      else await page.locator("[data-spiral-hud] button").first().click();
    },
    4000,
  );

  await goTo(page, 2);
  await recordScenario(
    page,
    "interrupt-down-up",
    async () => {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(120);
      await page.keyboard.press("ArrowUp");
    },
    2000,
  );

  await browser.close();
  console.log("[capture] done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
