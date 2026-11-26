/**
 * Серия скриншотов во время flip (цвет + blur).
 * Usage: node scripts/capture-flip-sequence.mjs [baseUrl] [outDir]
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173/Portfolio/";
const outDir = process.argv[3] || join(process.cwd(), "scripts", "flip-shots");

mkdirSync(outDir, { recursive: true });

async function captureFlip(page, label, trigger) {
  const dir = join(outDir, label);
  mkdirSync(dir, { recursive: true });
  await trigger();
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(70);
    await page.screenshot({ path: join(dir, `${String(i).padStart(2, "0")}.png`) });
  }
  await page
    .waitForFunction(() => !document.body.classList.contains("is-spinning"), {
      timeout: 5000,
    })
    .catch(() => {});
  await page.screenshot({ path: join(dir, "land.png") });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  await captureFlip(page, "0-to-1", async () => {
    await page.keyboard.press("ArrowDown");
  });

  await captureFlip(page, "1-to-0", async () => {
    await page.keyboard.press("ArrowUp");
  });

  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(900);

  await captureFlip(page, "3-to-2", async () => {
    await page.keyboard.press("ArrowUp");
  });

  console.log("shots written to", outDir);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
