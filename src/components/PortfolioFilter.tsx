"use client";

import React, { useState } from "react";

interface Project {
  id: string;
  category: string;
  categoryName: string;
  title: string;
  client: string;
  scope: string;
  problem: string;
  solution: string;
  deliverables: string[];
  metrics: string[];
  tags: string[];
}

interface PortfolioFilterProps {
  projects: Project[];
}

export function PortfolioFilter({ projects }: PortfolioFilterProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categories = [
    { key: "all", label: "All Works" },
    { key: "branding", label: "Branding & Identity" },
    { key: "web", label: "Web Development" },
    { key: "marketing", label: "Digital Marketing & SEO" },
    { key: "media", label: "Media & Production" },
  ];

  const filteredProjects = projects.filter((p) => {
    if (activeFilter === "all") return true;
    return p.category === activeFilter;
  });

  return (
    <>
      <div className="portfolio-filter-bar">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`portfolio-filter-btn ${
              activeFilter === c.key ? "active" : ""
            }`}
            onClick={() => setActiveFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="portfolio-grid">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="portfolio-card fade-in"
            data-category={project.category}
          >
            <div className="portfolio-card-visual">
              <span className="concept-badge">Concept Project</span>
              <div className="portfolio-card-visual-inner">
                <span className="portfolio-category-pill">
                  {project.categoryName}
                </span>
                <h3 className="portfolio-card-title">{project.title}</h3>
              </div>
            </div>

            <div className="portfolio-card-content">
              <div className="portfolio-meta-tags">
                {project.tags.map((t, idx) => (
                  <span key={idx} className="badge">
                    {t}
                  </span>
                ))}
              </div>
              <p className="portfolio-card-scope">
                <strong>Scope:</strong> {project.scope}
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm view-case-study-btn"
                onClick={() => {
                  setSelectedProject(project);
                  document.body.style.overflow = "hidden";
                }}
              >
                Inspect Project Scope &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Project Modal */}
      {selectedProject && (
        <div
          id="projectModal"
          className="modal-overlay"
          style={{ display: "flex" }}
        >
          <div className="modal-card modal-card-large">
            <button
              type="button"
              className="modal-close-icon"
              aria-label="Close modal"
              onClick={() => {
                setSelectedProject(null);
                document.body.style.overflow = "";
              }}
            >
              &times;
            </button>

            <div className="modal-case-header">
              <span className="badge badge-accent">Concept Project Spec</span>
              <h2 className="modal-title">{selectedProject.title}</h2>
              <p className="text-muted">
                Industry: {selectedProject.categoryName} &bull; Target Market:{" "}
                {selectedProject.client}
              </p>
            </div>

            <div className="modal-case-body">
              <div className="case-study-section">
                <h4>Commercial Problem:</h4>
                <p>{selectedProject.problem}</p>
              </div>

              <div className="case-study-section">
                <h4>Engineered Solution:</h4>
                <p>{selectedProject.solution}</p>
              </div>

              <div className="case-study-section">
                <h4>Itemized Deliverables:</h4>
                <ul className="check-list">
                  {selectedProject.deliverables.map((d, idx) => (
                    <li key={idx}>
                      <span className="check-icon">&check;</span> {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="case-study-section">
                <h4>Projected / Benchmark Metrics:</h4>
                <div className="metric-tags">
                  {selectedProject.metrics.map((m, idx) => (
                    <span key={idx} className="metric-tag">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <a
                href={`https://wa.me/917510109730?text=${encodeURIComponent(
                  `Hi AKZQ.Creation, I am interested in a project similar to "${selectedProject.title}". Let's discuss pricing.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Inquire for Similar Project &rarr;
              </a>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedProject(null);
                  document.body.style.overflow = "";
                }}
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
