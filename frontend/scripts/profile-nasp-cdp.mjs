/**
 * DevTools Performance trace для «Наверх» (wrap): длинные кадры + Raster/Layout/GPU.
 * Usage: node scripts/profile-nasp-cdp.mjs [baseUrl] [--from=7] [--out=scripts/nasp-trace.json]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4210/Portfolio/";
const fromArg = Number(
  (process.argv.find((a) => a.startsWith("--from=")) || "--from=7").split("=")[1],
);
const outArg =
  (process.argv.find((a) => a.startsWith("--out=")) || "--out=scripts/nasp-trace.json").split(
    "=",
  )[1] || "scripts/nasp-trace.json";

async function waitSpin(page, on, timeout = 30000) {
  await page.waitForFunction(
    (want) => document.body.classList.contains("is-spinning") === want,
    on,
    { timeout },
  );
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--disable-gpu", "--use-gl=swiftshader"],
  });
  const context = await browser.newContext({ viewport: { width: 1912, height: 1000 } });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  await client.send("Performance.enable");
  await client.send("Overlay.setShowFPSCounter", { show: false });

  const url = base.endsWith("/") ? `${base}#contacts` : `${base}/#contacts`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("[data-spiral-root]", { timeout: 20000 });
  await page.waitForTimeout(1200);

  const lastIdx = await page.evaluate(() => {
    const n = document.querySelectorAll("nav[data-spiral-hud] button").length;
    return Math.max(0, n - 1);
  });
  const from = Math.min(lastIdx, Math.max(0, fromArg - 1));
  if (from !== lastIdx) {
    await page.locator("nav[data-spiral-hud] button").nth(from).click();
    await waitSpin(page, true, 8000).catch(() => {});
    await waitSpin(page, false, 60000);
    await page.waitForTimeout(600);
  }

  await client.send("Tracing.start", {
    categories: [
      "devtools.timeline",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.frame",
      "disabled-by-default-devtools.timeline.stack",
      "disabled-by-default-v8.cpu_profiler",
      "disabled-by-default-devtools.screenshot",
      "blink.user_timing",
      "loading",
      "blink",
      "cc",
      "gpu",
      "rail",
    ].join(","),
    options: "sampling-frequency=10000",
  });

  const frames = [];
  await page.evaluate(() => {
    window.__naspFrames = [];
    let last = performance.now();
    const tick = (t) => {
      window.__naspFrames.push(t - last);
      last = t;
      if (document.body.classList.contains("is-spinning") || window.__naspFrames.length < 8) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

  const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
  if ((await link.count()) > 0) await link.first().click({ force: true });
  else await page.locator("nav[data-spiral-hud] button").first().click();

  await waitSpin(page, true, 8000);
  await waitSpin(page, false, 60000);
  await page.waitForTimeout(400);

  frames.push(...(await page.evaluate(() => window.__naspFrames || [])));

  const traceEvents = [];
  client.on("Tracing.dataCollected", (params) => {
    if (params.value) traceEvents.push(...params.value);
  });
  const done = new Promise((resolve) => {
    client.on("Tracing.tracingComplete", resolve);
  });
  await client.send("Tracing.end");
  await done;

  const longFrames = frames
    .map((d, i) => ({ i, d: Number(d.toFixed(1)) }))
    .filter((x) => x.d > 50)
    .sort((a, b) => b.d - a.d);

  const byName = new Map();
  for (const e of traceEvents) {
    if (!e || e.ph !== "X") continue;
    const dur = e.dur || 0;
    if (dur < 5000) continue; // µs
    const name = e.name || "?";
    const cur = byName.get(name) || { name, count: 0, maxUs: 0, sumUs: 0 };
    cur.count += 1;
    cur.maxUs = Math.max(cur.maxUs, dur);
    cur.sumUs += dur;
    byName.set(name, cur);
  }
  const topEvents = [...byName.values()].sort((a, b) => b.maxUs - a.maxUs).slice(0, 25);

  const layerTree = [];
  for (const e of traceEvents) {
    if (!e) continue;
    if (
      e.name === "UpdateLayer" ||
      e.name === "Paint" ||
      e.name === "RasterTask" ||
      e.name === "LayerTreeHost::UpdateLayers"
    ) {
      if ((e.dur || 0) >= 8000) {
        layerTree.push({
          name: e.name,
          durMs: Number(((e.dur || 0) / 1000).toFixed(1)),
          cat: e.cat,
          args: e.args,
        });
      }
    }
  }
  layerTree.sort((a, b) => b.durMs - a.durMs);

  const report = {
    createdAt: new Date().toISOString(),
    base,
    from1Based: fromArg,
    viewport: "1912x1000",
    software: true,
    frameMaxMs: frames.length ? Math.max(...frames) : null,
    frameOver100: frames.filter((d) => d > 100).length,
    longFrames: longFrames.slice(0, 20),
    topTraceEventsMs: topEvents.map((e) => ({
      name: e.name,
      count: e.count,
      maxMs: Number((e.maxUs / 1000).toFixed(1)),
      sumMs: Number((e.sumUs / 1000).toFixed(1)),
    })),
    heavyPaintRaster: layerTree.slice(0, 30),
    eventCount: traceEvents.length,
  };

  const outPath = path.resolve(outArg);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(outPath.replace(/\.json$/i, "-raw.json"), JSON.stringify(traceEvents));
  console.log(JSON.stringify(report, null, 2));
  console.log(`[profile] wrote ${outPath}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
