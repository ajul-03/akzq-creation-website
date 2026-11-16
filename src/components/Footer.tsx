import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {/* Brand & Manifesto Column */}
        <div className="footer-col footer-col-brand">
          <Link href="/" className="footer-logo" aria-label="AKZQ.Creation Home">
            <img
              src="/assets/images/logo-white.svg"
              alt="AKZQ.Creation"
              width="170"
              height="40"
            />
          </Link>
          <p className="footer-desc">
            North Malabar’s transparent creative &amp; digital growth agency.
            Providing fixed-price quotes, honest timelines, and measurable
            outcomes for businesses in Kannur, Thalassery, and beyond.
          </p>
          <div className="footer-badges">
            <span className="badge badge-outline">Zero Hidden Fees</span>
            <span className="badge badge-outline">100% IP Transfer</span>
          </div>
        </div>

        {/* Core Services Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Services</h4>
          <ul className="footer-links">
            <li>
              <Link href="/branding-identity">Branding &amp; Identity</Link>
            </li>
            <li>
              <Link href="/web-design-development">
                Web Design &amp; Development
              </Link>
            </li>
            <li>
              <Link href="/digital-marketing-seo">
                Digital Marketing &amp; SEO
              </Link>
            </li>
            <li>
              <Link href="/media-content-production">
                Media &amp; Content Production
              </Link>
            </li>
            <li>
              <Link href="/local-seo">Local SEO (Google Maps)</Link>
            </li>
          </ul>
        </div>

        {/* Local Hubs & Agency Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Locations &amp; Info</h4>
          <ul className="footer-links">
            <li>
              <Link href="/kannur">Kannur Studio (Caltex)</Link>
            </li>
            <li>
              <Link href="/thalassery">Thalassery Hub (Logan St)</Link>
            </li>
            <li>
              <Link href="/about">About Agency &amp; Manifesto</Link>
            </li>
            <li>
              <Link href="/portfolio">Portfolio &amp; Case Studies</Link>
            </li>
            <li>
              <Link href="/blog">Blog &amp; Insights</Link>
            </li>
            <li>
              <Link href="/faq">Frequently Asked Questions</Link>
            </li>
          </ul>
        </div>

        {/* Contact & NAP Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Get in Touch</h4>
          <div className="footer-contact-item">
            <strong>Phone:</strong>
            <a href="tel:+917510109730">+91 7510109730</a>
          </div>
          <div className="footer-contact-item">
            <strong>WhatsApp:</strong>
            <a
              href="https://wa.me/917510109730"
              target="_blank"
              rel="noopener noreferrer"
            >
              +91 7510109730 (Fast Reply)
            </a>
          </div>
          <div className="footer-contact-item">
            <strong>Location:</strong>
            <a
              href="https://maps.app.goo.gl/VG7GxtuddrXFstY56"
              target="_blank"
              rel="noopener noreferrer"
            >
              SN Park Road, Near Caltex Junction, Kannur, Kerala 670002
            </a>
          </div>
          <div className="footer-contact-item">
            <strong>Hours:</strong>
            <span>Mon &ndash; Sat: 9:00 AM &ndash; 6:30 PM</span>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="copyright">
          &copy; {new Date().getFullYear()} AKZQ.Creation. All rights reserved.
          Transparent digital growth for North Malabar.
        </p>
        <div className="footer-bottom-links">
          <Link href="/faq">Pricing Transparency</Link>
          <Link href="/contact">Request Fixed Proposal</Link>
        </div>
      </div>
    </footer>
  );
}
