/**
 * Честный замер кадров спирали (шаг 22).
 *
 * Usage:
 *   node scripts/measure-spiral-perf.mjs [baseUrl] [options]
 *
 * Options:
 *   --software          Chromium software GL
 *   --mode=frames|invariants|all   (default all; frames без getComputedStyle)
 *   --viewport=1440x900,1912x1000
 *   --cpu=1,4
 *   --runs=5
 *   --out=scripts/perf-baseline.json
 *   --hash=none,contacts,about   загрузка: / | #contacts | #about
 *
 * Таймаут waitSpin — провал прогона. Кадры >2000 мс НЕ отбрасываются.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const baseArg = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:4173/Portfolio/";
const software = args.includes("--software");
const modeArg = (args.find((a) => a.startsWith("--mode=")) || "--mode=all").slice(7);
const viewportArg = (
  args.find((a) => a.startsWith("--viewport=")) || "--viewport=1440x900,1912x1000"
).slice(11);
const cpuArg = (args.find((a) => a.startsWith("--cpu=")) || "--cpu=1,4").slice(6);
const runsArg = Number((args.find((a) => a.startsWith("--runs=")) || "--runs=5").slice(7));
const outArg = (
  args.find((a) => a.startsWith("--out=")) || "--out=scripts/perf-baseline.json"
).slice(6);
const hashArg = (args.find((a) => a.startsWith("--hash=")) || "--hash=none,contacts,about").slice(
  7,
);

const POST_SPIN_MS = 480 + 500;
const SPIN_ON_MS = 8000;
const SPIN_OFF_MS = 60000;
const RUNS = Number.isFinite(runsArg) && runsArg > 0 ? runsArg : 5;

function parseViewports(s) {
  return s.split(",").map((p) => {
    const [w, h] = p.split("x").map(Number);
    if (!w || !h) throw new Error(`bad viewport: ${p}`);
    return { width: w, height: h, label: `${w}x${h}` };
  });
}

function parseCpus(s) {
  return s.split(",").map((x) => {
    const n = Number(x);
    if (![1, 4].includes(n)) throw new Error(`bad cpu: ${x}`);
    return n;
  });
}

function parseHashes(s) {
  return s.split(",").map((h) => {
    if (h === "none" || h === "") return { key: "none", path: "" };
    if (h.startsWith("#")) return { key: h.slice(1), path: h };
    return { key: h, path: `#${h}` };
  });
}

const viewports = parseViewports(viewportArg);
const cpus = parseCpus(cpuArg);
const hashes = parseHashes(hashArg);
const modes =
  modeArg === "all"
    ? ["frames", "invariants"]
    : modeArg === "frames" || modeArg === "invariants"
      ? [modeArg]
      : null;
if (!modes) throw new Error(`bad --mode=${modeArg}`);

function summarize(frames, label, extra = {}) {
  const clean = frames.slice(1);
  const avg = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
  const sorted = [...clean].sort((a, b) => a - b);
  const p95 = sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
    : 0;
  return {
    label,
    frames: clean.length,
    avg: Number(avg.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    max: clean.length ? Number(Math.max(...clean).toFixed(2)) : 0,
    over50: clean.filter((d) => d > 50).length,
    over100: clean.filter((d) => d > 100).length,
    over2000: clean.filter((d) => d > 2000).length,
    ...extra,
  };
}

async function waitSpin(page, on, timeout, label) {
  try {
    await page.waitForFunction(
      (want) => document.body.classList.contains("is-spinning") === want,
      on,
      { timeout },
    );
  } catch {
    throw new Error(
      `[timeout] waitSpin(${on}) ${timeout}ms label=${label || "?"} — прогон провален`,
    );
  }
}

async function stopRaf(page) {
  await page.evaluate(() => {
    window.__perfStop = true;
  });
}

async function startFrameProbe(page, withInvariants) {
  await page.evaluate((wantInv) => {
    window.__perfStop = false;
    window.__perf = {
      frames: [],
      blurMax: 0,
      blurSamples: 0,
      clickAt: 0,
      spinStartAt: 0,
      withInvariants: wantInv,
    };
    let last = performance.now();
    const tick = (now) => {
      if (window.__perfStop) return;
      const d = now - last;
      last = now;
      // Считаем ВСЕ кадры, включая >2000 мс.
      window.__perf.frames.push(d);

      if (!window.__perf.spinStartAt && document.body.classList.contains("is-spinning")) {
        window.__perf.spinStartAt = now;
      }

      if (window.__perf.withInvariants) {
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
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, withInvariants);
}

async function measure(page, label, action, withInvariants) {
  await stopRaf(page);
  await page.waitForTimeout(40);
  await startFrameProbe(page, withInvariants);
  await page.evaluate(() => {
    window.__perf.clickAt = performance.now();
  });
  await action();
  await waitSpin(page, true, SPIN_ON_MS, `${label} spin-on`);
  await waitSpin(page, false, SPIN_OFF_MS, `${label} spin-off`);
  await page.waitForTimeout(POST_SPIN_MS);
  return page.evaluate(
    ({ lbl, withInv }) => {
      window.__perfStop = true;
      const frames = window.__perf.frames || [];
      const clean = frames.slice(1);
      const avg = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
      const sorted = [...clean].sort((a, b) => a - b);
      const p95 = sorted.length
        ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
        : 0;
      const startDelay =
        window.__perf.spinStartAt && window.__perf.clickAt
          ? window.__perf.spinStartAt - window.__perf.clickAt
          : null;
      return {
        label: lbl,
        frames: clean.length,
        avg: Number(avg.toFixed(2)),
        p95: Number(p95.toFixed(2)),
        max: clean.length ? Number(Math.max(...clean).toFixed(2)) : 0,
        over50: clean.filter((d) => d > 50).length,
        over100: clean.filter((d) => d > 100).length,
        over2000: clean.filter((d) => d > 2000).length,
        blurMax: withInv ? window.__perf.blurMax : null,
        blurSamples: withInv ? window.__perf.blurSamples : null,
        startDelayMs: startDelay != null ? Number(startDelay.toFixed(1)) : null,
        timedOut: false,
      };
    },
    { lbl: label, withInv: withInvariants },
  );
}

/** Пружина: нет is-spinning — фиксированное окно. */
async function measureSpring(page, label, action, withInvariants) {
  await stopRaf(page);
  await page.waitForTimeout(40);
  await startFrameProbe(page, withInvariants);
  await page.evaluate(() => {
    window.__perf.clickAt = performance.now();
  });
  await action();
  await page.waitForTimeout(500 + POST_SPIN_MS);
  return page.evaluate(
    ({ lbl, withInv }) => {
      window.__perfStop = true;
      const frames = (window.__perf.frames || []).slice(1);
      const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
      const sorted = [...frames].sort((a, b) => a - b);
      const p95 = sorted.length
        ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
        : 0;
      return {
        label: lbl,
        frames: frames.length,
        avg: Number(avg.toFixed(2)),
        p95: Number(p95.toFixed(2)),
        max: frames.length ? Number(Math.max(...frames).toFixed(2)) : 0,
        over50: frames.filter((d) => d > 50).length,
        over100: frames.filter((d) => d > 100).length,
        over2000: frames.filter((d) => d > 2000).length,
        blurMax: withInv ? window.__perf.blurMax : null,
        startDelayMs: null,
        timedOut: false,
      };
    },
    { lbl: label, withInv: withInvariants },
  );
}

async function goToIndex(page, index, label) {
  const dots = page.locator("nav[data-spiral-hud] button");
  const cur = await page.evaluate(() => {
    const panels = [...document.querySelectorAll("[data-spiral-section]")];
    return panels.findIndex((p) => p.hasAttribute("data-active"));
  });
  if (cur === index) {
    await page.waitForTimeout(200);
    return;
  }
  await dots.nth(index).click();
  await waitSpin(page, true, SPIN_ON_MS, `${label} goTo(${index}) on`);
  await waitSpin(page, false, SPIN_OFF_MS, `${label} goTo(${index}) off`);
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

function baseWithHash(base, hashPath) {
  const u = new URL(base.endsWith("/") ? base : `${base}/`);
  // hash на pathname /Portfolio/
  return `${u.origin}${u.pathname.replace(/\/?$/, "/")}${hashPath}`;
}

async function loadPage(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("[data-spiral-root]", { timeout: 20000 });
  await page.waitForTimeout(1600);
  await page.mouse.move(8, 8);
}

async function runScenarioSuite(page, meta, withInvariants) {
  const rows = [];
  const fail = (label, err) => {
    rows.push({
      label,
      error: String(err?.message || err),
      timedOut: /timeout/i.test(String(err?.message || err)),
      max: null,
      avg: null,
      p95: null,
      over50: null,
      over100: null,
      over2000: null,
      frames: 0,
    });
  };

  const lastIdx = (await page.locator("[data-spiral-section]").count()) - 1;
  const tag = (name, run) =>
    `${name} #${run} [${meta.viewport}|cpu${meta.cpu}|hash=${meta.hash}|${meta.probe}]`;

  for (let run = 1; run <= RUNS; run += 1) {
    // Соседние пары
    for (let i = 0; i < lastIdx; i += 1) {
      try {
        await goToIndex(page, i, tag(`prep ${i}`, run));
        rows.push(
          await measure(
            page,
            tag(`${i}->${i + 1}`, run),
            async () => {
              await page.keyboard.press("ArrowDown");
            },
            withInvariants,
          ),
        );
        rows.push(
          await measure(
            page,
            tag(`${i + 1}->${i}`, run),
            async () => {
              await page.keyboard.press("ArrowUp");
            },
            withInvariants,
          ),
        );
      } catch (err) {
        fail(tag(`adj ${i}`, run), err);
      }
    }

    // Наверх с 5-й, 6-й, 7-й (1-based) → индексы 4,5,6 при N=7
    for (const from1 of [5, 6, 7]) {
      const from = Math.min(lastIdx, from1 - 1);
      try {
        await goToIndex(page, from, tag(`prep nasp ${from1}`, run));
        rows.push(
          await measure(
            page,
            tag(`Наверх from ${from1}`, run),
            async () => {
              await clickTop(page);
            },
            withInvariants,
          ),
        );
      } catch (err) {
        fail(tag(`Наверх from ${from1}`, run), err);
      }
    }

    // Назад на 3 шага: 7->4, 4->1 (1-based)
    try {
      await goToIndex(page, lastIdx, tag("prep 7->4", run));
      rows.push(
        await measure(
          page,
          tag("7->4", run),
          async () => {
            await page
              .locator("nav[data-spiral-hud] button")
              .nth(Math.max(0, lastIdx - 3))
              .click();
          },
          withInvariants,
        ),
      );
      rows.push(
        await measure(
          page,
          tag("4->1", run),
          async () => {
            await page.locator("nav[data-spiral-hud] button").nth(0).click();
          },
          withInvariants,
        ),
      );
    } catch (err) {
      fail(tag("back3", run), err);
    }

    // Круг по точкам 7->2, 7->3
    for (const dest1 of [2, 3]) {
      const dest = Math.min(lastIdx, dest1 - 1);
      try {
        await goToIndex(page, lastIdx, tag(`prep 7->${dest1}`, run));
        rows.push(
          await measure(
            page,
            tag(`7->${dest1}`, run),
            async () => {
              await page.locator("nav[data-spiral-hud] button").nth(dest).click();
            },
            withInvariants,
          ),
        );
      } catch (err) {
        fail(tag(`7->${dest1}`, run), err);
      }
    }

    // Ход 1->2 после круга (Наверх с last, затем 0->1)
    try {
      await goToIndex(page, lastIdx, tag("prep after-circle", run));
      rows.push(
        await measure(
          page,
          tag("circle-Наверх", run),
          async () => {
            await clickTop(page);
          },
          withInvariants,
        ),
      );
      rows.push(
        await measure(
          page,
          tag("after-circle 1->2", run),
          async () => {
            await page.keyboard.press("ArrowDown");
          },
          withInvariants,
        ),
      );
    } catch (err) {
      fail(tag("after-circle", run), err);
    }

    // Пружина
    try {
      await goToIndex(page, lastIdx, tag("prep spring", run));
      rows.push(
        await measureSpring(
          page,
          tag("spring last", run),
          async () => {
            await page.keyboard.press("ArrowDown");
          },
          withInvariants,
        ),
      );
    } catch (err) {
      fail(tag("spring", run), err);
    }
  }

  return rows;
}

async function main() {
  const outPath = path.resolve(outArg);
  const report = {
    headHint: "step22-§1 baseline / measure",
    createdAt: new Date().toISOString(),
    base: baseArg,
    software,
    runs: RUNS,
    postSpinMs: POST_SPIN_MS,
    spinOffTimeoutMs: SPIN_OFF_MS,
    matrices: [],
    failures: 0,
  };

  console.log(
    `[measure] base=${baseArg} software=${software} runs=${RUNS} modes=${modes.join(",")} viewports=${viewports.map((v) => v.label).join(",")} cpu=${cpus.join(",")} hashes=${hashes.map((h) => h.key).join(",")}`,
  );

  for (const cpu of cpus) {
    const browser = await chromium.launch({
      headless: true,
      channel: "chrome",
      args: software ? ["--disable-gpu", "--use-gl=swiftshader"] : [],
    });

    for (const vp of viewports) {
      for (const hash of hashes) {
        for (const probe of modes) {
          const withInvariants = probe === "invariants";
          const meta = {
            viewport: vp.label,
            cpu,
            hash: hash.key,
            probe,
          };
          const page = await browser.newPage({
            viewport: { width: vp.width, height: vp.height },
          });
          // CDP CPU throttling (надёжнее флага)
          if (cpu > 1) {
            const client = await page.context().newCDPSession(page);
            await client.send("Emulation.setCPUThrottlingRate", { rate: cpu });
          }
          page.setDefaultTimeout(SPIN_OFF_MS);
          const url = baseWithHash(baseArg, hash.path);
          console.log(`[run] ${vp.label} cpu×${cpu} hash=${hash.key || "none"} probe=${probe}`);
          try {
            await loadPage(page, url);
            const rows = await runScenarioSuite(page, meta, withInvariants);
            const timedOut = rows.filter((r) => r.timedOut || r.error).length;
            report.failures += timedOut;
            report.matrices.push({ meta, url, rows, timedOut });
          } catch (err) {
            report.failures += 1;
            report.matrices.push({
              meta,
              url,
              error: String(err?.message || err),
              rows: [],
              timedOut: 1,
            });
            console.error(`[fail]`, meta, err);
          }
          await page.close();
        }
      }
    }
    await browser.close();
  }

  // Сводка max по семействам сценариев (frames-only)
  const summary = {};
  for (const m of report.matrices) {
    if (m.meta?.probe !== "frames") continue;
    for (const r of m.rows || []) {
      if (r.max == null) continue;
      const family = String(r.label).replace(/ #\d+.*/, "");
      const key = `${m.meta.viewport}|cpu${m.meta.cpu}|hash=${m.meta.hash}|${family}`;
      if (!summary[key]) summary[key] = [];
      summary[key].push(r.max);
    }
  }
  report.summaryMax = Object.fromEntries(
    Object.entries(summary).map(([k, arr]) => [
      k,
      {
        n: arr.length,
        avg: Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)),
        p95: Number(
          [...arr]
            .sort((a, b) => a - b)
            [Math.min(arr.length - 1, Math.floor(arr.length * 0.95))].toFixed(1),
        ),
        max: Number(Math.max(...arr).toFixed(1)),
        over100Runs: arr.filter((x) => x > 100).length,
      },
    ]),
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`[measure] wrote ${outPath} failures=${report.failures}`);
  // Markdown table (краткая)
  const mdPath = outPath.replace(/\.json$/i, ".md");
  const lines = [
    `# Perf baseline`,
    ``,
    `Created: ${report.createdAt}`,
    `Base: ${report.base}`,
    `Software: ${software}`,
    `Runs: ${RUNS}`,
    `Failures/timeouts: ${report.failures}`,
    ``,
    `| Scenario key | n | avg max | p95 max | max | runs>100 |`,
    `|---|---:|---:|---:|---:|---:|`,
  ];
  for (const [k, v] of Object.entries(report.summaryMax || {})) {
    lines.push(`| ${k} | ${v.n} | ${v.avg} | ${v.p95} | ${v.max} | ${v.over100Runs} |`);
  }
  fs.writeFileSync(mdPath, lines.join("\n"));
  console.log(`[measure] wrote ${mdPath}`);

  void summarize;
  if (report.failures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
