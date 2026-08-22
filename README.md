# AKZQ.Creation — Production Agency Website

A clean, modern, high-converting website built for **AKZQ.Creation**, a digital marketing and creative agency based in Kannur, Kerala, serving businesses across Kannur, Thalassery, and North Malabar.

---

## 🚀 Key Brand & Design Principles

- **Core Positioning**: Transparent, fixed-price quotes and a visibly honest process.
- **Brand Palette**:
  - Primary Background: Clean White / Off-White (`#FFFFFF` / `#FAFAFA`)
  - Primary Text: Near-black Charcoal (`#15151A`)
  - Secondary Text: Muted Neutral Gray (`#6B6B76`)
  - Signature Accent: Vibrant Brand Orange (`#FF6A2B`)
  - Card Surfaces: Light Gray (`#F5F5F7`) with refined borders (`#E4E4E9`)
- **Typography**: Google Fonts *Poppins* (Weights: 400, 500, 600, 700, 800)
- **Local Nuance & Isolation**:
  - `kannur.html`: References Kannur's commercial zones (South Bazaar, Fort Road, Caltex Junction, Thavakkara) with **zero mention of Thalassery**.
  - `thalassery.html`: References Thalassery's **Logan Street retail cluster**, Court Road, and trade heritage with **zero mention of Kannur**.

---

## 📁 Complete Website Pages

1. **`index.html`** — Homepage with hero dashboard, 4 trust cards, 5 core services, 4-step process, Logan Street local trust section, concept portfolio preview, testimonials, FAQ preview, and footer.
2. **`about.html`** — About page with founder-led startup positioning, Honest Manifesto, and local agility pillars.
3. **`services.html`** — Services overview with fixed-pricing philosophy and deliverable checklists.
4. **`branding-identity.html`** — Service 1: Branding & Identity (logos, typography, color tokens, brand guidelines, and 100% vector master files).
5. **`web-design-development.html`** — Service 2: Web Design & Development (sub-1.5s load speeds, mobile UX, and clean code).
6. **`digital-marketing-seo.html`** — Service 3: Digital Marketing & SEO (Google Search ads, Meta/Instagram performance campaigns, and zero vanity metrics).
7. **`media-content-production.html`** — Service 4: Media & Content Production (4K video reels, commercial photography, and regional copywriting).
8. **`local-seo.html`** — Service 5: Local SEO (Google Maps Top 3 local pack dominance, citation consistency, and review workflows).
9. **`kannur.html`** — Dedicated Kannur location hub.
10. **`thalassery.html`** — Dedicated Thalassery location hub.
11. **`portfolio.html`** — Case studies with "Concept Project" badges, category filter tabs, and interactive scope modal inspector.
12. **`blog.html`** — Blog listing with North Malabar-localized topics.
13. **`blog-cost-of-seo-kerala.html`** — Featured in-depth pricing guide: *"How Much Does SEO Cost in Kerala?"*.
14. **`faq.html`** — FAQ page with interactive accordion, live search filter, exact 8 questions, and `FAQPage` JSON-LD schema.
15. **`contact.html`** — Full quote & inquiry form with 5 services dropdown, budget picker, real NAP block, business hours, coverage map, and WhatsApp integration.

---

## 🛠️ Assets & Architecture

```
akzq.creation/
├── assets/
│   ├── css/
│   │   ├── style.css         # Complete design system & responsive rules
│   │   └── animations.css    # Subtle micro-interactions & transitions
│   ├── js/
│   │   ├── main.js           # Header dynamics & mobile drawer
│   │   ├── faq.js            # Accordion & live search
│   │   ├── portfolio.js      # Filter tabs & modal case study inspector
│   │   └── contact.js        # Quote estimation & WhatsApp dispatch
│   └── images/
│       ├── logo.svg          # Brand logo for light backgrounds
│       ├── logo-white.svg    # Brand logo for dark backgrounds & footer
│       ├── favicon.svg       # Favicon icon
│       └── hero-dashboard.svg# Growth chart & transparency metrics visual
├── sitemap.xml               # Search engine sitemap
├── robots.txt                # Robots indexing directives
└── [15 HTML Pages]
```

---

## ⚡ How to Run Locally

Because this project is built using modern standard Vanilla HTML5, CSS3, and JavaScript, you can open any `.html` file directly in your browser:

- Double-click `index.html` to open in Chrome, Safari, Edge, or Firefox.
- Or use any local static server:
  ```bash
  # Python 3
  python -m http.server 8000

  # Node.js npx serve
  npx serve .
  ```

---

## 🌐 Instant Deployment Options

- **GitHub Pages**: Push this directory to a GitHub repository and enable GitHub Pages under *Settings > Pages*.
- **Vercel / Netlify / Cloudflare Pages**: Drag and drop the `akzq.creation` folder into the dashboard for zero-configuration instant SSL deployment.
- **cPanel / Web Hosting**: Upload the contents directly into `public_html`.
