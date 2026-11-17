import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';

function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        resolve();
      });
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

async function runIsolationTest() {
  console.log('Starting Next.js production server on port 3000...');
  const server = spawn('cmd.exe', ['/c', 'npx next start -H 127.0.0.1 -p 3000'], { stdio: 'inherit' });

  let browser;
  const detailedAudit = [];

  try {
    await waitForServer(3000);

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 1. Audit /kannur (Forbidden: "Thalassery")
    console.log('\n--- Auditing /kannur (Isolation from "Thalassery") ---');
    await page.goto('http://127.0.0.1:3000/kannur', { waitUntil: 'networkidle' });
    const kannurHtml = await page.content();

    // A. Meta tags inspection
    const kannurMetaTags = await page.$$eval('meta', (els) =>
      els.map((e) => (e.getAttribute('content') || '') + ' ' + (e.getAttribute('name') || '') + ' ' + (e.getAttribute('property') || ''))
    );
    const kannurMetaViolations = kannurMetaTags.filter((t) => /thalassery/i.test(t));

    // B. JSON-LD inspection
    const kannurJsonLdScripts = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent || ''));
    const kannurJsonViolations = kannurJsonLdScripts.filter((s) => /thalassery/i.test(s));

    // C. Links inspection
    const kannurLinks = await page.$$eval('a', (els) => els.map((e) => e.getAttribute('href') || ''));
    const kannurLinkViolations = kannurLinks.filter((h) => /thalassery/i.test(h));

    // D. Visible Body Text inspection
    const kannurBodyText = await page.innerText('body');
    const kannurBodyViolations = (kannurBodyText.match(/thalassery/gi) || []);

    // E. Total HTML string inspection
    const kannurTotalViolations = (kannurHtml.match(/thalassery/gi) || []);

    detailedAudit.push(
      { route: '/kannur', category: 'Total Rendered HTML', forbiddenTerm: 'Thalassery', violationsFound: kannurTotalViolations.length, status: kannurTotalViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/kannur', category: 'Meta Tags', forbiddenTerm: 'Thalassery', violationsFound: kannurMetaViolations.length, status: kannurMetaViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/kannur', category: 'JSON-LD Scripts', forbiddenTerm: 'Thalassery', violationsFound: kannurJsonViolations.length, status: kannurJsonViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/kannur', category: 'Anchor href Links', forbiddenTerm: 'Thalassery', violationsFound: kannurLinkViolations.length, status: kannurLinkViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/kannur', category: 'Visible Body Text', forbiddenTerm: 'Thalassery', violationsFound: kannurBodyViolations.length, status: kannurBodyViolations.length === 0 ? 'PASS' : 'FAIL' }
    );

    // 2. Audit /thalassery (Forbidden: "Kannur")
    console.log('--- Auditing /thalassery (Isolation from "Kannur") ---');
    await page.goto('http://127.0.0.1:3000/thalassery', { waitUntil: 'networkidle' });
    const thalasseryHtml = await page.content();

    // A. Meta tags inspection
    const thalasseryMetaTags = await page.$$eval('meta', (els) =>
      els.map((e) => (e.getAttribute('content') || '') + ' ' + (e.getAttribute('name') || '') + ' ' + (e.getAttribute('property') || ''))
    );
    const thalasseryMetaViolations = thalasseryMetaTags.filter((t) => /kannur/i.test(t));

    // B. JSON-LD inspection
    const thalasseryJsonLdScripts = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent || ''));
    const thalasseryJsonViolations = thalasseryJsonLdScripts.filter((s) => /kannur/i.test(s));

    // C. Links inspection
    const thalasseryLinks = await page.$$eval('a', (els) => els.map((e) => e.getAttribute('href') || ''));
    const thalasseryLinkViolations = thalasseryLinks.filter((h) => /kannur/i.test(h));

    // D. Visible Body Text inspection
    const thalasseryBodyText = await page.innerText('body');
    const thalasseryBodyViolations = (thalasseryBodyText.match(/kannur/gi) || []);

    // E. Total HTML string inspection
    const thalasseryTotalViolations = (thalasseryHtml.match(/kannur/gi) || []);

    detailedAudit.push(
      { route: '/thalassery', category: 'Total Rendered HTML', forbiddenTerm: 'Kannur', violationsFound: thalasseryTotalViolations.length, status: thalasseryTotalViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/thalassery', category: 'Meta Tags', forbiddenTerm: 'Kannur', violationsFound: thalasseryMetaViolations.length, status: thalasseryMetaViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/thalassery', category: 'JSON-LD Scripts', forbiddenTerm: 'Kannur', violationsFound: thalasseryJsonViolations.length, status: thalasseryJsonViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/thalassery', category: 'Anchor href Links', forbiddenTerm: 'Kannur', violationsFound: thalasseryLinkViolations.length, status: thalasseryLinkViolations.length === 0 ? 'PASS' : 'FAIL' },
      { route: '/thalassery', category: 'Visible Body Text', forbiddenTerm: 'Kannur', violationsFound: thalasseryBodyViolations.length, status: thalasseryBodyViolations.length === 0 ? 'PASS' : 'FAIL' }
    );

    console.log('\n=== COMPREHENSIVE LOCATION ISOLATION REPORT ===');
    console.table(detailedAudit);

    const allPassed = detailedAudit.every((r) => r.status === 'PASS');
    if (allPassed) {
      console.log('\nFINAL RESULT: PASS — Zero cross-contamination between /kannur and /thalassery across all categories.');
      process.exit(0);
    } else {
      console.error('\nFINAL RESULT: FAIL — Cross-contamination detected!');
      process.exit(1);
    }
  } finally {
    if (browser) await browser.close();
    if (server.pid) {
      try {
        spawn('cmd.exe', ['/c', `taskkill /pid ${server.pid} /f /t`], { stdio: 'ignore' });
      } catch (e) {
        server.kill('SIGTERM');
      }
    }
  }
}

runIsolationTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
