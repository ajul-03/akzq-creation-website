import fs from 'fs';
import path from 'path';

const pages = [
  { name: 'Home', file: 'index.html', route: 'index', urlPath: '/' },
  { name: 'About', file: 'about.html', route: 'about', urlPath: '/about' },
  { name: 'Services', file: 'services.html', route: 'services', urlPath: '/services' },
  { name: 'Branding', file: 'branding-identity.html', route: 'branding-identity', urlPath: '/branding-identity' },
  { name: 'Web Dev', file: 'web-design-development.html', route: 'web-design-development', urlPath: '/web-design-development' },
  { name: 'Digital Mktg', file: 'digital-marketing-seo.html', route: 'digital-marketing-seo', urlPath: '/digital-marketing-seo' },
  { name: 'Media Prod', file: 'media-content-production.html', route: 'media-content-production', urlPath: '/media-content-production' },
  { name: 'Local SEO', file: 'local-seo.html', route: 'local-seo', urlPath: '/local-seo' },
  { name: 'Kannur', file: 'kannur.html', route: 'kannur', urlPath: '/kannur' },
  { name: 'Thalassery', file: 'thalassery.html', route: 'thalassery', urlPath: '/thalassery' },
  { name: 'Portfolio', file: 'portfolio.html', route: 'portfolio', urlPath: '/portfolio' },
  { name: 'Blog', file: 'blog.html', route: 'blog', urlPath: '/blog' },
  { name: 'Blog Post', file: 'blog-cost-of-seo-kerala.html', route: 'blog-cost-of-seo-kerala', urlPath: '/blog-cost-of-seo-kerala' },
  { name: 'FAQ', file: 'faq.html', route: 'faq', urlPath: '/faq' },
  { name: 'Contact', file: 'contact.html', route: 'contact', urlPath: '/contact' },
];

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&copy;/g, '©')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLegacyRegions(html, fileName) {
  // 1. Header
  const hMatch = html.match(/<header[\s\S]*?<\/header>/);
  const headerHtml = hMatch ? hMatch[0] : '';

  // 2. Main: between </header> (after mobile-nav) and <footer
  const hEnd = html.indexOf('</header>');
  const fStart = html.indexOf('<footer');
  const afterHeader = html.slice(hEnd);
  const m = afterHeader.match(/<(section|article)/);
  const mainStart = hEnd + (m ? m.index : 0);
  let mainHtml = html.slice(mainStart, fStart).trim();

  // If kannur.html, account for owner-approved pin update
  if (fileName === 'kannur.html') {
    mainHtml = mainHtml.replace(/670001\s*&\s*670002/g, '670001 & 670675');
    mainHtml = mainHtml.replace(/670001\s*&amp;\s*670002/g, '670001 &amp; 670675');
  }

  // 3. Footer
  const fMatch = html.match(/<footer[\s\S]*?<\/footer>/);
  const footerHtml = fMatch ? fMatch[0] : '';

  return {
    header: extractText(headerHtml),
    main: extractText(mainHtml),
    footer: extractText(footerHtml),
  };
}

function extractNextRegions(html) {
  // 1. Header
  const hMatch = html.match(/<header[\s\S]*?<\/header>/);
  const headerHtml = hMatch ? hMatch[0] : '';

  // 2. Main
  const mMatch = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/);
  const mainHtml = mMatch ? mMatch[1] : '';

  // 3. Footer
  const fMatch = html.match(/<footer[\s\S]*?<\/footer>/);
  const footerHtml = fMatch ? fMatch[0] : '';

  return {
    header: extractText(headerHtml),
    main: extractText(mainHtml),
    footer: extractText(footerHtml),
  };
}

console.log('=== REGION-BY-REGION TEXT PARITY AUDIT (HEADER, MAIN, FOOTER) ===\n');

const tableData = [];
let allMainZero = true;
let markdown = `# Text Parity Region-by-Region Diff Report (Header, Main, Footer)\n\n`;
markdown += `Comparing legacy static HTML against Next.js rendered HTML across three separate structural regions:\n`;
markdown += `- **Header:** site navigation, brand mark, utility links\n`;
markdown += `- **Main:** core page sections, case studies, form fields, and FAQ accordions\n`;
markdown += `- **Footer:** brand summary, service columns, location hubs, and NAP addresses\n\n`;
markdown += `## Summary Table\n\n`;
markdown += `| Page | Route | Header Parity | Main Parity (<main>) | Footer Parity | Main Diffs |\n`;
markdown += `|---|---|---|---|---|---|\n`;

for (const p of pages) {
  const legacyHtml = fs.readFileSync(p.file, 'utf8');
  const nextHtmlPath = path.join('.next/server/app', p.route === 'index' ? 'index.html' : `${p.route}.html`);
  const nextHtml = fs.readFileSync(nextHtmlPath, 'utf8');

  const legacy = extractLegacyRegions(legacyHtml, p.file);
  const next = extractNextRegions(nextHtml);

  const headerMatch = legacy.header === next.header;
  const mainMatch = legacy.main === next.main;
  const footerMatch = legacy.footer === next.footer;

  let mainDiffCount = 0;
  if (!mainMatch) {
    allMainZero = false;
    mainDiffCount = Math.abs(legacy.main.length - next.main.length) || 1;
  }

  tableData.push({
    Page: p.name,
    Route: p.urlPath,
    Header: headerMatch ? 'MATCH (100%)' : 'DIFF',
    Main: mainMatch ? 'MATCH (100%)' : 'DIFF',
    Footer: footerMatch ? 'MATCH (100%)' : 'DIFF',
    MainDiffs: mainDiffCount,
    MainChars: next.main.length,
  });

  markdown += `| ${p.name} | \`${p.urlPath}\` | ${headerMatch ? 'MATCH' : 'DIFF'} | ${mainMatch ? '**MATCH (0 diff)**' : '**FAIL**'} | ${footerMatch ? 'MATCH' : 'DIFF'} | ${mainDiffCount} |\n`;
}

console.table(tableData);

markdown += `\n## Per-Page Detailed Analysis\n\n`;
for (const p of pages) {
  const legacyHtml = fs.readFileSync(p.file, 'utf8');
  const nextHtmlPath = path.join('.next/server/app', p.route === 'index' ? 'index.html' : `${p.route}.html`);
  const nextHtml = fs.readFileSync(nextHtmlPath, 'utf8');

  const legacy = extractLegacyRegions(legacyHtml, p.file);
  const next = extractNextRegions(nextHtml);

  markdown += `### ${p.name} (\`${p.urlPath}\`)\n\n`;
  markdown += `- **Header Parity:** ${legacy.header === next.header ? 'PASS (100% match)' : 'DIFF'}\n`;
  markdown += `- **Main Content Parity:** ${legacy.main === next.main ? 'PASS (0 differences, verbatim match)' : 'FAIL'}\n`;
  markdown += `- **Footer Parity:** ${legacy.footer === next.footer ? 'PASS (100% match)' : 'DIFF'}\n`;
  markdown += `- **Main Length:** ${next.main.length} characters\n\n`;
}

// Check FAQ JSON-LD parity
markdown += `## FAQ JSON-LD vs Visible Accordion Parity\n\n`;
const faqHtml = fs.readFileSync('.next/server/app/faq.html', 'utf8');
const jsonMatch = faqHtml.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
const schema = JSON.parse(jsonMatch[1]);
const schemaFaqs = schema.mainEntity || [];
const visibleItems = [...faqHtml.matchAll(/<div class="faq-item[^"]*">[\s\S]*?<button class="faq-question"[^>]*>([\s\S]*?)<\/button>[\s\S]*?<div class="faq-answer">([\s\S]*?)<\/div>\s*<\/div>/g)];

let faqEqual = true;
markdown += `| # | Question | Schema Answer Length | Visible Answer Length | Match |\n`;
markdown += `|---|---|---|---|---|\n`;
for (let i = 0; i < 8; i++) {
  const schemaA = extractText(schemaFaqs[i].acceptedAnswer.text);
  const visA = extractText(visibleItems[i][2]);
  const m = schemaA === visA;
  if (!m) faqEqual = false;
  markdown += `| ${i + 1} | ${extractText(schemaFaqs[i].name)} | ${schemaA.length} | ${visA.length} | ${m ? 'PASS' : 'FAIL'} |\n`;
}

fs.writeFileSync('docs/text-parity-diff.md', markdown, 'utf8');

console.log('\n--- TARGET VERIFICATION ---');
console.log(`Main Content Parity (<main>): ${allMainZero ? 'PASS — ZERO unapproved copy differences across all 15 pages' : 'FAIL'}`);
console.log(`FAQ JSON-LD vs Visible Answers: ${faqEqual ? 'PASS — All 8 FAQ answers match verbatim' : 'FAIL'}`);
console.log(`Report written to: docs/text-parity-diff.md\n`);

if (!allMainZero || !faqEqual) {
  process.exit(1);
}
