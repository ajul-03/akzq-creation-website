import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const pages = [
  { html: 'index.html', route: '/' },
  { html: 'about.html', route: '/about' },
  { html: 'services.html', route: '/services' },
  { html: 'branding-identity.html', route: '/branding-identity' },
  { html: 'web-design-development.html', route: '/web-design-development' },
  { html: 'digital-marketing-seo.html', route: '/digital-marketing-seo' },
  { html: 'media-content-production.html', route: '/media-content-production' },
  { html: 'local-seo.html', route: '/local-seo' },
  { html: 'kannur.html', route: '/kannur' },
  { html: 'thalassery.html', route: '/thalassery' },
  { html: 'portfolio.html', route: '/portfolio' },
  { html: 'blog.html', route: '/blog' },
  { html: 'blog-cost-of-seo-kerala.html', route: '/blog-cost-of-seo-kerala' },
  { html: 'faq.html', route: '/faq' },
  { html: 'contact.html', route: '/contact' },
];

function fetchUrl(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: pathname,
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function normalizeText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&check;/g, '✓')
    .replace(/&rarr;/g, '→')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('Starting Next.js server on port 3000...');
const server = spawn('cmd.exe', ['/c', 'npx next start -p 3000'], { stdio: 'ignore' });

setTimeout(async () => {
  try {
    const metadataReport = [];
    const textParityReport = [];
    const internalLinksReport = [];
    const linkSet = new Set();

    // 1. Metadata and Content Parity
    for (const p of pages) {
      const htmlRaw = fs.readFileSync(p.html, 'utf-8');
      const nextRes = await fetchUrl(p.route);

      // Titles
      const origTitle = (htmlRaw.match(/<title>(.*?)<\/title>/s) || [])[1]?.trim() || '';
      const nextTitle = (nextRes.body.match(/<title>(.*?)<\/title>/s) || [])[1]?.trim() || '';

      // Descriptions
      const origDesc = (htmlRaw.match(/<meta name="description" content="(.*?)"/s) || [])[1]?.trim() || '';
      const nextDesc = (nextRes.body.match(/<meta name="description" content="(.*?)"/s) || [])[1]?.trim() || '';

      // Canonical
      const origCanon = (htmlRaw.match(/<link rel="canonical" href="(.*?)"/s) || [])[1]?.trim() || 'NONE (Added in Next.js)';
      const nextCanon = (nextRes.body.match(/<link rel="canonical" href="(.*?)"/s) || [])[1]?.trim() || '';

      // OG Tags in Next.js
      const nextOgTitle = (nextRes.body.match(/<meta property="og:title" content="(.*?)"/s) || [])[1]?.trim() || '';
      const nextOgDesc = (nextRes.body.match(/<meta property="og:description" content="(.*?)"/s) || [])[1]?.trim() || '';
      const nextOgUrl = (nextRes.body.match(/<meta property="og:url" content="(.*?)"/s) || [])[1]?.trim() || '';
      const nextOgImg = (nextRes.body.match(/<meta property="og:image" content="(.*?)"/s) || [])[1]?.trim() || '';

      metadataReport.push({
        page: p.route,
        titleMatch: origTitle === nextTitle,
        descMatch: origDesc === nextDesc,
        origCanon,
        nextCanon,
        ogTitle: Boolean(nextOgTitle),
        ogDesc: Boolean(nextOgDesc),
        ogUrl: Boolean(nextOgUrl),
        ogImage: Boolean(nextOgImg),
      });

      // Text comparison
      const origText = normalizeText(htmlRaw);
      const nextText = normalizeText(nextRes.body);

      // Calculate similarity / length difference
      const diffLength = Math.abs(origText.length - nextText.length);
      const diffPercent = ((diffLength / origText.length) * 100).toFixed(2);

      textParityReport.push({
        page: p.route,
        origLength: origText.length,
        nextLength: nextText.length,
        diffChars: diffLength,
        diffPercent: `${diffPercent}%`,
        materialDifference: Number(diffPercent) > 5.0,
      });

      // Extract internal links from Next.js response
      const hrefMatches = [...nextRes.body.matchAll(/href="([^"#:]+)"/g)].map((m) => m[1]);
      for (const h of hrefMatches) {
        if (!h.startsWith('tel:') && !h.startsWith('mailto:') && !h.startsWith('http')) {
          linkSet.add(h);
        }
      }
    }

    // 2. Validate all internal link targets
    console.log('\nTesting all internal link destinations...');
    for (const link of linkSet) {
      const res = await fetchUrl(link);
      internalLinksReport.push({
        target: link,
        statusCode: res.status,
        valid: res.status === 200 || res.status === 301,
      });
    }

    // 3. Deep-equal comparison of JSON-LD schemas
    console.log('\nValidating JSON-LD deep equality...');
    const jsonLdReport = [];

    // LocalBusiness on index.html vs Next.js /
    const origHomeHtml = fs.readFileSync('index.html', 'utf-8');
    const origHomeJsonLd = JSON.parse(origHomeHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].trim());
    const nextHomeRes = await fetchUrl('/');
    const nextHomeJsonLdRaw = nextHomeRes.body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].trim();
    let nextHomeJsonLd;
    try {
      nextHomeJsonLd = JSON.parse(JSON.parse(nextHomeJsonLdRaw));
    } catch (e) {
      nextHomeJsonLd = JSON.parse(nextHomeJsonLdRaw);
    }

    jsonLdReport.push({
      schema: 'LocalBusiness (Home)',
      contextMatch: origHomeJsonLd['@context'] === nextHomeJsonLd['@context'],
      typeMatch: origHomeJsonLd['@type'] === nextHomeJsonLd['@type'],
      nameMatch: origHomeJsonLd.name === nextHomeJsonLd.name,
      phoneMatch: origHomeJsonLd.telephone === nextHomeJsonLd.telephone,
      geoMatch: JSON.stringify(origHomeJsonLd.geo) === JSON.stringify(nextHomeJsonLd.geo),
      addressMatch: JSON.stringify(origHomeJsonLd.address) === JSON.stringify(nextHomeJsonLd.address),
      deepEqual: JSON.stringify(origHomeJsonLd) === JSON.stringify(nextHomeJsonLd),
    });

    // FAQPage on faq.html vs Next.js /faq
    const origFaqHtml = fs.readFileSync('faq.html', 'utf-8');
    const origFaqJsonLd = JSON.parse(origFaqHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].trim());
    const nextFaqRes = await fetchUrl('/faq');
    const nextFaqJsonLdRaw = nextFaqRes.body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].trim();
    let nextFaqJsonLd;
    try {
      nextFaqJsonLd = JSON.parse(JSON.parse(nextFaqJsonLdRaw));
    } catch (e) {
      nextFaqJsonLd = JSON.parse(nextFaqJsonLdRaw);
    }

    jsonLdReport.push({
      schema: 'FAQPage (FAQ)',
      contextMatch: origFaqJsonLd['@context'] === nextFaqJsonLd['@context'],
      typeMatch: origFaqJsonLd['@type'] === nextFaqJsonLd['@type'],
      questionCountOrig: origFaqJsonLd.mainEntity.length,
      questionCountNext: nextFaqJsonLd.mainEntity.length,
      deepEqual: JSON.stringify(origFaqJsonLd) === JSON.stringify(nextFaqJsonLd),
    });

    // 4. Sitemap and Robots
    const sitemapRes = await fetchUrl('/sitemap.xml');
    const sitemapXml = sitemapRes.body;
    const urlMatches = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    const lastmodMatches = [...sitemapXml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((m) => m[1]);
    const priorityMatches = [...sitemapXml.matchAll(/<priority>(.*?)<\/priority>/g)].map((m) => m[1]);

    const sitemapReport = {
      statusCode: sitemapRes.status,
      totalUrls: urlMatches.length,
      hasRealLastmod: lastmodMatches.every((l) => l.startsWith('2026-08-10')),
      sampleLastmod: lastmodMatches[0],
      urlList: urlMatches,
    };

    const robotsRes = await fetchUrl('/robots.txt');
    const robotsReport = {
      statusCode: robotsRes.status,
      body: robotsRes.body.trim(),
    };

    console.log('\n=== METADATA PARITY REPORT ===');
    console.table(metadataReport);

    console.log('\n=== TEXT PARITY REPORT ===');
    console.table(textParityReport);

    console.log('\n=== INTERNAL LINKS RESOLUTION REPORT ===');
    console.table(internalLinksReport);

    console.log('\n=== JSON-LD DEEP-EQUALITY REPORT ===');
    console.table(jsonLdReport);

    console.log('\n=== SITEMAP & ROBOTS REPORT ===');
    console.log(sitemapReport);
    console.log('Robots.txt:');
    console.log(robotsReport.body);

    const fullReport = {
      metadataReport,
      textParityReport,
      internalLinksReport,
      jsonLdReport,
      sitemapReport,
      robotsReport,
    };

    fs.writeFileSync('tests/parity-report.json', JSON.stringify(fullReport, null, 2));
    console.log('\nParity test completed successfully and written to tests/parity-report.json');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    server.kill('SIGTERM');
    process.exit(0);
  }
}, 4000);
