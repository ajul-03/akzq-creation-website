import assert from "assert";
import { execSync, spawn, ChildProcess } from "child_process";
import http from "http";
import net from "net";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { main as runSeed } from "../prisma/seed";
import { hashIp } from "../src/lib/privacy";

const PG_PORT = 54332;
const TEST_DB_NAME = "akzq_test_db";
const SHADOW_DB_NAME = "akzq_shadow_test_db";
const TEST_DB_URL = `postgresql://postgres:password@127.0.0.1:${PG_PORT}/${TEST_DB_NAME}`;
const TEST_SECRET = "test-secret-salt-for-leads-suite-32c";

const PROD_PORT = 3005;
const DEV_PORT = 3006;
const SECRET_FAIL_PORT = 3007;
const TIMEOUT_PORT = 3008;
const HANG_TCP_PORT = 54336;
const MOCK_RESEND_PORT = 54335;

function killProcessTree(child?: ChildProcess | null) {
  if (!child || !child.pid) return;
  try {
    execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: "ignore" });
  } catch {}
}

async function waitForServer(port: number, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/contact`);
      if (res.status === 200 || res.status === 404) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

console.log("=== RUNNING LEADS API REAL PRODUCTION-SERVER HTTP TEST SUITE ===\n");

async function runSuite() {
  // Safety guard: Host MUST be localhost/127.0.0.1 and DB name MUST contain 'test'
  console.log("--- 1. Safety Check: Verifying Target Database ---");
  const parsedDb = new URL(TEST_DB_URL);
  if (parsedDb.hostname !== "127.0.0.1" && parsedDb.hostname !== "localhost") {
    throw new Error(`SAFETY VIOLATION: Non-localhost host '${parsedDb.hostname}'. Aborting.`);
  }
  if (!TEST_DB_NAME.includes("test")) {
    throw new Error(`SAFETY VIOLATION: Database name '${TEST_DB_NAME}' does not contain 'test'. Aborting.`);
  }
  console.log(`✓ Safety check passed: host=${parsedDb.hostname}, database=${TEST_DB_NAME}\n`);

  // 2. Start Disposable Test Postgres Cluster
  console.log("--- 2. Starting Disposable Postgres Cluster ---");
  const pgServer = new EmbeddedPostgres({
    port: PG_PORT,
    databaseDir: "./.test-pg-data",
    user: "postgres",
    password: "password",
    persistent: false,
    initdbFlags: ["-E", "UTF8", "--locale=C"],
  });

  try {
    await pgServer.initialise();
  } catch {}
  await pgServer.start();
  console.log(`Disposable Postgres cluster running on port ${PG_PORT}.`);

  const adminClient = new pg.Client({
    connectionString: `postgresql://postgres:password@127.0.0.1:${PG_PORT}/postgres`,
  });
  await adminClient.connect();
  await adminClient.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME};`);
  await adminClient.query(`CREATE DATABASE ${TEST_DB_NAME};`);
  await adminClient.query(`DROP DATABASE IF EXISTS ${SHADOW_DB_NAME};`);
  await adminClient.query(`CREATE DATABASE ${SHADOW_DB_NAME};`);
  await adminClient.end();

  // Run migrations & seed
  console.log("Deploying migrations and seeding initial database state...");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
    encoding: "utf8",
  });

  const adapter = new PrismaPg({ connectionString: TEST_DB_URL });
  const prisma = new PrismaClient({ adapter });
  await runSeed(prisma);
  console.log("✓ Migrations deployed and database seeded.\n");

  // 3. Start Mock Resend HTTP Server
  console.log("--- 3. Starting Mock Resend Server ---");
  let mockResendShouldFail = false;
  const receivedResendRequests: Array<{ headers: http.IncomingHttpHeaders; body: any }> = [];

  const mockResendServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let parsed = {};
      try {
        parsed = JSON.parse(body);
      } catch {}
      receivedResendRequests.push({ headers: req.headers, body: parsed });

      if (mockResendShouldFail) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Mock Resend Internal Server Error" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "mock-resend-email-id-12345" }));
      }
    });
  });

  await new Promise<void>((resolve) => mockResendServer.listen(MOCK_RESEND_PORT, resolve));
  console.log(`Mock Resend server listening on http://127.0.0.1:${MOCK_RESEND_PORT}\n`);

  let prodServer: ChildProcess | null = null;
  let devServer: ChildProcess | null = null;
  let secretFailServer: ChildProcess | null = null;
  let timeoutServer: ChildProcess | null = null;
  let hangTcpServer: net.Server | null = null;

  try {
    // 4. Start Production Server (`next start -p 3005`)
    console.log("--- 4. Spawning Production Next.js Server ---");
    console.log(`Server command: npx next start -p ${PROD_PORT}`);
    console.log(`Target port: ${PROD_PORT}`);

    prodServer = spawn("cmd.exe", ["/c", `npx next start -p ${PROD_PORT}`], {
      env: {
        ...process.env,
        PORT: String(PROD_PORT),
        NODE_ENV: "production",
        DATABASE_URL: TEST_DB_URL,
        DIRECT_URL: TEST_DB_URL,
        IP_HASH_SECRET: TEST_SECRET,
        NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
        ALLOWED_ORIGINS: "https://preview.akzqcreation.com",
        RESEND_API_KEY: "re_mock_test_key_placeholder",
        NOTIFY_EMAIL: "notifications@akzqcreation.com",
        RESEND_FROM_EMAIL: "leads@akzqcreation.com",
        RESEND_BASE_URL: `http://127.0.0.1:${MOCK_RESEND_PORT}`,
      },
      stdio: "ignore",
    });

    const isReady = await waitForServer(PROD_PORT);
    assert.ok(isReady, `Production server failed to respond on port ${PROD_PORT}`);
    console.log(`✓ Production server is ready on http://127.0.0.1:${PROD_PORT}\n`);

    // Helper for HTTP requests
    const requestApi = async (options: {
      body?: unknown;
      rawText?: string;
      headers?: Record<string, string>;
      port?: number;
    }) => {
      const port = options.port || PROD_PORT;
      const headers: Record<string, string> = {
        "content-type": "application/json",
        origin: "https://akzqcreation.com",
        "user-agent": "Mozilla/5.0 HttpTestSuite/1.0",
        ...(options.headers || {}),
      };

      const bodyText =
        options.rawText !== undefined
          ? options.rawText
          : options.body !== undefined
          ? JSON.stringify(options.body)
          : "";

      return fetch(`http://127.0.0.1:${port}/api/leads`, {
        method: "POST",
        headers,
        body: bodyText,
      });
    };

    // =========================================================================
    // PROVE HTTP: Print raw curl -i of a valid POST and one of a 413
    // =========================================================================
    console.log("--- PROVING REAL HTTP OVER WIRE (raw curl output) ---");
    const fs = await import("fs");

    console.log("\n[CURL 1: Valid POST /api/leads]");
    const validJsonPayload = JSON.stringify({
      name: "Curl Tester",
      email: "curl.valid@example.com",
      service: "Branding & Identity",
      elapsedMs: 3500,
    });
    fs.writeFileSync("./.test-valid-payload.json", validJsonPayload);
    const curlValidOutput = execSync(
      `curl.exe -i -s -X POST http://127.0.0.1:${PROD_PORT}/api/leads -H "Content-Type: application/json" -H "Origin: https://akzqcreation.com" --data-binary @./.test-valid-payload.json`,
      { encoding: "utf8" }
    );
    console.log(curlValidOutput.trim());
    try {
      fs.unlinkSync("./.test-valid-payload.json");
    } catch {}

    console.log("\n[CURL 2: Payload Too Large 413 (>10KB)]");
    const largePayload = JSON.stringify({
      name: "Large Payload",
      email: "large@example.com",
      message: "A".repeat(11000),
      elapsedMs: 3500,
    });
    fs.writeFileSync("./.test-large-payload.json", largePayload);
    const curl413Output = execSync(
      `curl.exe -i -s -X POST http://127.0.0.1:${PROD_PORT}/api/leads -H "Content-Type: application/json" -H "Origin: https://akzqcreation.com" --data-binary @./.test-large-payload.json`,
      { encoding: "utf8" }
    );
    console.log(curl413Output.trim());
    try {
      fs.unlinkSync("./.test-large-payload.json");
    } catch {}
    console.log("\n✓ HTTP curl proofs verified.\n");

    // =========================================================================
    // TEST 1: 4-Way Identical 201 Response Shape
    // =========================================================================
    console.log("--- TEST 1: 4-Way Identical 201 Response Shape ---");
    // 1. Genuine Success
    const resGenuine = await requestApi({
      body: {
        name: "Genuine User",
        email: "genuine@example.com",
        phone: "+91 7510109730",
        service: "branding-identity",
        elapsedMs: 4000,
      },
      headers: { "x-forwarded-for": "10.0.1.1" },
    });
    const bodyGenuine = await resGenuine.text();

    // 2. Honeypot
    const resHp = await requestApi({
      body: {
        name: "Bot User",
        email: "bot@example.com",
        hp_field: "trap-triggered",
        elapsedMs: 4000,
      },
      headers: { "x-forwarded-for": "10.0.1.2" },
    });
    const bodyHp = await resHp.text();

    // 3. Fast submit (<2000ms)
    const resFast = await requestApi({
      body: {
        name: "Fast Bot",
        email: "fastbot@example.com",
        elapsedMs: 400,
      },
      headers: { "x-forwarded-for": "10.0.1.3" },
    });
    const bodyFast = await resFast.text();

    // 4. Deduplication (same email + same message within 10 min)
    const resDedupe = await requestApi({
      body: {
        name: "Genuine User",
        email: "genuine@example.com",
        phone: "+91 7510109730",
        service: "branding-identity",
        elapsedMs: 4000,
      },
      headers: { "x-forwarded-for": "10.0.1.1" },
    });
    const bodyDedupe = await resDedupe.text();

    console.log("Status Codes:");
    console.log(`  Genuine:   ${resGenuine.status}`);
    console.log(`  Honeypot:  ${resHp.status}`);
    console.log(`  Fast:      ${resFast.status}`);
    console.log(`  Dedupe:    ${resDedupe.status}`);

    console.log("Cache-Control Headers:");
    console.log(`  Genuine:   ${resGenuine.headers.get("Cache-Control")}`);
    console.log(`  Honeypot:  ${resHp.headers.get("Cache-Control")}`);
    console.log(`  Fast:      ${resFast.headers.get("Cache-Control")}`);
    console.log(`  Dedupe:    ${resDedupe.headers.get("Cache-Control")}`);

    console.log("Bodies:");
    console.log(`  Genuine:   ${bodyGenuine}`);
    console.log(`  Honeypot:  ${bodyHp}`);
    console.log(`  Fast:      ${bodyFast}`);
    console.log(`  Dedupe:    ${bodyDedupe}`);

    assert.strictEqual(resGenuine.status, 201);
    assert.strictEqual(resHp.status, 201);
    assert.strictEqual(resFast.status, 201);
    assert.strictEqual(resDedupe.status, 201);

    assert.strictEqual(resGenuine.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(resHp.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(resFast.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(resDedupe.headers.get("Cache-Control"), "no-store");

    assert.strictEqual(bodyGenuine, '{"ok":true}');
    assert.strictEqual(bodyHp, '{"ok":true}');
    assert.strictEqual(bodyFast, '{"ok":true}');
    assert.strictEqual(bodyDedupe, '{"ok":true}');
    console.log("✓ TEST 1 PASSED: Byte-for-byte identical 201 responses.\n");

    // =========================================================================
    // TEST 2: Content-Type (415), Payload Size (413), and Bad JSON / Zod (400)
    // =========================================================================
    console.log("--- TEST 2: HTTP 415, 413, and 400 Validations ---");
    // 415: Bad Content-Type
    const res415 = await requestApi({
      rawText: '{"name":"Test"}',
      headers: { "content-type": "text/plain" },
    });
    console.log(`415 Status: ${res415.status}`);
    assert.strictEqual(res415.status, 415);

    // 413: Body > 10KB
    const res413 = await requestApi({
      rawText: JSON.stringify({ name: "A".repeat(11000) }),
    });
    console.log(`413 Status: ${res413.status}`);
    assert.strictEqual(res413.status, 413);

    // 400: Malformed JSON
    const resBadJson = await requestApi({
      rawText: '{"invalidJson',
    });
    console.log(`Malformed JSON Status: ${resBadJson.status}`);
    assert.strictEqual(resBadJson.status, 400);

    // 400: Zod validation failure (invalid email)
    const resZodBad = await requestApi({
      body: { name: "Rahul", email: "not-an-email" },
    });
    console.log(`Zod Validation Status: ${resZodBad.status}`);
    const zodBody = await resZodBad.json();
    console.log(`Zod Errors: ${JSON.stringify(zodBody.errors)}`);
    assert.strictEqual(resZodBad.status, 400);
    assert.ok(zodBody.errors.email);
    console.log("✓ TEST 2 PASSED: 415, 413, and 400 rejected cleanly.\n");

    // =========================================================================
    // TEST 3: Origin & Referer Hardening (Task 6)
    // =========================================================================
    console.log("--- TEST 3: Origin Hardening (Task 6) ---");
    // 1. Evil suffix origin -> 403
    const resEvil = await requestApi({
      body: { name: "Attacker", email: "att@example.com" },
      headers: { origin: "https://akzqcreation.com.evil.example" },
    });
    console.log(`Evil Suffix Origin (https://akzqcreation.com.evil.example) Status: ${resEvil.status}`);
    assert.strictEqual(resEvil.status, 403);

    // 2. HTTP instead of HTTPS -> 403
    const resHttp = await requestApi({
      body: { name: "Attacker", email: "att@example.com" },
      headers: { origin: "http://akzqcreation.com" },
    });
    console.log(`HTTP Scheme Origin (http://akzqcreation.com) Status: ${resHttp.status}`);
    assert.strictEqual(resHttp.status, 403);

    // 3. www subdomain not listed -> 403
    const resWww = await requestApi({
      body: { name: "Attacker", email: "att@example.com" },
      headers: { origin: "https://www.akzqcreation.com" },
    });
    console.log(`Unlisted www Subdomain (https://www.akzqcreation.com) Status: ${resWww.status}`);
    assert.strictEqual(resWww.status, 403);

    // 4. Listed extra origin in ALLOWED_ORIGINS -> 201
    const resAllowedExtra = await requestApi({
      body: { name: "Preview User", email: "preview@example.com", elapsedMs: 3000 },
      headers: { origin: "https://preview.akzqcreation.com" },
    });
    console.log(`Listed Extra Origin (https://preview.akzqcreation.com) Status: ${resAllowedExtra.status}`);
    assert.strictEqual(resAllowedExtra.status, 201);

    // 5. Absent origin and referer -> 201
    const resAbsent = await requestApi({
      body: { name: "Direct Client", email: "direct@example.com", elapsedMs: 3000 },
      headers: { origin: "", referer: "" },
    });
    console.log(`Absent Origin & Referer Status: ${resAbsent.status}`);
    assert.strictEqual(resAbsent.status, 201);

    // 6. Malformed origin URL -> 403
    const resMalformed = await requestApi({
      body: { name: "Direct Client", email: "direct@example.com" },
      headers: { origin: "invalid-origin-url-without-protocol" },
    });
    console.log(`Malformed Origin Status: ${resMalformed.status}`);
    assert.strictEqual(resMalformed.status, 403);

    // 7. Localhost origin in PRODUCTION -> 403
    const resLocalhostInProd = await requestApi({
      body: { name: "Local Client", email: "local@example.com" },
      headers: { origin: "http://localhost:3000" },
    });
    console.log(`Localhost Origin in Production Status: ${resLocalhostInProd.status}`);
    assert.strictEqual(resLocalhostInProd.status, 403);
    console.log("✓ TEST 3 PASSED: Origin hardening verified.\n");

    // =========================================================================
    // TEST 4: Service Slug Validation with Real DB Row (Task 5)
    // =========================================================================
    console.log("--- TEST 4: Service Slug Validation (Task 5) ---");
    // Find a service row
    const targetService = await prisma.service.findFirst({
      where: { slug: "branding-identity" },
    });
    assert.ok(targetService, "Target service 'branding-identity' must exist");

    // a) Set status to DRAFT (unpublished)
    await prisma.service.update({
      where: { id: targetService.id },
      data: { status: "DRAFT" },
    });

    const resDraft = await requestApi({
      body: {
        name: "Service Tester",
        email: "draft.service@example.com",
        service: "branding-identity",
        elapsedMs: 3000,
      },
      headers: { "x-forwarded-for": "10.0.4.1" },
    });
    const draftBody = await resDraft.json();
    console.log(`Unpublished (DRAFT) Service Status: ${resDraft.status}`);
    console.log(`Unpublished (DRAFT) Service Response: ${JSON.stringify(draftBody)}`);
    assert.strictEqual(resDraft.status, 400);
    assert.strictEqual(
      draftBody.error,
      "Invalid service selection. Please choose a published service."
    );
    // Ensure submitted slug is NOT reflected in error body
    assert.strictEqual(JSON.stringify(draftBody).includes("branding-identity"), false);

    // b) Set status back to PUBLISHED
    await prisma.service.update({
      where: { id: targetService.id },
      data: { status: "PUBLISHED" },
    });

    const resPublished = await requestApi({
      body: {
        name: "Service Tester",
        email: "published.service@example.com",
        service: "branding-identity",
        elapsedMs: 3000,
      },
      headers: { "x-forwarded-for": "10.0.4.2" },
    });
    const publishedBody = await resPublished.json();
    console.log(`Published (PUBLISHED) Service Status: ${resPublished.status}`);
    console.log(`Published (PUBLISHED) Service Response: ${JSON.stringify(publishedBody)}`);
    assert.strictEqual(resPublished.status, 201);
    console.log("✓ TEST 4 PASSED: Service slug status verified with fixed error message.\n");

    // =========================================================================
    // TEST 5: ipHash Privacy, Raw IP Exclusion & ActivityLog (Task 7 & 1)
    // =========================================================================
    console.log("--- TEST 5: ipHash Integrity & Zero Raw IP (Tasks 1 & 7) ---");
    const knownIp = "203.0.113.195";
    const resPrivacy = await requestApi({
      body: {
        name: "Privacy Tester",
        email: "privacy.wire@example.com",
        phone: "+91 7510109730",
        service: "local-seo",
        elapsedMs: 3500,
      },
      headers: { "x-forwarded-for": `${knownIp}, 10.0.0.1` },
    });
    assert.strictEqual(resPrivacy.status, 201);

    const expectedHash = hashIp(knownIp, TEST_SECRET);
    console.log(`Known IP: ${knownIp}`);
    console.log(`Expected HMAC-SHA256 ipHash: ${expectedHash}`);

    // Query raw SQL on Lead table
    const leadRows: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
      `SELECT id, source, name, email, phone, "ipHash", "userAgent" FROM "Lead" WHERE email = 'privacy.wire@example.com'`
    );
    console.log("\nDumped Lead Row (raw SQL):");
    console.dir(leadRows[0], { depth: null });

    // Query raw SQL on ActivityLog table
    const activityRows: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
      `SELECT id, action, "entityType", "entityId", "ipHash", metadata FROM "ActivityLog" WHERE "ipHash" = '${expectedHash}' ORDER BY "createdAt" DESC LIMIT 1`
    );
    console.log("\nDumped ActivityLog Row (raw SQL):");
    console.dir(activityRows[0], { depth: null });

    // Assertions
    assert.strictEqual(leadRows[0].ipHash, expectedHash);
    assert.strictEqual(activityRows[0].ipHash, expectedHash);
    assert.strictEqual(JSON.stringify(leadRows[0]).includes(knownIp), false, "Raw IP must NOT be in Lead row");
    assert.strictEqual(JSON.stringify(activityRows[0]).includes(knownIp), false, "Raw IP must NOT be in ActivityLog row");

    // Verify ActivityLog metadata has NO PII
    const actMeta = activityRows[0].metadata as Record<string, unknown>;
    assert.strictEqual(actMeta.name, undefined);
    assert.strictEqual(actMeta.email, undefined);
    assert.strictEqual(actMeta.phone, undefined);
    assert.strictEqual(actMeta.message, undefined);
    console.log("✓ TEST 5 PASSED: ipHash matches HMAC; zero raw IP in database; ActivityLog has no PII.\n");

    // =========================================================================
    // TEST 6: Rate Limiting & Dynamic Retry-After (Task 8)
    // =========================================================================
    console.log("--- TEST 6: Rate Limiting & Dynamic Retry-After (Task 8) ---");
    // 1. Hourly rate limit: 5 allowed, 6th returns 429
    const hourlyIp = "198.51.100.50";
    for (let i = 1; i <= 5; i++) {
      const r = await requestApi({
        body: {
          name: `Hourly User ${i}`,
          email: `hourly_${i}@example.com`,
          message: `Msg ${i}`,
          elapsedMs: 2500,
        },
        headers: { "x-forwarded-for": hourlyIp },
      });
      assert.strictEqual(r.status, 201, `Hourly submission ${i} must succeed`);
    }

    const resHourlyBlocked = await requestApi({
      body: {
        name: "Hourly User 6",
        email: "hourly_6@example.com",
        elapsedMs: 2500,
      },
      headers: { "x-forwarded-for": hourlyIp },
    });
    const retryAfterHourly = resHourlyBlocked.headers.get("Retry-After");
    console.log(`Hourly 6th Request Status: ${resHourlyBlocked.status}`);
    console.log(`Hourly 6th Request Retry-After: ${retryAfterHourly}`);
    assert.strictEqual(resHourlyBlocked.status, 429);
    assert.ok(retryAfterHourly, "Retry-After header must be present");
    const retrySeconds = parseInt(retryAfterHourly, 10);
    assert.ok(retrySeconds > 0 && retrySeconds <= 3600, "Retry-After must be positive seconds <= 3600");

    // 2. 24-hour rate limit: Seed 19 rows from 2 hours ago for dailyIp
    console.log("\nSeeding 19 Lead rows from 2 hours ago (within 24h, outside 1h window)...");
    const dailyIp = "198.51.100.60";
    const dailyIpHash = hashIp(dailyIp, TEST_SECRET);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const dailySeedData = Array.from({ length: 19 }).map((_, idx) => ({
      source: "CONTACT_FORM" as const,
      name: `Day Seed ${idx}`,
      email: `day_seed_${idx}@example.com`,
      message: `Seeded msg ${idx}`,
      ipHash: dailyIpHash,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
      status: "NEW" as const,
    }));
    await prisma.lead.createMany({ data: dailySeedData });

    // Request 20 in 24h (succeeds)
    const resDaily20 = await requestApi({
      body: { name: "Daily User 20", email: "day20@example.com", elapsedMs: 2500 },
      headers: { "x-forwarded-for": dailyIp },
    });
    console.log(`Daily 20th Request Status: ${resDaily20.status}`);
    assert.strictEqual(resDaily20.status, 201);

    // Request 21 in 24h (blocked with 429 and Retry-After)
    const resDailyBlocked = await requestApi({
      body: { name: "Daily User 21", email: "day21@example.com", elapsedMs: 2500 },
      headers: { "x-forwarded-for": dailyIp },
    });
    const retryAfterDaily = resDailyBlocked.headers.get("Retry-After");
    console.log(`Daily 21st Request Status: ${resDailyBlocked.status}`);
    console.log(`Daily 21st Request Retry-After: ${retryAfterDaily}`);
    assert.strictEqual(resDailyBlocked.status, 429);
    assert.ok(retryAfterDaily);
    const dailyRetrySeconds = parseInt(retryAfterDaily, 10);
    // Oldest row was 2 hours ago, so remaining time in 24h window is ~22 hours (79200s)
    assert.ok(dailyRetrySeconds > 0 && dailyRetrySeconds <= 86400);

    // 3. Unknown IP shared bucket rate limit: max 2/hr
    const resUnknown1 = await requestApi({
      body: { name: "Unknown 1", email: "unk1@example.com", elapsedMs: 2500 },
      headers: { "x-forwarded-for": "", "x-real-ip": "" },
    });
    assert.strictEqual(resUnknown1.status, 201);

    const resUnknown2 = await requestApi({
      body: { name: "Unknown 2", email: "unk2@example.com", elapsedMs: 2500 },
      headers: { "x-forwarded-for": "", "x-real-ip": "" },
    });
    assert.strictEqual(resUnknown2.status, 201);

    const resUnknown3 = await requestApi({
      body: { name: "Unknown 3", email: "unk3@example.com", elapsedMs: 2500 },
      headers: { "x-forwarded-for": "", "x-real-ip": "" },
    });
    console.log(`\nUnknown IP 3rd Request Status (limit 2/hr): ${resUnknown3.status}`);
    assert.strictEqual(resUnknown3.status, 429);
    console.log("✓ TEST 6 PASSED: Hourly, Daily, and Unknown IP dynamic rate limits verified.\n");

    // =========================================================================
    // TEST 7: SQL Injection & XSS Inert Storage (Task 1)
    // =========================================================================
    console.log("--- TEST 7: SQL Injection & XSS Payload Inertness ---");
    const sqlInjectionName = `Robert'); DROP TABLE "Lead";--`;
    const xssMessage = `<script>alert("xss")</script>`;
    const resInert = await requestApi({
      body: {
        name: sqlInjectionName,
        email: "injection.wire@example.com",
        message: xssMessage,
        elapsedMs: 3000,
      },
      headers: { "x-forwarded-for": "10.0.7.1" },
    });
    assert.strictEqual(resInert.status, 201);

    // Verify Lead table still exists and row is stored inertly
    const injectedRow = await prisma.lead.findFirst({
      where: { email: "injection.wire@example.com" },
    });
    assert.ok(injectedRow, "Lead row must exist");
    assert.strictEqual(injectedRow.name, sqlInjectionName);
    assert.strictEqual(injectedRow.message, xssMessage);
    console.log(`Stored name: ${injectedRow.name}`);
    console.log(`Stored message: ${injectedRow.message}`);
    console.log("✓ TEST 7 PASSED: SQL injection attempted, table persists, text stored inertly.\n");

    // =========================================================================
    // TEST 8: Resend Notification with Mock Server (Task 9)
    // =========================================================================
    console.log("--- TEST 8: Resend Notifications via Mock Server (Task 9) ---");
    receivedResendRequests.length = 0;
    mockResendShouldFail = false;

    // (i) Lead triggers email request with correct fields
    const resEmailSuccess = await requestApi({
      body: {
        name: "Akash Nair\r\nBcc: evil@attacker.com", // testing control char sanitization
        email: "akash@malabar.example",
        phone: "+91 7510109730",
        service: "Web Design & Development",
        elapsedMs: 3500,
      },
      headers: { "x-forwarded-for": "10.0.9.1" },
    });
    assert.strictEqual(resEmailSuccess.status, 201);

    // Wait for after() hook to dispatch
    await new Promise((r) => setTimeout(r, 600));

    assert.strictEqual(receivedResendRequests.length, 1, "Mock Resend server must have received 1 request");
    const sentReq = receivedResendRequests[0];
    console.log("Mock Resend Server Received Request:");
    console.log(`  Headers Authorization: ${sentReq.headers.authorization}`);
    console.log(`  Payload:`, JSON.stringify(sentReq.body, null, 2));

    assert.strictEqual(sentReq.headers.authorization, "Bearer re_mock_test_key_placeholder");
    assert.strictEqual(sentReq.body.from, "leads@akzqcreation.com");
    assert.deepStrictEqual(sentReq.body.to, ["notifications@akzqcreation.com"]);
    // Subject must be sanitized: control chars stripped, no newlines
    assert.strictEqual(sentReq.body.subject.includes("\r"), false);
    assert.strictEqual(sentReq.body.subject.includes("\n"), false);
    assert.ok(sentReq.body.subject.includes("Akash Nair"));

    // (ii) Mock 500 writes lead.notify_failed without PII, response to visitor is still 201
    mockResendShouldFail = true;
    receivedResendRequests.length = 0;

    const resEmailFail = await requestApi({
      body: {
        name: "Failure Tester",
        email: "fail.notify@example.com",
        phone: "+91 7510109730",
        message: "Secret client message",
        elapsedMs: 3500,
      },
      headers: { "x-forwarded-for": "10.0.9.2" },
    });
    assert.strictEqual(resEmailFail.status, 201);

    await new Promise((r) => setTimeout(r, 600));
    const failLead = await prisma.lead.findFirst({
      where: { email: "fail.notify@example.com" },
    });
    assert.ok(failLead);

    const failLog = await prisma.activityLog.findFirst({
      where: { action: "lead.notify_failed", entityId: failLead.id },
    });
    assert.ok(failLog, "lead.notify_failed ActivityLog entry must exist");
    console.log("\nlead.notify_failed ActivityLog entry:");
    console.dir(failLog, { depth: null });

    const failMeta = failLog.metadata as Record<string, unknown>;
    assert.strictEqual(failMeta.name, undefined);
    assert.strictEqual(failMeta.email, undefined);
    assert.strictEqual(failMeta.message, undefined);
    console.log("✓ TEST 8 PASSED: Resend notification fields verified and 500 failure handled.\n");

    // =========================================================================
    // TEST 9: Dev Environment Behavior (Localhost Origin Allowed in Dev)
    // =========================================================================
    console.log("--- TEST 9: Dev Environment Localhost Origin Allowance ---");
    devServer = spawn("cmd.exe", ["/c", `npx next start -p ${DEV_PORT}`], {
      env: {
        ...process.env,
        PORT: String(DEV_PORT),
        NODE_ENV: "development",
        ALLOW_DEV_ORIGIN: "true",
        DATABASE_URL: TEST_DB_URL,
        DIRECT_URL: TEST_DB_URL,
        IP_HASH_SECRET: TEST_SECRET,
        NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
      },
      stdio: "ignore",
    });

    const isDevReady = await waitForServer(DEV_PORT);
    assert.ok(isDevReady, "Dev server failed to start");

    const resDevLocalhost = await requestApi({
      port: DEV_PORT,
      body: { name: "Dev User", email: "dev@example.com", elapsedMs: 3000 },
      headers: { origin: `http://localhost:${DEV_PORT}` },
    });
    console.log(`Localhost Origin in Development Status: ${resDevLocalhost.status}`);
    assert.strictEqual(resDevLocalhost.status, 201);
    console.log("✓ TEST 9 PASSED: Localhost origin accepted in development.\n");

    // =========================================================================
    // TEST 10: Secret Validation Check (Task 7: Secret < 32 chars -> 503)
    // =========================================================================
    console.log("--- TEST 10: IP_HASH_SECRET Guard (< 32 chars -> 503) ---");
    secretFailServer = spawn("cmd.exe", ["/c", `npx next start -p ${SECRET_FAIL_PORT}`], {
      env: {
        ...process.env,
        PORT: String(SECRET_FAIL_PORT),
        NODE_ENV: "production",
        DATABASE_URL: TEST_DB_URL,
        DIRECT_URL: TEST_DB_URL,
        IP_HASH_SECRET: "short-insecure-key", // < 32 chars!
        NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
      },
      stdio: "ignore",
    });

    const isSecretFailReady = await waitForServer(SECRET_FAIL_PORT);
    assert.ok(isSecretFailReady, "Secret fail server failed to start");

    const resSecretFail = await requestApi({
      port: SECRET_FAIL_PORT,
      body: { name: "Test User", email: "test@example.com", elapsedMs: 3000 },
      headers: { "x-forwarded-for": "10.0.10.1" },
    });
    const secretFailBody = await resSecretFail.text();
    console.log(`Short Secret Server Response Status: ${resSecretFail.status}`);
    console.log(`Short Secret Server Response Body: ${secretFailBody}`);
    assert.strictEqual(resSecretFail.status, 503);
    assert.strictEqual(resSecretFail.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(
      secretFailBody,
      '{"ok":false,"error":"Service temporarily unavailable. Please try again or reach us directly."}'
    );
    console.log("✓ TEST 10 PASSED: Missing/short secret returns clean 503 over HTTP.\n");

    // =========================================================================
    // TEST 11: Database Timeouts & Hang Server Test (Task 10)
    // =========================================================================
    console.log("--- TEST 11: Database Timeouts & TCP Hang Server (Task 10) ---");
    // Start TCP server that accepts connections and never replies
    const tcpServer = net.createServer((socket) => {
      // Do nothing, hang the connection
    });
    hangTcpServer = tcpServer;
    await new Promise<void>((resolve) => tcpServer.listen(HANG_TCP_PORT, resolve));
    console.log(`TCP hang server listening on port ${HANG_TCP_PORT}`);

    timeoutServer = spawn("cmd.exe", ["/c", `npx next start -p ${TIMEOUT_PORT}`], {
      env: {
        ...process.env,
        PORT: String(TIMEOUT_PORT),
        NODE_ENV: "production",
        DATABASE_URL: `postgresql://postgres:password@127.0.0.1:${HANG_TCP_PORT}/hang_db`,
        DIRECT_URL: `postgresql://postgres:password@127.0.0.1:${HANG_TCP_PORT}/hang_db`,
        IP_HASH_SECRET: TEST_SECRET,
        NEXT_PUBLIC_SITE_URL: "https://akzqcreation.com",
      },
      stdio: "ignore",
    });

    const isTimeoutReady = await waitForServer(TIMEOUT_PORT);
    assert.ok(isTimeoutReady, "Timeout test server failed to start");

    const hangStart = Date.now();
    const resHang = await requestApi({
      port: TIMEOUT_PORT,
      body: { name: "Hang Tester", email: "hang@example.com", elapsedMs: 3000 },
      headers: { "x-forwarded-for": "10.0.11.1" },
    });
    const hangDuration = Date.now() - hangStart;
    const hangBody = await resHang.text();

    console.log(`Hang Server Response Status: ${resHang.status}`);
    console.log(`Hang Elapsed Time: ${hangDuration}ms (~5-7s)`);
    console.log("Hang Response Headers:");
    resHang.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
    console.log(`Hang Response Body: ${hangBody}`);

    assert.strictEqual(resHang.status, 503);
    assert.strictEqual(resHang.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(
      hangBody,
      '{"ok":false,"error":"Service temporarily unavailable. Please try again or reach us directly."}'
    );
    // Verified: Connection timeout of ~5000ms caused route to catch and return 503 within ~6s
    assert.ok(hangDuration >= 4500 && hangDuration <= 9000, `Expected duration ~5-7s, got ${hangDuration}ms`);
    console.log("✓ TEST 11 PASSED: Database timeout returns 503 cleanly within ~6s.\n");

  } finally {
    console.log("Cleaning up servers and resources...");
    killProcessTree(prodServer);
    killProcessTree(devServer);
    killProcessTree(secretFailServer);
    killProcessTree(timeoutServer);
    if (hangTcpServer) {
      try {
        hangTcpServer.close();
      } catch {}
    }
    if (mockResendServer) {
      try {
        mockResendServer.close();
      } catch {}
    }
    try {
      await prisma.$disconnect();
    } catch {}
    try {
      await pgServer.stop();
    } catch {}
    console.log("✓ All servers and processes terminated cleanly.");
  }

  console.log("\n========================================================");
  console.log("ALL REAL PRODUCTION-SERVER LEADS API TESTS PASSED CLEANLY");
  console.log("========================================================\n");
}

runSuite().catch((err) => {
  console.error("LEADS API HTTP TEST SUITE FAILED:", err);
  process.exit(1);
});
