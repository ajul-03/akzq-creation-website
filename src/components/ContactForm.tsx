"use client";

import React, { useState, useEffect } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [whatsAppLink, setWhatsAppLink] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [fallbackError, setFallbackError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [renderTime, setRenderTime] = useState<number>(Date.now());
  const [referrerOnMount, setReferrerOnMount] = useState<string | null>(null);

  useEffect(() => {
    setRenderTime(Date.now());
    if (typeof document !== "undefined") {
      setReferrerOnMount(document.referrer || null);
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFallbackError(false);
    setValidationError(null);
    setInvalidFields({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const company = (formData.get("company") as string)?.trim() || null;
    const service = (formData.get("service") as string) || "";
    const budget = (formData.get("budget") as string) || "Growth (₹30k - ₹60k)";
    const message = (formData.get("details") as string)?.trim() || null;
    const hp_field = (formData.get("hp_field") as string) || "";
    const elapsedMs = Date.now() - renderTime;

    if (!name || !email || !service) {
      const inv: Record<string, boolean> = {};
      if (!name) inv.name = true;
      if (!email) inv.email = true;
      if (!service) inv.service = true;
      setInvalidFields(inv);
      setValidationError("Please fill in your Name, Email, and select the Required Service.");
      return;
    }

    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const utmSource = urlParams?.get("utm_source") || null;
    const utmMedium = urlParams?.get("utm_medium") || null;
    const utmCampaign = urlParams?.get("utm_campaign") || null;
    const referrer = referrerOnMount;

    setSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          service,
          budgetRange: budget,
          message,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer,
          hp_field,
          elapsedMs,
        }),
      });

      if (response.status === 201) {
        setSubmitting(false);
        setClientName(name);

        const text = encodeURIComponent(
          `Hi AKZQ.Creation, I am ${name}. I requested a fixed-price quote for ${service}. (Budget Range: ${budget}). Let's discuss!`
        );
        setWhatsAppLink(`https://wa.me/917510109730?text=${text}`);
        setSubmitted(true);
        if (typeof document !== "undefined") {
          document.body.style.overflow = "hidden";
        }
        form.reset();
        setSelectedService("");
        return;
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        setSubmitting(false);
        try {
          const data = await response.json();
          if (data.errors && typeof data.errors === "object") {
            const inv: Record<string, boolean> = {};
            for (const k of Object.keys(data.errors)) {
              inv[k] = true;
            }
            setInvalidFields(inv);
          }
        } catch {}
        setValidationError("Please fill in your Name, Email, and select the Required Service.");
        return;
      }

      // 429, 503, or other error
      setSubmitting(false);
      setFallbackError(true);
    } catch {
      // Network failure
      setSubmitting(false);
      setFallbackError(true);
    }
  };

  const closeModal = () => {
    setSubmitted(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  return (
    <>
      <form id="agencyQuoteForm" className="quote-form" onSubmit={handleSubmit}>
        {/* Off-screen honeypot input */}
        <input
          type="text"
          name="hp_field"
          tabIndex={-1}
          autoComplete="off"
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
          aria-hidden="true"
        />

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
              aria-invalid={invalidFields.name ? "true" : undefined}
              style={invalidFields.name ? { borderColor: "#e53e3e" } : undefined}
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
              aria-invalid={invalidFields.email ? "true" : undefined}
              style={invalidFields.email ? { borderColor: "#e53e3e" } : undefined}
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
              placeholder="e.g. +91 75101 09730"
              className="form-control"
              aria-invalid={invalidFields.phone ? "true" : undefined}
              style={invalidFields.phone ? { borderColor: "#e53e3e" } : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientCompany">Company / Business Name</label>
            <input
              type="text"
              id="clientCompany"
              name="company"
              placeholder="e.g. Malabar Retail Co."
              className="form-control"
              aria-invalid={invalidFields.company ? "true" : undefined}
              style={invalidFields.company ? { borderColor: "#e53e3e" } : undefined}
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
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
              aria-invalid={invalidFields.service ? "true" : undefined}
              style={invalidFields.service ? { borderColor: "#e53e3e" } : undefined}
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
              <option value="Multi-Service Custom Package">
                Multi-Service Custom Package
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

        {/* Validation error on client/server 400 */}
        {validationError && (
          <div
            id="formValidationError"
            className="form-error"
            style={{
              padding: "12px 16px",
              marginBottom: "16px",
              borderRadius: "6px",
              backgroundColor: "rgba(229, 62, 62, 0.1)",
              border: "1px solid rgba(229, 62, 62, 0.3)",
              color: "#e53e3e",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            {validationError}
          </div>
        )}

        {/* Fallback error line on 429/503/network failure */}
        {fallbackError && (
          <div
            id="formFallbackError"
            className="form-error"
            style={{
              padding: "12px 16px",
              marginBottom: "16px",
              borderRadius: "6px",
              backgroundColor: "rgba(229, 62, 62, 0.1)",
              border: "1px solid rgba(229, 62, 62, 0.3)",
              color: "#e53e3e",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            We couldn't send your message just now. Please call{" "}
            <a
              href="tel:+917510109730"
              style={{ color: "#e53e3e", fontWeight: 600, textDecoration: "underline" }}
            >
              +91 75101 09730
            </a>{" "}
            or message us on{" "}
            <a
              href="https://wa.me/917510109730"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e53e3e", fontWeight: 600, textDecoration: "underline" }}
            >
              WhatsApp
            </a>
            .
          </div>
        )}

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
