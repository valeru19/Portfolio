/**
 * Chromium tracing for «Наверх»: worst frames + event kinds.
 * Usage: node scripts/trace-nasp.mjs [baseUrl]
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const outPath = join(process.cwd(), "scripts", "nasp-trace.json");

function summarizeTrace(traceJson) {
  const events = traceJson.traceEvents || [];
  const frames = [];
  let frameStart = null;
  let bucket = [];

  const interesting = new Set([
    "UpdateLayoutTree",
    "Layout",
    "Paint",
    "PaintImage",
    "RasterTask",
    "ImageDecodeTask",
    "DecodeImage",
    "Commit",
    "LayerTreeHostImpl::BeginCommit",
    "FunctionCall",
    "EvaluateScript",
    "v8.callFunction",
    "HitTest",
    "PrePaint",
    "ScrollLayer",
  ]);

  for (const e of events) {
    if (e.name === "DrawFrame" || e.name === "BeginFrame") {
      if (frameStart != null && bucket.length) {
        const dur = (e.ts - frameStart) / 1000;
        frames.push({ start: frameStart, dur, events: bucket });
      }
      frameStart = e.ts;
      bucket = [];
      continue;
    }
    if (frameStart == null) continue;
    if (e.ph === "X" || e.ph === "B" || e.ph === "I") {
      const name = e.name || "";
      if (interesting.has(name) || name.includes("Raster") || name.includes("Decode")) {
        bucket.push({
          name,
          dur: e.dur ? e.dur / 1000 : 0,
          cat: e.cat,
        });
      }
    }
  }

  const heavy = frames
    .filter((f) => f.dur > 50)
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 8);

  const rows = heavy.map((f, i) => {
    const byName = new Map();
    for (const ev of f.events) {
      const prev = byName.get(ev.name) || { count: 0, ms: 0 };
      prev.count += 1;
      prev.ms += ev.dur;
      byName.set(ev.name, prev);
    }
    const top = [...byName.entries()]
      .sort((a, b) => b[1].ms - a[1].ms)
      .slice(0, 6)
      .map(([name, v]) => `${name}×${v.count}(${v.ms.toFixed(1)}ms)`)
      .join("; ");
    return {
      rank: i + 1,
      frameMs: Number(f.dur.toFixed(1)),
      raster: f.events.filter((e) => e.name.includes("Raster")).length,
      decode: f.events.filter((e) => /Decode|ImageDecode/i.test(e.name)).length,
      layout: f.events.filter((e) => e.name === "Layout" || e.name === "UpdateLayoutTree").length,
      paint: f.events.filter((e) => e.name === "Paint" || e.name === "PrePaint").length,
      top,
    };
  });

  let rasterTotal = 0;
  let decodeTotal = 0;
  for (const f of frames) {
    rasterTotal += f.events.filter((e) => e.name.includes("Raster")).length;
    decodeTotal += f.events.filter((e) => /Decode|ImageDecode/i.test(e.name)).length;
  }

  return {
    frameCount: frames.length,
    heavyCount: frames.filter((f) => f.dur > 50).length,
    over100: frames.filter((f) => f.dur > 100).length,
    rasterTotal,
    decodeTotal,
    worst: rows,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(70);
  }
  await page.waitForTimeout(1600);

  await context.tracing.start({
    screenshots: false,
    snapshots: false,
    sources: false,
  });
  // Playwright tracing != CDP; use CDP for chronium categories.
  const client = await context.newCDPSession(page);
  await client.send("Tracing.start", {
    categories:
      "-*,devtools.timeline,disabled-by-default-devtools.timeline,cc,blink,v8.execute,disabled-by-default-v8.cpu_profiler",
    options: "sampling-frequency=10000",
  });

  const chunks = [];
  client.on("Tracing.dataCollected", (params) => {
    chunks.push(...params.value);
  });
  const done = new Promise((resolve) => {
    client.on("Tracing.tracingComplete", resolve);
  });

  await page.getByRole("link", { name: /Наверх|Top/i }).click({ force: true });
  await page
    .waitForFunction(() => !document.body.classList.contains("is-spinning"), {
      timeout: 6000,
    })
    .catch(() => {});
  await page.waitForTimeout(400);

  await client.send("Tracing.end");
  await done;
  await context.tracing
    .stop({ path: join(process.cwd(), "scripts", "nasp-playwright.zip") })
    .catch(() => {});

  const trace = { traceEvents: chunks };
  writeFileSync(outPath, JSON.stringify(trace));
  const summary = summarizeTrace(trace);
  console.log(JSON.stringify(summary, null, 2));
  console.log("trace bytes", Buffer.byteLength(JSON.stringify(trace)));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
