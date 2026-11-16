/**
 * AKZQ.CREATION — CONTACT & FIXED QUOTE FORM SCRIPT
 * Handles form validation, budget estimations, and direct WhatsApp quotation links
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initBudgetEstimator();
});

function initContactForm() {
  const form = document.getElementById('agencyQuoteForm');
  const successModal = document.getElementById('formSuccessModal');
  const closeModalBtn = document.getElementById('closeSuccessModal');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const name = form.querySelector('[name="name"]')?.value.trim();
    const email = form.querySelector('[name="email"]')?.value.trim();
    const phone = form.querySelector('[name="phone"]')?.value.trim();
    const service = form.querySelector('[name="service"]')?.value;
    const budget = form.querySelector('input[name="budget"]:checked')?.value || 'Standard Scope';
    const message = form.querySelector('[name="details"]')?.value.trim();

    if (!name || !email || !service) {
      alert('Please fill in your Name, Email, and select the Required Service.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Preparing Fixed Proposal...';

    // Simulate instant process
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      // Populate success modal info
      const successName = document.getElementById('successClientName');
      if (successName) successName.textContent = name;

      // Populate WhatsApp link
      const waBtn = document.getElementById('successWhatsAppBtn');
      if (waBtn) {
        const text = encodeURIComponent(
          `Hi AKZQ.Creation, I am ${name}. I requested a fixed-price quote for ${service}. (Budget Range: ${budget}). Let's discuss!`
        );
        waBtn.href = `https://wa.me/917510109730?text=${text}`;
      }

      if (successModal) {
        successModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      form.reset();
    }, 600);
  });

  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
}

function initBudgetEstimator() {
  const serviceSelect = document.getElementById('serviceRequiredSelect');
  const estimatorNote = document.getElementById('quoteEstimatorNote');

  if (!serviceSelect || !estimatorNote) return;

  const estimates = {
    'Branding & Identity': 'Includes brand discovery, typography guidelines, logo system, full source vector files, and 100% intellectual property transfer.',
    'Web Design & Development': 'Includes custom mobile-first UI, high-speed lightweight code, SEO-ready architecture, and free post-launch support.',
    'Digital Marketing & SEO': 'Includes audience mapping for North Malabar, high-intent Google & Meta campaigns, and transparent weekly reporting.',
    'Media & Content Production': 'Includes on-location photo/video production in Kannur/Thalassery, short-form reels, and commercial copywriting.',
    'Local SEO': 'Includes Google Business Profile optimization, Kannur & Thalassery local citation building, and review workflows.'
  };

  serviceSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (estimates[val]) {
      estimatorNote.innerHTML = `<strong>Included in Fixed Scope:</strong> ${estimates[val]}`;
      estimatorNote.style.display = 'block';
    } else {
      estimatorNote.style.display = 'none';
    }
  });
}
