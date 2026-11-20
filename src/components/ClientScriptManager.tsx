"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ClientScriptManager() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. FAQ accordion & search
    const faqItems = document.querySelectorAll<HTMLElement>(".faq-item");
    faqItems.forEach((item) => {
      const btn = item.querySelector<HTMLButtonElement>(".faq-question");
      if (!btn) return;
      const handler = () => {
        const isActive = item.classList.contains("active");
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove("active");
            other.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
          }
        });
        if (isActive) {
          item.classList.remove("active");
          btn.setAttribute("aria-expanded", "false");
        } else {
          item.classList.add("active");
          btn.setAttribute("aria-expanded", "true");
        }
      };
      btn.addEventListener("click", handler);
    });

    const searchInput = document.getElementById("faqSearchInput") as HTMLInputElement | null;
    const noResultsMsg = document.getElementById("faqNoResults");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
        let count = 0;
        faqItems.forEach((item) => {
          const q = item.querySelector(".faq-question")?.textContent?.toLowerCase() || "";
          const a = item.querySelector(".faq-answer")?.textContent?.toLowerCase() || "";
          if (q.includes(query) || a.includes(query)) {
            item.style.display = "block";
            count++;
          } else {
            item.style.display = "none";
          }
        });
        if (noResultsMsg) noResultsMsg.style.display = count === 0 ? "block" : "none";
      });
    }

    // 2. Portfolio filter & modal
    const filterBtns = document.querySelectorAll<HTMLButtonElement>(".portfolio-filter-btn");
    const projectCards = document.querySelectorAll<HTMLElement>(".portfolio-card");
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filterValue = btn.getAttribute("data-filter");
        projectCards.forEach((card) => {
          const cat = card.getAttribute("data-category");
          if (filterValue === "all" || cat === filterValue) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        });
      });
    });

    const modal = document.getElementById("projectModal");
    const modalBody = document.getElementById("projectModalBody");
    const closeModalBtn = document.getElementById("closeProjectModal");
    const openButtons = document.querySelectorAll<HTMLAnchorElement>(".view-case-study-btn");
    openButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const title = btn.getAttribute("data-title") || "Project Case Study";
        const category = btn.getAttribute("data-category-name") || "Concept Project";
        const challenge = btn.getAttribute("data-challenge") || "";
        const solution = btn.getAttribute("data-solution") || "";
        const deliverables = (btn.getAttribute("data-deliverables") || "").split("|");
        const delivHtml = deliverables
          .map((i) => `<li><span class="text-accent">✓</span> ${i.trim()}</li>`)
          .join("");

        if (modalBody) {
          modalBody.innerHTML = `
            <div style="margin-bottom: 16px;">
              <span class="badge badge-concept">Honest Concept Project</span>
              <span class="badge badge-accent" style="margin-left: 8px;">${category}</span>
            </div>
            <h2 style="font-size: 1.8rem; margin-bottom: 12px;">${title}</h2>
            <p class="text-lead" style="margin-bottom: 24px;">Complete case study framework tailored for North Malabar market conditions.</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
              <div style="background: var(--bg-card); padding: 20px; border-radius: var(--radius-md);">
                <h4 style="margin-bottom: 8px; color: var(--text-primary);">The Local Challenge</h4>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">${challenge}</p>
              </div>
              <div style="background: var(--bg-card); padding: 20px; border-radius: var(--radius-md);">
                <h4 style="margin-bottom: 8px; color: var(--text-primary);">Strategic Solution</h4>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">${solution}</p>
              </div>
            </div>
            <h4 style="margin-bottom: 12px; color: var(--text-primary);">Production Scope Deliverables</h4>
            <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem;">
              ${delivHtml}
            </ul>
          `;
        }
        if (modal) {
          modal.style.display = "flex";
          document.body.style.overflow = "hidden";
        }
      });
    });

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
        document.body.style.overflow = "";
      });
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
          document.body.style.overflow = "";
        }
      });
    }

    // 3. Contact form
    const form = document.getElementById("agencyQuoteForm") as HTMLFormElement | null;
    const successModal = document.getElementById("formSuccessModal");
    const closeSuccessBtn = document.getElementById("closeSuccessModal");
    const formRenderTime = Date.now();
    const initialReferrer = typeof document !== "undefined" ? document.referrer || null : null;

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Remove any prior error notification and field errors
        const oldErr = document.getElementById("formFallbackError");
        if (oldErr) oldErr.remove();
        form.querySelectorAll(".form-error").forEach((el) => el.remove());

        const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value.trim();
        const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value.trim();
        const phone = (form.querySelector('[name="phone"]') as HTMLInputElement)?.value.trim() || null;
        const company = (form.querySelector('[name="company"]') as HTMLInputElement)?.value.trim() || null;
        const service = (form.querySelector('[name="service"]') as HTMLSelectElement)?.value || "";
        const budget =
          (form.querySelector('input[name="budget"]:checked') as HTMLInputElement)?.value ||
          "Growth (₹30k - ₹60k)";
        const message = (form.querySelector('[name="details"]') as HTMLTextAreaElement)?.value.trim() || null;
        const hp_field = (form.querySelector('[name="hp_field"]') as HTMLInputElement)?.value || "";
        const elapsedMs = Date.now() - formRenderTime;

        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get("utm_source") || null;
        const utmMedium = urlParams.get("utm_medium") || null;
        const utmCampaign = urlParams.get("utm_campaign") || null;
        const referrer = initialReferrer;

        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        const origText = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Preparing Fixed Proposal...";
        }

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

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
          }

          if (response.status === 201) {
            const successName = document.getElementById("successClientName");
            if (successName) successName.textContent = name;
            const waBtn = document.getElementById("successWhatsAppBtn") as HTMLAnchorElement | null;
            if (waBtn) {
              const text = encodeURIComponent(
                `Hi AKZQ.Creation, I am ${name}. I requested a fixed-price quote for ${service}. (Budget Range: ${budget}). Let's discuss!`
              );
              waBtn.href = `https://wa.me/917510109730?text=${text}`;
            }
            if (successModal) {
              successModal.style.display = "flex";
              document.body.style.overflow = "hidden";
            }
            form.reset();
            return;
          }

          // Server-side validation field errors (400)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            try {
              const data = await response.json();
              if (data.errors && typeof data.errors === "object") {
                const clientFieldMessages: Record<string, string> = {
                  name: "Please fill in your Name.",
                  email: "Please fill in your Email.",
                  phone: "Please fill in your Phone / WhatsApp.",
                  service: "Please select the Required Service.",
                  company: "Please enter your Company / Business Name.",
                  message: "Please enter your Project Details.",
                };
                let hasFieldError = false;
                for (const [field, messages] of Object.entries(data.errors)) {
                  const input =
                    form.querySelector(`[name="${field}"]`) ||
                    (field === "message" ? form.querySelector('[name="details"]') : null);
                  if (input && Array.isArray(messages) && messages.length > 0) {
                    const span = document.createElement("span");
                    span.className = "form-error";
                    span.style.cssText = "color: #e53e3e; font-size: 0.85rem; display: block; margin-top: 4px;";
                    span.textContent = clientFieldMessages[field] || "Please fill in this required field.";
                    input.insertAdjacentElement("afterend", span);
                    hasFieldError = true;
                  }
                }
                if (hasFieldError) return;
              }
            } catch {}
          }

          // Error handling
          let errorMessage = "Unable to submit form. Please contact us directly at +91 75101 09730 or via WhatsApp.";
          const errDiv = document.createElement("div");
          errDiv.id = "formFallbackError";
          errDiv.style.cssText = "padding: 12px 16px; margin-bottom: 16px; border-radius: 6px; background-color: rgba(229, 62, 62, 0.1); border: 1px solid rgba(229, 62, 62, 0.3); color: #e53e3e; font-size: 0.9rem; line-height: 1.5;";
          errDiv.innerHTML = `Unable to submit form. Please contact us directly at <a href="tel:+917510109730" style="color: #e53e3e; font-weight: 600; text-decoration: underline;">+91 75101 09730</a> or via <a href="https://wa.me/917510109730" target="_blank" rel="noopener noreferrer" style="color: #e53e3e; font-weight: 600; text-decoration: underline;">WhatsApp</a>.`;
          form.insertBefore(errDiv, form.firstChild);
        } catch {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
          }
          const errDiv = document.createElement("div");
          errDiv.id = "formFallbackError";
          errDiv.style.cssText = "padding: 12px 16px; margin-bottom: 16px; border-radius: 6px; background-color: rgba(229, 62, 62, 0.1); border: 1px solid rgba(229, 62, 62, 0.3); color: #e53e3e; font-size: 0.9rem; line-height: 1.5;";
          errDiv.innerHTML = `Unable to submit form. Please contact us directly at <a href="tel:+917510109730" style="color: #e53e3e; font-weight: 600; text-decoration: underline;">+91 75101 09730</a> or via <a href="https://wa.me/917510109730" target="_blank" rel="noopener noreferrer" style="color: #e53e3e; font-weight: 600; text-decoration: underline;">WhatsApp</a>.`;
          form.insertBefore(errDiv, form.firstChild);
        }
      });
    }
    if (closeSuccessBtn && successModal) {
      closeSuccessBtn.addEventListener("click", () => {
        successModal.style.display = "none";
        document.body.style.overflow = "";
      });
    }
  }, [pathname]);

  return null;
}
