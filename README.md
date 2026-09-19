# AImpostor Syndrome — website

The public site for **AImpostor Syndrome**, a show where two engineers build AI-native
software in public, one real working session a week.

Live at **https://aimpostor-syndrome.github.io/website/** (custom domain pending — see below).

> Spelling note: it's **impostor**, with an *o*. Canonical everywhere.

## Quick start

```bash
npm ci               # install (use `npm install` if you're changing dependencies)
npm start            # local preview with live reload -> http://localhost:8080
npm run build        # one-off production build into _site/
npm run verify:all   # build + both checks — run this before pushing
```

Requires Node 20+. No Ruby, no global installs.

## Checks

Two checks guard the deploy. Both run in CI; run them locally with
`npm run verify:all`.

| Command | What it proves |
|---|---|
| `npm run check` | Every `href`/`src` in the built HTML resolves to a real file, **under the path prefix the site is actually served from**. |
| `npm run check:visual` | The page *renders* — loaded in headless Chromium, asserting the brand font applied, design tokens resolve, the hero computes a real grid, nothing 404s in the browser's network log, and there's no horizontal overflow at 390px. |

Both exist because of [#6](https://github.com/AImpostor-Syndrome/website/issues/6), where
the site shipped completely unstyled: assets were linked from the domain root while Pages
serves this repo from `/website/`. The verification that missed it fetched the asset's real
URL and got a 200 — which is the URL the *file* lives at, not the one the *page asks for*.

The visual check asserts **computed styles**, not screenshots, so it catches "CSS didn't
apply" without breaking on every copy edit. Its local server deliberately serves *only*
under the path prefix and 404s everything else — mirroring Pages, because a lenient server
would pass a build that breaks in production.

Both checks are verified to actually fail: rebuild with `PATH_PREFIX=/` and they exit
non-zero.

## How publishing works

**Publishing is a commit to `main`.** There is no manual deploy step.

```
commit to main  ->  .github/workflows/deploy.yml  ->  npm ci && npm run build  ->  Pages
```

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the site with Eleventy
and hands `_site/` to GitHub Pages. A push to `main` updates the live page in a minute or two;
watch it in the repo's **Actions** tab. You can also re-deploy without a commit via
**Actions → Deploy to GitHub Pages → Run workflow**.

Build output (`_site/`) is **gitignored on purpose** — Actions builds it, so it never belongs
in git.

### One-time Pages setup

Settings → Pages → **Source: GitHub Actions**. (Not "Deploy from a branch" — the site needs a
build step.)

## Custom domain (`aimpostorsyndrome.com`)

Not wired yet: DNS still points at a Namecheap parking page. The config is staged so the
switch is two steps, but **do them in this order** — publishing a `CNAME` before DNS resolves
makes Pages claim the domain and serves nothing at *either* URL.

**1. Add the DNS records** at the registrar:

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `aimpostor-syndrome.github.io.` |

**2. Then turn on the CNAME** in this repo:

```bash
git mv src/CNAME.example src/CNAME
# uncomment the addPassthroughCopy CNAME line in .eleventy.js
```

Commit, and set the domain in Settings → Pages → Custom domain, then enable **Enforce HTTPS**
once the certificate is issued.

## Layout

```
src/
  index.njk               the homepage
  CNAME.example           custom-domain stub (see above)
  _data/
    site.json             site-wide strings (title, links, domain)
    episodes.js           the episode list, newest first
    episodeList.js        derived: { latest, rest } for the homepage
  _includes/layouts/
    base.njk              shell: head, nav, footer
  assets/
    css/tokens.css        design tokens — the shared system
    css/site.css          site styles
    img/                  logo, avatar, banner
```

### Design tokens

[`src/assets/css/tokens.css`](src/assets/css/tokens.css) is the **single source of truth** for
palette, type, spacing, and radii, ported from the Claude Design handoff bundle. The episode
template (#2) inherits from it — change a color there, both pages follow.

One rule worth keeping: the brand gradient (`--gradient-brand`) is always 135°, coral →
magenta → violet, never reversed, and at most **one gradient element per viewport** — the
mark, the primary button, or the hero "AI".

### Adding an episode

Until the publish pipeline lands (#3, #4), episodes are added by hand to
[`src/_data/episodes.js`](src/_data/episodes.js) — newest first. The first entry is featured
on the homepage; the rest become the list. `published: false` means the session was recorded
but its episode page isn't live yet.

## Why Eleventy

GitHub Pages defaults to Jekyll, but the episode pages are generated from AI-drafted markdown
(#3), which needs a real build step — and Jekyll needs Ruby ≥ 3.0, which the project's
machines don't have (system Ruby is 2.6.10). Eleventy runs on the Node that's already
installed, renders markdown natively, and passes hand-authored HTML through untouched, which
is what keeps the design pixel-faithful. Full decision table on
[issue #1](https://github.com/AImpostor-Syndrome/website/issues/1).

## Related

- [`AImpostor-Syndrome/team-brain`](https://github.com/AImpostor-Syndrome/team-brain) — the
  project's shared memory: decisions, session records, specs. Decision 0006 is why this site
  is its own repo.
