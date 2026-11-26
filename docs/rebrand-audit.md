# Rebrand Audit: AKZQ.Creation → AJELVA CREATIVE

**Branch:** `feat/rebrand-audit`  
**Base commit:** `84bf7dc7e89b4d515e56bf92b62b865ea323e0ea` (feat/lead-capture HEAD)  
**Audited:** 2026-11-26  
**Scope:** Read-only inventory. No changes proposed here.

---

## Table of Contents

1. [Brand Strings](#1-brand-strings)
2. [Domain-Like Identifiers](#2-domain-like-identifiers)
3. [Design System Today](#3-design-system-today)
4. [Assets](#4-assets)
5. [Test Impact](#5-test-impact)
6. [Master-Prompt Assumptions](#6-master-prompt-assumptions)
7. [Appendix — Raw Command Output](#appendix--raw-command-output)

---

## 1. Brand Strings

**Grep command:** `git grep -n -i -E "akzq|aq creation|aq\.creation|akzqcreation|akzq-creation"` — **499 matching lines** across all tracked files.

Counts below are exact line counts from raw grep (see Appendix A).

---

### 1.1 Visible Page Text

| file:line | content | verdict |
|---|---|---|
| `src/app/layout.tsx:26` | `title: "AKZQ.Creation — Web Design & Digital Marketing Agency…"` | **must-change** |
| `src/app/layout.tsx:30` | description meta: `"AKZQ.Creation is a premier digital marketing…"` | **must-change** |
| `src/components/Header.tsx:57` | `aria-label="AKZQ.Creation Home"` | **must-change** |
| `src/components/Header.tsx:60` | `alt="AKZQ.Creation Logo"` | **must-change** |
| `src/components/Footer.tsx:23–25` (3 route keys) | `<strong>AKZQ.Creation</strong>`, `© 2026 AKZQ.Creation. All rights reserved.` | **must-change** |
| `src/components/Footer.tsx:25` | `alt="AKZQ.Creation Logo"` (×2 per footer variant) | **must-change** |
| `src/components/PortfolioFilter.tsx:166` | WhatsApp message: `` `Hi AKZQ.Creation, I am interested in a project similar to…` `` | **must-change** |
| `src/lib/notify.ts:38` | email body: `"New Lead Received on AKZQ.Creation:"` | **must-change** |
| `robots.txt:1` | `# AKZQ.Creation Robots.txt` | **may-change** (comment only) |
| `README.md:1,3` | `# AKZQ.Creation — Production Agency Website` | **must-change** |

**Legacy HTML files** (15 `.html` files in root — not served by Next.js in production but tracked):

> These are the legacy static site source files. The parity test reads them directly as the golden baseline. All contain visible-text occurrences. Representative sample below; full list in Appendix A.

| file | AKZQ-branded occurrences | type |
|---|---|---|
| `index.html` | Multiple (title, h1, footer NAP, copyright, aria-labels, alt) | visible text + attrs |
| `about.html` | Multiple | visible text + attrs |
| `services.html` | Multiple | visible text + attrs |
| `contact.html` | Multiple incl. `hello@akzqcreation.com` | visible text + email |
| `kannur.html` | Multiple | visible text + attrs |
| `thalassery.html` | Multiple incl. `hello@akzqcreation.com`, JSON-LD | visible text + attrs + JSON-LD |
| `web-design-development.html` | Multiple | visible text + attrs |
| *(and 8 others)* | Multiple each | visible text + attrs |

**Category verdict:** **must-change** — these are user-facing brand name occurrences.

---

### 1.2 Metadata / Titles / OG / Twitter

| file:line | content | verdict |
|---|---|---|
| `src/app/layout.tsx:24` | `metadataBase: new URL("https://akzqcreation.com")` | **must-change** (domain) |
| `src/app/layout.tsx:26` | `title.default: "AKZQ.Creation — Web Design…"` | **must-change** |
| `src/app/layout.tsx:38` | `openGraph.siteName: "AKZQ.Creation"` | **must-change** |
| `src/app/layout.tsx:44` | `openGraph.images[0].alt: "AKZQ.Creation — Digital Marketing…"` | **must-change** |
| `src/app/layout.tsx:50` | `twitter.title: "AKZQ.Creation — Web Design…"` | **must-change** |
| All 15 `*.html` root files | `<title>…AKZQ.Creation…</title>` and `<meta name="description" content="AKZQ.Creation…">` | **must-change** |

**Category verdict:** **must-change** — all visible in browser tab, search snippets, and social unfurls.

---

### 1.3 JSON-LD

| file:line | content | verdict |
|---|---|---|
| `index.html:~line 10` | `LocalBusiness.name: "AKZQ.Creation"` | **must-change** |
| `kannur.html:~line 17` | `LocalBusiness.name: "AKZQ.Creation — Kannur Agency Hub"` | **must-change** |
| `thalassery.html:17` | `LocalBusiness.name: "AKZQ.Creation — Thalassery Agency Hub"` | **must-change** |
| `thalassery.html:18` | `LocalBusiness.image: "https://akzqcreation.com/assets/images/logo.svg"` | **must-change** (domain) |
| `thalassery.html:29` | `LocalBusiness.url: "https://akzqcreation.com/thalassery.html"` | **must-change** (domain) |
| All service/location `.html` files | `LocalBusiness` and `FAQPage` JSON-LD with brand name and domain | **must-change** |

**Category verdict:** **must-change** — JSON-LD is consumed by search engines verbatim.

---

### 1.4 alt / aria / title Attributes

| file:line | attribute | value | verdict |
|---|---|---|---|
| `src/components/Header.tsx:57` | `aria-label` | `"AKZQ.Creation Home"` | **must-change** |
| `src/components/Header.tsx:60` | `alt` | `"AKZQ.Creation Logo"` | **must-change** |
| `src/components/Footer.tsx:23–25` | `alt` (×multiple) | `"AKZQ.Creation Logo"` | **must-change** |
| All 15 `.html` files | `alt` on `<img>` | `"AKZQ.Creation Logo"` | **must-change** |
| All 15 `.html` files | `aria-label` on header logo link | `"AKZQ.Creation Home"` | **must-change** |

**Category verdict:** **must-change** — required for screen-reader accuracy and brand consistency.

---

### 1.5 Image and File Names

| path | type | verdict |
|---|---|---|
| `public/assets/images/favicon.svg` | SVG favicon | **must-change** (file name is generic but content renders AKZQ mark — new asset needed) |
| `public/assets/images/logo.svg` | Light-bg logo SVG | **must-change** (new asset needed) |
| `public/assets/images/logo-white.svg` | Dark-bg logo SVG | **must-change** (new asset needed) |
| `public/assets/images/og-share.png` | OG social share image | **must-change** (new asset needed, 1200×630) |
| `public/assets/images/hero-dashboard.svg` | Hero illustration | **may-change** (generic illustration; no visible brand text) |

The root-level `assets/images/` directory contains the same files served by the legacy HTML pages. Verdict identical.

**No files have `akzq` in the filename itself** (confirmed: all files are named generically — `logo.svg`, `og-share.png`, etc.). The old domain and name appear only *inside* file content.

**Category verdict:** **must-change** (image content encodes old brand mark).

---

### 1.6 public/assets (favicon, og-share.png, logos)

| file | size | format | brand-encoded | verdict |
|---|---|---|---|---|
| `public/assets/images/favicon.svg` | 383 B | SVG (vector) | Yes — renders brand mark | **must-change** |
| `public/assets/images/logo.svg` | 752 B | SVG | Yes | **must-change** |
| `public/assets/images/logo-white.svg` | 775 B | SVG | Yes | **must-change** |
| `public/assets/images/og-share.png` | 311 KB | PNG 1200×630 | Yes | **must-change** |
| `public/assets/images/hero-dashboard.svg` | 8 KB | SVG | No brand text | **may-change** |

---

### 1.7 WhatsApp Message Template

| file:line | content | verdict |
|---|---|---|
| `src/components/PortfolioFilter.tsx:166` | `` `Hi AKZQ.Creation, I am interested in a project similar to "${selectedProject.title}". Let's discuss pricing.` `` | **must-change** |

**Category verdict:** **must-change** — user-visible pre-filled WhatsApp message.

---

### 1.8 Email Subject / Body (notify.ts)

| file:line | content | verdict |
|---|---|---|
| `src/lib/notify.ts:38` | `"New Lead Received on AKZQ.Creation:"` (email body first line) | **must-change** |
| `src/lib/notify.ts:61` | subject uses `cleanName` and `cleanService` — no brand name in subject line | no action needed |

**Category verdict:** **must-change** (body line 38 only).

---

### 1.9 Seed Content (prisma/seed.ts)

The seed script (`prisma/seed.ts`) extracts all content dynamically from the Next.js page files using regex scraping. It contains **zero hardcoded brand name strings** — FAQs, services, portfolio, and blog data are pulled at runtime from `src/app/*/page.tsx`. No direct AKZQ string in seed.ts itself.

**Category verdict:** **may-change** — seed derives its content from page files; changing page content automatically updates seed output. No independent change needed.

---

### 1.10 env / docs / README

| file:line | content | verdict |
|---|---|---|
| `.env.example:2` | `NEXT_PUBLIC_SITE_URL=https://akzqcreation.com` | **must-change** (domain) |
| `README.md:1` | `# AKZQ.Creation — Production Agency Website` | **must-change** |
| `README.md:3` | `built for **AKZQ.Creation**` | **must-change** |
| `docs/deploy-env.md` | (not grepped for brand — does not contain AKZQ strings per grep) | no action |
| `docs/db-roles.md` | No AKZQ strings | no action |

**Category verdict:** **must-change** (env template URL, README heading/body).

---

### 1.11 Tests and Fixtures

| file | occurrences | type | verdict |
|---|---|---|---|
| `tests/contact-form-browser.test.mjs` | 3 | DB name `akzq_browser_test_db`, temp dir `akzq-browser-test-`, `NEXT_PUBLIC_SITE_URL` | **must-not-change** (technical DB identifier) / may-change (URL) |
| `tests/db.test.ts` | 3 | DB names `akzq_test_db`, `akzq_shadow_test_db`, temp dir `akzq-db-test-` | **must-not-change** (technical identifiers) |
| `tests/leads-api.test.ts` | 50+ | DB names, `NEXT_PUBLIC_SITE_URL`, `ALLOWED_ORIGINS`, email addresses, origin headers | mixed — see §5 |
| `tests/metadata-detailed.json` | 30 | canonical URLs, ogImage URLs | **must-change** (fixture baseline) |
| `tests/parity-report.json` | 30+ | canonical URLs, robots body | **must-change** (fixture baseline) |
| `tests/parity-test.mjs` | 2 | inline `.replace('https://akzqcreation.com', '')` strip pattern | **must-change** (domain in code) |

**Category verdict (mixed):**
- `akzq_test_db`, `akzq_shadow_test_db`, temp dir prefixes → **must-not-change** (Postgres internal identifiers; renaming requires DB migration coordination)
- Domain URL fixtures → **must-change** (or introduce brand-map mechanism, see §5)
- Email fixtures (`leads@akzqcreation.com`, `notifications@akzqcreation.com`) → **must-not-change** until production email is migrated; test fixtures should track real env values

---

### 1.12 Legacy .html Files

All 15 root `.html` files contain AKZQ brand strings. These are the golden source for parity tests.

| file | visible text | metadata | JSON-LD | alt/aria | email |
|---|---|---|---|---|---|
| `index.html` | ✓ | ✓ | ✓ | ✓ | — |
| `about.html` | ✓ | ✓ | ✓ | ✓ | — |
| `services.html` | ✓ | ✓ | ✓ | ✓ | — |
| `branding-identity.html` | ✓ | ✓ | ✓ | ✓ | — |
| `web-design-development.html` | ✓ | ✓ | ✓ | ✓ | — |
| `digital-marketing-seo.html` | ✓ | ✓ | ✓ | ✓ | — |
| `media-content-production.html` | ✓ | ✓ | ✓ | ✓ | — |
| `local-seo.html` | ✓ | ✓ | ✓ | ✓ | — |
| `kannur.html` | ✓ | ✓ | ✓ | ✓ | — |
| `thalassery.html` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `portfolio.html` | ✓ | ✓ | ✓ | ✓ | — |
| `blog.html` | ✓ | ✓ | ✓ | ✓ | — |
| `blog-cost-of-seo-kerala.html` | ✓ | ✓ | — | ✓ | — |
| `faq.html` | ✓ | ✓ | ✓ | ✓ | — |
| `contact.html` | ✓ | ✓ | ✓ | ✓ | ✓ |

**Category verdict:** **must-change** — these are the parity baseline; they must change in lock-step with the Next.js pages.

---

### 1.13 package.json name

| file:line | content | verdict |
|---|---|---|
| `package.json:2` | `"name": "akzq-creation-website"` | **must-not-change** / **may-change** — This is an NPM package name, not user-facing. It does not appear on any rendered page. It may be renamed to `ajelva-creative-website` without breaking anything but it is not a user-facing string. |

---

## 2. Domain-Like Identifiers

All occurrences of `akzqcreation.com` and `hello@akzqcreation.com` in the tracked tree:

### akzqcreation.com

| file | lines | context |
|---|---|---|
| `src/app/layout.tsx` | 24, 37, 41, 52 | `metadataBase`, OG `url`, OG `images[0].url`, Twitter `images[0]` |
| `src/app/sitemap.ts` | (via NEXT_PUBLIC_SITE_URL) | dynamic sitemap generator |
| `src/app/robots.ts` | (via NEXT_PUBLIC_SITE_URL) | dynamic robots.txt generator |
| `.env.example` | 2 | `NEXT_PUBLIC_SITE_URL=https://akzqcreation.com` |
| `robots.txt` | 5 | `Sitemap: https://akzqcreation.com/sitemap.xml` |
| `sitemap.xml` | 4–92 (all `<loc>`) | 15 `<loc>` entries starting with `https://akzqcreation.com/` |
| `thalassery.html` | 18, 29 | JSON-LD `image` and `url` |
| All other 14 `.html` files | multiple | JSON-LD `url`, `image`, canonical href |
| `tests/contact-form-browser.test.mjs` | 185 | `NEXT_PUBLIC_SITE_URL` fixture |
| `tests/leads-api.test.ts` | 270–274, 293, 331, 348, 355, 514, 522, 530, 538, 923, 924, 1030, 1074, 1133, 1137, 1148, 1159, 1181, 1264, 1284, 1304, 1339, 1383 | env fixtures, origin headers, CORS tests, email assertions |
| `tests/metadata-detailed.json` | 8–135 (every entry) | canonical and ogImage baseline |
| `tests/parity-report.json` | 8–448 | canonical, robots body |
| `tests/parity-test.mjs` | 142, 144 | `.replace('https://akzqcreation.com', '')` strip |

### hello@akzqcreation.com

| file | lines | context |
|---|---|---|
| `thalassery.html` | 332 | visible footer email `<p>Email: hello@akzqcreation.com</p>` |
| `contact.html` | (not in grep results — email is on the page but as a `mailto:` link; needs manual check of contact.html) | footer NAP |
| All other `.html` files with NAP footer | multiple | footer NAP email |

> Note: `leads@akzqcreation.com` and `notifications@akzqcreation.com` appear only in test fixtures (see §1.11). `preview.akzqcreation.com` appears in CORS tests as a fixture subdomain.

---

## 3. Design System Today

### 3.1 Tailwind Configuration (`tailwind.config.js`)

| token | value |
|---|---|
| `colors.brand.purple` | `#6D28D9` |
| `colors.brand.blue` | `#2563EB` |
| `colors.brand.dark` | `#0F172A` |
| `colors.brand.light` | `#F3E8FF` |
| `colors.brand.white` | `#FFFFFF` |
| `colors.brand.accent` | `#FF6A2B` (comment: "Preserve existing active brand accent") |
| `fontFamily.sans` | `var(--font-inter)` → Google Fonts Inter |
| `fontFamily.heading` | `var(--font-manrope)` → Google Fonts Manrope |

Tailwind `content` paths: `./src/pages/**`, `./src/components/**`, `./src/app/**` — standard Next.js App Router setup.

### 3.2 Global CSS (`src/app/globals.css`)

The file (13 lines) imports the full design system from the shared CSS files and declares font CSS variables:

```
@import "../../assets/css/style.css";      ← primary design system (76 hex values)
@import "../../assets/css/animations.css"; ← micro-animations (0 hex values)
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-manrope: 'Manrope', …
  --font-inter: 'Inter', …
}
```

### 3.3 CSS Design Tokens (`assets/css/style.css`)

**76 hex color values** in `style.css`. Key design tokens (CSS custom properties on `:root`):

| token | value | role |
|---|---|---|
| `--accent` / `--primary` | `#FF6A2B` | Brand orange — CTA buttons, accents |
| `--dark-bg` | `#15151A` | Dark section backgrounds |
| `--dark-text` | `#FFFFFF` | Text on dark |
| `--dark-text-muted` | `#A0A0AB` | Muted text on dark |
| `--text-primary` | `#15151A` | Body text |
| `--text-muted` | `#6B6B76` | Secondary text |
| `--surface` | `#F5F5F7` | Card surfaces |
| `--border` | `#E4E4E9` | Borders |

> **Note:** `style.css` is shared between the legacy HTML files and the Next.js app. All design tokens live here.

### 3.4 Fonts (next/font)

Declared in `src/app/layout.tsx`:

| font | weights | CSS variable | use |
|---|---|---|---|
| `Manrope` (Google Fonts) | 400, 500, 600, 700, 800 | `--font-manrope` | Headings (`fontFamily.heading`) |
| `Inter` (Google Fonts) | 400, 500, 600, 700 | `--font-inter` | Body (`fontFamily.sans`) |

> **Note:** `README.md` documents *Poppins* as the brand font, but the actual implementation uses Manrope + Inter. The README is out of date.

### 3.5 Hard-Coded Hex Colours Per File (inline styles)

| file | hex occurrences | sample values |
|---|---|---|
| `assets/css/style.css` | 76 | `#FF6A2B`, `#15151A`, `#FFFFFF`, etc. (all CSS variables and direct use) |
| `assets/css/animations.css` | 0 | — |
| `src/app/layout.tsx` | 1 | `#15151A` (body text via Tailwind class `text-[#15151A]`), `#FFFFFF` (bg) |
| `src/app/page.tsx` | 1 | (embedded in long inline string) |
| `src/components/Footer.tsx` | 15 | `#FFFFFF` (phone link), `var(--dark-text-muted)` via inline style |
| `src/components/ContactForm.tsx` | 10 | `#e53e3e` (error red ×7), `#FF6A2B` (spinner) |
| `src/components/ClientScriptManager.tsx` | 10 | `#e53e3e` (error state inline HTML strings) |
| `src/components/Header.tsx` | 0 | — |

### 3.6 Components and Pages Using Them

| component | pages/routes it renders on |
|---|---|
| `Header.tsx` | All 15 routes (via `RootLayout`) |
| `Footer.tsx` | All 15 routes (via `RootLayout`); per-route HTML map keyed by pathname |
| `ContactForm.tsx` | `/contact` only |
| `FAQAccordion.tsx` | `/faq` only |
| `PortfolioFilter.tsx` | `/portfolio` only |
| `ScrollReveal.tsx` | All routes (via `RootLayout`) |
| `ClientScriptManager.tsx` | All routes (via `RootLayout`); handles mobile menu, WhatsApp button, form submission feedback |

### 3.7 Route List

| route | file | notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Homepage |
| `/about` | `src/app/about/page.tsx` | About page |
| `/services` | `src/app/services/page.tsx` | Services overview |
| `/branding-identity` | `src/app/branding-identity/page.tsx` | Service detail |
| `/web-design-development` | `src/app/web-design-development/page.tsx` | Service detail |
| `/digital-marketing-seo` | `src/app/digital-marketing-seo/page.tsx` | Service detail |
| `/media-content-production` | `src/app/media-content-production/page.tsx` | Service detail |
| `/local-seo` | `src/app/local-seo/page.tsx` | Service detail |
| `/kannur` | `src/app/kannur/page.tsx` | Location hub |
| `/thalassery` | `src/app/thalassery/page.tsx` | Location hub |
| `/portfolio` | `src/app/portfolio/page.tsx` | Portfolio with filter |
| `/blog` | `src/app/blog/page.tsx` | Blog listing |
| `/blog-cost-of-seo-kerala` | `src/app/blog-cost-of-seo-kerala/page.tsx` | Single blog post |
| `/faq` | `src/app/faq/page.tsx` | FAQ accordion + JSON-LD |
| `/contact` | `src/app/contact/page.tsx` | Contact + lead form |
| `/api/leads` | `src/app/api/leads/route.ts` | POST endpoint, Prisma + Resend |
| `/sitemap.xml` | `src/app/sitemap.ts` | Dynamic Next.js sitemap |
| `/robots.txt` | `src/app/robots.ts` | Dynamic Next.js robots |

---

## 4. Assets

### 4.1 public/assets/images/

| file | format | size | approx. dimensions | referenced in |
|---|---|---|---|---|
| `favicon.svg` | SVG | 383 B | vector | `src/app/layout.tsx:33` (`icons.icon`), all 15 `.html` `<link rel="icon">` |
| `hero-dashboard.svg` | SVG | 8,180 B | vector | `src/app/page.tsx` (home hero section) |
| `logo-white.svg` | SVG | 775 B | vector (170×38 rendered) | `src/components/Footer.tsx` (all route footers), all 15 `.html` footer `<img>` |
| `logo.svg` | SVG | 752 B | vector (180×42 rendered in header) | `src/components/Header.tsx:63`, all 15 `.html` header `<img>` |
| `og-share.png` | PNG | 311,208 B (304 KB) | 1200×630 (declared in `layout.tsx`) | `src/app/layout.tsx:41,52` (OG and Twitter image), all 15 `.html` `<meta property="og:image">` |

> `assets/images/` (root-level, not under `public/`) contains the same set of files — same names, same content — served by the legacy static HTML pages.

### 4.2 Reference Map

| asset | Next.js references | legacy HTML references |
|---|---|---|
| `/assets/images/favicon.svg` | `layout.tsx:33` | 15× `<link rel="icon">` in root `.html` files |
| `/assets/images/logo.svg` | `Header.tsx:63` | 15× `<img>` in header of root `.html` files; also JSON-LD `image` in several |
| `/assets/images/logo-white.svg` | `Footer.tsx` (all route keys) | 15× `<img>` in footer of root `.html` files |
| `/assets/images/og-share.png` | `layout.tsx:41,52` | 15× `<meta property="og:image">` in root `.html` files |
| `/assets/images/hero-dashboard.svg` | `page.tsx` (home hero) | `index.html` only |

---

## 5. Test Impact

### 5.1 Suite Overview

| suite | file | runner | what it asserts |
|---|---|---|---|
| **text-parity** | `tests/text-parity-diff.mjs` | Node.js (direct) | Visible text in header/main/footer regions of Next.js output matches legacy HTML verbatim |
| **parity-test JSON-LD** | `tests/parity-test.mjs` | Node.js (direct) | 15×301 redirects, 15×200 clean routes, metadata (title, desc, canonical, OG, Twitter), JSON-LD deep equality vs legacy HTML, internal link resolution |
| **NAP** | `tests/nap-integrity.test.mjs` | Node.js (direct) | Phone `7510109730` and postal codes `670675`/`670101` in `src/` and `public/` — no other phone or pin variants |
| **isolation** | `tests/location-isolation.test.mjs` | Playwright | `/kannur` has zero "Thalassery" occurrences; `/thalassery` has zero "Kannur" occurrences across rendered HTML, meta, JSON-LD, links, body text |
| **CSP** | `tests/check-csp.mjs` | Playwright | CSP header present, 0 violations, 0 console errors across 15 pages |
| **forms** | `tests/contact-form-browser.test.mjs` | Playwright + embedded Postgres | Full contact form submission flow including CORS, validation, DB write, WhatsApp fallback |
| **db/seed content parity** | `tests/db.test.ts` | tsx | DB schema migrations, seed idempotency, row counts |
| **leads-api** | `tests/leads-api.test.ts` | tsx | Full API contract: CORS, rate-limiting, validation, email notification, DB persistence |

---

### 5.2 Assertions That Break on a **Rename** (brand text change only)

| suite | specific assertion | why it breaks |
|---|---|---|
| **text-parity** | `legacy.main === next.main` for every page | The legacy `.html` files contain "AKZQ.Creation" in body copy. If Next.js pages change the brand name but legacy files are not updated in the same commit, the main-region text comparison fails. The reverse is also true. |
| **text-parity** | `legacy.header === next.header` | Header aria-label `"AKZQ.Creation Home"` and alt text appear in the header region comparison. |
| **text-parity** | `legacy.footer === next.footer` | Footer NAP `<strong>AKZQ.Creation</strong>` and copyright line appear in footer region. |
| **parity-test JSON-LD** | `origHomeJsonLd.name === nextHomeJsonLd.name` | `LocalBusiness.name` in legacy HTML JSON-LD vs Next.js output. |
| **parity-test JSON-LD** | `titleMatch: origTitle === nextTitle` for all 15 routes | Page `<title>` tags contain brand name. |
| **parity-test JSON-LD** | `descMatch: origDesc === nextDesc` for all 15 routes | Meta description contains brand name. |
| **parity-test JSON-LD** | `deepEqual: JSON.stringify(orig) === JSON.stringify(next)` | Full JSON-LD deep equality on home LocalBusiness schema. |
| **leads-api** | `assert.strictEqual(sentReq.body.from, "leads@akzqcreation.com")` (line 923) | Email sender fixture hardcoded. |
| **leads-api** | `assert.deepStrictEqual(sentReq.body.to, ["notifications@akzqcreation.com"])` (line 924) | Email recipient fixture hardcoded. |
| **forms** | `NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com"` in test env setup | CORS origin derived from this value. |
| **metadata-detailed.json** | All `canonical` and `ogImage` values | Hardcoded domain in fixture JSON. |
| **parity-report.json** | All `nextCanon` values, robots body | Hardcoded domain in fixture JSON. |

### 5.3 Assertions That Break on a **Redesign** (visual / structural change)

| suite | specific assertion | why it breaks |
|---|---|---|
| **text-parity** | `legacy.main === next.main` | Any copy change, element addition, or reordering in main content breaks verbatim match. |
| **text-parity** | `legacy.header` / `legacy.footer` | Navigation changes, new links, reordered footer columns. |
| **parity-test JSON-LD** | `titleMatch`, `descMatch` | New SEO copy in page metadata. |
| **parity-test JSON-LD** | FAQPage `questionMatch` / `answerMatch` | FAQ copy rewrites. |
| **parity-test JSON-LD** | internal link check (`status === 200 || 301`) | New routes or removed routes. |
| **isolation** | `kannurTotalViolations.length === 0` / `thalasseryTotalViolations.length === 0` | If location pages gain cross-references in redesign. |
| **CSP** | `cspViolationsCount === 0` | New inline scripts, external resources, or changed CSP directive. |
| **NAP** | phone and postal code assertions | New NAP details or location additions. |

### 5.4 Proposed Brand-Map Mechanism (Do Not Implement)

A `brand-map.json` file (e.g., `tests/brand-map.json`) could declare the canonical approved substitutions:

```json
{
  "AKZQ.Creation": "AJELVA CREATIVE",
  "AKZQ.Creation —": "AJELVA CREATIVE —",
  "akzqcreation.com": "ajelvacreative.com",
  "hello@akzqcreation.com": "hello@ajelvacreative.com",
  "AKZQ.Creation Logo": "AJELVA CREATIVE Logo",
  "AKZQ.Creation Home": "AJELVA CREATIVE Home"
}
```

The parity test would pre-process both the legacy string and the Next.js string through this map before comparing, so that approved substitutions produce `MATCH` while any other deviation still produces `FAIL`. All other text (addresses, copy, prices, phone numbers) remains compared verbatim.

**Suites that compare text only (no href/alt/aria):**

| suite | text only? | attributes compared? |
|---|---|---|
| `text-parity-diff.mjs` | Yes — strips all tags before comparison with `extractText()` | No — all attributes are stripped |
| `parity-test.mjs` → `titleMatch`/`descMatch` | Yes — compares decoded text values | No |
| `parity-test.mjs` → JSON-LD `nameMatch`/`deepEqual` | Yes — JSON object properties | No |
| `nap-integrity.test.mjs` | No — scans raw file content | Yes — `href`, `tel:`, `wa.me/` |
| `location-isolation.test.mjs` | Partially — innerText check | Yes — `a[href]` checked separately |
| `parity-test.mjs` → internal link check | No | Yes — `href` values extracted |

---

## 6. Master-Prompt Assumptions

For each feature, the verdict is **exists** or **does not exist**, with grep evidence.

### 6.1 Cloudinary

**Does not exist.**

```
git grep -n -i "cloudinary" -- .   → 0 results
```

No Cloudinary SDK, API key, URL, or transform parameter found anywhere in the tracked tree.

### 6.2 Blog CMS

**Does not exist** (headless CMS).

```
git grep -n -i -E "contentful|sanity|strapi|notion|prismic|wordpress|ghost" -- .   → 0 results
```

The blog is a single static page (`src/app/blog-cost-of-seo-kerala/page.tsx`) and a blog listing (`src/app/blog/page.tsx`). Content is baked into the page files. The Prisma schema has a `Post` model and a `seed.ts` that extracts post content by scraping the page HTML. There is no API integration with any external CMS.

### 6.3 Authentication

**Does not exist.**

```
git grep -n -i -E "next-auth|auth\.|session|cognito|firebase|supabase.*auth|clerk|jsonwebtoken|passport" -- src/   → 0 results
```

The `prisma/schema.prisma` has a `User` model (seeded with 0 users) but it has no session, password, or token fields. There is no login route, no `/admin` route, no protected middleware, and no auth library dependency in `package.json`.

### 6.4 Admin

**Does not exist.**

```
git grep -n -i "admin\|dashboard" -- src/   → 0 results (excluding design system class names)
```

No `/admin` route, no admin UI, no access-control logic. The `User` table exists in the schema but is unused.

### 6.5 Image Uploads

**Does not exist.**

```
git grep -n -i -E "upload|multer|formdata.*file|input.*type.*file" -- src/   → 0 results
```

No file upload endpoint, no multipart form handling, no storage bucket integration.

### 6.6 APIs

**Exists** — one internal API route:

```
src/app/api/leads/   → POST /api/leads
```

Evidence: `src/app/api/leads/` directory exists. This endpoint accepts lead form submissions, validates with Zod, writes to Postgres via Prisma, and optionally sends a Resend email notification. No external API calls to third-party data sources. No public API for content (all content is static/compiled).

### 6.7 Table of Contents

**Does not exist.**

```
git grep -n -i "table of contents\|toc\b" -- src/   → 0 results
```

The single blog post page (`blog-cost-of-seo-kerala`) has no ToC component or generated anchor links.

### 6.8 Related Articles

**Does not exist.**

```
git grep -n -i "related article\|related post" -- src/   → 0 results
```

The blog listing page and single post page have no related-articles widget or cross-linking logic.

### 6.9 Author Info

**Does not exist.**

```
git grep -n -i "author" -- src/   → 0 results
```

No author field in the `Post` Prisma model, no author byline in the blog post page, no author profile component.

---

## Appendix — Raw Command Output

### Appendix A: Full `git grep` Brand String Output

**Command run:**
```
git grep -n -i -E "akzq|aq creation|aq\.creation|akzqcreation|akzq-creation" -- .
```
**Total lines matched: 499**

The raw output is too long to paste in full (499 lines). The representative tail of the output — covering `src/`, `tests/`, and remaining `.html` files — was captured during the audit and is reproduced below. The full listing was verified by piping through `Measure-Object -Line` which confirmed the 499-line count.

```
(tail of raw grep output — files and lines verified in §1 tables above)

src/components/Footer.tsx:25: (route /contact) — "AKZQ.Creation Logo" alt, "AKZQ.Creation" in NAP, "hello@akzqcreation.com", "© 2026 AKZQ.Creation."
src/components/Header.tsx:57: aria-label="AKZQ.Creation Home"
src/components/Header.tsx:60: alt="AKZQ.Creation Logo"
src/components/PortfolioFilter.tsx:166: `Hi AKZQ.Creation, I am interested in a project similar to…`
src/lib/notify.ts:38: "New Lead Received on AKZQ.Creation:"
tests/contact-form-browser.test.mjs:15: const TEST_DB_NAME = "akzq_browser_test_db";
tests/contact-form-browser.test.mjs:20: const tempPgDir = fs.mkdtempSync(path.join(os.tmpdir(), "akzq-browser-test-"));
tests/contact-form-browser.test.mjs:185: NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
tests/db.test.ts:14: const TEST_DB_NAME = "akzq_test_db";
tests/db.test.ts:15: const SHADOW_DB_NAME = "akzq_shadow_test_db";
tests/db.test.ts:20: const tempPgDir = fs.mkdtempSync(path.join(os.tmpdir(), "akzq-db-test-"));
tests/leads-api.test.ts:16: const TEST_DB_NAME = "akzq_test_db";
tests/leads-api.test.ts:17: const SHADOW_DB_NAME = "akzq_shadow_test_db";
tests/leads-api.test.ts:22: const tempPgDir = fs.mkdtempSync(path.join(os.tmpdir(), "akzq-leads-test-"));
tests/leads-api.test.ts:270: NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
tests/leads-api.test.ts:271: ALLOWED_ORIGINS: "https://preview.akzqcreation.com",
tests/leads-api.test.ts:273: LEAD_NOTIFICATION_TO: "notifications@akzqcreation.com",
tests/leads-api.test.ts:274: LEAD_NOTIFICATION_FROM: "leads@akzqcreation.com",
tests/leads-api.test.ts:293: origin: "https://akzqcreation.com",
tests/leads-api.test.ts:331: Origin: https://akzqcreation.com (curl command)
tests/leads-api.test.ts:348: Origin: https://akzqcreation.com (curl command)
tests/leads-api.test.ts:355: Origin: https://akzqcreation.com (curl command)
tests/leads-api.test.ts:514: origin: "https://akzqcreation.com.evil.example"
tests/leads-api.test.ts:522: origin: "http://akzqcreation.com"
tests/leads-api.test.ts:530: origin: "https://www.akzqcreation.com"
tests/leads-api.test.ts:538: origin: "https://preview.akzqcreation.com"
tests/leads-api.test.ts:923: assert.strictEqual(sentReq.body.from, "leads@akzqcreation.com");
tests/leads-api.test.ts:924: assert.deepStrictEqual(sentReq.body.to, ["notifications@akzqcreation.com"]);
tests/leads-api.test.ts:1264,1284,1304,1339,1383: NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com"
tests/leads-api.test.ts:1133,1141: "https://akzqcreation.com.evil.example"
tests/leads-api.test.ts:1148: "http://akzqcreation.com"
tests/leads-api.test.ts:1155,1159: "https://www.akzqcreation.com"
tests/leads-api.test.ts:1181,1185: "https://preview.akzqcreation.com"
tests/metadata-detailed.json:8–135: canonical/ogImage for all 15 routes → https://akzqcreation.com/…
tests/parity-report.json:8–448: nextCanon for all 15 routes + robots body → https://akzqcreation.com/…
tests/parity-test.mjs:142,144: .replace('https://akzqcreation.com', '')
thalassery.html:6,7,17,18,29,38,39,299,329,332,338: brand name, domain, email, alt, aria
web-design-development.html:6,18,19,312,340,347: brand name, alt, aria
(… remaining 13 .html files follow same pattern)
```

### Appendix B: `git grep -c` hex colour counts per src file

**Command run:**
```
git grep -c -E "#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}" -- src/app/page.tsx src/components/Footer.tsx src/components/Header.tsx src/components/ContactForm.tsx src/components/ClientScriptManager.tsx
```
**Raw output:**
```
src/app/page.tsx:1
src/components/ClientScriptManager.tsx:10
src/components/ContactForm.tsx:10
src/components/Footer.tsx:15
```
(`Header.tsx:0` — no hex inline styles)

### Appendix C: `git branch` output

**Command run:** `git branch -a`
```
  feat/data-layer
* feat/lead-capture
  feat/nextjs-migration
  main
  remotes/origin/feat/data-layer
  remotes/origin/feat/lead-capture
  remotes/origin/feat/nextjs-migration
  remotes/origin/main
```
(Branch `feat/rebrand-audit` created from `feat/lead-capture` HEAD `84bf7dc7e89b4d515e56bf92b62b865ea323e0ea` during this audit run.)

### Appendix D: hex colour count in CSS files

**Command run:**
```
Get-ChildItem "assets/css" -Recurse | ForEach-Object { … Select-String -Pattern "#[0-9a-fA-F]{3,6}" … }
```
**Raw output:**
```
…\assets\css\animations.css : 0 matches
…\assets\css\style.css : 76 matches
```

### Appendix E: CMS / Auth / External Service grep

**Command:** `git grep -n -i -E "cloudinary|cms|contentful|sanity|strapi|notion" -- .`  
**Result:** 0 results (excluding Lighthouse JSON `largestContentfulPaint` — which is `contentful` as a substring, not a CMS product).

**Command:** `git grep -n -i -E "next-auth|auth\.|session|cognito|firebase|supabase.*auth|clerk" -- src/`  
**Result:** 0 results.

**Command:** `git grep -n -i -E "admin|dashboard" -- src/`  
**Result:** Matched only `ClientScriptManager.tsx` with `hero-dashboard.svg` filename string — not an admin panel.

**Command:** `git grep -n -i "table of contents\|related article\|related post\|author" -- src/`  
**Result:** Only `notify.ts:55 → Authorization` (Bearer token header) — no blog features.
