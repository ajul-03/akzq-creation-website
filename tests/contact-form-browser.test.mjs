import assert from "assert";
import { execSync, spawn } from "child_process";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const PG_PORT = 54333;
const TEST_DB_NAME = "akzq_browser_test_db";
const TEST_DB_URL = `postgresql://postgres:password@127.0.0.1:${PG_PORT}/${TEST_DB_NAME}`;
const BROWSER_PORT = 3009;
const TEST_SECRET = "browser-test-salt-secret-32-chars-long!";

function killProcessTree(child) {
  if (!child || !child.pid) return;
  try {
    execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: "ignore" });
  } catch {}
}

async function waitForServer(port, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/contact`);
      if (res.status === 200) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

console.log("=== RUNNING HEADLESS CHROMIUM CONTACT FORM BROWSER TEST ===\n");

async function runBrowserTest() {
  // Safety check
  if (!TEST_DB_NAME.includes("test")) {
    throw new Error(`SAFETY VIOLATION: Database '${TEST_DB_NAME}' does not contain 'test'.`);
  }

  // 1. Start Disposable PostgreSQL
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
  const server = spawn("cmd.exe", ["/c", `npx next start -p ${BROWSER_PORT}`], {
    env: {
      ...process.env,
      PORT: String(BROWSER_PORT),
      NODE_ENV: "production",
      DATABASE_URL: TEST_DB_URL,
      DIRECT_URL: TEST_DB_URL,
      IP_HASH_SECRET: TEST_SECRET,
      NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
      ALLOW_DEV_ORIGIN: "true", // Allows testing from localhost browser
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
    // TASK 2d: WhatsApp Link / Message Format Equals Legacy Format
    // =========================================================================
    console.log("\n--- TASK 2d: Verifying WhatsApp Link Format ---");
    const waBtnLocator = page.locator("#successWhatsAppBtn");
    const waHref = await waBtnLocator.getAttribute("href");
    console.log("Generated WhatsApp href:\n" + waHref);

    const expectedPrefix = "https://wa.me/917510109730?text=";
    assert.ok(waHref.startsWith(expectedPrefix), "WhatsApp link must start with https://wa.me/917510109730?text=");

    const decodedMessage = decodeURIComponent(waHref.replace(expectedPrefix, ""));
    console.log("Decoded WhatsApp Message:\n" + decodedMessage);

    const legacyExpectedMessage =
      "Hi AKZQ.Creation, I am Naveen Kumar. I requested a fixed-price quote for Branding & Identity. (Budget Range: Starter (₹15k \u2013 \u20B930k)). Let's discuss!";
    assert.strictEqual(
      decodedMessage,
      legacyExpectedMessage,
      "WhatsApp message text must equal the legacy format exactly"
    );
    console.log("✓ TASK 2d PASSED: WhatsApp message format matches legacy format byte-for-byte.\n");

    // Verify Lead row exists in PostgreSQL
    const createdLead = await prisma.lead.findFirst({
      where: { email: "naveen.k@business.example" },
    });
    assert.ok(createdLead, "Lead row must exist in database");
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

    const fallback429 = page.locator("#formFallbackError");
    assert.strictEqual(await fallback429.isVisible(), true, "Fallback error must appear on 429");
    const fallbackText = await fallback429.innerText();
    console.log("Fallback Error Text on 429:\n" + fallbackText);
    assert.ok(fallbackText.includes("+91 75101 09730"));
    assert.ok(fallbackText.includes("WhatsApp"));

    const telLink = await fallback429.locator('a[href^="tel:"]').getAttribute("href");
    const waLink = await fallback429.locator('a[href*="wa.me"]').getAttribute("href");
    console.log(`Fallback tel link: ${telLink}`);
    console.log(`Fallback wa link:  ${waLink}`);
    assert.strictEqual(telLink, "tel:+917510109730");
    assert.strictEqual(waLink, "https://wa.me/917510109730");
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
    assert.strictEqual(await page.locator("#formFallbackError").isVisible(), true);
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
    assert.strictEqual(await page.locator("#formFallbackError").isVisible(), true);
    console.log("✓ Fallback error displayed on network failure; modal hidden.");
    await page.unroute("**/api/leads");
    console.log("✓ TASK 2c PASSED: All failure cases hide modal and display fallback error with working links.\n");

    // =========================================================================
    // TASK 2e: Server-Side Validation Errors (400) Display in Field Error UI
    // =========================================================================
    console.log("--- TASK 2e: Server-Side 400 Validation Errors Display ---");
    await fillValidForm();
    await page.route("**/api/leads", (route) => {
      route.fulfill({
        status: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Validation failed",
          errors: {
            email: ["Invalid email address domain"],
            phone: ["Phone number format rejected by server"],
          },
        }),
      });
    });

    await page.click('button[type="submit"]', { noWaitAfter: true });
    await page.waitForTimeout(500);

    const emailErrorLocator = page.locator(".form-group:has(#clientEmail) .form-error");
    const phoneErrorLocator = page.locator(".form-group:has(#clientPhone) .form-error");

    await emailErrorLocator.waitFor({ state: "visible", timeout: 5000 });
    await phoneErrorLocator.waitFor({ state: "visible", timeout: 5000 });

    const emailErrorText = await emailErrorLocator.innerText();
    const phoneErrorText = await phoneErrorLocator.innerText();

    console.log(`Email Field Error displayed: "${emailErrorText}"`);
    console.log(`Phone Field Error displayed: "${phoneErrorText}"`);

    assert.strictEqual(emailErrorText, "Invalid email address domain");
    assert.strictEqual(phoneErrorText, "Phone number format rejected by server");
    assert.strictEqual(await page.locator("#formSuccessModal").isVisible(), false);
    await page.unroute("**/api/leads");
    console.log("✓ TASK 2e PASSED: Server-side 400 field errors rendered cleanly in form-error UI.\n");

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
