import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us & Get a Fixed Quote — AKZQ.Creation | Kannur & Thalassery",
  description: "Request a fixed-price proposal from AKZQ.Creation. Located near Caltex Junction, Kannur, serving Kannur, Thalassery, and North Malabar. Fast 24-hour proposal turnaround.",
  alternates: {
    canonical: "https://akzqcreation.com/contact",
  },
  openGraph: {
    title: "Contact Us & Get a Fixed Quote — AKZQ.Creation | Kannur & Thalassery",
    description: "Request a fixed-price proposal from AKZQ.Creation. Located near Caltex Junction, Kannur, serving Kannur, Thalassery, and North Malabar. Fast 24-hour proposal turnaround.",
    url: "https://akzqcreation.com/contact",
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

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Get In Touch</span>
          <h1 className="hero-title">Start with a Fixed-Price Quote.</h1>
          <p className="hero-subtext">
            Tell us about your project, timeline, and goals. We will reply within 24 hours with an itemized, clear proposal &mdash; zero hidden costs, zero surprises.
          </p>
        </div>
      </section>

      <section className="contact-section">
        <div className="container contact-grid">
          <div className="contact-form-wrapper">
            <h2 className="section-title">Request a Fixed Quote</h2>
            <p className="text-muted">
              Select your required services and budget range below. We guarantee 100% transparent pricing and direct founder communication.
            </p>
            <ContactForm />
          </div>

          <div className="contact-info-wrapper">
            <div className="contact-info-card">
              <h3 className="card-title">Studio &amp; Regional Hub</h3>
              <p className="text-muted">
                Based near Caltex Junction, Kannur, we actively serve businesses across Kannur, Thalassery, Payyanur, and North Malabar.
              </p>

              <div className="nap-block">
                <div className="nap-item">
                  <span className="nap-label">Agency Name:</span>
                  <span className="nap-val">AKZQ.Creation</span>
                </div>
                <div className="nap-item">
                  <span className="nap-label">Direct Phone:</span>
                  <span className="nap-val"><a href="tel:+917510109730">+91 7510109730</a></span>
                </div>
                <div className="nap-item">
                  <span className="nap-label">Fast WhatsApp:</span>
                  <span className="nap-val"><a href="https://wa.me/917510109730" target="_blank" rel="noopener noreferrer">+91 7510109730</a></span>
                </div>
                <div className="nap-item">
                  <span className="nap-label">Google Maps:</span>
                  <span className="nap-val"><a href="https://maps.app.goo.gl/VG7GxtuddrXFstY56" target="_blank" rel="noopener noreferrer">View Caltex / SN Park Studio &rarr;</a></span>
                </div>
                <div className="nap-item">
                  <span className="nap-label">Business Hours:</span>
                  <span className="nap-val">Monday &ndash; Saturday: 9:00 AM &ndash; 6:30 PM</span>
                </div>
              </div>

              <div className="local-coverage-notice">
                <h4>In-Person Consultations</h4>
                <p>
                  Prefer to meet face-to-face? We schedule in-person project scoping meetings anywhere along Kannur Fort Road, South Bazaar, Thavakkara, or Thalassery Logan Street.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
