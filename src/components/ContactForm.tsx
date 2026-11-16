"use client";

import React, { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [whatsAppLink, setWhatsAppLink] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const estimates: Record<string, string> = {
    "Branding & Identity":
      "Includes brand discovery, typography guidelines, logo system, full source vector files, and 100% intellectual property transfer.",
    "Web Design & Development":
      "Includes custom mobile-first UI, high-speed lightweight code, SEO-ready architecture, and free post-launch support.",
    "Digital Marketing & SEO":
      "Includes audience mapping for North Malabar, high-intent Google & Meta campaigns, and transparent weekly reporting.",
    "Media & Content Production":
      "Includes on-location photo/video production in Kannur/Thalassery, short-form reels, and commercial copywriting.",
    "Local SEO":
      "Includes Google Business Profile optimization, Kannur & Thalassery local citation building, and review workflows.",
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const service = (formData.get("service") as string) || "";
    const budget = (formData.get("budget") as string) || "Standard Scope";

    if (!name || !email || !service) {
      alert("Please fill in your Name, Email, and select the Required Service.");
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setClientName(name);

      const text = encodeURIComponent(
        `Hi AKZQ.Creation, I am ${name}. I requested a fixed-price quote for ${service}. (Budget Range: ${budget}). Let's discuss!`
      );
      setWhatsAppLink(`https://wa.me/917510109730?text=${text}`);
      setSubmitted(true);
      document.body.style.overflow = "hidden";
      form.reset();
      setSelectedService("");
    }, 600);
  };

  const closeModal = () => {
    setSubmitted(false);
    document.body.style.overflow = "";
  };

  return (
    <>
      <form id="agencyQuoteForm" className="quote-form" onSubmit={handleSubmit}>
        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="clientName">
              Full Name <span className="req">*</span>
            </label>
            <input
              type="text"
              id="clientName"
              name="name"
              required
              placeholder="e.g. Rahul Nambiar"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientEmail">
              Email Address <span className="req">*</span>
            </label>
            <input
              type="email"
              id="clientEmail"
              name="email"
              required
              placeholder="e.g. rahul@business.com"
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="clientPhone">Phone / WhatsApp Number</label>
            <input
              type="tel"
              id="clientPhone"
              name="phone"
              placeholder="e.g. +91 98765 43210"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="serviceRequiredSelect">
              Required Service <span className="req">*</span>
            </label>
            <select
              id="serviceRequiredSelect"
              name="service"
              required
              className="form-control"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="" disabled>
                Select a service
              </option>
              <option value="Branding &amp; Identity">Branding &amp; Identity</option>
              <option value="Web Design &amp; Development">
                Web Design &amp; Development
              </option>
              <option value="Digital Marketing &amp; SEO">
                Digital Marketing &amp; SEO
              </option>
              <option value="Media &amp; Content Production">
                Media &amp; Content Production
              </option>
              <option value="Local SEO">Local SEO (Google Maps Dominance)</option>
              <option value="Complete Agency Growth Package">
                Complete Agency Growth Package
              </option>
            </select>
          </div>
        </div>

        {/* Dynamic scope note */}
        {selectedService && estimates[selectedService] && (
          <div
            id="quoteEstimatorNote"
            className="estimator-note"
            style={{ display: "block" }}
          >
            <strong>Included in Fixed Scope:</strong> {estimates[selectedService]}
          </div>
        )}

        <div className="form-group">
          <label>Estimated Project Budget Range</label>
          <div className="budget-options">
            <label className="budget-radio">
              <input type="radio" name="budget" value="Starter (₹15k - ₹30k)" />
              <span>₹15,000 &ndash; ₹30,000</span>
            </label>
            <label className="budget-radio">
              <input
                type="radio"
                name="budget"
                value="Growth (₹30k - ₹60k)"
                defaultChecked
              />
              <span>₹30,000 &ndash; ₹60,000</span>
            </label>
            <label className="budget-radio">
              <input
                type="radio"
                name="budget"
                value="Scale / Enterprise (₹60k+)"
              />
              <span>₹60,000+</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="projectDetails">
            Tell Us About Your Business &amp; Goals
          </label>
          <textarea
            id="projectDetails"
            name="details"
            rows={4}
            placeholder="Share your current challenges, location (e.g. Kannur Fort Road, Thalassery Logan St), timeline expectations, and any references..."
            className="form-control"
          ></textarea>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-submit"
          disabled={submitting}
        >
          {submitting ? "Preparing Fixed Proposal..." : "Request Fixed-Price Proposal"}
        </button>

        <p className="form-privacy-note">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          No spam. You will receive an itemized proposal within 24 business hours.
        </p>
      </form>

      {/* Success Modal */}
      {submitted && (
        <div
          id="formSuccessModal"
          className="modal-overlay"
          style={{ display: "flex" }}
        >
          <div className="modal-card">
            <div className="modal-icon-wrap">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF6A2B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 className="modal-title">Fixed Quote Request Received!</h3>
            <p className="modal-text">
              Thank you, <strong>{clientName}</strong>. Our team is preparing your
              transparent, itemized fixed-price proposal. We will contact you
              within 24 hours.
            </p>
            <div className="modal-actions">
              <a
                id="successWhatsAppBtn"
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Discuss Faster on WhatsApp &rarr;
              </a>
              <button
                type="button"
                id="closeSuccessModal"
                className="btn btn-outline"
                onClick={closeModal}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
