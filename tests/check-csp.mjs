import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';

const pages = [
  '/',
  '/about',
  '/services',
  '/branding-identity',
  '/web-design-development',
  '/digital-marketing-seo',
  '/media-content-production',
  '/local-seo',
  '/kannur',
  '/thalassery',
  '/portfolio',
  '/blog',
  '/blog-cost-of-seo-kerala',
  '/faq',
  '/contact',
];

console.log('Starting Next.js server for CSP and console inspection...');
const server = spawn('npx', ['next', 'start', '-p', '3000'], { shell: true, stdio: 'ignore' });

setTimeout(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const pageResults = [];

    for (const p of pages) {
      const page = await browser.newPage();
      const consoleMessages = [];
      const cspViolations = [];

      page.on('console', (msg) => {
        const text = msg.text();
        consoleMessages.push({ type: msg.type(), text });
        if (text.toLowerCase().includes('content security policy') || text.toLowerCase().includes('violates')) {
          cspViolations.push(text);
        }
      });

      page.on('pageerror', (err) => {
        consoleMessages.push({ type: 'pageerror', text: err.message });
      });

      const response = await page.goto(`http://localhost:3000${p}`, { waitUntil: 'networkidle' });
      const headers = response.headers();

      pageResults.push({
        page: p,
        status: response.status(),
        cspHeaderPresent: Boolean(headers['content-security-policy']),
        permissionsPolicyPresent: Boolean(headers['permissions-policy']),
        cspViolationsCount: cspViolations.length,
        cspViolations,
        consoleErrors: consoleMessages.filter((m) => m.type === 'error' || m.type === 'pageerror'),
      });

      await page.close();
    }

    console.log('\n=== HEADLESS BROWSER CSP & CONSOLE INSPECTION ===');
    console.table(
      pageResults.map((r) => ({
        page: r.page,
        status: r.status,
        cspPresent: r.cspHeaderPresent,
        violations: r.cspViolationsCount,
        errors: r.consoleErrors.length,
      }))
    );

    const totalViolations = pageResults.reduce((acc, r) => acc + r.cspViolationsCount, 0);
    console.log(`\nTotal CSP Violations across all 15 pages: ${totalViolations}`);
  } catch (err) {
    console.error('Playwright inspection error:', err);
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
    process.exit(0);
  }
}, 4000);
