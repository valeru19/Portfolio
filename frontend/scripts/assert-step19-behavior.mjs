/**
 * Приёмка поведения 4.1 (Chromium). Usage:
 * node scripts/assert-step19-behavior.mjs [baseUrl]
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
      const cover =
        el.querySelector("[data-panel-solid-cover]") || el.querySelector("[data-panel-frost-fill]");
      const veil = el.querySelector("[data-panel-blur-veil]");
      const scroll = el.querySelector("[data-panel-scroll]");
      const csV = veil ? getComputedStyle(veil) : null;
      const coverOp = cover ? Number(getComputedStyle(cover).opacity) : 0;
      const bf = csV ? csV.backdropFilter || csV.webkitBackdropFilter || "none" : "none";
      const liveBlur =
        !(coverOp > 0.95) &&
        csV &&
        csV.display !== "none" &&
        Number(csV.opacity) > 0.02 &&
        bf &&
        bf !== "none";
      return {
        view: el.getAttribute("data-panel-view"),
        cover: coverOp,
        veil: csV ? Number(csV.opacity) : 0,
        cv: scroll ? getComputedStyle(scroll).contentVisibility : "",
        liveBlur: Boolean(liveBlur),
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
  await page.locator("[data-spiral-hud] button").nth(index).click();
  await waitSpin(page, true, 3000);
  await waitSpin(page, false, 8000);
  await page.waitForTimeout(700);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);

  // Idle for each activeIndex
  for (let i = 0; i < 7; i += 1) {
    await go(page, i);
    const snap = await sample(page);
    if (!snap.length) fail(`idle ${i}: no panels`);
    const sharp = snap.filter((p) => p.view === "sharp").length;
    const blur = snap.filter((p) => p.view === "blur").length;
    const expectBlur = i < 6 ? 1 : 0;
    if (sharp !== 1) fail(`idle ${i}: sharp=${sharp}`);
    if (blur !== expectBlur) fail(`idle ${i}: blur=${blur} expect ${expectBlur}`);
    snap.forEach((p, idx) => {
      if (p.view === "solid" && p.cv !== "hidden") fail(`idle ${i} panel ${idx}: solid cv=${p.cv}`);
    });
  }

  // Back: cover of from stays 0; veil rises
  await go(page, 1);
  const backP = record(page, 1400);
  await page.keyboard.press("ArrowUp");
  await waitSpin(page, true);
  const back = await backP;
  await waitSpin(page, false);
  const spinningBack = [];
  // crude: take middle third
  const mid = back.slice(Math.floor(back.length * 0.15), Math.floor(back.length * 0.7));
  for (const frame of mid) {
    const live = frame.filter((p) => p.liveBlur).length;
    if (live > 1) fail(`back: liveBlur=${live}`);
    if (frame[1] && frame[1].cover > 0.02) fail(`back: from cover=${frame[1].cover}`);
  }
  const veils = mid.map((f) => (f[1] ? f[1].veil : 0));
  for (let i = 1; i < veils.length; i += 1) {
    if (veils[i] + 0.08 < veils[i - 1]) fail(`back: veil not mono ${veils[i - 1]}→${veils[i]}`);
  }

  // Forward: i+2 cover eventually 1→0 during/after turn; liveBlur≤1
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
  const covers = fwd.map((f) => (f[2] ? f[2].cover : 1));
  if (Math.min(...covers) > 0.2) fail("forward: i+2 cover never opened");

  // Hover
  await go(page, 0);
  const hover = [];
  const blurPanel = page.locator('[data-spiral-section][data-panel-view="blur"]').first();
  for (let i = 0; i < 20; i += 1) hover.push((await sample(page))[1].veil);
  await blurPanel.hover({ force: true });
  for (let i = 0; i < 30; i += 1) {
    hover.push((await sample(page))[1].veil);
    await page.waitForTimeout(16);
  }
  if (!(hover.some((v) => v < 0.2) && hover[0] > 0.8)) fail(`hover: veil path ${hover.slice(0, 10)}`);

  // Наверх: only 0,1,+start content; 0/1 ready before spin; land no new enables
  await go(page, 6);
  let preSpin = null;
  const naspSamples = [];
  const naspLoop = (async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 3800) {
      const s = await sample(page);
      const spinning = await page.evaluate(() => document.body.classList.contains("is-spinning"));
      naspSamples.push({ spinning, s });
      if (spinning && !preSpin) {
        // previous sample is last pre
      }
      await page.waitForTimeout(16);
    }
  })();
  await page.waitForTimeout(40);
  const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
  if ((await link.count()) > 0) await link.first().click({ force: true });
  else await page.locator("[data-spiral-hud] button").first().click();
  await naspLoop;
  const firstSpinIdx = naspSamples.findIndex((x) => x.spinning);
  if (firstSpinIdx > 0) {
    preSpin = naspSamples[firstSpinIdx - 1].s;
    const p0 = preSpin[0];
    const p1 = preSpin[1];
    if (!(p0.view === "sharp" || p0.cover > 0.9)) fail(`nasp pre0 view=${p0.view} cover=${p0.cover}`);
    if (!(p1.view === "blur" || p1.cover > 0.9)) fail(`nasp pre1 view=${p1.view} cover=${p1.cover}`);
  } else fail("nasp: no spin samples");

  const after = naspSamples.filter((x) => !x.spinning).slice(-5);
  for (const a of after) {
    if (a.s[0].view !== "sharp" || a.s[1].view !== "blur") {
      fail(`nasp land views ${a.s[0].view}/${a.s[1].view}`);
      break;
    }
  }

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
