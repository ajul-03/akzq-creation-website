import assert from "assert";
import { execSync } from "child_process";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { POST } from "../src/app/api/leads/route";
import { main as runSeed } from "../prisma/seed";
import { hashIp } from "../src/lib/privacy";
import { resetDb } from "../src/lib/db";

const TEST_PORT = 54332;
const TEST_DB_NAME = "akzq_test_db";
const SHADOW_DB_NAME = "akzq_shadow_test_db";
const TEST_DB_URL = `postgresql://postgres:password@127.0.0.1:${TEST_PORT}/${TEST_DB_NAME}`;

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

    // Test 1: Clean, valid lead submission (201 Created)
    console.log("--- Test 1: Valid Lead Submission (201 Created) ---");
    const test1Req = makeReq({
      body: {
        name: "Rahul Nambiar",
        email: "rahul@kannurretail.com",
        phone: "+91 7510109730",
        company: "Kannur Retail Corp",
        service: "branding-identity",
        budgetRange: "Growth (₹30k - ₹60k)",
        message: "Need brand refresh and packaging design for Kannur stores.",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "kannur-branding",
        referrer: "https://google.com/search?q=kannur+branding",
        elapsedMs: 5000,
      },
      ip: "103.20.10.1",
    });

    const res1 = await POST(test1Req);
    assert.strictEqual(res1.status, 201, `Expected 201, got ${res1.status}`);
    assert.strictEqual(res1.headers.get("Cache-Control"), "no-store");
    const json1 = (await res1.json()) as { ok: boolean; id: string };
    assert.strictEqual(json1.ok, true);
    assert.ok(json1.id, "Expected returned lead id");

    // Verify stored lead in database
    const leadRecord = await prisma.lead.findUnique({
      where: { id: json1.id },
      include: { service: true },
    });
    assert.ok(leadRecord, "Lead must exist in database");
    assert.strictEqual(leadRecord.name, "Rahul Nambiar");
    assert.strictEqual(leadRecord.email, "rahul@kannurretail.com");
    assert.strictEqual(leadRecord.phone, "+91 7510109730");
    assert.strictEqual(leadRecord.company, "Kannur Retail Corp");
    assert.strictEqual(leadRecord.budgetRange, "GROWTH");
    assert.strictEqual(leadRecord.source, "CONTACT_FORM");
    assert.strictEqual(leadRecord.status, "NEW");
    assert.strictEqual(leadRecord.ipHash, hashIp("103.20.10.1", process.env.IP_HASH_SECRET));
    assert.strictEqual(leadRecord.service?.slug, "branding-identity");
    assert.ok(leadRecord.consentGivenAt, "consentGivenAt must be set");

    // Verify ActivityLog entry: zero PII in metadata
    const activityLogs = await prisma.activityLog.findMany({
      where: { entityId: leadRecord.id },
    });
    assert.strictEqual(activityLogs.length, 1, "Exactly 1 ActivityLog record expected");
    const log = activityLogs[0];
    assert.strictEqual(log.action, "lead.created");
    assert.strictEqual(log.entityType, "Lead");
    assert.strictEqual(log.ipHash, leadRecord.ipHash);
    const meta = log.metadata as Record<string, unknown>;
    assert.strictEqual(meta.source, "CONTACT_FORM");
    assert.strictEqual(meta.hasPhone, true);
    assert.strictEqual(meta.budgetRange, "GROWTH");
    assert.strictEqual(meta.name, undefined, "PII (name) must NEVER be in ActivityLog");
    assert.strictEqual(meta.email, undefined, "PII (email) must NEVER be in ActivityLog");
    assert.strictEqual(meta.phone, undefined, "PII (phone) must NEVER be in ActivityLog");
    assert.strictEqual(meta.message, undefined, "PII (message) must NEVER be in ActivityLog");
    console.log("✓ Test 1 PASSED: Lead stored correctly with ActivityLog and zero PII.\n");

    // Test 2: Content-Type rejection (415)
    console.log("--- Test 2: Non-JSON Content-Type (415 Unsupported Media Type) ---");
    const test2Req = makeReq({
      rawText: "name=Rahul&email=test@example.com",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    const res2 = await POST(test2Req);
    assert.strictEqual(res2.status, 415, `Expected 415, got ${res2.status}`);
    assert.strictEqual(res2.headers.get("Cache-Control"), "no-store");
    console.log("✓ Test 2 PASSED: 415 returned on non-JSON Content-Type.\n");

    // Test 3: Body size > 10KB (413)
    console.log("--- Test 3: Payload Too Large > 10KB (413) ---");
    const largeMessage = "A".repeat(11 * 1024);
    const test3Req = makeReq({
      body: { name: "Test User", email: "test@example.com", message: largeMessage },
    });
    const res3 = await POST(test3Req);
    assert.strictEqual(res3.status, 413, `Expected 413, got ${res3.status}`);
    console.log("✓ Test 3 PASSED: 413 returned when body exceeds 10KB.\n");

    // Test 4: Origin mismatch (403)
    console.log("--- Test 4: Origin / Referer Mismatch (403 Forbidden) ---");
    const test4Req = makeReq({
      body: { name: "Spam Origin", email: "spam@example.com", elapsedMs: 5000 },
      headers: {
        origin: "https://malicious-phishing-site.com",
        referer: "https://malicious-phishing-site.com/attack",
      },
    });
    const res4 = await POST(test4Req);
    assert.strictEqual(res4.status, 403, `Expected 403, got ${res4.status}`);
    console.log("✓ Test 4 PASSED: 403 returned on unauthorized origin.\n");

    // Test 5: Validation Failures (400)
    console.log("--- Test 5: Zod Validation Failures (400 Bad Request) ---");
    // 5a: Short name
    const res5a = await POST(
      makeReq({
        body: { name: "A", email: "valid@example.com", elapsedMs: 5000 },
      })
    );
    assert.strictEqual(res5a.status, 400);

    // 5b: Invalid email
    const res5b = await POST(
      makeReq({
        body: { name: "Valid Name", email: "not-an-email", elapsedMs: 5000 },
      })
    );
    assert.strictEqual(res5b.status, 400);

    // 5c: Invalid phone regex
    const res5c = await POST(
      makeReq({
        body: {
          name: "Valid Name",
          email: "valid@example.com",
          phone: "INVALID_PHONE_LETTERS",
          elapsedMs: 5000,
        },
      })
    );
    assert.strictEqual(res5c.status, 400);
    console.log("✓ Test 5 PASSED: 400 returned on invalid name, email, and phone.\n");

    // Test 6: Unknown Service Slug (400)
    console.log("--- Test 6: Unknown Service Slug Rejection (400 Bad Request) ---");
    const res6 = await POST(
      makeReq({
        body: {
          name: "Test Client",
          email: "client@example.com",
          service: "non-existent-service-slug-xyz",
          elapsedMs: 5000,
        },
      })
    );
    assert.strictEqual(res6.status, 400);
    const json6 = (await res6.json()) as { ok: boolean; error: string };
    assert.ok(json6.error.includes("Must match a published service"));
    console.log("✓ Test 6 PASSED: 400 returned when service slug is unknown.\n");

    // Test 7: Honeypot trap (silently returns 201 ack, inserts NOTHING)
    console.log("--- Test 7: Honeypot Anti-Spam Trap ---");
    const countBeforeHoneypot = await prisma.lead.count();
    const res7 = await POST(
      makeReq({
        body: {
          name: "Spam Bot",
          email: "bot@spammer.com",
          hp_field: "I am a malicious bot filling hidden fields",
          elapsedMs: 5000,
        },
      })
    );
    assert.strictEqual(res7.status, 201);
    const json7 = (await res7.json()) as { ok: boolean; id: string };
    assert.strictEqual(json7.id, "ack");
    const countAfterHoneypot = await prisma.lead.count();
    assert.strictEqual(countAfterHoneypot, countBeforeHoneypot, "Honeypot MUST NOT insert any record");
    console.log("✓ Test 7 PASSED: Honeypot submission returned 201 'ack' with ZERO database insertions.\n");

    // Test 8: Fast submission check (< 2000ms -> silently returns 201 ack, inserts NOTHING)
    console.log("--- Test 8: Rapid Sub-2-Second Submission Trap ---");
    const countBeforeFast = await prisma.lead.count();
    const res8 = await POST(
      makeReq({
        body: {
          name: "Super Fast Bot",
          email: "fastbot@spammer.com",
          elapsedMs: 850, // Less than 2000ms
        },
      })
    );
    assert.strictEqual(res8.status, 201);
    const json8 = (await res8.json()) as { ok: boolean; id: string };
    assert.strictEqual(json8.id, "ack");
    const countAfterFast = await prisma.lead.count();
    assert.strictEqual(countAfterFast, countBeforeFast, "Fast submission MUST NOT insert any record");
    console.log("✓ Test 8 PASSED: Fast submission returned 201 'ack' with ZERO database insertions.\n");

    // Test 9: Deduplication (same email + same message within 10 min)
    console.log("--- Test 9: Deduplication Window (10 Minutes) ---");
    const test9Email = "dedupe@example.com";
    const test9Message = "Same exact message inquiry.";
    const res9a = await POST(
      makeReq({
        body: {
          name: "Dedupe User",
          email: test9Email,
          message: test9Message,
          elapsedMs: 4000,
        },
        ip: "103.20.10.99",
      })
    );
    assert.strictEqual(res9a.status, 201);
    const json9a = (await res9a.json()) as { ok: boolean; id: string };

    const countBeforeDedupe = await prisma.lead.count();
    const res9b = await POST(
      makeReq({
        body: {
          name: "Dedupe User",
          email: test9Email,
          message: test9Message,
          elapsedMs: 4000,
        },
        ip: "103.20.10.99",
      })
    );
    assert.strictEqual(res9b.status, 201);
    const json9b = (await res9b.json()) as { ok: boolean; id: string };
    assert.strictEqual(json9b.id, json9a.id, "Deduplication must return existing record ID");
    const countAfterDedupe = await prisma.lead.count();
    assert.strictEqual(countAfterDedupe, countBeforeDedupe, "Duplicate submission MUST NOT insert a second record");
    console.log("✓ Test 9 PASSED: Deduplicated submission returned original ID with ZERO duplicate insertions.\n");

    // Test 10: Rate Limiting (5 requests per hour per IP)
    console.log("--- Test 10: Rate Limiting (Max 5/Hour per IP) ---");
    const rateLimitIp = "185.190.20.55";
    for (let i = 1; i <= 5; i++) {
      const resRate = await POST(
        makeReq({
          body: {
            name: `Rate Limit User ${i}`,
            email: `ratelimit_${i}@example.com`,
            message: `Different message ${i} to bypass dedupe`,
            elapsedMs: 3000,
          },
          ip: rateLimitIp,
        })
      );
      assert.strictEqual(resRate.status, 201, `Submission ${i} should succeed`);
    }

    // 6th submission from same IP must receive 429
    const resRateBlocked = await POST(
      makeReq({
        body: {
          name: "Rate Limit User 6",
          email: "ratelimit_6@example.com",
          message: "Attempt 6 from same IP",
          elapsedMs: 3000,
        },
        ip: rateLimitIp,
      })
    );
    assert.strictEqual(resRateBlocked.status, 429, `Expected 429, got ${resRateBlocked.status}`);
    assert.strictEqual(resRateBlocked.headers.get("Retry-After"), "3600");
    const jsonRate = (await resRateBlocked.json()) as { ok: boolean; error: string };
    assert.ok(jsonRate.error.includes("Too many submissions"));
    console.log("✓ Test 10 PASSED: 429 Too Many Requests returned with Retry-After header on 6th submission.\n");

    // Test 11: Service Unavailable on Database Failure (503)
    console.log("--- Test 11: Database Outage Failure Handling (503 Service Unavailable) ---");
    const origDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://postgres:badpassword@127.0.0.1:54999/nonexistent";
    process.env.DIRECT_URL = "postgresql://postgres:badpassword@127.0.0.1:54999/nonexistent";
    resetDb();

    // Create a new request that hits DB failure
    const res503 = await POST(
      makeReq({
        body: {
          name: "Outage Tester",
          email: "outage@example.com",
          elapsedMs: 4000,
        },
        ip: "10.0.0.99",
      })
    );
    assert.strictEqual(res503.status, 503, `Expected 503, got ${res503.status}`);
    const json503 = (await res503.json()) as { ok: boolean; error: string };
    assert.strictEqual(
      json503.error,
      "Service temporarily unavailable. Please try again or reach us directly."
    );
    // Ensure no connection credentials or internal trace are leaked
    assert.strictEqual(JSON.stringify(json503).includes("badpassword"), false);
    assert.strictEqual(JSON.stringify(json503).includes("PrismaClient"), false);

    // Restore original DB url
    process.env.DATABASE_URL = origDbUrl;
    process.env.DIRECT_URL = origDbUrl;
    resetDb();
    console.log("✓ Test 11 PASSED: 503 returned cleanly without leaking connection strings or stack traces.\n");

    // Test 12: Lead Viewer Script Verification
    console.log("--- Test 12: Lead Viewer Script (scripts/leads-list.ts) ---");
    const scriptOutput = execSync("npx tsx scripts/leads-list.ts", {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
      encoding: "utf8",
    });
    assert.ok(scriptOutput.includes("LATEST"), "Script must output latest leads");
    assert.ok(scriptOutput.includes("Rahul Nambiar"), "Script must display created lead");
    console.log("✓ Test 12 PASSED: scripts/leads-list.ts executed cleanly.\n");

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
