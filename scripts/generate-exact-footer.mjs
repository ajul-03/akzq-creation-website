import fs from 'fs';

const pages = [
  { legacy: 'index.html', route: '/' },
  { legacy: 'about.html', route: '/about' },
  { legacy: 'services.html', route: '/services' },
  { legacy: 'branding-identity.html', route: '/branding-identity' },
  { legacy: 'web-design-development.html', route: '/web-design-development' },
  { legacy: 'digital-marketing-seo.html', route: '/digital-marketing-seo' },
  { legacy: 'media-content-production.html', route: '/media-content-production' },
  { legacy: 'local-seo.html', route: '/local-seo' },
  { legacy: 'kannur.html', route: '/kannur' },
  { legacy: 'thalassery.html', route: '/thalassery' },
  { legacy: 'portfolio.html', route: '/portfolio' },
  { legacy: 'blog.html', route: '/blog' },
  { legacy: 'blog-cost-of-seo-kerala.html', route: '/blog-cost-of-seo-kerala' },
  { legacy: 'faq.html', route: '/faq' },
  { legacy: 'contact.html', route: '/contact' },
];

const linkMap = [
  ['index.html', '/'],
  ['about.html', '/about'],
  ['services.html', '/services'],
  ['branding-identity.html', '/branding-identity'],
  ['web-design-development.html', '/web-design-development'],
  ['digital-marketing-seo.html', '/digital-marketing-seo'],
  ['media-content-production.html', '/media-content-production'],
  ['local-seo.html', '/local-seo'],
  ['kannur.html', '/kannur'],
  ['thalassery.html', '/thalassery'],
  ['portfolio.html', '/portfolio'],
  ['blog.html', '/blog'],
  ['blog-cost-of-seo-kerala.html', '/blog-cost-of-seo-kerala'],
  ['faq.html', '/faq'],
  ['contact.html', '/contact'],
];

function cleanHrefs(html) {
  let res = html;
  for (const [legacy, clean] of linkMap) {
    res = res.replaceAll(`href="${legacy}"`, `href="${clean}"`);
    res = res.replaceAll(`href="./${legacy}"`, `href="${clean}"`);
  }
  res = res.replaceAll('src="assets/', 'src="/assets/');
  res = res.replaceAll('src="./assets/', 'src="/assets/');
  return res;
}

const footers = {};
for (const p of pages) {
  const c = fs.readFileSync(p.legacy, 'utf8');
  const fMatch = c.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);
  if (!fMatch) throw new Error(`Missing footer in ${p.legacy}`);
  footers[p.route] = cleanHrefs(fMatch[1].trim());
}

const fileContent = `"use client";

import React from "react";
import { usePathname } from "next/navigation";

export interface FooterProps {
  variant?: "default" | "kannur" | "thalassery";
}

const footersByRoute: Record<string, string> = ${JSON.stringify(footers, null, 2)};

export function Footer({ variant }: FooterProps) {
  const pathname = usePathname();
  
  // Select matching footer markup based on pathname or variant
  let html = footersByRoute[pathname];
  if (!html) {
    if (variant === "kannur") html = footersByRoute["/kannur"];
    else if (variant === "thalassery") html = footersByRoute["/thalassery"];
    else html = footersByRoute["/"];
  }

  return (
    <footer
      className="site-footer"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
`;

fs.writeFileSync('src/components/Footer.tsx', fileContent, 'utf8');
console.log('src/components/Footer.tsx generated successfully.');
