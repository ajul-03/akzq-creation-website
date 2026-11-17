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
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value.trim();
        const service = (form.querySelector('[name="service"]') as HTMLSelectElement)?.value;
        const budget =
          (form.querySelector('input[name="budget"]:checked') as HTMLInputElement)?.value ||
          "Standard Scope";

        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (submitBtn) {
          const origText = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Preparing Fixed Proposal...";
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
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
          }, 600);
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
