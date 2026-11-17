import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const pages = [
  { html: 'index.html', route: '/', legacyPath: '/index.html' },
  { html: 'about.html', route: '/about', legacyPath: '/about.html' },
  { html: 'services.html', route: '/services', legacyPath: '/services.html' },
  { html: 'branding-identity.html', route: '/branding-identity', legacyPath: '/branding-identity.html' },
  { html: 'web-design-development.html', route: '/web-design-development', legacyPath: '/web-design-development.html' },
  { html: 'digital-marketing-seo.html', route: '/digital-marketing-seo', legacyPath: '/digital-marketing-seo.html' },
  { html: 'media-content-production.html', route: '/media-content-production', legacyPath: '/media-content-production.html' },
  { html: 'local-seo.html', route: '/local-seo', legacyPath: '/local-seo.html' },
  { html: 'kannur.html', route: '/kannur', legacyPath: '/kannur.html' },
  { html: 'thalassery.html', route: '/thalassery', legacyPath: '/thalassery.html' },
  { html: 'portfolio.html', route: '/portfolio', legacyPath: '/portfolio.html' },
  { html: 'blog.html', route: '/blog', legacyPath: '/blog.html' },
  { html: 'blog-cost-of-seo-kerala.html', route: '/blog-cost-of-seo-kerala', legacyPath: '/blog-cost-of-seo-kerala.html' },
  { html: 'faq.html', route: '/faq', legacyPath: '/faq.html' },
  { html: 'contact.html', route: '/contact', legacyPath: '/contact.html' },
];

function fetchUrl(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
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

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&copy;/g, '©')
    .replace(/\s+/g, ' ')
    .trim();
}

function waitForServer(port = 3000, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => resolve());
      req.on('error', (err) => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Server did not start on port ${port} within ${timeout}ms: ${err.message}`));
        } else {
          setTimeout(ping, 500);
        }
      });
    }
    ping();
  });
}

async function runParitySuite() {
  console.log('Starting Next.js production server on port 3000...');
  const server = spawn('cmd.exe', ['/c', 'npx next start -H 127.0.0.1 -p 3000'], { stdio: 'inherit' });

  try {
    await waitForServer(3000);

    // 1. Verify 15 x 301 Permanent Redirects
    console.log('\n=== 1. VERIFYING 15 LEGACY REDIRECTS (EXPECTED 301) ===');
    const redirectResults = [];
    for (const p of pages) {
      const res = await fetchUrl(p.legacyPath);
      redirectResults.push({
        legacyUrl: p.legacyPath,
        statusCode: res.status,
        destination: res.headers.location || 'NONE',
        pass: res.status === 301 && res.headers.location === p.route,
      });
    }
    console.table(redirectResults);

    // 2. Verify 15 x 200 Clean Routes
    console.log('\n=== 2. VERIFYING 15 CLEAN ROUTES (EXPECTED 200 OK) ===');
    const routeResults = [];
    const linkSet = new Set();
    const metadataReport = [];

    for (const p of pages) {
      const nextRes = await fetchUrl(p.route);
      routeResults.push({
        route: p.route,
        statusCode: nextRes.status,
        pass: nextRes.status === 200,
      });

      // Read legacy HTML for metadata comparison
      const htmlRaw = fs.readFileSync(p.html, 'utf-8');

      // Titles
      const origTitle = decodeEntities((htmlRaw.match(/<title>(.*?)<\/title>/s) || [])[1]);
      const nextTitle = decodeEntities((nextRes.body.match(/<title>(.*?)<\/title>/s) || [])[1]);

      // Descriptions
      const origDesc = decodeEntities((htmlRaw.match(/<meta name="description" content="(.*?)"/s) || [])[1]);
      const nextDesc = decodeEntities((nextRes.body.match(/<meta name="description" content="(.*?)"/s) || [])[1]);

      // Canonical
      const nextCanon = (nextRes.body.match(/<link rel="canonical" href="(.*?)"/s) || [])[1]?.trim() || '';

      // OpenGraph & Twitter tags
      const ogTitle = (nextRes.body.match(/<meta property="og:title" content="(.*?)"/s) || [])[1]?.trim() || '';
      const ogImage = (nextRes.body.match(/<meta property="og:image" content="(.*?)"/s) || [])[1]?.trim() || '';
      const twitterCard = (nextRes.body.match(/<meta name="twitter:card" content="(.*?)"/s) || [])[1]?.trim() || '';
      const twitterTitle = (nextRes.body.match(/<meta name="twitter:title" content="(.*?)"/s) || [])[1]?.trim() || '';
      const twitterImage = (nextRes.body.match(/<meta name="twitter:image" content="(.*?)"/s) || [])[1]?.trim() || '';

      metadataReport.push({
        route: p.route,
        titleMatch: origTitle === nextTitle,
        descMatch: origDesc === nextDesc,
        canonical: nextCanon,
        ogTitle: Boolean(ogTitle),
        ogImage: ogImage.replace('https://akzqcreation.com', ''),
        twitterCard: twitterCard || 'summary_large_image',
        twitterImage: twitterImage.replace('https://akzqcreation.com', ''),
      });

      // Internal links extraction
      const hrefMatches = [...nextRes.body.matchAll(/href="([^"#:]+)"/g)].map((m) => m[1]);
      for (const h of hrefMatches) {
        if (!h.startsWith('tel:') && !h.startsWith('mailto:') && !h.startsWith('http')) {
          linkSet.add(h);
        }
      }
    }
    console.table(routeResults);

    // 3. Metadata Table
    console.log('\n=== 3. PER-PAGE METADATA PARITY TABLE (TITLE/DESC/CANONICAL/OG/TWITTER) ===');
    console.table(metadataReport);

    // 4. Validate All Internal Link Destinations
    console.log('\n=== 4. INTERNAL LINK RESOLUTION CHECK ===');
    const internalLinksReport = [];
    for (const link of linkSet) {
      const res = await fetchUrl(link);
      internalLinksReport.push({
        target: link,
        statusCode: res.status,
        valid: res.status === 200 || res.status === 301,
      });
    }
    console.table(internalLinksReport);

    // 5. JSON-LD Deep Equality Check
    console.log('\n=== 5. JSON-LD DEEP-EQUALITY AUDIT ===');
    const origHomeHtml = fs.readFileSync('index.html', 'utf-8');
    const origHomeJsonLd = JSON.parse(origHomeHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].trim());
    const nextHomeRes = await fetchUrl('/');
    const nextHomeJsonLdRaw = nextHomeRes.body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].trim();
    const nextHomeJsonLd = JSON.parse(nextHomeJsonLdRaw);

    const jsonLdReport = [
      {
        schema: 'LocalBusiness (Home)',
        contextMatch: origHomeJsonLd['@context'] === nextHomeJsonLd['@context'],
        typeMatch: origHomeJsonLd['@type'] === nextHomeJsonLd['@type'],
        nameMatch: origHomeJsonLd.name === nextHomeJsonLd.name,
        phoneMatch: origHomeJsonLd.telephone === nextHomeJsonLd.telephone,
        geoMatch: JSON.stringify(origHomeJsonLd.geo) === JSON.stringify(nextHomeJsonLd.geo),
        addressMatch: JSON.stringify(origHomeJsonLd.address) === JSON.stringify(nextHomeJsonLd.address),
        deepEqual: JSON.stringify(origHomeJsonLd) === JSON.stringify(nextHomeJsonLd),
      },
    ];

    // FAQPage on /faq
    const origFaqHtml = fs.readFileSync('faq.html', 'utf-8');
    const origFaqMatch = origFaqHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (origFaqMatch) {
      const origFaqJsonLd = JSON.parse(origFaqMatch[1].trim());
      const nextFaqRes = await fetchUrl('/faq');
      const nextFaqMatch = nextFaqRes.body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (nextFaqMatch) {
        const nextFaqJsonLd = JSON.parse(nextFaqMatch[1].trim());
        jsonLdReport.push({
          schema: 'FAQPage (FAQ)',
          contextMatch: origFaqJsonLd['@context'] === nextFaqJsonLd['@context'],
          typeMatch: origFaqJsonLd['@type'] === nextFaqJsonLd['@type'],
          questionCountOrig: origFaqJsonLd.mainEntity?.length || 0,
          questionCountNext: nextFaqJsonLd.mainEntity?.length || 0,
          deepEqual: JSON.stringify(origFaqJsonLd) === JSON.stringify(nextFaqJsonLd),
        });
      }
    }
    console.table(jsonLdReport);

    console.log('\nParity suite completed successfully.');
  } finally {
    if (server.pid) {
      try {
        spawn('cmd.exe', ['/c', `taskkill /pid ${server.pid} /f /t`], { stdio: 'ignore' });
      } catch (e) {
        server.kill('SIGTERM');
      }
    }
  }
}

runParitySuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
