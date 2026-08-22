/**
 * AKZQ.CREATION — PORTFOLIO & CASE STUDIES SCRIPT
 * Handles category filtering and interactive modal details for concept projects
 */

document.addEventListener('DOMContentLoaded', () => {
  initPortfolioFilter();
  initProjectModal();
});

function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.portfolio-filter-btn');
  const projectCards = document.querySelectorAll('.portfolio-card');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active button style
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          card.classList.add('fade-in');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function initProjectModal() {
  const modal = document.getElementById('projectModal');
  const modalBody = document.getElementById('projectModalBody');
  const closeModalBtn = document.getElementById('closeProjectModal');
  const openButtons = document.querySelectorAll('.view-case-study-btn');

  if (!modal || !modalBody) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.getAttribute('data-title') || 'Project Case Study';
      const category = btn.getAttribute('data-category-name') || 'Concept Project';
      const challenge = btn.getAttribute('data-challenge') || 'Market differentiation and digital presence.';
      const solution = btn.getAttribute('data-solution') || 'Custom brand strategy, clean modern web architecture, and localized search positioning.';
      const deliverables = (btn.getAttribute('data-deliverables') || '').split('|');

      let deliverablesHtml = deliverables.map(item => `<li><span class="text-accent">✓</span> ${item.trim()}</li>`).join('');

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
            <h4 style="margin-bottom: 8px; color: var(--text-primary);">Our Honest Strategy</h4>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">${solution}</p>
          </div>
        </div>

        <h4 style="margin-bottom: 12px;">Exact Delivered Scope</h4>
        <ul style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; list-style: none; margin-bottom: 30px;">
          ${deliverablesHtml}
        </ul>

        <div style="border-top: 1px solid var(--border-light); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">Interested in a similar project with transparent pricing?</span>
          </div>
          <a href="contact.html" class="btn btn-primary btn-sm">Request a Fixed Quote</a>
        </div>
      `;

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    });
  }

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
}
