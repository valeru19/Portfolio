/**
 * Приёмка спирали (Chromium). Usage:
 * node scripts/assert-spiral-behavior.mjs [baseUrl]
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
let failed = 0;

function fail(msg) {
  console.error("[FAIL]", msg);
  failed += 1;
}

async function waitSpin(page, on, timeout = 8000) {
  await page
    .waitForFunction((want) => document.body.classList.contains("is-spinning") === want, on, {
      timeout,
    })
    .catch(() => {});
}

async function sample(page) {
  return page.evaluate(() => {
    const panels = [...document.querySelectorAll("[data-spiral-section]")];
    if (!panels.length) throw new Error("no panels");
    return panels.map((el) => {
      const cover = el.querySelector("[data-panel-solid-cover]");
      const veil = el.querySelector("[data-panel-blur-veil]");
      const scroll = el.querySelector("[data-panel-scroll]");
      const coverOp = cover ? Number(getComputedStyle(cover).opacity) : 0;
      const csV = veil ? getComputedStyle(veil) : null;
      const csS = scroll ? getComputedStyle(scroll) : null;
      const filter = csS?.filter || "none";
      const view = el.getAttribute("data-panel-view");
      const liveBlur =
        view === "blur" &&
        !(coverOp > 0.95) &&
        filter.includes("blur") &&
        Number(csV?.opacity ?? 1) > 0.02;
      return {
        id: el.id,
        view,
        cover: coverOp,
        veil: csV ? Number(csV.opacity) : 0,
        cv: scroll ? getComputedStyle(scroll).contentVisibility : "",
        filter,
        liveBlur: Boolean(liveBlur),
        active: el.hasAttribute("data-active"),
      };
    });
  });
}

async function record(page, ms = 1600) {
  const out = [];
  const start = Date.now();
  while (Date.now() - start < ms) {
    out.push(await sample(page));
    await page.waitForTimeout(16);
  }
  return out;
}

async function go(page, index) {
  await page.locator("nav[data-spiral-hud] button").nth(index).click();
  await waitSpin(page, true, 3000);
  await waitSpin(page, false, 8000);
  await page.waitForTimeout(700);
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);

  const panelCount = await page.locator("[data-spiral-section]").count();
  const last = Math.max(0, panelCount - 1);

  for (let i = 0; i < panelCount; i += 1) {
    await go(page, i);
    const snap = await sample(page);
    const sharp = snap.filter((p) => p.view === "sharp").length;
    const blur = snap.filter((p) => p.view === "blur").length;
    const live = snap.filter((p) => p.liveBlur).length;
    const expectBlur = i < last ? 1 : 0;
    if (sharp !== 1) fail(`idle ${i}: sharp=${sharp}`);
    if (blur !== expectBlur) fail(`idle ${i}: blur=${blur} expect ${expectBlur}`);
    if (live !== expectBlur) fail(`idle ${i}: liveBlur=${live} expect ${expectBlur}`);
    if (!snap.some((p) => p.active && p.view === "sharp")) fail(`idle ${i}: active not sharp`);
    snap.forEach((p, idx) => {
      if (p.view === "solid" && p.cv !== "hidden") fail(`idle ${i} panel ${idx}: solid cv=${p.cv}`);
    });
  }

  await go(page, 1);
  const backP = record(page, 1400);
  await page.keyboard.press("ArrowUp");
  await waitSpin(page, true);
  const back = await backP;
  await waitSpin(page, false);
  const mid = back.slice(Math.floor(back.length * 0.15), Math.floor(back.length * 0.7));
  for (const frame of mid) {
    const live = frame.filter((p) => p.liveBlur).length;
    if (live > 1) fail(`back: liveBlur=${live}`);
  }

  await go(page, 0);
  const fwdP = record(page, 1800);
  await page.keyboard.press("ArrowDown");
  await waitSpin(page, true);
  const fwd = await fwdP;
  await waitSpin(page, false);
  await page.waitForTimeout(600);
  for (const frame of fwd) {
    const live = frame.filter((p) => p.liveBlur).length;
    if (live > 1) fail(`forward: liveBlur=${live}`);
  }

  // Пружина на последней: виды/hash не меняются, transform двигается.
  await go(page, last);
  const before = await page.evaluate(() => {
    const spiral = document.querySelector("[data-spiral-root]");
    return {
      hash: location.hash,
      views: [...document.querySelectorAll("[data-spiral-section]")].map((el) =>
        el.getAttribute("data-panel-view"),
      ),
      tf: spiral ? getComputedStyle(spiral).transform : "",
    };
  });
  const midSpring = page.waitForTimeout(160).then(() =>
    page.evaluate(() => {
      const spiral = document.querySelector("[data-spiral-root]");
      return {
        views: [...document.querySelectorAll("[data-spiral-section]")].map((el) =>
          el.getAttribute("data-panel-view"),
        ),
        hash: location.hash,
        tf: spiral ? getComputedStyle(spiral).transform : "",
        spinning: document.body.classList.contains("is-spinning"),
      };
    }),
  );
  await page.keyboard.press("ArrowDown");
  const midS = await midSpring;
  await page.waitForTimeout(650);
  const after = await page.evaluate(() => ({
    hash: location.hash,
    views: [...document.querySelectorAll("[data-spiral-section]")].map((el) =>
      el.getAttribute("data-panel-view"),
    ),
    spinning: document.body.classList.contains("is-spinning"),
  }));
  if (JSON.stringify(before.views) !== JSON.stringify(after.views)) fail("spring: views changed");
  if (before.hash !== after.hash) fail("spring: hash changed");
  if (after.spinning) fail("spring: left is-spinning");
  if (midS.spinning) fail("spring: set is-spinning");
  if (JSON.stringify(midS.views) !== JSON.stringify(before.views))
    fail("spring mid: views changed");
  if (!(midS.tf && midS.tf !== before.tf)) fail("spring: transform did not move");

  await go(page, last);
  const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
  if ((await link.count()) > 0) await link.first().click({ force: true });
  else await page.locator("nav[data-spiral-hud] button").first().click();
  await waitSpin(page, true, 4000);
  await waitSpin(page, false, 12000);
  await page.waitForTimeout(900);
  const land = await sample(page);
  if (land[0]?.view !== "sharp" || land[1]?.view !== "blur") {
    fail(`nasp land views ${land[0]?.view}/${land[1]?.view}`);
  }
  const liveLand = land.filter((p) => p.liveBlur).length;
  if (liveLand !== 1) fail(`nasp land liveBlur=${liveLand}`);
  if (!land.some((p) => p.active && p.view === "sharp")) fail("nasp land: active not sharp");

  await browser.close();
  if (failed) {
    console.error(`[assert] ${failed} failures`);
    process.exit(1);
  }
  console.log("[assert] ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
