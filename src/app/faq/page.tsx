import type { Metadata } from "next";
import { FAQAccordion } from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — AKZQ.Creation | Kannur & Thalassery",
  description: "Get honest answers to common questions about fixed pricing, timelines, ownership, Thalassery & Logan Street experience, and how AKZQ.Creation works.",
  alternates: {
    canonical: "https://akzqcreation.com/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions — AKZQ.Creation | Kannur & Thalassery",
    description: "Get honest answers to common questions about fixed pricing, timelines, ownership, Thalassery & Logan Street experience, and how AKZQ.Creation works.",
    url: "https://akzqcreation.com/faq",
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

const faqData = [
  {
    id: "faq-1",
    category: "pricing",
    question: "Do you offer fixed-price quotes?",
    answer: "Yes. Every project begins with an itemized, clear fixed-price proposal that outlines all deliverables, milestones, and timelines. As long as the agreed scope does not change, you will never pay a single rupee more than what was quoted."
  },
  {
    id: "faq-2",
    category: "general",
    question: "Do you only work with Kannur businesses?",
    answer: "No. While our studio is based in Kannur, we actively serve businesses across Thalassery, Payyanur, Kanhangad, Mattannur, and the wider North Malabar region, as well as select clients across Kerala and the UAE."
  },
  {
    id: "faq-3",
    category: "general",
    question: "How is AKZQ.Creation different from a bigger-city agency?",
    answer: "Unlike agencies in Kochi or Bangalore with high overheads and layers of junior account handlers, AKZQ.Creation offers direct founder access, deep North Malabar market understanding, local in-person meetings, and fast startup agility."
  },
  {
    id: "faq-4",
    category: "process",
    question: "Will I own the final website and files?",
    answer: "Yes, completely. At project handoff, you receive 100% intellectual property ownership, all Figma design files, vector logo assets, source code repositories, and administrative logins."
  },
  {
    id: "faq-5",
    category: "process",
    question: "How long does a typical project take?",
    answer: "We provide a realistic, locked timeline at your first consultation. Brand identity projects typically take 2-3 weeks, custom website builds take 2-4 weeks, and Local SEO setups launch within 7-10 days."
  },
  {
    id: "faq-6",
    category: "pricing",
    question: "We're a very new startup with a limited budget — can you still help us?",
    answer: "Yes. Our agile process is specifically shaped to accommodate early-stage startups. We prioritize high-impact initial deliverables (e.g. core brand mark and a high-converting single-page website) so you can launch professionally without overextending capital."
  },
  {
    id: "faq-7",
    category: "process",
    question: "Do you offer ongoing support after launch?",
    answer: "Yes. Every web project includes 30 days of free post-launch support and bug fixes. After that, we offer both one-time support packages and flexible month-to-month maintenance options with no long-term lock-in."
  },
  {
    id: "faq-8",
    category: "general",
    question: "Do you have experience with businesses in Thalassery specifically?",
    answer: "Yes. We actively work with Thalassery enterprises, including the Logan Street retail cluster, Court Road commercial firms, and heritage bakery/hospitality brands, tailoring our strategies to Thalassery's distinct commercial heritage."
  }
];

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do you offer fixed-price quotes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Every project begins with an itemized, clear fixed-price proposal that outlines all deliverables, milestones, and timelines. As long as the agreed scope does not change, you will never pay a single rupee more than what was quoted."
        }
      },
      {
        "@type": "Question",
        "name": "Do you only work with Kannur businesses?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. While our studio is based in Kannur, we actively serve businesses across Thalassery, Payyanur, Kanhangad, Mattannur, and the wider North Malabar region, as well as select clients across Kerala and the UAE."
        }
      },
      {
        "@type": "Question",
        "name": "How is AKZQ.Creation different from a bigger-city agency?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Unlike agencies in Kochi or Bangalore with high overheads and layers of junior account handlers, AKZQ.Creation offers direct founder access, deep North Malabar market understanding, local in-person meetings, and fast startup agility."
        }
      },
      {
        "@type": "Question",
        "name": "Will I own the final website and files?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, completely. At project handoff, you receive 100% intellectual property ownership, all Figma design files, vector logo assets, source code repositories, and administrative logins."
        }
      },
      {
        "@type": "Question",
        "name": "How long does a typical project take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide a realistic, locked timeline at your first consultation. Brand identity projects typically take 2-3 weeks, custom website builds take 2-4 weeks, and Local SEO setups launch within 7-10 days."
        }
      },
      {
        "@type": "Question",
        "name": "We're a very new startup with a limited budget — can you still help us?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Our agile process is specifically shaped to accommodate early-stage startups. We prioritize high-impact initial deliverables (e.g. core brand mark and a high-converting single-page website) so you can launch professionally without overextending capital."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer ongoing support after launch?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Every web project includes 30 days of free post-launch support and bug fixes. After that, we offer both one-time support packages and flexible month-to-month maintenance options with no long-term lock-in."
        }
      },
      {
        "@type": "Question",
        "name": "Do you have experience with businesses in Thalassery specifically?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We actively work with Thalassery enterprises, including the Logan Street retail cluster, Court Road commercial firms, and heritage bakery/hospitality brands, tailoring our strategies to Thalassery's distinct commercial heritage."
        }
      }
    ]
  }),
        }}
      />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Clarity &amp; Transparency</span>
          <h1 className="hero-title">Frequently Asked Questions.</h1>
          <p className="hero-subtext">
            Transparent answers regarding our fixed-price policy, ownership transfer, timelines, local North Malabar presence, and project workflow.
          </p>
        </div>
      </section>

      <section className="faq-page-section">
        <div className="container faq-container">
          <FAQAccordion items={faqData} />
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-box">
          <span className="eyebrow">Still Have Questions?</span>
          <h2 className="cta-title">Talk to Us Directly.</h2>
          <p className="cta-subtext">
            We are always happy to discuss project scopes, feasibility, and realistic budgets over a quick phone call or coffee in Kannur or Thalassery.
          </p>
          <div className="cta-actions">
            <a href="/contact" className="btn btn-primary">Request Fixed Quote &rarr;</a>
            <a href="https://wa.me/917510109730" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Chat on WhatsApp</a>
          </div>
        </div>
      </section>
    </>
  );
}
