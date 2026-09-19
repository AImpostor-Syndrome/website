/**
 * Visual smoke check: does the page actually RENDER, not just load?
 *
 * Why this exists, separately from check-links.js (#6):
 * check-links proves every asset resolves. It cannot prove the page looks
 * right — a stylesheet can 200 and still not apply (wrong media, bad @import,
 * a CSS parse error, a a broken font URL). This loads the built site in a real
 * headless browser and asserts the design is actually in effect.
 *
 * The assertions are deliberately about *whether styling applied at all*,
 * not pixel-perfection — no screenshot baselines to churn on every copy edit.
 * That keeps it useful as a gate instead of noise.
 *
 *   npm run check:visual        # builds first via `npm run verify:all`
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const PREFIX = (process.env.PATH_PREFIX || "/website/").replace(/\/+$/, "/");
const ROOT = "_site";
const PORT = 8123;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Serve _site under PREFIX, so the test mirrors how Pages actually serves it. */
function serve() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const p0 = decodeURIComponent(req.url.split("?")[0]);

      // Serve ONLY under PREFIX. Anything outside it 404s, exactly as Pages
      // does. This strictness is the point: a lenient server that also served
      // /assets/... would have let bug #6 pass this very check.
      if (!p0.startsWith(PREFIX)) {
        res.writeHead(404).end("not found (outside path prefix)");
        return;
      }
      const p = p0.slice(PREFIX.length);
      let file = join(ROOT, p);
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file)) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(await readFile(file));
    });
    server.listen(PORT, () => resolve(server));
  });
}

const failures = [];
const check = (name, ok, detail) => {
  if (ok) console.log(`  ✓ ${name}`);
  else {
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failures.push(name);
  }
};

const server = await serve();
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Any asset the page requests that 404s is a hard failure — this is the
  // browser's own view of #6, not a static guess about URLs.
  const badRequests = [];
  page.on("response", (r) => {
    if (r.status() >= 400) badRequests.push(`${r.status()} ${r.url()}`);
  });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto(`http://localhost:${PORT}${PREFIX}`, { waitUntil: "networkidle" });

  console.log("\nVisual checks:");

  check("no failed asset requests", badRequests.length === 0, badRequests.join(", "));
  check("no JS errors", pageErrors.length === 0, pageErrors.join(", "));

  // --- Did the stylesheet actually apply? ---
  // The #6 signature: CSS never loads, so the body keeps the browser default
  // serif on a transparent/white ground.
  const body = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return { font: s.fontFamily, bg: s.backgroundColor };
  });
  check(
    "body uses the brand font (not a browser default)",
    /Space Grotesk/i.test(body.font),
    `got: ${body.font}`,
  );
  check(
    "body has the paper background",
    body.bg === "rgb(247, 246, 242)",
    `got: ${body.bg}`,
  );

  // Design tokens are the shared contract with the episode template (#2).
  const tokens = await page.evaluate(() => {
    const r = getComputedStyle(document.documentElement);
    return {
      gradient: r.getPropertyValue("--gradient-brand").trim(),
      violet: r.getPropertyValue("--color-violet").trim(),
    };
  });
  check("design tokens are defined", tokens.gradient.includes("linear-gradient"), tokens.gradient || "empty");
  check("brand violet token is correct", tokens.violet.toLowerCase() === "#8b5cf6", tokens.violet || "empty");

  // --- Is the layout actually laid out? ---
  // Unstyled pages stack everything full-width in source order. A real grid
  // means CSS is in effect, not merely downloaded.
  const heroCols = await page.evaluate(() => {
    const el = document.querySelector(".hero__inner");
    return el ? getComputedStyle(el).gridTemplateColumns : "";
  });
  check(
    "hero renders as a multi-column grid",
    heroCols.split(" ").filter(Boolean).length >= 2,
    `grid-template-columns: ${heroCols || "none"}`,
  );

  const heroSize = await page.evaluate(() => {
    const el = document.querySelector(".hero__title");
    return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
  });
  check("hero headline is display-sized (>40px)", heroSize > 40, `${heroSize}px`);

  // --- Does it hold up on a phone? ---
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("no horizontal overflow at 390px", overflow <= 1, `${overflow}px wider than viewport`);

  console.log("");
  if (failures.length) {
    console.error(`✗ ${failures.length} visual check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("✓ all visual checks passed — the page renders styled.");
  }
} finally {
  await browser.close();
  server.close();
}
