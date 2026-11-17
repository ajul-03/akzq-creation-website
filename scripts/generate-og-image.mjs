import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function generateOgImage() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });

  // Read logo-white.svg
  const logoSvgPath = path.resolve('public/assets/images/logo-white.svg');
  let logoSvg = '';
  if (fs.existsSync(logoSvgPath)) {
    logoSvg = fs.readFileSync(logoSvgPath, 'utf8');
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at 80% 20%, rgba(109, 40, 217, 0.35) 0%, rgba(15, 23, 42, 1) 60%), #0F172A;
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 80px;
      position: relative;
      overflow: hidden;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      background: rgba(255, 106, 43, 0.15);
      border: 1px solid #FF6A2B;
      color: #FF6A2B;
      border-radius: 9999px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .header-logo {
      height: 52px;
      display: flex;
      align-items: center;
    }
    .header-logo svg {
      height: 52px;
      width: auto;
    }
    .main-title {
      font-size: 54px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      max-width: 950px;
      margin-bottom: 20px;
    }
    .accent-text {
      color: #FF6A2B;
    }
    .subtitle {
      font-size: 24px;
      color: #94A3B8;
      max-width: 850px;
      line-height: 1.4;
      font-weight: 400;
    }
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 28px;
      color: #94A3B8;
      font-size: 18px;
      font-weight: 500;
    }
    .footer-pills {
      display: flex;
      gap: 16px;
    }
    .footer-pill {
      background: rgba(255, 255, 255, 0.06);
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 14px;
    }
    .glow-orb {
      position: absolute;
      width: 450px;
      height: 450px;
      background: #6D28D9;
      filter: blur(140px);
      opacity: 0.25;
      border-radius: 50%;
      top: -100px;
      right: -100px;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="glow-orb"></div>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
      <div class="header-logo">${logoSvg}</div>
    </div>
    <h1 class="main-title">Digital Marketing &amp; Web Design with <span class="accent-text">Fixed Pricing</span></h1>
    <p class="subtitle">North Malabar's transparent creative and digital growth agency. Serving ambitious brands in Kannur, Thalassery, and beyond.</p>
  </div>

  <div class="footer-bar">
    <span>akzqcreation.com</span>
    <div class="footer-pills">
      <span class="footer-pill">Branding</span>
      <span class="footer-pill">Web Development</span>
      <span class="footer-pill">Local SEO</span>
      <span class="footer-pill">Content Production</span>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  const outPath = path.resolve('public/assets/images/og-share.png');
  await page.screenshot({ path: outPath, type: 'png' });
  console.log('OG Share image generated successfully at:', outPath);

  await browser.close();
}

generateOgImage().catch(console.error);
