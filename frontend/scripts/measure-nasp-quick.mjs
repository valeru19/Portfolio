import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";

async function waitSpin(page, on, timeout = 6000) {
  await page
    .waitForFunction(
      (want) => document.body.classList.contains("is-spinning") === want,
      on,
      { timeout },
    )
    .catch(() => {});
}

async function measureSpin(page, label, start) {
  await page.evaluate(() => {
    window.__perf = { frames: [] };
    let last = performance.now();
    let armed = false;
    window.__perfArm = () => {
      armed = true;
      last = performance.now();
    };
    window.__perfStop = false;
    const tick = (now) => {
      if (window.__perfStop) return;
      if (armed) window.__perf.frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await start();
  await page.evaluate(() => window.__perfArm?.());
  await waitSpin(page, true, 3000);
  await waitSpin(page, false, 8000);
  await page.waitForTimeout(40);
  return page.evaluate((lbl) => {
    window.__perfStop = true;
    const frames = (window.__perf.frames || []).filter((d) => d < 2000);
    const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    return {
      label: lbl,
      frames: frames.length,
      avg: Number(avg.toFixed(2)),
      max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
      over33: frames.filter((d) => d > 33).length,
      over50: frames.filter((d) => d > 50).length,
      over100: frames.filter((d) => d > 100).length,
    };
  }, label);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);

const rows = [];
console.log("start");

rows.push(
  await measureSpin(page, "0->1", async () => {
    await page.keyboard.press("ArrowDown");
  }),
);
console.log(rows.at(-1));

rows.push(
  await measureSpin(page, "1->2", async () => {
    await page.keyboard.press("ArrowDown");
  }),
);
console.log(rows.at(-1));

// Climb to last (contacts = index 6): 4 more downs from index 2
for (let i = 0; i < 4; i += 1) {
  await page.keyboard.press("ArrowDown");
  await waitSpin(page, true, 2500);
  await waitSpin(page, false, 5000);
}

const active = await page.evaluate(
  () => document.querySelector("[data-spiral-section][data-active]")?.id,
);
console.log("active before nasp", active);

rows.push(
  await measureSpin(page, "Наверх from last", async () => {
    await page.getByRole("link", { name: /Наверх|Back to top|Top/i }).click({ force: true });
  }),
);
console.log(rows.at(-1));

// From mid sections: about(1), experience(3), education(5)
const jumps = [
  { downs: 1, label: "Наверх from 1" },
  { downs: 3, label: "Наверх from 3" },
  { downs: 5, label: "Наверх from 5" },
];
for (const jump of jumps) {
  for (let i = 0; i < jump.downs; i += 1) {
    await page.keyboard.press("ArrowDown");
    await waitSpin(page, true, 2500);
    await waitSpin(page, false, 5000);
  }
  rows.push(
    await measureSpin(page, jump.label, async () => {
      await page.getByRole("link", { name: /Наверх|Back to top|Top/i }).click({ force: true });
    }),
  );
  console.log(rows.at(-1));
}

const bakeKb = await page.evaluate(() => {
  let bytes = 0;
  for (const img of document.querySelectorAll("[data-panel-bake]")) {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("data:")) bytes += Math.round((src.length * 3) / 4);
  }
  return Math.round(bytes / 1024);
});

console.log(JSON.stringify({ bakeTexturesKbApprox: bakeKb, rows }, null, 2));
await browser.close();
