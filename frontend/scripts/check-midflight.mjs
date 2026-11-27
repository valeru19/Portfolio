import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4210/Portfolio/";

async function waitSpin(page, on, timeout = 60000) {
  await page.waitForFunction(
    (want) => document.body.classList.contains("is-spinning") === want,
    on,
    { timeout },
  );
}

async function clickTop(page) {
  const link = page.getByRole("link", { name: /Наверх|Back to top|Top/i });
  if ((await link.count()) > 0) {
    await link.first().click({ force: true });
    return;
  }
  await page.locator("nav[data-spiral-hud] button").first().click();
}

async function goLast(page) {
  await page.locator("nav[data-spiral-hud] button").last().click();
  await waitSpin(page, true, 8000).catch(() => {});
  await waitSpin(page, false, 60000);
  await page.waitForTimeout(400);
}

async function clickLang(page) {
  const btn = page
    .locator("button")
    .filter({ hasText: /^EN$|^RU$/ })
    .first();
  await btn.click();
}

async function clickTheme(page) {
  const byLabel = page.locator(
    'button[aria-label*="тем" i], button[aria-label*="theme" i], button[title*="тем" i], button[title*="theme" i]',
  );
  if ((await byLabel.count()) > 0) {
    await byLabel.first().click();
    return;
  }
  await page
    .getByRole("button", { name: /тем|theme|светл|тёмн|dark|light/i })
    .first()
    .click();
}

async function clickMode(page) {
  await page
    .getByRole("button", { name: /скролл|scroll|обычн|spiral|спирал/i })
    .first()
    .click();
}

async function snapshot(page, name) {
  await page.waitForTimeout(700);
  const spinning = await page.evaluate(() => document.body.classList.contains("is-spinning"));
  const counter = await page.locator("p[data-spiral-hud]").innerText();
  const hash = await page.evaluate(() => location.hash);
  const sharp = await page.evaluate(() =>
    [...document.querySelectorAll("[data-panel-view='sharp']")].map((e) => e.id),
  );
  console.log(JSON.stringify({ name, spinning, counter, hash, sharp }, null, 2));
  if (spinning) throw new Error(`${name}: still spinning`);
  return { counter, hash, sharp };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--disable-gpu", "--use-gl=swiftshader"],
  });

  const cases = [
    {
      name: "nasp+lang",
      start: async (page) => {
        await goLast(page);
        await clickTop(page);
      },
      mid: clickLang,
      expectHash: "#hero",
      expectCounter: /01/,
    },
    {
      name: "nasp+theme",
      start: async (page) => {
        await goLast(page);
        await clickTop(page);
      },
      mid: clickTheme,
      expectHash: "#hero",
      expectCounter: /01/,
    },
    {
      name: "dots-last+lang",
      start: async (page) => {
        await page.locator("nav[data-spiral-hud] button").last().click();
      },
      mid: clickLang,
      expectHash: "#contacts",
      expectCounter: /07/,
    },
    {
      name: "step+theme",
      start: async (page) => {
        await page.keyboard.press("ArrowDown");
      },
      mid: clickTheme,
      expectHash: "#about",
      expectCounter: /02/,
    },
    {
      name: "nasp+mode",
      start: async (page) => {
        await goLast(page);
        await clickTop(page);
      },
      mid: clickMode,
      expectHash: "#hero",
      expectCounter: /01/,
    },
    {
      name: "nasp-double-click",
      start: async (page) => {
        await goLast(page);
        await clickTop(page);
        await page.waitForTimeout(200);
        await clickTop(page);
        await clickTop(page);
      },
      mid: async () => {},
      expectHash: "#hero",
      expectCounter: /01/,
    },
  ];

  for (const c of cases) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("[data-spiral-root]", { timeout: 20000 });
    await page.waitForTimeout(900);
    await c.start(page);
    const started = await page
      .waitForFunction(() => document.body.classList.contains("is-spinning"), null, {
        timeout: 8000,
      })
      .then(() => true)
      .catch(() => false);
    if (started && c.mid) {
      await page.waitForTimeout(350);
      await c.mid(page);
    }
    await waitSpin(page, false, 60000).catch(() => {});
    const snap = await snapshot(page, c.name);
    if (c.expectHash && snap.hash !== c.expectHash) {
      throw new Error(`${c.name}: hash ${snap.hash} != ${c.expectHash}`);
    }
    if (c.expectCounter && !c.expectCounter.test(snap.counter)) {
      throw new Error(`${c.name}: counter ${snap.counter}`);
    }
    await ctx.close();
  }

  await browser.close();
  console.log("[ok] mid-flight cases passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
