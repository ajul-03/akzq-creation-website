import assert from "assert";
import { execSync } from "child_process";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { POST } from "../src/app/api/leads/route";
import { sendLeadNotification } from "../src/lib/notify";
import { main as runSeed } from "../prisma/seed";
import { hashIp } from "../src/lib/privacy";

const TEST_PORT = 54332;
const TEST_DB_NAME = "akzq_test_db";
const SHADOW_DB_NAME = "akzq_shadow_test_db";
const TEST_DB_URL = `postgresql://postgres:password@127.0.0.1:${TEST_PORT}/${TEST_DB_NAME}`;

// Test-only reset helper that does not touch production db.ts
function resetDb() {
  (globalThis as unknown as { prismaInstance?: unknown }).prismaInstance = undefined;
}

console.log("=== RUNNING LEADS API INTEGRATION TEST SUITE ===\n");

async function runSuite() {
  // Safety check: Database name MUST contain 'test'
  if (!TEST_DB_NAME.includes("test")) {
    throw new Error(`SAFETY VIOLATION: Refusing to run tests. Target DB '${TEST_DB_NAME}' does not contain 'test'.`);
  }

  // 1. Start Disposable Test Postgres Cluster
  console.log("--- 1. Starting Disposable Postgres Cluster & Safety Checks ---");
  const pgServer = new EmbeddedPostgres({
    port: TEST_PORT,
    databaseDir: "./.test-pg-data",
    user: "postgres",
    password: "password",
    persistent: false,
    initdbFlags: ["-E", "UTF8", "--locale=C"],
  });

  try {
    await pgServer.initialise();
  } catch {
    // Already initialised
  }
  await pgServer.start();
  console.log(`Disposable Postgres cluster running on port ${TEST_PORT}.`);

  // Initialize fresh, empty databases
  const adminClient = new pg.Client({
    connectionString: `postgresql://postgres:password@127.0.0.1:${TEST_PORT}/postgres`,
  });
  await adminClient.connect();
  await adminClient.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME};`);
  await adminClient.query(`CREATE DATABASE ${TEST_DB_NAME};`);
  await adminClient.query(`DROP DATABASE IF EXISTS ${SHADOW_DB_NAME};`);
  await adminClient.query(`CREATE DATABASE ${SHADOW_DB_NAME};`);
  await adminClient.end();

  // Point environment to test database
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.DIRECT_URL = TEST_DB_URL;
  process.env.IP_HASH_SECRET = "test-secret-salt-for-leads-suite-32c";
  process.env.NEXT_PUBLIC_SITE_URL = "https://akzqcreation.com";
  (process.env as Record<string, string | undefined>).NODE_ENV = "development";

  // Deploy migrations
  console.log("--- 2. Deploying Migrations & Seeding Services ---");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
    encoding: "utf8",
  });

  const adapter = new PrismaPg({ connectionString: TEST_DB_URL });
  const prisma = new PrismaClient({ adapter });

  await runSeed(prisma);
  console.log("✓ Test database initialized and seeded.\n");

  try {
    // Helper to create NextRequest for /api/leads
    const makeReq = (options: {
      body?: unknown;
      rawText?: string;
      headers?: Record<string, string>;
      ip?: string;
    }) => {
      const hdrs = new Headers();
      hdrs.set("content-type", "application/json");
      hdrs.set("origin", "https://akzqcreation.com");
      hdrs.set("user-agent", "Mozilla/5.0 TestSuite/1.0");
      if (options.ip) hdrs.set("x-forwarded-for", options.ip);

      if (options.headers) {
        for (const [k, v] of Object.entries(options.headers)) {
          if (v === "") hdrs.delete(k);
          else hdrs.set(k, v);
        }
      }

      const bodyText =
        options.rawText !== undefined
          ? options.rawText
          : options.body !== undefined
          ? JSON.stringify(options.body)
          : "";

      return new NextRequest("https://akzqcreation.com/api/leads", {
        method: "POST",
        headers: hdrs,
        body: bodyText,
      });
    };

    // =========================================================================
    // TASK 1: Response-Shape Parity Check (Byte-for-byte identical 201 responses)
    // =========================================================================
    console.log("--- TASK 1: Response-Shape Parity Across All 4 Scenarios ---");
    // Scenario 1: Genuine Success
    const resSuccess = await POST(
      makeReq({
        body: {
          name: "Genuine Lead",
          email: "genuine@example.com",
          phone: "+91 7510109730",
          service: "branding-identity",
          elapsedMs: 5000,
        },
        ip: "10.0.1.1",
      })
    );
    const bodySuccess = await resSuccess.text();
    const cacheSuccess = resSuccess.headers.get("Cache-Control");

    // Scenario 2: Honeypot
    const resHoneypot = await POST(
      makeReq({
        body: {
          name: "Spam Bot",
          email: "spambot@example.com",
          hp_field: "trap-triggered",
          elapsedMs: 5000,
        },
        ip: "10.0.1.2",
      })
    );
    const bodyHoneypot = await resHoneypot.text();
    const cacheHoneypot = resHoneypot.headers.get("Cache-Control");

    // Scenario 3: Fast-Submit (<2000ms)
    const resFast = await POST(
      makeReq({
        body: {
          name: "Fast Bot",
          email: "fastbot@example.com",
          elapsedMs: 450,
        },
        ip: "10.0.1.3",
      })
    );
    const bodyFast = await resFast.text();
    const cacheFast = resFast.headers.get("Cache-Control");

    // Scenario 4: Deduplication (Same email + same message within 10 min)
    const resDedupe = await POST(
      makeReq({
        body: {
          name: "Genuine Lead",
          email: "genuine@example.com",
          phone: "+91 7510109730",
          service: "branding-identity",
          elapsedMs: 5000,
        },
        ip: "10.0.1.1",
      })
    );
    const bodyDedupe = await resDedupe.text();
    const cacheDedupe = resDedupe.headers.get("Cache-Control");

    console.log("Raw Response Status Codes:");
    console.log(`  Genuine Success: ${resSuccess.status}`);
    console.log(`  Honeypot Trap:   ${resHoneypot.status}`);
    console.log(`  Fast Submit:     ${resFast.status}`);
    console.log(`  Deduplication:   ${resDedupe.status}`);

    console.log("\nRaw Response Cache-Control Headers:");
    console.log(`  Genuine Success: ${cacheSuccess}`);
    console.log(`  Honeypot Trap:   ${cacheHoneypot}`);
    console.log(`  Fast Submit:     ${cacheFast}`);
    console.log(`  Deduplication:   ${cacheDedupe}`);

    console.log("\nRaw Response Bodies (Byte-by-Byte):");
    console.log(`  Genuine Success: ${bodySuccess}`);
    console.log(`  Honeypot Trap:   ${bodyHoneypot}`);
    console.log(`  Fast Submit:     ${bodyFast}`);
    console.log(`  Deduplication:   ${bodyDedupe}`);

    assert.strictEqual(resSuccess.status, 201);
    assert.strictEqual(resHoneypot.status, 201);
    assert.strictEqual(resFast.status, 201);
    assert.strictEqual(resDedupe.status, 201);

    assert.strictEqual(cacheSuccess, "no-store");
    assert.strictEqual(cacheHoneypot, "no-store");
    assert.strictEqual(cacheFast, "no-store");
    assert.strictEqual(cacheDedupe, "no-store");

    assert.strictEqual(bodySuccess, '{"ok":true}');
    assert.strictEqual(bodyHoneypot, '{"ok":true}');
    assert.strictEqual(bodyFast, '{"ok":true}');
    assert.strictEqual(bodyDedupe, '{"ok":true}');

    assert.strictEqual(bodySuccess, bodyHoneypot);
    assert.strictEqual(bodySuccess, bodyFast);
    assert.strictEqual(bodySuccess, bodyDedupe);
    console.log("\n✓ TASK 1 PASSED: All 4 responses are byte-for-byte identical (status 201, Cache-Control: no-store, body: {\"ok\":true}).\n");

    // =========================================================================
    // TASK 3a: ipHash Format, Raw IP Exclusion & Raw SQL Rows Dump
    // =========================================================================
    console.log("--- TASK 3a: ipHash Integrity & Raw IP Exclusion ---");
    const testIp = "203.0.113.195";
    const res3a = await POST(
      makeReq({
        body: {
          name: "Privacy Tester",
          email: "privacy@malabar.example",
          phone: "+91 7510109730",
          company: "Privacy Hub Kannur",
          service: "local-seo",
          elapsedMs: 3500,
        },
        ip: testIp,
      })
    );
    assert.strictEqual(res3a.status, 201);

    const expectedHash = hashIp(testIp, process.env.IP_HASH_SECRET);
    assert.strictEqual(expectedHash.length, 64, "ipHash must be 64 characters (SHA256 hex)");
    assert.ok(/^[a-f0-9]{64}$/.test(expectedHash), "ipHash must be lowercase hexadecimal");
    assert.strictEqual(expectedHash.includes(testIp), false, "ipHash must not contain raw IP");

    // Dump Lead row via raw SQL
    const rawLeads: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
      `SELECT id, source, name, email, phone, company, "ipHash", "userAgent", "consentGivenAt" FROM "Lead" WHERE email = 'privacy@malabar.example'`
    );
    console.log("Dumped Lead Row (raw SQL):");
    console.dir(rawLeads[0], { depth: null });

    // Dump ActivityLog row via raw SQL
    const rawActivity: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
      `SELECT id, action, "entityType", "entityId", "ipHash", metadata FROM "ActivityLog" WHERE "ipHash" = '${expectedHash}' ORDER BY "createdAt" DESC LIMIT 1`
    );
    console.log("\nDumped ActivityLog Row (raw SQL):");
    console.dir(rawActivity[0], { depth: null });

    // Assert raw IP does NOT appear in either row
    const leadJson = JSON.stringify(rawLeads[0]);
    const activityJson = JSON.stringify(rawActivity[0]);
    assert.strictEqual(leadJson.includes(testIp), false, "Raw IP must NEVER appear in Lead table");
    assert.strictEqual(activityJson.includes(testIp), false, "Raw IP must NEVER appear in ActivityLog table");
    assert.strictEqual(rawLeads[0].ipHash, expectedHash);
    assert.strictEqual(rawActivity[0].ipHash, expectedHash);
    console.log("\n✓ TASK 3a PASSED: ipHash is valid 64-char HMAC; zero raw IP in database.\n");

    // =========================================================================
    // TASK 3b: ActivityLog "lead.created" Dedicated Test (Zero PII in metadata)
    // =========================================================================
    console.log("--- TASK 3b: ActivityLog 'lead.created' Verification ---");
    const createdLead = rawLeads[0];
    const createdLog = rawActivity[0];
    assert.strictEqual(createdLog.action, "lead.created");
    assert.strictEqual(createdLog.entityType, "Lead");
    assert.strictEqual(createdLog.entityId, createdLead.id);

    const logMeta = createdLog.metadata as Record<string, unknown>;
    console.log("ActivityLog metadata contents:", JSON.stringify(logMeta));
    assert.strictEqual(logMeta.name, undefined, "Metadata must NOT contain name");
    assert.strictEqual(logMeta.email, undefined, "Metadata must NOT contain email");
    assert.strictEqual(logMeta.phone, undefined, "Metadata must NOT contain phone");
    assert.strictEqual(logMeta.message, undefined, "Metadata must NOT contain message");
    assert.strictEqual(logMeta.company, undefined, "Metadata must NOT contain company");
    assert.strictEqual(logMeta.source, "CONTACT_FORM");
    assert.strictEqual(typeof logMeta.hasPhone, "boolean");
    console.log("✓ TASK 3b PASSED: ActivityLog entityId matches lead.id; zero PII in metadata.\n");

    // =========================================================================
    // TASK 3c: SQL Injection & XSS Payloads
    // =========================================================================
    console.log("--- TASK 3c: SQL-Injection & XSS Round-Trip Verification ---");
    const sqlInjectionName = `Robert'); DROP TABLE "Lead";--`;
    const xssMessage = `<script>alert(1)</script>`;
    const res3c = await POST(
      makeReq({
        body: {
          name: sqlInjectionName,
          email: "injection.test@akzqcreation.com",
          message: xssMessage,
          elapsedMs: 3000,
        },
        ip: "10.0.3.1",
      })
    );
    assert.strictEqual(res3c.status, 201);

    // Verify Lead table still exists
    const leadCount = await prisma.lead.count();
    assert.ok(leadCount > 0, "Lead table MUST still exist after SQL-injection payload");

    // Fetch the injected row and verify exact inert storage
    const injectedLead = await prisma.lead.findFirst({
      where: { email: "injection.test@akzqcreation.com" },
      select: { id: true, name: true, email: true, message: true },
    });
    assert.ok(injectedLead, "Lead row must exist");
    assert.strictEqual(injectedLead.name, sqlInjectionName, "Name must be stored as inert text");
    assert.strictEqual(injectedLead.message, xssMessage, "Message must be stored as inert text");
    console.log("Retrieved Injected Row (inert round-trip):");
    console.dir(injectedLead);
    console.log("✓ TASK 3c PASSED: SQL injection attempted, table persists, text round-trips inertly.\n");

    // =========================================================================
    // TASK 3d: Rate Limit (Hour Limit & Day Limit)
    // =========================================================================
    console.log("--- TASK 3d: Rate Limit Enforcement (1-Hour & 24-Hour Windows) ---");
    // 1) 1-Hour Limit: 5 requests succeed, 6th rejected with 429
    const hourlyIp = "198.51.100.50";
    for (let i = 1; i <= 5; i++) {
      const r = await POST(
        makeReq({
          body: {
            name: `Hourly User ${i}`,
            email: `hourly_${i}@example.com`,
            message: `Unique message ${i}`,
            elapsedMs: 2500,
          },
          ip: hourlyIp,
        })
      );
      assert.strictEqual(r.status, 201, `Submission ${i} must succeed`);
    }

    const resHourlyBlocked = await POST(
      makeReq({
        body: {
          name: "Hourly User 6",
          email: "hourly_6@example.com",
          message: "Unique message 6",
          elapsedMs: 2500,
        },
        ip: hourlyIp,
      })
    );
    console.log("Hourly 6th Request Status:", resHourlyBlocked.status);
    console.log("Hourly 6th Request Retry-After:", resHourlyBlocked.headers.get("Retry-After"));
    const hourlyBody = await resHourlyBlocked.json();
    console.log("Hourly 6th Request Body:", JSON.stringify(hourlyBody));

    assert.strictEqual(resHourlyBlocked.status, 429);
    assert.strictEqual(resHourlyBlocked.headers.get("Retry-After"), "3600");
    assert.strictEqual(resHourlyBlocked.headers.get("Cache-Control"), "no-store");

    // 2) 24-Hour Limit: Seed 19 rows from 2 hours ago (within 24h, outside 1h)
    // Then 1 new submission reaches 20 total. Next submission triggers 24h limit (429 with Retry-After: 86400).
    const dailyIp = "198.51.100.60";
    const dailyIpHash = hashIp(dailyIp, process.env.IP_HASH_SECRET);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const dailySeedData = Array.from({ length: 19 }).map((_, idx) => ({
      source: "CONTACT_FORM" as const,
      name: `Seeded Day User ${idx}`,
      email: `dayseed_${idx}@example.com`,
      message: `Seeded message ${idx}`,
      ipHash: dailyIpHash,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
      status: "NEW" as const,
    }));
    await prisma.lead.createMany({ data: dailySeedData });

    // Request 20 in 24h (Request 1 in current hour)
    const resDaily20 = await POST(
      makeReq({
        body: {
          name: "Daily User 20",
          email: "daily_20@example.com",
          message: "Request 20 in 24h",
          elapsedMs: 2500,
        },
        ip: dailyIp,
      })
    );
    assert.strictEqual(resDaily20.status, 201, "20th request within day must succeed");

    // Request 21 in 24h (Request 2 in current hour) -> daily limit exceeded!
    const resDailyBlocked = await POST(
      makeReq({
        body: {
          name: "Daily User 21",
          email: "daily_21@example.com",
          message: "Request 21 in 24h",
          elapsedMs: 2500,
        },
        ip: dailyIp,
      })
    );
    console.log("\nDaily 21st Request Status:", resDailyBlocked.status);
    console.log("Daily 21st Request Retry-After:", resDailyBlocked.headers.get("Retry-After"));
    const dailyBody = await resDailyBlocked.json();
    console.log("Daily 21st Request Body:", JSON.stringify(dailyBody));

    assert.strictEqual(resDailyBlocked.status, 429);
    assert.strictEqual(resDailyBlocked.headers.get("Retry-After"), "86400");
    assert.strictEqual(resDailyBlocked.headers.get("Cache-Control"), "no-store");
    console.log("✓ TASK 3d PASSED: 1-hour limit (429, Retry-After: 3600) and 24-hour limit (429, Retry-After: 86400) verified.\n");

    // =========================================================================
    // TASK 3e: 503 Test (Clean JSON, zero internal leaks)
    // =========================================================================
    console.log("--- TASK 3e: 503 Outage Handling & Credential Leak Check ---");
    const savedDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://postgres:secret_pass@127.0.0.1:54999/nonexistent_db";
    process.env.DIRECT_URL = "postgresql://postgres:secret_pass@127.0.0.1:54999/nonexistent_db";
    resetDb();

    const res503 = await POST(
      makeReq({
        body: {
          name: "Outage User",
          email: "outage@example.com",
          elapsedMs: 3000,
        },
        ip: "10.0.5.1",
      })
    );
    const body503Text = await res503.text();
    console.log("503 Status Code:", res503.status);
    console.log("503 Response Headers:");
    res503.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
    console.log("503 Response Body:", body503Text);

    assert.strictEqual(res503.status, 503);
    assert.strictEqual(res503.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(
      body503Text,
      '{"ok":false,"error":"Service temporarily unavailable. Please try again or reach us directly."}'
    );

    // Negative assertions: verify NO credentials, connection strings, hosts, ports, or traces leak
    assert.strictEqual(body503Text.toLowerCase().includes("postgres"), false);
    assert.strictEqual(body503Text.toLowerCase().includes("prismaclient"), false);
    assert.strictEqual(body503Text.includes("secret_pass"), false);
    assert.strictEqual(body503Text.includes("54999"), false);
    assert.strictEqual(body503Text.includes("127.0.0.1"), false);
    assert.strictEqual(body503Text.toLowerCase().includes("connection"), false);
    assert.strictEqual(body503Text.toLowerCase().includes("stack"), false);

    // Restore test DB connection
    process.env.DATABASE_URL = savedDbUrl;
    process.env.DIRECT_URL = savedDbUrl;
    resetDb();
    console.log("✓ TASK 3e PASSED: 503 returned cleanly with zero internal traces or secrets leaked.\n");

    // =========================================================================
    // TASK 3g: Service Slug Validation
    // =========================================================================
    console.log("--- TASK 3g: Service Slug Validation (Unpublished vs Published) ---");
    // Unpublished / fake slug
    const resBadSlug = await POST(
      makeReq({
        body: {
          name: "Slug Tester",
          email: "slugtester@example.com",
          service: "non-existent-unpublished-slug",
          elapsedMs: 3000,
        },
        ip: "10.0.7.1",
      })
    );
    const badSlugBody = await resBadSlug.json();
    console.log("Unpublished Slug Status:", resBadSlug.status);
    console.log("Unpublished Slug Body:", JSON.stringify(badSlugBody));
    assert.strictEqual(resBadSlug.status, 400);
    assert.ok(badSlugBody.error.includes("Must match a published service"));

    // Published slug
    const resGoodSlug = await POST(
      makeReq({
        body: {
          name: "Slug Tester",
          email: "slugtester2@example.com",
          service: "branding-identity",
          elapsedMs: 3000,
        },
        ip: "10.0.7.2",
      })
    );
    const goodSlugBody = await resGoodSlug.json();
    console.log("\nPublished Slug Status:", resGoodSlug.status);
    console.log("Published Slug Body:", JSON.stringify(goodSlugBody));
    assert.strictEqual(resGoodSlug.status, 201);
    console.log("✓ TASK 3g PASSED: Unpublished slug rejected (400), published accepted (201).\n");

    // =========================================================================
    // TASK 3h: Origin & Referer Verification
    // =========================================================================
    console.log("--- TASK 3h: Origin & Referer Verification ---");
    // 1) Disallowed Origin
    const resBadOrigin = await POST(
      makeReq({
        body: { name: "Attacker", email: "attacker@bad.com", elapsedMs: 3000 },
        headers: { origin: "https://evil-unauthorized-phishing.com" },
        ip: "10.0.8.1",
      })
    );
    console.log("Disallowed Origin Status:", resBadOrigin.status);
    assert.strictEqual(resBadOrigin.status, 403);

    // 2) Absent Origin (Allowed for direct clients/scripts)
    const resNoOrigin = await POST(
      makeReq({
        body: { name: "Direct Client", email: "direct@example.com", elapsedMs: 3000 },
        headers: { origin: "", referer: "" },
        ip: "10.0.8.2",
      })
    );
    console.log("Absent Origin Status:", resNoOrigin.status);
    assert.strictEqual(resNoOrigin.status, 201);

    // 3) Localhost origin in Development vs Production
    // a. In Development (NODE_ENV !== "production"): localhost accepted
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const resLocalhostDev = await POST(
      makeReq({
        body: { name: "Local Dev", email: "localdev@example.com", elapsedMs: 3000 },
        headers: { origin: "http://localhost:3000" },
        ip: "10.0.8.3",
      })
    );
    console.log("Localhost in development status:", resLocalhostDev.status);
    assert.strictEqual(resLocalhostDev.status, 201);

    // b. In Production (NODE_ENV === "production"): localhost rejected with 403
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const resLocalhostProd = await POST(
      makeReq({
        body: { name: "Local Prod", email: "localprod@example.com", elapsedMs: 3000 },
        headers: { origin: "http://localhost:3000" },
        ip: "10.0.8.4",
      })
    );
    console.log("Localhost in production status:", resLocalhostProd.status);
    assert.strictEqual(resLocalhostProd.status, 403);
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    console.log("✓ TASK 3h PASSED: Disallowed Origin -> 403, Absent Origin -> 201, Localhost allowed ONLY in dev.\n");

    // =========================================================================
    // TASK 4a: Resend Notification Test
    // =========================================================================
    console.log("--- TASK 4a: Resend Notification Test (Default OFF & Failure Logging) ---");
    // Test 1: Unset credentials (Default OFF) -> does nothing
    delete process.env.RESEND_API_KEY;
    delete process.env.NOTIFY_EMAIL;

    const countBeforeUnset = await prisma.activityLog.count({
      where: { action: "lead.notify_failed" },
    });
    await sendLeadNotification({
      leadId: "test-lead-unset-1",
      name: "Unset Lead",
      email: "unset@example.com",
    });
    const countAfterUnset = await prisma.activityLog.count({
      where: { action: "lead.notify_failed" },
    });
    assert.strictEqual(countAfterUnset, countBeforeUnset, "When unset, sendLeadNotification must do nothing");
    console.log("Default OFF (unset credentials): Notification does nothing, 0 failure logs.");

    // Test 2: Set invalid credentials -> dispatches HTTP, fails, logs lead.notify_failed without PII
    process.env.RESEND_API_KEY = "re_invalid_test_key_placeholder";
    process.env.NOTIFY_EMAIL = "notify@akzqcreation.com";

    await sendLeadNotification({
      leadId: "test-lead-fail-1",
      name: "Sensitive Customer Name",
      email: "sensitive.customer@example.com",
      phone: "+91 9999999999",
      message: "Secret project description",
    });

    const failedLog = await prisma.activityLog.findFirst({
      where: { action: "lead.notify_failed", entityId: "test-lead-fail-1" },
    });
    assert.ok(failedLog, "Failure log must be written on dispatch error");
    assert.strictEqual(failedLog.entityId, "test-lead-fail-1");
    console.log("\nDumped lead.notify_failed ActivityLog Row:");
    console.dir(failedLog, { depth: null });

    const failedMeta = failedLog.metadata as Record<string, unknown>;
    assert.strictEqual(failedMeta.name, undefined);
    assert.strictEqual(failedMeta.email, undefined);
    assert.strictEqual(failedMeta.phone, undefined);
    assert.strictEqual(failedMeta.message, undefined);
    console.log("✓ TASK 4a PASSED: Resend notification is default OFF; failed send logs without PII.\n");

    delete process.env.RESEND_API_KEY;
    delete process.env.NOTIFY_EMAIL;

    // =========================================================================
    // Re-verify Lead Viewer Script
    // =========================================================================
    console.log("--- Lead Viewer Script (scripts/leads-list.ts) ---");
    const scriptOutput = execSync("npx tsx scripts/leads-list.ts", {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
      encoding: "utf8",
    });
    console.log(scriptOutput.trim());
    assert.ok(scriptOutput.includes("LATEST"), "Script must output latest leads");
    console.log("✓ scripts/leads-list.ts executed cleanly.\n");

  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
    try {
      await pgServer.stop();
    } catch {}
    console.log("Disposable Postgres cluster stopped cleanly.");
  }

  console.log("\n========================================================");
  console.log("ALL LEADS API INTEGRATION TESTS PASSED CLEANLY");
  console.log("========================================================\n");
}

runSuite().catch((err) => {
  console.error("LEADS API TEST SUITE FAILED:", err);
  process.exit(1);
});
