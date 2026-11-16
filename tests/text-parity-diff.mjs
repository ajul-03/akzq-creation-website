import fs from 'fs';
import path from 'path';

const pages = [
  { name: 'home', file: 'index.html', route: 'index' },
  { name: 'about', file: 'about.html', route: 'about' },
  { name: 'services', file: 'services.html', route: 'services' },
  { name: 'branding-identity', file: 'branding-identity.html', route: 'branding-identity' },
  { name: 'web-design-development', file: 'web-design-development.html', route: 'web-design-development' },
  { name: 'digital-marketing-seo', file: 'digital-marketing-seo.html', route: 'digital-marketing-seo' },
  { name: 'media-content-production', file: 'media-content-production.html', route: 'media-content-production' },
  { name: 'local-seo', file: 'local-seo.html', route: 'local-seo' },
  { name: 'kannur', file: 'kannur.html', route: 'kannur' },
  { name: 'thalassery', file: 'thalassery.html', route: 'thalassery' },
  { name: 'portfolio', file: 'portfolio.html', route: 'portfolio' },
  { name: 'blog', file: 'blog.html', route: 'blog' },
  { name: 'blog-cost-of-seo-kerala', file: 'blog-cost-of-seo-kerala.html', route: 'blog-cost-of-seo-kerala' },
  { name: 'faq', file: 'faq.html', route: 'faq' },
  { name: 'contact', file: 'contact.html', route: 'contact' },
];

function extractCleanText(html) {
  // Remove scripts, styles, svg, and html comments
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Replace block tags with newlines
  clean = clean.replace(/<\/(p|div|h[1-6]|li|section|header|footer|nav|article|aside|tr|td|th)>/gi, '\n');
  // Strip all remaining tags
  clean = clean.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  clean = clean
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&copy;/g, '©');

  // Split into lines, trim, and remove empty lines
  const lines = clean
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  return lines;
}

// Simple Myers / LCS line-by-line diff
function diffLines(origLines, nextLines) {
  const diff = [];
  let i = 0;
  let j = 0;

  // Find longest common subsequence
  const n = origLines.length;
  const m = nextLines.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let x = 1; x <= n; x++) {
    for (let y = 1; y <= m; y++) {
      if (origLines[x - 1] === nextLines[y - 1]) {
        dp[x][y] = dp[x - 1][y - 1] + 1;
      } else {
        dp[x][y] = Math.max(dp[x - 1][y], dp[x][y - 1]);
      }
    }
  }

  // Backtrack
  let x = n;
  let y = m;
  const chunks = [];
  while (x > 0 || y > 0) {
    if (x > 0 && y > 0 && origLines[x - 1] === nextLines[y - 1]) {
      chunks.push({ type: 'common', text: origLines[x - 1] });
      x--;
      y--;
    } else if (y > 0 && (x === 0 || dp[x][y - 1] >= dp[x - 1][y])) {
      chunks.push({ type: 'added', text: nextLines[y - 1] });
      y--;
    } else if (x > 0 && (y === 0 || dp[x][y - 1] < dp[x - 1][y])) {
      chunks.push({ type: 'removed', text: origLines[x - 1] });
      x--;
    }
  }

  return chunks.reverse();
}

const knownBoilerplateKeywords = [
  'home', 'about', 'services', 'branding', 'web design', 'digital marketing',
  'media', 'content', 'local seo', 'kannur', 'thalassery', 'portfolio', 'blog',
  'faq', 'contact', 'get fixed quote', 'locations', 'studio', 'hub', 'all rights reserved',
  'transparent digital growth', 'pricing transparency', 'request fixed proposal',
  'hours:', 'phone:', 'whatsapp:', 'sn park road', 'caltex junction', 'mon – sat',
  'zero hidden fees', '100% ip transfer', 'serving south bazaar', 'serving logan street',
  'fast reply', 'free quote'
];

function isBoilerplate(text) {
  const lower = text.toLowerCase();
  return knownBoilerplateKeywords.some((kw) => lower.includes(kw));
}

let markdownReport = `# Text Parity Unified Diff Report (15 Pages)\n\n`;
markdownReport += `Generated on: ${new Date().toISOString()}\n\n`;
markdownReport += `Comparing legacy static HTML normalized text against Next.js 14 App Router rendered text.\n\n`;

const pageSummaries = [];

for (const p of pages) {
  const origHtml = fs.readFileSync(p.file, 'utf8');
  const nextHtmlPath = path.join('.next/server/app', p.route === 'index' ? 'index.html' : `${p.route}.html`);
  const nextHtml = fs.readFileSync(nextHtmlPath, 'utf8');

  const origLines = extractCleanText(origHtml);
  const nextLines = extractCleanText(nextHtml);

  const diff = diffLines(origLines, nextLines);

  const addedLines = diff.filter((d) => d.type === 'added').map((d) => d.text);
  const removedLines = diff.filter((d) => d.type === 'removed').map((d) => d.text);

  const nonBoilerplateAdded = addedLines.filter((l) => !isBoilerplate(l));

  pageSummaries.push({
    page: p.name,
    origLines: origLines.length,
    nextLines: nextLines.length,
    addedBlocks: addedLines.length,
    removedBlocks: removedLines.length,
    nonBoilerplateFlagged: nonBoilerplateAdded.length,
    flaggedSamples: nonBoilerplateAdded.slice(0, 3).join(' | '),
  });

  markdownReport += `## Page: /${p.route === 'index' ? '' : p.route} (${p.file})\n\n`;
  markdownReport += `- **Legacy Line Count:** ${origLines.length}\n`;
  markdownReport += `- **Next.js Line Count:** ${nextLines.length}\n`;
  markdownReport += `- **Added Blocks:** ${addedLines.length}\n`;
  markdownReport += `- **Removed Blocks:** ${removedLines.length}\n`;
  markdownReport += `- **Non-Boilerplate Added Flags:** ${nonBoilerplateAdded.length}\n\n`;

  if (nonBoilerplateAdded.length > 0) {
    markdownReport += `> [!WARNING]\n`;
    markdownReport += `> Flagged non-boilerplate text:\n`;
    nonBoilerplateAdded.forEach((f) => {
      markdownReport += `> - "${f}"\n`;
    });
    markdownReport += `\n`;
  }

  markdownReport += `### Unified Diff:\n\`\`\`diff\n`;
  let contextCount = 0;
  for (const item of diff) {
    if (item.type === 'added') {
      markdownReport += `+ ${item.text}\n`;
    } else if (item.type === 'removed') {
      markdownReport += `- ${item.text}\n`;
    }
  }
  markdownReport += `\`\`\`\n\n---\n\n`;
}

console.log('=== TEXT PARITY AUDIT SUMMARY ===');
console.table(pageSummaries);

const outDoc = path.resolve('docs/text-parity-diff.md');
fs.writeFileSync(outDoc, markdownReport);
console.log('\nFull unified diff markdown written to:', outDoc);
