/**
 * Asset-link check: every href/src in the built HTML must resolve to a real
 * file in _site.
 *
 * Why this exists: #6. The site shipped completely unstyled because the built
 * HTML linked /assets/css/site.css while Pages serves the site from
 * /website/assets/css/site.css. The original check curl'd the file's real URL
 * and got a 200 — but that is not the URL the *page* asks for, so a broken
 * page passed verification.
 *
 * This resolves each link the way a browser does: against the page's own URL,
 * under the configured pathPrefix. Run after a build:
 *
 *   npm run build && npm run check
 */
import { readFileSync, existsSync } from "node:fs";
import { join, posix } from "node:path";
import { globSync } from "node:fs";

const SITE = "_site";
const prefix = (process.env.PATH_PREFIX || "/website/").replace(/\/+$/, "/");

const pages = globSync(`${SITE}/**/*.html`);
if (pages.length === 0) {
  console.error("✗ no HTML found in _site — did the build run?");
  process.exit(1);
}

let broken = 0;
let checked = 0;

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

  for (const link of links) {
    // Only local assets: skip absolute URLs, anchors, and protocol-relative.
    if (/^(https?:)?\/\//.test(link) || link.startsWith("#") || link.startsWith("mailto:")) {
      continue;
    }
    if (!/\.(css|js|png|jpe?g|svg|webp|ico|woff2?)$/.test(link)) continue;

    checked++;

    // A root-absolute link must start with the prefix, or the browser will
    // request it from the domain root — exactly the #6 failure.
    if (link.startsWith("/") && !link.startsWith(prefix)) {
      console.error(`✗ ${page}\n    ${link}\n    missing path prefix "${prefix}"`);
      broken++;
      continue;
    }

    const rel = link.startsWith("/") ? link.slice(prefix.length) : link;
    if (!existsSync(join(SITE, rel))) {
      console.error(`✗ ${page}\n    ${link}\n    no such file: ${join(SITE, rel)}`);
      broken++;
    }
  }
}

if (broken > 0) {
  console.error(`\n✗ ${broken} broken asset link(s) of ${checked} checked.`);
  process.exit(1);
}

console.log(`✓ all ${checked} asset link(s) resolve (prefix "${prefix}")`);
