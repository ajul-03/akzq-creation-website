import type { Metadata } from "next";

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
        url: "https://akzqcreation.com/assets/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "AKZQ.Creation — Digital Marketing & Web Agency in Kannur & Thalassery",
      },
    ],
  },
};

export default function FAQPage() {
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
                              "text": "Yes, absolutely. Before any project kicks off, we provide a detailed, itemized fixed-price proposal that outlines all deliverables, milestones, and timelines. As long as the agreed scope does not change, you will never pay a single rupee more than what was quoted in writing. We do not engage in vague hourly billing or surprise end-of-month invoices."
                    }
          },
          {
                    "@type": "Question",
                    "name": "Do you only work with Kannur businesses?",
                    "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "While our core studio is based in Kannur, we actively serve businesses across Thalassery, Payyanur, Kanhangad, Mattannur, and the wider North Malabar region, as well as select regional clients across Kerala and the UAE. We travel regularly for on-site meetings across Kannur and Thalassery."
                    }
          },
          {
                    "@type": "Question",
                    "name": "How is AKZQ.Creation different from a bigger-city agency?",
                    "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "Bigger-city agencies in Kochi or Bangalore often burden local business owners with high metropolitan overhead markups, slow account manager routing, and little understanding of local North Malabar market realities. At AKZQ.Creation, you work directly with senior founders who know your local competitors, understand regional buyer behavior, and are readily reachable right here."
                    }
          },
          {
                    "@type": "Question",
                    "name": "Will I own the final website and files?",
                    "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "Yes, 100% completely. Upon final milestone approval, you receive full intellectual property ownership, complete Figma design master files, production source code repositories, high-resolution vector assets, and full administrative logins. We never hold your assets or domain hostage."
                    }
          },
          {
                    "@type": "Question",
                    "name": "How long does a typical project take?",
                    "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "We provide a realistic, locked timeline during our first consultation. Typically, brand identity projects take 2 to 3 weeks, custom high-speed websites take 2 to 4 weeks, and Local SEO setups launch within 7 to 10 days. We communicate milestone dates clearly and stick to them."
                    }
          },
          {
                    "@type": "Question",
                    "name": "We're a very new startup with a limited budget — can you still help us?",
                    "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "Yes. Our agile startup process is specifically shaped to accommodate early-stage budgets. We help you prioritize high-impact initial deliverables (such as a memorable logo and a high-converting one-page website) so you can launch professionally without burning unnecessary capital."
                    }
          },
          {
                    "@type": "Question",
                    "name": "Do you offer ongoing support after launch?",
                    "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "Yes. Every website build comes with 30 days of free post-launch support and bug fixes. Following that, we offer both one-time on-demand support and flexible month-to-month maintenance retainers with zero lock-in agreements."
                    }
          },
          {
                    "@type": "Question",
                    "name": "Do you have experience with businesses in Thalassery specifically?",
                    "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "Yes, extensively. We actively consult with businesses in Thalassery, including retailers in the high-density Logan Street cluster, professional firms near Court Road, and heritage bakeries and food brands, tailoring our strategies to Thalassery's distinct commercial heritage and customer base."
                    }
          }
]
          }),
        }}
      />
      <div dangerouslySetInnerHTML={{ __html: "<section class=\"hero-section\" style=\"padding-bottom: 30px;\">\n    <div class=\"container text-center\" style=\"max-width: 820px;\">\n      <div class=\"eyebrow\">Direct Transparency</div>\n      <h1 style=\"margin-bottom: 18px;\">Frequently Asked Questions</h1>\n      <p class=\"text-lead\">\n        Straightforward, honest answers to everything you need to know about our fixed pricing, local focus, process, and file ownership.\n      </p>\n\n      <!-- Real-time Search Box -->\n      <div style=\"max-width: 520px; margin: 28px auto 0; position: relative;\">\n        <input type=\"text\" id=\"faqSearchInput\" class=\"form-input\" placeholder=\"Type a keyword to filter questions (e.g. pricing, Thalassery, files)...\" style=\"padding-left: 44px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);\">\n        <svg style=\"position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-secondary);\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg>\n      </div>\n    </div>\n  </section>\n\n  <!-- FAQ LIST -->\n  <section class=\"section\" style=\"padding-top: 20px;\">\n    <div class=\"container faq-container\">\n      <div id=\"faqNoResults\" style=\"display: none; text-align: center; padding: 40px; color: var(--text-secondary);\">\n        <p>No questions matched your search query. <a href=\"/contact\" style=\"color: var(--accent); font-weight: 600;\">Ask us directly on WhatsApp →</a></p>\n      </div>\n\n      <div class=\"faq-list\">\n        <!-- Question 1 -->\n        <div class=\"faq-item active\">\n          <button class=\"faq-question\" aria-expanded=\"true\">\n            <span>1. Do you offer fixed-price quotes?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p><strong>Yes, absolutely.</strong> Before any project kicks off, we provide a detailed, itemized fixed-price proposal that outlines all deliverables, milestones, and timelines. As long as the agreed scope does not change, you will never pay a single rupee more than what was quoted in writing. We do not engage in vague hourly billing or surprise end-of-month invoices.</p>\n          </div>\n        </div>\n\n        <!-- Question 2 -->\n        <div class=\"faq-item\">\n          <button class=\"faq-question\" aria-expanded=\"false\">\n            <span>2. Do you only work with Kannur businesses?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p>While our core studio is based in Kannur, we actively serve businesses across Thalassery, Payyanur, Kanhangad, Mattannur, and the wider North Malabar region, as well as select regional clients across Kerala and the UAE. We travel regularly for on-site meetings across Kannur and Thalassery.</p>\n          </div>\n        </div>\n\n        <!-- Question 3 -->\n        <div class=\"faq-item\">\n          <button class=\"faq-question\" aria-expanded=\"false\">\n            <span>3. How is AKZQ.Creation different from a bigger-city agency?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p>Bigger-city agencies in Kochi or Bangalore often burden local business owners with high metropolitan overhead markups, slow account manager routing, and little understanding of local North Malabar market realities. At AKZQ.Creation, you work directly with senior founders who know your local competitors, understand regional buyer behavior, and are readily reachable right here.</p>\n          </div>\n        </div>\n\n        <!-- Question 4 -->\n        <div class=\"faq-item\">\n          <button class=\"faq-question\" aria-expanded=\"false\">\n            <span>4. Will I own the final website and files?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p><strong>Yes, 100% completely.</strong> Upon final milestone approval, you receive full intellectual property ownership, complete Figma design master files, production source code repositories, high-resolution vector assets, and full administrative logins. We never hold your assets or domain hostage.</p>\n          </div>\n        </div>\n\n        <!-- Question 5 -->\n        <div class=\"faq-item\">\n          <button class=\"faq-question\" aria-expanded=\"false\">\n            <span>5. How long does a typical project take?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p>We provide a realistic, locked timeline during our first consultation. Typically, brand identity projects take 2 to 3 weeks, custom high-speed websites take 2 to 4 weeks, and Local SEO setups launch within 7 to 10 days. We communicate milestone dates clearly and stick to them.</p>\n          </div>\n        </div>\n\n        <!-- Question 6 -->\n        <div class=\"faq-item\">\n          <button class=\"faq-question\" aria-expanded=\"false\">\n            <span>6. We're a very new startup with a limited budget — can you still help us?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p><strong>Yes.</strong> Our agile startup process is specifically shaped to accommodate early-stage budgets. We help you prioritize high-impact initial deliverables (such as a memorable logo and a high-converting one-page website) so you can launch professionally without burning unnecessary capital.</p>\n          </div>\n        </div>\n\n        <!-- Question 7 -->\n        <div class=\"faq-item\">\n          <button class=\"faq-question\" aria-expanded=\"false\">\n            <span>7. Do you offer ongoing support after launch?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p>Yes. Every website build comes with 30 days of free post-launch support and bug fixes. Following that, we offer both one-time on-demand support and flexible month-to-month maintenance retainers with zero lock-in agreements.</p>\n          </div>\n        </div>\n\n        <!-- Question 8 -->\n        <div class=\"faq-item\">\n          <button class=\"faq-question\" aria-expanded=\"false\">\n            <span>8. Do you have experience with businesses in Thalassery specifically?</span>\n            <span class=\"faq-icon\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg></span>\n          </button>\n          <div class=\"faq-answer\">\n            <p><strong>Yes, extensively.</strong> We actively consult with businesses in Thalassery, including retailers in the high-density Logan Street cluster, professional firms near Court Road, and heritage bakeries and food brands, tailoring our strategies to Thalassery's distinct commercial heritage and customer base.</p>\n          </div>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  <!-- STILL HAVE QUESTIONS CTA -->\n  <section class=\"section section-bg-alt\">\n    <div class=\"container\">\n      <div class=\"cta-banner\">\n        <div class=\"cta-banner-content\">\n          <div class=\"eyebrow eyebrow-dark\">Direct Founder Chat</div>\n          <h2>Have a Question Not Listed Here?</h2>\n          <p>We believe in open, direct conversations. Send us a message on WhatsApp or call our studio directly.</p>\n          <div class=\"btn-group\" style=\"justify-content: center;\">\n            <a href=\"https://wa.me/917510109730\" target=\"_blank\" rel=\"noopener\" class=\"btn btn-primary btn-lg\">Ask on WhatsApp</a>\n            <a href=\"/contact\" class=\"btn btn-white-outline btn-lg\">Send a Message</a>\n          </div>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  <!-- FOOTER -->" }} />
    </>
  );
}
