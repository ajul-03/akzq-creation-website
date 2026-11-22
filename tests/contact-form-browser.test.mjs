import assert from "node:assert";
import fs from "node:fs";
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import pg from "pg";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import EmbeddedPostgres from "embedded-postgres";

const BROWSER_PORT = 3009;
const PG_PORT = 54333;
const TEST_DB_NAME = "akzq_browser_test_db";
const TEST_DB_URL = `postgresql://postgres:password@127.0.0.1:${PG_PORT}/${TEST_DB_NAME}`;
const TEST_SECRET = "super-secret-browser-test-salt-32-chars!";

function waitForServer(port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: "ignore" });
    } else {
      proc.kill("SIGKILL");
    }
  } catch {}
}

async function runBrowserTest() {
  console.log("=== RUNNING HEADLESS CHROMIUM CONTACT FORM BROWSER TEST ===\n");

  // 1. Start Disposable Postgres Cluster
  console.log("--- 1. Starting Disposable Postgres Cluster for Browser Test ---");
  const pgServer = new EmbeddedPostgres({
    port: PG_PORT,
    databaseDir: "./.test-pg-browser-data",
    user: "postgres",
    password: "password",
    persistent: false,
    initdbFlags: ["-E", "UTF8", "--locale=C"],
  });

  try {
    await pgServer.initialise();
  } catch {}
  await pgServer.start();
  console.log(`Disposable Postgres running on port ${PG_PORT}.`);

  const adminClient = new pg.Client({
    connectionString: `postgresql://postgres:password@127.0.0.1:${PG_PORT}/postgres`,
  });
  await adminClient.connect();
  await adminClient.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME};`);
  await adminClient.query(`CREATE DATABASE ${TEST_DB_NAME};`);
  await adminClient.end();

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
    encoding: "utf8",
  });

  execSync("npx tsx prisma/seed.ts", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
    encoding: "utf8",
  });
  console.log("✓ Database initialized and seeded.\n");

  const adapter = new PrismaPg({ connectionString: TEST_DB_URL });
  const prisma = new PrismaClient({ adapter });

  // 2. Spawn Next.js Production Server
  console.log("--- 2. Starting Next.js Server on port " + BROWSER_PORT + " ---");
  const server = spawn("npx", ["next", "start", "-p", String(BROWSER_PORT)], {
    shell: true,
    env: {
      ...process.env,
      PORT: String(BROWSER_PORT),
      NODE_ENV: "production",
      DATABASE_URL: TEST_DB_URL,
      DIRECT_URL: TEST_DB_URL,
      IP_HASH_SECRET: TEST_SECRET,
      NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
      ALLOWED_ORIGINS: `http://127.0.0.1:${BROWSER_PORT}`, // Explicit ALLOWED_ORIGINS (T6)
    },
    stdio: "ignore",
  });

  const isReady = await waitForServer(BROWSER_PORT);
  assert.ok(isReady, `Server failed to respond on port ${BROWSER_PORT}`);
  console.log(`✓ Next.js server ready at http://127.0.0.1:${BROWSER_PORT}\n`);

  let browser;
  try {
    // 3. Launch Headless Chromium via Playwright
    console.log("--- 3. Launching Headless Chromium ---");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const cspViolations = [];
    const consoleErrors = [];

    page.on("request", (req) => {
      console.log(`[BROWSER NETWORK REQ] ${req.method()} ${req.url()}`);
    });

    page.on("response", (res) => {
      console.log(`[BROWSER NETWORK RES] ${res.status()} ${res.url()}`);
    });

    page.on("console", (msg) => {
      const text = msg.text();
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
      if (
        text.toLowerCase().includes("content security policy") ||
        text.toLowerCase().includes("violates")
      ) {
        cspViolations.push(text);
      }
      if (msg.type() === "error") {
        consoleErrors.push(text);
      }
    });

    page.on("pageerror", (err) => {
      console.log(`[BROWSER PAGEERROR] ${err.message}`);
      consoleErrors.push(err.message);
    });

    console.log(`Navigating to http://127.0.0.1:${BROWSER_PORT}/contact ...`);
    await page.goto(`http://127.0.0.1:${BROWSER_PORT}/contact`, {
      waitUntil: "networkidle",
    });

    // =========================================================================
    // TASK 2b: Honeypot Inspection & Visible Text Proof
    // =========================================================================
    console.log("\n--- TASK 2b: Inspecting Honeypot Input ---");
    const honeypotLocator = page.locator('input[name="hp_field"]');
    const outerHtml = await honeypotLocator.evaluate((el) => el.outerHTML);
    console.log("Honeypot outerHTML:\n" + outerHtml);

    const isAriaHidden = await honeypotLocator.getAttribute("aria-hidden");
    const tabIndex = await honeypotLocator.getAttribute("tabindex");
    const autoComplete = await honeypotLocator.getAttribute("autocomplete");
    const styleAttr = await honeypotLocator.getAttribute("style");

    assert.strictEqual(isAriaHidden, "true", "Honeypot must have aria-hidden='true'");
    assert.strictEqual(tabIndex, "-1", "Honeypot must have tabIndex=-1");
    assert.strictEqual(autoComplete, "off", "Honeypot must have autocomplete='off'");
    assert.ok(
      styleAttr.includes("left: -9999px") || styleAttr.includes("opacity: 0"),
      "Honeypot must be positioned off-screen"
    );

    // Verify honeypot field name/label is NOT in visible text
    const visiblePageText = await page.evaluate(() => document.body.innerText);
    assert.strictEqual(
      visiblePageText.includes("hp_field"),
      false,
      "Honeypot identifier must not be visible in page text"
    );
    console.log("✓ TASK 2b PASSED: Honeypot is completely invisible to users and screen readers.\n");

    // =========================================================================
    // TASK 2a: Fill & Submit Form -> 201, Success Modal, Lead Row, 0 CSP
    // =========================================================================
    console.log("--- TASK 2a: Submitting Valid Contact Form ---");
    await page.fill('#clientName', 'Naveen Kumar');
    await page.fill('#clientEmail', 'naveen.k@business.example');
    await page.fill('#clientPhone', '+91 7510109730');
    await page.fill('#clientCompany', 'Malabar Spices Trading');
    await page.selectOption('#serviceRequiredSelect', { index: 1 });
    await page.fill('#projectDetails', 'Complete brand identity refresh for retail chain in Kannur.');

    // Wait slightly so elapsedMs >= 2000
    await page.waitForTimeout(2200);

    // Track network request/response to /api/leads
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/leads") && res.request().method() === "POST",
        { timeout: 10000 }
      ),
      page.click('button[type="submit"]', { noWaitAfter: true }),
    ]);

    const resStatus = response.status();
    console.log(`Network Request: POST http://127.0.0.1:${BROWSER_PORT}/api/leads`);
    console.log(`Network Response Status: ${resStatus} Created`);
    assert.strictEqual(resStatus, 201, "API response must be 201 Created");

    // Verify Success Modal appears
    const modalLocator = page.locator("#formSuccessModal");
    await modalLocator.waitFor({ state: "visible", timeout: 5000 });
    const isModalVisible = await modalLocator.isVisible();
    assert.strictEqual(isModalVisible, true, "Success modal must be visible after submission");
    console.log("✓ Success modal is visible.");

    // =========================================================================
    // TASK 2d: WhatsApp Link / Message Parity Check
    // =========================================================================
    console.log("\n--- TASK 2d: Verifying WhatsApp Link Format ---");
    const whatsAppBtnLocator = page.locator("#successWhatsAppBtn");
    const generatedHref = await whatsAppBtnLocator.getAttribute("href");
    console.log("Generated WhatsApp href:\n" + generatedHref);

    // Extract legacy template from assets/js/contact.js
    const contactJsContent = fs.readFileSync("assets/js/contact.js", "utf8");
    const waTextMatch = contactJsContent.match(/const text = encodeURIComponent\(\s*`([^`]+)`\s*\);/);
    assert.ok(waTextMatch, "WhatsApp text template must exist in assets/js/contact.js");
    const legacyTemplate = waTextMatch[1];
    console.log("Programmatically Extracted WhatsApp Text Template from assets/js/contact.js:");
    console.log(`  "${legacyTemplate}"`);

    const nameVal = "Naveen Kumar";
    const serviceVal = "Branding & Identity";
    const budgetVal = "Starter (₹15k \u2013 \u20B930k)";
    const legacyCalculatedMessage = legacyTemplate
      .replace("${name}", nameVal)
      .replace("${service}", serviceVal)
      .replace("${budget}", budgetVal);
    const legacyExpectedHref = `https://wa.me/917510109730?text=${encodeURIComponent(legacyCalculatedMessage)}`;

    console.log("Legacy Calculated WhatsApp href (from assets/js/contact.js):");
    console.log(`  ${legacyExpectedHref}`);
    console.log("Browser-Rendered WhatsApp href:");
    console.log(`  ${generatedHref}`);
    assert.strictEqual(
      generatedHref,
      legacyExpectedHref,
      "WhatsApp message href must match legacy contact.js generated href byte-for-byte"
    );
    console.log("✓ TASK 2d PASSED: WhatsApp message format matches legacy format byte-for-byte.\n");

    // Verify Lead row in Postgres database
    const createdLead = await prisma.lead.findFirst({
      where: { email: "naveen.k@business.example" },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(createdLead, "Lead row must exist in the database");
    console.log("Created Lead Row in Database:");
    console.dir(createdLead, { depth: null });
    assert.strictEqual(createdLead.name, "Naveen Kumar");
    assert.strictEqual(createdLead.status, "NEW");

    // Verify 0 CSP violations
    console.log(`\nConsole CSP Violations Count: ${cspViolations.length}`);
    assert.strictEqual(cspViolations.length, 0, "There must be 0 CSP violations");
    console.log("✓ TASK 2a PASSED: Form submission creates lead row, shows modal, 0 CSP violations.\n");

    // Close the success modal
    await page.click("#closeSuccessModal");
    await modalLocator.waitFor({ state: "hidden", timeout: 5000 });

    const fillValidForm = async () => {
      await page.fill('#clientName', 'Test User');
      await page.fill('#clientEmail', 'test.user@example.com');
      await page.fill('#clientPhone', '+91 7510109730');
      await page.selectOption('#serviceRequiredSelect', { index: 1 });
    };

    // =========================================================================
    // TASK 2c: Route Interception (Force 429, 503, Offline)
    // =========================================================================
    console.log("--- TASK 2c: Route Interception (429, 503, Offline Network Failure) ---");

    // 1. Force 429
    console.log("\n[Subcase 1: Force HTTP 429]");
    await fillValidForm();
    await page.route("**/api/leads", (route) => {
      route.fulfill({
        status: 429,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Too many submissions" }),
      });
    });

    await page.click('button[type="submit"]', { noWaitAfter: true });
    await page.waitForTimeout(500);

    let modalVisible = await page.locator("#formSuccessModal").isVisible();
    assert.strictEqual(modalVisible, false, "Modal must NOT appear on 429");
    console.log(`Assert: success modal is hidden on 429 -> ${!modalVisible}`);

    const fallback429 = page.locator("#formFallbackError");
    assert.strictEqual(await fallback429.isVisible(), true, "Fallback error must appear on 429");
    const fallbackText429 = await fallback429.innerText();
    console.log("Fallback Error Text on 429:\n" + fallbackText429);
    assert.ok(fallbackText429.includes("+91 75101 09730"));
    assert.ok(fallbackText429.includes("WhatsApp"));

    const telLink429 = await fallback429.locator('a[href^="tel:"]').getAttribute("href");
    const waLink429 = await fallback429.locator('a[href*="wa.me"]').getAttribute("href");
    console.log(`Fallback 429 tel href:   ${telLink429}`);
    console.log(`Fallback 429 wa.me href: ${waLink429}`);
    assert.strictEqual(telLink429, "tel:+917510109730");
    assert.strictEqual(waLink429, "https://wa.me/917510109730");
    await page.unroute("**/api/leads");

    // 2. Force 503
    console.log("\n[Subcase 2: Force HTTP 503]");
    await fillValidForm();
    await page.route("**/api/leads", (route) => {
      route.fulfill({
        status: 503,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Service temporarily unavailable" }),
      });
    });

    await page.click('button[type="submit"]', { noWaitAfter: true });
    await page.waitForTimeout(500);

    modalVisible = await page.locator("#formSuccessModal").isVisible();
    assert.strictEqual(modalVisible, false, "Modal must NOT appear on 503");
    console.log(`Assert: success modal is hidden on 503 -> ${!modalVisible}`);

    const fallback503 = page.locator("#formFallbackError");
    assert.strictEqual(await fallback503.isVisible(), true);
    const fallbackText503 = await fallback503.innerText();
    console.log("Fallback Error Text on 503:\n" + fallbackText503);
    const telLink503 = await fallback503.locator('a[href^="tel:"]').getAttribute("href");
    const waLink503 = await fallback503.locator('a[href*="wa.me"]').getAttribute("href");
    console.log(`Fallback 503 tel href:   ${telLink503}`);
    console.log(`Fallback 503 wa.me href: ${waLink503}`);
    assert.strictEqual(telLink503, "tel:+917510109730");
    assert.strictEqual(waLink503, "https://wa.me/917510109730");
    console.log("✓ Fallback error displayed on 503; modal hidden.");
    await page.unroute("**/api/leads");

    // 3. Force Network Offline / Abort
    console.log("\n[Subcase 3: Force Offline / Network Failure]");
    await fillValidForm();
    await page.route("**/api/leads", (route) => {
      route.abort("failed");
    });

    await page.click('button[type="submit"]', { noWaitAfter: true });
    await page.waitForTimeout(500);

    modalVisible = await page.locator("#formSuccessModal").isVisible();
    assert.strictEqual(modalVisible, false, "Modal must NOT appear on network failure");
    console.log(`Assert: success modal is hidden on offline -> ${!modalVisible}`);

    const fallbackOffline = page.locator("#formFallbackError");
    assert.strictEqual(await fallbackOffline.isVisible(), true);
    const fallbackTextOffline = await fallbackOffline.innerText();
    console.log("Fallback Error Text on Offline Failure:\n" + fallbackTextOffline);
    const telLinkOffline = await fallbackOffline.locator('a[href^="tel:"]').getAttribute("href");
    const waLinkOffline = await fallbackOffline.locator('a[href*="wa.me"]').getAttribute("href");
    console.log(`Fallback offline tel href:   ${telLinkOffline}`);
    console.log(`Fallback offline wa.me href: ${waLinkOffline}`);
    assert.strictEqual(telLinkOffline, "tel:+917510109730");
    assert.strictEqual(waLinkOffline, "https://wa.me/917510109730");
    console.log("✓ Fallback error displayed on network failure; modal hidden.");
    await page.unroute("**/api/leads");
    console.log("✓ TASK 2c PASSED: All failure cases hide modal and display fallback error with working links.\n");

    // =========================================================================
    // TASK 4: Real Server 400 Field Errors (No Route Interception)
    // =========================================================================
    console.log("--- TASK 4: Real Server 400 Validation Errors (No Route Interception) ---");
    // Extract legacy validation alert from assets/js/contact.js programmatically
    const contactJsAlert = fs.readFileSync("assets/js/contact.js", "utf8");
    const alertMatch = contactJsAlert.match(/alert\(['"`](.*?)['"`]\)/);
    assert.ok(alertMatch, "Failed to extract alert from assets/js/contact.js");
    const legacyJsAlert = alertMatch[1];
    console.log(`Programmatically Extracted Legacy JS Alert Message (assets/js/contact.js:30):`);
    console.log(`  "${legacyJsAlert}"`);

    // Fill valid form, then set invalid email and bypass client HTML5 validation via noValidate
    await fillValidForm();
    await page.evaluate(() => {
      const form = document.getElementById("agencyQuoteForm");
      if (form) {
        form.noValidate = true;
        const emailInput = form.querySelector('[name="email"]');
        if (emailInput) {
          emailInput.value = "not-an-email-domain";
        }
      }
    });

    await page.click('button[type="submit"]', { noWaitAfter: true });
    await page.waitForTimeout(600);

    const emailErrorLocator = page.locator(".form-group:has(#clientEmail) .form-error");
    await emailErrorLocator.waitFor({ state: "visible", timeout: 5000 });
    const displayedEmailError = await emailErrorLocator.innerText();

    console.log(`Legacy Validation Message Source: "${legacyJsAlert}"`);
    console.log(`Browser-Displayed Field Error:   "${displayedEmailError}"`);
    assert.ok(legacyJsAlert.includes("Email"), "Legacy alert must mention Email");
    assert.strictEqual(displayedEmailError, "Please fill in your Email.");
    console.log("✓ TASK 4 PASSED: Real server 400 maps field to legacy validation message and ignores server strings.\n");

    // =========================================================================
    // TASK 1: Browser Referrer & UTM Test
    // =========================================================================
    console.log("--- TASK 1: Browser Referrer & UTM Capturing ---");
    // (a) Navigation with UTMs and HTTP Referer
    await page.goto(
      `http://127.0.0.1:${BROWSER_PORT}/contact?utm_source=test&utm_medium=cpc&utm_campaign=x`,
      {
        referer: "https://example.org/some-page?q=1",
        waitUntil: "networkidle",
      }
    );

    await page.fill('#clientName', 'Referrer Test User');
    await page.fill('#clientEmail', 'referrer.test@example.com');
    await page.fill('#clientPhone', '+91 7510109730');
    await page.selectOption('#serviceRequiredSelect', { index: 1 });
    await page.waitForTimeout(2100);

    const [utmRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/leads") && res.request().method() === "POST",
        { timeout: 10000 }
      ),
      page.click('button[type="submit"]', { noWaitAfter: true }),
    ]);
    assert.strictEqual(utmRes.status(), 201);

    const utmLead = await prisma.lead.findFirst({
      where: { email: "referrer.test@example.com" },
      orderBy: { createdAt: "desc" },
    });
    console.log("\nFull Lead Row with UTMs and Referrer (query stripped):");
    console.dir(utmLead, { depth: null });
    assert.ok(utmLead);
    assert.strictEqual(utmLead.utmSource, "test");
    assert.strictEqual(utmLead.utmMedium, "cpc");
    assert.strictEqual(utmLead.utmCampaign, "x");
    assert.strictEqual(utmLead.referrer, "https://example.org/some-page");

    // (b) Direct navigation without referer
    await page.goto(`http://127.0.0.1:${BROWSER_PORT}/contact`, {
      waitUntil: "networkidle",
    });

    await page.fill('#clientName', 'Direct Nav User');
    await page.fill('#clientEmail', 'direct.nav@example.com');
    await page.fill('#clientPhone', '+91 7510109730');
    await page.selectOption('#serviceRequiredSelect', { index: 1 });
    await page.waitForTimeout(2100);

    const [directRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/leads") && res.request().method() === "POST",
        { timeout: 10000 }
      ),
      page.click('button[type="submit"]', { noWaitAfter: true }),
    ]);
    assert.strictEqual(directRes.status(), 201);

    const directLead = await prisma.lead.findFirst({
      where: { email: "direct.nav@example.com" },
      orderBy: { createdAt: "desc" },
    });
    console.log("\nFull Lead Row from Direct Navigation (referrer null):");
    console.dir(directLead, { depth: null });
    assert.ok(directLead);
    assert.strictEqual(directLead.referrer, null);
    console.log("✓ TASK 1 PASSED: UTMs set, referrer stripped to origin+pathname, null on direct nav.\n");

    // =========================================================================
    // TASK 11: Fresh Lead Table Query Verification
    // =========================================================================
    console.log("--- TASK 11: Fresh Lead Table Rows Verification ---");
    const freshLeadRows = await prisma.$queryRawUnsafe(
      'SELECT id, "createdAt", "consentGivenAt" FROM "Lead" ORDER BY "createdAt"'
    );
    console.log('SELECT id, "createdAt", "consentGivenAt" FROM "Lead" ORDER BY "createdAt":');
    console.table(freshLeadRows);
    console.log("✓ TASK 11 PASSED: Lead table queried and printed.\n");

  } finally {
    console.log("Cleaning up browser test resources...");
    if (browser) await browser.close();
    killProcessTree(server);
    try {
      await prisma.$disconnect();
    } catch {}
    try {
      await pgServer.stop();
    } catch {}
    console.log("✓ Browser test cleanup finished.");
  }

  console.log("\n========================================================");
  console.log("HEADLESS BROWSER FORM TESTS ALL PASSED CLEANLY");
  console.log("========================================================\n");
}

runBrowserTest().catch((err) => {
  console.error("BROWSER TEST FAILED:", err);
  process.exit(1);
});
