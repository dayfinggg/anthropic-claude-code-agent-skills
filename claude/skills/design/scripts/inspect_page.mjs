import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const collectJs = `(${readFileSync(path.join(here, "collect.js"), "utf8").trim()})()`;
const focusJs = `(${readFileSync(path.join(here, "focus.js"), "utf8").trim()})()`;
const settleJs = `(${readFileSync(path.join(here, "settle.js"), "utf8").trim()})()`;

function loadChromium() {
  const bases = [path.join(process.cwd(), "package.json")];
  try {
    bases.push(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "noop.js"));
  } catch {}
  for (const base of bases) {
    const require = createRequire(base);
    for (const name of ["playwright", "@playwright/test", "playwright-core"]) {
      try {
        return require(name).chromium;
      } catch {}
    }
  }
  console.error("Playwright was not found in the current project or global npm modules. Run from a project that has playwright installed, or use inspect_page.py with Python Playwright.");
  process.exit(2);
}

async function checkFocus(page, limit) {
  const results = [];
  const seen = new Set();
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(focusJs);
    if (!info) continue;
    if (seen.has(info.key)) break;
    seen.add(info.key);
    results.push(info);
  }
  const missing = results.filter((r) => !r.indicator);
  return { checked: results.length, withoutVisibleIndicator: missing.slice(0, 10) };
}

function summaryLine(run) {
  const parts = [
    `${run.scheme}@${run.viewport.width}/${run.state}`,
    `overflow=${run.horizontalOverflow ? "yes" : "no"}`,
    `contrast_fail=${run.contrastFailureCount}`,
    `small_targets=${run.smallTargetCount}`,
    `fonts=${JSON.stringify(run.fonts.map(([f]) => f))}`,
    `sizes=${run.fontSizes.length}`,
    `radii=${run.radii.length}`,
    `tells=${JSON.stringify(run.tells)}`,
    `motion=${JSON.stringify(run.motion)}`,
  ];
  if (run.focus) parts.push(`focus_missing=${run.focus.withoutVisibleIndicator.length}/${run.focus.checked}`);
  if (run.errors.length) parts.push(`errors=${run.errors.length}`);
  return parts.join(" | ");
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", default: "design-inspection" },
    widths: { type: "string", default: "390,768,1440" },
    schemes: { type: "string", default: "light,dark" },
    "focus-steps": { type: "string", default: "15" },
    state: { type: "string", multiple: true, default: [] },
  },
});

if (positionals.length !== 1) {
  console.error('Usage: node inspect_page.mjs <url-or-file> [--out dir] [--widths 390,768,1440] [--schemes light,dark] [--focus-steps 15] [--state "name=selector && selector"]');
  process.exit(2);
}

let target = positionals[0];
if (!target.includes("://")) {
  const file = path.resolve(target);
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  target = pathToFileURL(file).href;
}

const widths = values.widths.split(",").map((w) => parseInt(w, 10)).filter(Boolean);
const schemes = values.schemes.split(",").map((s) => s.trim()).filter(Boolean);
const out = path.resolve(values.out);
mkdirSync(out, { recursive: true });

const states = [["initial", []]];
for (const spec of values.state) {
  const at = spec.indexOf("=");
  const name = at > 0 ? spec.slice(0, at).trim() : "";
  const steps = at > 0 ? spec.slice(at + 1).split("&&").map((s) => s.trim()).filter(Boolean) : [];
  if (!name || !steps.length) {
    console.error(`Invalid --state "${spec}". Use "name=selector && selector".`);
    process.exit(2);
  }
  states.push([name, steps]);
}

const chromium = loadChromium();
const browser = await chromium.launch();
const report = { target, runs: [] };
try {
  for (const scheme of schemes) {
    for (const width of widths) {
      for (const [state, steps] of states) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => {
          if (m.type() === "error") errors.push(m.text());
        });
        try {
          await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });
        } catch (e) {
          errors.push(`navigation: ${e.message}`);
        }
        await page.waitForTimeout(600);
        for (const step of steps) {
          try {
            await page.locator(step).first().click({ timeout: 5000 });
            await page.waitForTimeout(300);
          } catch (e) {
            errors.push(`state ${state}: could not click ${step}: ${e.message}`);
            break;
          }
        }
        await page.evaluate(settleJs);
        const prefix = state === "initial" ? `${scheme}-${width}` : `${scheme}-${width}-${state}`;
        const shot = path.join(out, `${prefix}.png`);
        const view = path.join(out, `${prefix}-viewport.png`);
        await page.screenshot({ path: shot, fullPage: true });
        await page.screenshot({ path: view });
        const data = await page.evaluate(collectJs);
        if (state === "initial" && width === Math.max(...widths)) data.focus = await checkFocus(page, parseInt(values["focus-steps"], 10));
        Object.assign(data, { scheme, state, screenshot: shot, viewportScreenshot: view, errors: errors.slice(0, 10) });
        report.runs.push(data);
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
}

const reportPath = path.join(out, "report.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2));
for (const run of report.runs) console.log(summaryLine(run));
console.log(`report: ${reportPath}`);
