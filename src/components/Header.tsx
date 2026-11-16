"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
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
    // Close mobile nav on route change
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
                    Dominate Google Maps in Kannur &amp; Thalassery
                  </span>
                </Link>
              </div>
            </div>

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
                  <span className="dropdown-link-title">Kannur Studio</span>
                  <span className="dropdown-link-desc">
                    Serving South Bazaar, Caltex, Fort Road &amp; surrounds
                  </span>
                </Link>
                <Link href="/thalassery" className="dropdown-link">
                  <span className="dropdown-link-title">Thalassery Hub</span>
                  <span className="dropdown-link-desc">
                    Serving Logan Street retail, Court Road &amp; Malabar trade
                  </span>
                </Link>
              </div>
            </div>

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
            <Link href="/contact" className="btn btn-primary nav-cta">
              Get Fixed Quote
            </Link>

            <button
              className="mobile-toggle"
              aria-label="Toggle navigation drawer"
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
      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`} aria-hidden={!mobileOpen}>
        <div className="mobile-nav-inner">
          <Link href="/" className="mobile-link">
            Home
          </Link>
          <Link href="/about" className="mobile-link">
            About Us
          </Link>
          <Link href="/services" className="mobile-link">
            Services Overview
          </Link>
          <div className="mobile-sublinks">
            <Link href="/branding-identity" className="mobile-sublink">
              — Branding &amp; Identity
            </Link>
            <Link href="/web-design-development" className="mobile-sublink">
              — Web Design &amp; Development
            </Link>
            <Link href="/digital-marketing-seo" className="mobile-sublink">
              — Digital Marketing &amp; SEO
            </Link>
            <Link href="/media-content-production" className="mobile-sublink">
              — Media &amp; Content Production
            </Link>
            <Link href="/local-seo" className="mobile-sublink">
              — Local SEO (Google Maps)
            </Link>
          </div>
          <Link href="/kannur" className="mobile-link">
            Kannur Studio
          </Link>
          <Link href="/thalassery" className="mobile-link">
            Thalassery Hub
          </Link>
          <Link href="/portfolio" className="mobile-link">
            Portfolio
          </Link>
          <Link href="/blog" className="mobile-link">
            Blog &amp; Insights
          </Link>
          <Link href="/faq" className="mobile-link">
            FAQ
          </Link>
          <Link href="/contact" className="mobile-link mobile-link-highlight">
            Get Fixed Quote
          </Link>
        </div>
      </div>
    </>
  );
}
