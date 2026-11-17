"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface HeaderProps {
  variant?: "default" | "kannur" | "thalassery";
}

export function Header({ variant = "default" }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    document.body.style.overflow = "";
  }, [pathname]);

  const toggleMobileNav = () => {
    setMobileOpen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? "hidden" : "";
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname === path) return true;
    return false;
  };

  const effectiveVariant =
    variant !== "default"
      ? variant
      : pathname === "/kannur"
      ? "kannur"
      : pathname === "/thalassery"
      ? "thalassery"
      : "default";

  return (
    <>
      <header className={`site-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="container nav-wrapper">
          <Link href="/" className="brand-logo" aria-label="AKZQ.Creation Home">
            <img
              src="/assets/images/logo.svg"
              alt="AKZQ.Creation Logo"
              width="180"
              height="42"
            />
          </Link>

          <nav className="nav-menu" aria-label="Main Navigation">
            <Link
              href="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`nav-link ${isActive("/about") ? "active" : ""}`}
            >
              About
            </Link>

            <div className="nav-item-dropdown">
              <Link
                href="/services"
                className={`nav-link ${
                  pathname.startsWith("/services") ||
                  pathname === "/branding-identity" ||
                  pathname === "/web-design-development" ||
                  pathname === "/digital-marketing-seo" ||
                  pathname === "/media-content-production" ||
                  pathname === "/local-seo"
                    ? "active"
                    : ""
                }`}
              >
                Services
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Link>
              <div className="nav-dropdown-menu">
                <Link href="/branding-identity" className="dropdown-link">
                  <span className="dropdown-link-title">Branding &amp; Identity</span>
                  <span className="dropdown-link-desc">
                    Logos, visual guidelines, and brand systems
                  </span>
                </Link>
                <Link
                  href="/web-design-development"
                  className="dropdown-link"
                >
                  <span className="dropdown-link-title">
                    Web Design &amp; Development
                  </span>
                  <span className="dropdown-link-desc">
                    High-speed, custom, conversion-focused websites
                  </span>
                </Link>
                <Link
                  href="/digital-marketing-seo"
                  className="dropdown-link"
                >
                  <span className="dropdown-link-title">
                    Digital Marketing &amp; SEO
                  </span>
                  <span className="dropdown-link-desc">
                    High-ROI campaigns and organic visibility
                  </span>
                </Link>
                <Link
                  href="/media-content-production"
                  className="dropdown-link"
                >
                  <span className="dropdown-link-title">
                    Media &amp; Content Production
                  </span>
                  <span className="dropdown-link-desc">
                    Commercial photo, reels, and video storytelling
                  </span>
                </Link>
                <Link href="/local-seo" className="dropdown-link">
                  <span className="dropdown-link-title">Local SEO</span>
                  <span className="dropdown-link-desc">
                    {effectiveVariant === "kannur"
                      ? "Dominate Google Maps in Kannur"
                      : effectiveVariant === "thalassery"
                      ? "Dominate Google Maps in Thalassery"
                      : "Dominate Google Maps in Kannur & Thalassery"}
                  </span>
                </Link>
              </div>
            </div>

            {effectiveVariant === "kannur" ? (
              <Link
                href="/kannur"
                className={`nav-link ${isActive("/kannur") ? "active" : ""}`}
              >
                Kannur Hub
              </Link>
            ) : effectiveVariant === "thalassery" ? (
              <Link
                href="/thalassery"
                className={`nav-link ${isActive("/thalassery") ? "active" : ""}`}
              >
                Thalassery Hub
              </Link>
            ) : (
              <div className="nav-item-dropdown">
                <span className="nav-link">
                  Locations
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
                <div className="nav-dropdown-menu">
                  <Link href="/kannur" className="dropdown-link">
                    <span className="dropdown-link-title">Kannur Agency</span>
                    <span className="dropdown-link-desc">
                      Serving South Bazaar, Fort Road &amp; business hubs
                    </span>
                  </Link>
                  <Link href="/thalassery" className="dropdown-link">
                    <span className="dropdown-link-title">Thalassery Agency</span>
                    <span className="dropdown-link-desc">
                      Serving Logan Street, Court Road &amp; retail clusters
                    </span>
                  </Link>
                </div>
              </div>
            )}

            <Link
              href="/portfolio"
              className={`nav-link ${isActive("/portfolio") ? "active" : ""}`}
            >
              Portfolio
            </Link>
            <Link
              href="/blog"
              className={`nav-link ${isActive("/blog") ? "active" : ""}`}
            >
              Blog
            </Link>
            <Link
              href="/faq"
              className={`nav-link ${isActive("/faq") ? "active" : ""}`}
            >
              FAQ
            </Link>
          </nav>

          <div className="nav-actions">
            <div className="location-switcher">
              {effectiveVariant === "kannur" ? (
                <Link href="/kannur">Kannur HQ</Link>
              ) : effectiveVariant === "thalassery" ? (
                <Link href="/thalassery">Thalassery Desk</Link>
              ) : (
                <>
                  <Link href="/kannur">Kannur</Link>
                  <Link href="/thalassery">Thalassery</Link>
                </>
              )}
            </div>
            <Link href="/contact" className="btn btn-primary btn-sm">
              Get a Free Quote
            </Link>

            <button
              className="mobile-toggle"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              onClick={toggleMobileNav}
              type="button"
            >
              {mobileOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`} aria-label="Mobile Navigation">
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/about" className="nav-link">
          About Us
        </Link>
        <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)", marginTop: "8px" }}>
          Services
        </div>
        <div className="mobile-submenu">
          <Link href="/branding-identity">Branding &amp; Identity</Link>
          <Link href="/web-design-development">Web Design &amp; Development</Link>
          <Link href="/digital-marketing-seo">Digital Marketing &amp; SEO</Link>
          <Link href="/media-content-production">Media &amp; Content Production</Link>
          <Link href="/local-seo">Local SEO</Link>
        </div>
        {effectiveVariant === "kannur" ? (
          <Link href="/kannur" className="nav-link" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Kannur Agency Hub
          </Link>
        ) : effectiveVariant === "thalassery" ? (
          <Link href="/thalassery" className="nav-link" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Thalassery Agency Hub
          </Link>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)", marginTop: "8px" }}>
              Locations
            </div>
            <div className="mobile-submenu">
              <Link href="/kannur">Kannur Agency Hub</Link>
              <Link href="/thalassery">Thalassery Agency Hub</Link>
            </div>
          </>
        )}
        <Link href="/portfolio" className="nav-link">
          Portfolio
        </Link>
        <Link href="/blog" className="nav-link">
          Blog
        </Link>
        <Link href="/faq" className="nav-link">
          FAQ
        </Link>
        <Link href="/contact" className="btn btn-primary" style={{ marginTop: "16px" }}>
          Get a Free Quote
        </Link>
      </div>
    </>
  );
}
