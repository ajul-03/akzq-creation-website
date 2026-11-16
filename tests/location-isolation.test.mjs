import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';

function waitForServer(port, timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Server did not start on port ${port} within ${timeout}ms`));
        } else {
          setTimeout(ping, 300);
        }
      });
    }
    ping();
  });
}

async function runIsolationTest() {
  console.log('Starting Next.js production server on port 3000...');
  const server = spawn('cmd.exe', ['/c', 'npx next start -p 3000'], { stdio: 'ignore' });

  let browser;
  const results = [];

  try {
    await waitForServer(3000);

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 1. Audit /kannur page
    console.log('\nAuditing /kannur for complete isolation from "Thalassery"...');
    await page.goto('http://localhost:3000/kannur', { waitUntil: 'networkidle' });
    const kannurHtml = await page.content();

    // Check for mentions of Thalassery
    const thalasseryMatches = kannurHtml.match(/thalassery/gi) || [];
    // Check for links to thalassery
    const thalasseryLinks = await page.$$eval('a[href*="thalassery"]', (els) => els.map((el) => el.href));

    results.push({
      page: '/kannur',
      forbiddenTerm: 'Thalassery',
      mentionsFound: thalasseryMatches.length,
      linksFound: thalasseryLinks.length,
      status: thalasseryMatches.length === 0 && thalasseryLinks.length === 0 ? 'PASS' : 'FAIL',
    });

    // 2. Audit /thalassery page
    console.log('Auditing /thalassery for complete isolation from "Kannur"...');
    await page.goto('http://localhost:3000/thalassery', { waitUntil: 'networkidle' });
    const thalasseryHtml = await page.content();

    // Check for mentions of Kannur
    const kannurMatches = thalasseryHtml.match(/kannur/gi) || [];
    // Check for links to kannur
    const kannurLinks = await page.$$eval('a[href*="kannur"]', (els) => els.map((el) => el.href));

    results.push({
      page: '/thalassery',
      forbiddenTerm: 'Kannur',
      mentionsFound: kannurMatches.length,
      linksFound: kannurLinks.length,
      status: kannurMatches.length === 0 && kannurLinks.length === 0 ? 'PASS' : 'FAIL',
    });

    console.log('\n=== LOCATION ISOLATION AUDIT RESULTS ===');
    console.table(results);

    const allPassed = results.every((r) => r.status === 'PASS');
    if (allPassed) {
      console.log('RESULT: PASS — Both location pages are strictly isolated.');
      process.exit(0);
    } else {
      console.error('RESULT: FAIL — Location isolation violation detected!');
      if (thalasseryMatches.length > 0 || thalasseryLinks.length > 0) {
        console.error('  /kannur mentions Thalassery:', thalasseryMatches.length, 'times, links:', thalasseryLinks);
      }
      if (kannurMatches.length > 0 || kannurLinks.length > 0) {
        console.error('  /thalassery mentions Kannur:', kannurMatches.length, 'times, links:', kannurLinks);
      }
      process.exit(1);
    }
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
}

runIsolationTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
