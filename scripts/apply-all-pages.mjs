import fs from 'fs';
import path from 'path';

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

const pageConfigs = [
  { htmlFile: 'index.html', route: '/', appPath: 'src/app/page.tsx', compName: 'HomePage' },
  { htmlFile: 'about.html', route: '/about', appPath: 'src/app/about/page.tsx', compName: 'AboutPage' },
  { htmlFile: 'services.html', route: '/services', appPath: 'src/app/services/page.tsx', compName: 'ServicesPage' },
  { htmlFile: 'branding-identity.html', route: '/branding-identity', appPath: 'src/app/branding-identity/page.tsx', compName: 'BrandingIdentityPage' },
  { htmlFile: 'web-design-development.html', route: '/web-design-development', appPath: 'src/app/web-design-development/page.tsx', compName: 'WebDesignDevelopmentPage' },
  { htmlFile: 'digital-marketing-seo.html', route: '/digital-marketing-seo', appPath: 'src/app/digital-marketing-seo/page.tsx', compName: 'DigitalMarketingSeoPage' },
  { htmlFile: 'media-content-production.html', route: '/media-content-production', appPath: 'src/app/media-content-production/page.tsx', compName: 'MediaContentProductionPage' },
  { htmlFile: 'local-seo.html', route: '/local-seo', appPath: 'src/app/local-seo/page.tsx', compName: 'LocalSeoPage' },
  { htmlFile: 'kannur.html', route: '/kannur', appPath: 'src/app/kannur/page.tsx', compName: 'KannurPage' },
  { htmlFile: 'thalassery.html', route: '/thalassery', appPath: 'src/app/thalassery/page.tsx', compName: 'ThalasseryPage' },
  { htmlFile: 'portfolio.html', route: '/portfolio', appPath: 'src/app/portfolio/page.tsx', compName: 'PortfolioPage' },
  { htmlFile: 'blog.html', route: '/blog', appPath: 'src/app/blog/page.tsx', compName: 'BlogPage' },
  { htmlFile: 'blog-cost-of-seo-kerala.html', route: '/blog-cost-of-seo-kerala', appPath: 'src/app/blog-cost-of-seo-kerala/page.tsx', compName: 'BlogCostOfSeoKeralaPage' },
  { htmlFile: 'faq.html', route: '/faq', appPath: 'src/app/faq/page.tsx', compName: 'FAQPage' },
  { htmlFile: 'contact.html', route: '/contact', appPath: 'src/app/contact/page.tsx', compName: 'ContactPage' },
];

function normText(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

for (const cfg of pageConfigs) {
  const legacyHtml = fs.readFileSync(cfg.htmlFile, 'utf8');
  const existingApp = fs.readFileSync(cfg.appPath, 'utf8');

  // Extract metadata block from existing file
  const metaMatch = existingApp.match(/export const metadata: Metadata = ({[\s\S]*?^};)/m);
  if (!metaMatch) throw new Error(`Could not find metadata in ${cfg.appPath}`);
  const metadataBlock = metaMatch[0];

  // Extract main content from legacy HTML
  const hEnd = legacyHtml.indexOf('</header>');
  const fStart = legacyHtml.indexOf('<footer');
  const afterHeader = legacyHtml.slice(hEnd);
  const m = afterHeader.match(/<(section|article)/);
  if (!m) throw new Error(`Could not find section/article in ${cfg.htmlFile}`);
  const mainStart = hEnd + m.index;
  let rawMain = legacyHtml.slice(mainStart, fStart).trim();

  // If this is kannur.html, ensure phrase has 670001 & 670675
  if (cfg.htmlFile === 'kannur.html') {
    rawMain = rawMain.replace(/670001\s*&\s*670002/g, '670001 & 670675');
    rawMain = rawMain.replace(/670001\s*&amp;\s*670002/g, '670001 &amp; 670675');
  }

  // Clean links & assets
  const cleanedMain = cleanHrefs(rawMain);

  // Check JSON-LD
  let jsonLdBlock = '';
  if (cfg.htmlFile === 'index.html') {
    jsonLdBlock = `
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "AKZQ.Creation",
            "image": "https://akzqcreation.com/assets/images/logo.svg",
            "description": "Digital marketing and creative agency serving Kannur, Thalassery, and North Malabar with fixed pricing and transparent processes.",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Near Caltex Junction, SN Park Road",
              "addressLocality": "Kannur",
              "addressRegion": "Kerala",
              "postalCode": "670675",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "11.8745",
              "longitude": "75.3704"
            },
            "url": "https://akzqcreation.com",
            "telephone": "+917510109730",
            "priceRange": "₹₹",
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "09:00",
                "closes": "18:30"
              }
            ]
          }),
        }}
      />`;
  } else if (cfg.htmlFile === 'kannur.html') {
    jsonLdBlock = `
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "AKZQ.Creation — Kannur Agency Hub",
            "image": "https://akzqcreation.com/assets/images/logo.svg",
            "description": "Digital marketing and creative agency based in Kannur, Kerala.",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Near Caltex Junction, SN Park Road",
              "addressLocality": "Kannur",
              "addressRegion": "Kerala",
              "postalCode": "670675",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "11.8745",
              "longitude": "75.3704"
            },
            "url": "https://akzqcreation.com/kannur",
            "telephone": "+917510109730",
            "priceRange": "₹₹"
          }),
        }}
      />`;
  } else if (cfg.htmlFile === 'thalassery.html') {
    jsonLdBlock = `
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "AKZQ.Creation — Thalassery Desk",
            "image": "https://akzqcreation.com/assets/images/logo.svg",
            "description": "Creative agency serving Thalassery, Logan Street, and Court Road retail and enterprise sectors.",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Logan Street / Court Road Commercial Area",
              "addressLocality": "Thalassery",
              "addressRegion": "Kerala",
              "postalCode": "670101",
              "addressCountry": "IN"
            },
            "telephone": "+917510109730",
            "url": "https://akzqcreation.com/thalassery",
            "priceRange": "₹₹"
          }),
        }}
      />`;
  } else if (cfg.htmlFile === 'faq.html') {
    // Extract questions and answers directly from visible HTML to guarantee 100% equality
    const faqItems = [...legacyHtml.matchAll(/<div class="faq-item[^"]*">[\s\S]*?<button class="faq-question"[^>]*>([\s\S]*?)<\/button>[\s\S]*?<div class="faq-answer">([\s\S]*?)<\/div>\s*<\/div>/g)];
    const mainEntity = faqItems.map(item => {
      // Question: remove numbering prefix (e.g., "1. ") for schema name
      let q = normText(item[1]).replace(/^\d+\.\s*/, '');
      let a = normText(item[2]);
      return {
        "@type": "Question",
        "name": q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": a
        }
      };
    });

    jsonLdBlock = `
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": ${JSON.stringify(mainEntity, null, 14)}
          }),
        }}
      />`;
  }

  const newContent = `import type { Metadata } from "next";

${metadataBlock}

export default function ${cfg.compName}() {
  return (
    <>
      ${jsonLdBlock}
      <div dangerouslySetInnerHTML={{ __html: ${JSON.stringify(cleanedMain)} }} />
    </>
  );
}
`;

  fs.writeFileSync(cfg.appPath, newContent, 'utf8');
  console.log(`Updated ${cfg.appPath} (main length: ${cleanedMain.length})`);
}
