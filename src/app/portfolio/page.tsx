import type { Metadata } from "next";
import { PortfolioFilter } from "@/components/PortfolioFilter";

export const metadata: Metadata = {
  title: "Portfolio & Case Studies — AKZQ.Creation | Transparent Design Standards",
  description: "Explore AKZQ.Creation's concept case studies and design standards across branding, high-speed web development, local SEO, and media production for North Malabar businesses.",
  alternates: {
    canonical: "https://akzqcreation.com/portfolio",
  },
  openGraph: {
    title: "Portfolio & Case Studies — AKZQ.Creation | Transparent Design Standards",
    description: "Explore AKZQ.Creation's concept case studies and design standards across branding, high-speed web development, local SEO, and media production for North Malabar businesses.",
    url: "https://akzqcreation.com/portfolio",
      images: [
      {
        url: "https://akzqcreation.com/assets/images/logo.svg",
        width: 1200,
        height: 630,
        alt: "AKZQ.Creation — Digital Marketing & Web Agency in Kannur & Thalassery",
      },
    ],
  },
};

const projectsData = [
  {
    "id": "p1",
    "category": "branding",
    "categoryName": "Branding & Identity",
    "title": "Malabar Heritage Hospitality",
    "client": "Boutique Resort / Kannur Coastal Zone",
    "scope": "Visual Identity & Luxury Brand Guidelines",
    "problem": "A high-end heritage resort in North Malabar lacked a distinctive visual presence, losing affluent travelers to generic hotel chains.",
    "solution": "Engineered a refined, warm visual identity system marrying traditional Malabar architecture motifs with modern minimalist typography.",
    "deliverables": [
      "Master Vector Logo System (SVG/AI/EPS)",
      "Color Token Architecture & Type Scale",
      "Bilingual Brand Guidelines Book",
      "Signage & Stationary Print Specs"
    ],
    "metrics": [
      "100% Vector Source Files Delivered",
      "Full Copyright Assignment Transferred",
      "Zero Hidden Retainers"
    ],
    "tags": [
      "Branding",
      "Hospitality",
      "Print System"
    ]
  },
  {
    "id": "p2",
    "category": "web",
    "categoryName": "Web Development",
    "title": "Logan Street Flagship Apparel",
    "client": "Multi-Store Fashion Retailer / Thalassery",
    "scope": "High-Performance Ecommerce Showcase",
    "problem": "The client suffered from a bloated, slow WordPress storefront with 6-second load times that repelled mobile shoppers on 4G networks.",
    "solution": "Designed and built an ultra-fast custom web application loading in under 1.2 seconds, featuring instant product filter workflows.",
    "deliverables": [
      "Custom Mobile-First Interface",
      "Sub-1.2s Page Load Optimization",
      "Integrated WhatsApp Instant Order Gateway",
      "Local SEO Structured Product Schema"
    ],
    "metrics": [
      "Lighthouse Performance: 99/100",
      "Zero Ongoing Plugin License Fees",
      "Direct Mobile WhatsApp Order Conversions"
    ],
    "tags": [
      "Web Design",
      "Mobile-First",
      "High-Speed"
    ]
  },
  {
    "id": "p3",
    "category": "marketing",
    "categoryName": "Digital Marketing & SEO",
    "title": "North Malabar Multi-Speciality Clinic",
    "client": "Healthcare Provider / Kannur South Bazaar",
    "scope": "Local Search Optimization & Patient Acquisition",
    "problem": "The clinic was virtually invisible on Google Maps for high-intent queries like 'pediatrician near me' or 'orthopedic doctor Kannur'.",
    "solution": "Implemented an aggressive Local SEO citation roadmap, Google Business Profile audit, and targeted local search ad campaigns.",
    "deliverables": [
      "Top 3 Google Local Pack Rankings for 14 Keywords",
      "Cleaned & Unified 45+ Local Directory Citations",
      "Review Funnel Automation System",
      "Transparent Weekly Cost-per-Acquisition Dashboard"
    ],
    "metrics": [
      "+184% Inbound Patient Calls in 90 Days",
      "Top 3 Local 3-Pack Rankings",
      "Fixed Monthly Retainer Without Markup"
    ],
    "tags": [
      "Local SEO",
      "Google Ads",
      "Healthcare"
    ]
  },
  {
    "id": "p4",
    "category": "media",
    "categoryName": "Media & Production",
    "title": "Artisanal Roastery & Cafe",
    "client": "Specialty Cafe / Thalassery Beach Road",
    "scope": "Commercial Photography & Short-Form Video Reels",
    "problem": "The cafe had exceptional coffee and ambiance but their social media presence consisted of amateur, poorly-lit smartphone photos.",
    "solution": "Conducted an on-location 4K video shoot and commercial food/beverage photography, creating a 60-day visual asset bank.",
    "deliverables": [
      "15 High-Definition Instagram Reels (Color-Graded)",
      "65 Commercial-Grade Product & Interior Photos",
      "Social Media Copywriting & Content Calendar",
      "Raw 4K Video Archive Ownership"
    ],
    "metrics": [
      "600k+ Regional Video Views Across Malabar",
      "3x Engagement Rate on Social Feeds",
      "All Master RAW Assets Transferred"
    ],
    "tags": [
      "Media Production",
      "4K Video",
      "Reels"
    ]
  },
  {
    "id": "p5",
    "category": "web",
    "categoryName": "Web Development",
    "title": "Malabar Export & Spice Logistics",
    "client": "Trade & Export Firm / Kannur",
    "scope": "B2B Corporate Portal & Digital Catalog",
    "problem": "International buyers from the Middle East found the client's previous website outdated, unsecure, and difficult to navigate on mobile.",
    "solution": "Built a sleek, authoritative corporate B2B web application with itemized export product specifications and direct inquiry forms.",
    "deliverables": [
      "B2B Product Inquiry Routing Architecture",
      "Enterprise Security & SSL Hardening",
      "Multi-Currency Specs & Country-Specific Catalogs",
      "Full Source Code Repo Transfer"
    ],
    "metrics": [
      "Sub-1.0s Worldwide TTFB",
      "100% Client Ownership of Codebase",
      "Zero Monthly Hosting Lock-ins"
    ],
    "tags": [
      "B2B Web",
      "Corporate",
      "Clean Code"
    ]
  },
  {
    "id": "p6",
    "category": "branding",
    "categoryName": "Branding & Identity",
    "title": "Thalassery Coastal Artisanal Bakers",
    "client": "Heritage Bakery & Confectionery",
    "scope": "Brand Modernization & Packaging Architecture",
    "problem": "A multi-decade Thalassery bakery wanted to modernize packaging for contemporary retail shelves without alienating loyal heritage customers.",
    "solution": "Refined the historic heritage brand mark into an elegant modern emblem, standardizing eco-friendly product packaging and boxes.",
    "deliverables": [
      "Modernized Heritage Vector Insignia",
      "Full Packaging Die-Cut Print Blueprints",
      "Retail Display Signage Guidelines",
      "Trademark-Ready Master Vector Deliverables"
    ],
    "metrics": [
      "3 Complete Packaging Product Lines",
      "Seamless Shelf Modernization",
      "Fixed Project Scope & Price"
    ],
    "tags": [
      "Packaging",
      "Rebrand",
      "Retail"
    ]
  }
];

export default function PortfolioPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Proven Standards</span>
          <h1 className="hero-title">Selected Concept Projects &amp; Case Studies.</h1>
          <p className="hero-subtext">
            Explore our project blueprints. While we are an agile startup agency, every concept is built to rigorous production standards &mdash; sub-second loading, clean vector branding, and transparent deliverables.
          </p>
        </div>
      </section>

      <section className="portfolio-section">
        <div className="container">
          <PortfolioFilter projects={projectsData} />
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-box">
          <span className="eyebrow">Ready for Your Project?</span>
          <h2 className="cta-title">Get a Fixed-Price Proposal.</h2>
          <p className="cta-subtext">
            Whether launching a new business on Logan Street or expanding your Kannur enterprise, we provide transparent costs and clear milestones.
          </p>
          <div className="cta-actions">
            <a href="/contact" className="btn btn-primary">Start Your Project &rarr;</a>
            <a href="https://wa.me/917510109730" target="_blank" rel="noopener noreferrer" className="btn btn-outline">WhatsApp Consultation</a>
          </div>
        </div>
      </section>
    </>
  );
}
