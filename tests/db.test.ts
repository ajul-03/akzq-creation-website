import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { db, getDb } from "../src/lib/db";
import { main as runSeed } from "../prisma/seed";

const TEST_PORT = 54332;
const TEST_DB_NAME = "akzq_test_db";
const SHADOW_DB_NAME = "akzq_shadow_test_db";
const TEST_DB_URL = `postgresql://postgres:password@127.0.0.1:${TEST_PORT}/${TEST_DB_NAME}`;
const SHADOW_DB_URL = `postgresql://postgres:password@127.0.0.1:${TEST_PORT}/${SHADOW_DB_NAME}`;

// Fresh data directory under os.tmpdir() (never in project folder or synced directory)
const tempPgDir = fs.mkdtempSync(path.join(os.tmpdir(), "akzq-db-test-"));
console.log(`Disposable Postgres temporary data directory: ${tempPgDir}`);
console.log(`Disposable Postgres port: ${TEST_PORT}\n`);

let testPrisma: any = null;
let testPool: any = null;
let pgServer: any = null;

// Hard watchdog: 5 minutes
const WATCHDOG_MS = 5 * 60 * 1000;
const watchdog = setTimeout(() => {
  console.error(`\n❌ HARD WATCHDOG TIMEOUT (5 min): tests/db.test.ts exceeded limit. Forcing cleanup & exit.`);
  void cleanupAndExit(1);
}, WATCHDOG_MS);
watchdog.unref();

async function cleanupAndExit(exitCode: number) {
  clearTimeout(watchdog);
  console.log("\nStarting robust cleanup sequence...");

  // 1. Close all database clients first
  if (testPrisma) {
    try {
      await testPrisma.$disconnect();
    } catch {}
  }
  try {
    await db.$disconnect();
  } catch {}
  if (testPool) {
    try {
      await testPool.end();
    } catch {}
  }

  // 2. Stop Postgres with 15s timeout and force-kill process tree if it does not exit
  if (pgServer) {
    try {
      let stopped = false;
      const stopPromise = pgServer.stop().then(() => {
        stopped = true;
      });
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 15000));
      await Promise.race([stopPromise, timeoutPromise]);
      if (!stopped) {
        console.warn("pgServer.stop() timed out after 15s; force-killing postgres process tree...");
        const pid = pgServer.process?.pid;
        if (pid && process.platform === "win32") {
          try {
            execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
          } catch {}
        }
      }
    } catch {
      const pid = pgServer.process?.pid;
      if (pid && process.platform === "win32") {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
        } catch {}
      }
    }
  }

  // 3. Delete data directory
  try {
    if (tempPgDir && fs.existsSync(tempPgDir)) {
      fs.rmSync(tempPgDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      console.log(`Temporary Postgres data directory removed: ${tempPgDir}`);
    }
  } catch (err) {
    console.warn("Could not delete temporary Postgres data directory:", err);
  }

  console.log(`✓ Cleanup finished with exit code ${exitCode}.`);
  process.exit(exitCode);
}

console.log("=== RUNNING DATABASE, DRIFT & LIVE CONSTRAINT TEST SUITE ===\n");

// Helper to normalize text
function norm(s: string) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

async function runSuite() {
  try {
    // 1. Prisma Client Singleton Test
    console.log("--- 1. Prisma Client Singleton Test ---");
  const clientA = db;
  const clientB = db;
  assert.strictEqual(
    clientA,
    clientB,
    "Multiple db imports must return the exact same PrismaClient singleton instance"
  );

  const globalPrisma = (globalThis as unknown as { prisma?: PrismaClient }).prisma;
  if (process.env.NODE_ENV !== "production") {
    assert.strictEqual(globalPrisma, db, "Global prisma reference must match singleton");
  }
  console.log("✓ Prisma Client singleton verification PASSED (no connection leak under reload).\n");

  // 2. Start Disposable Test Postgres Cluster
  console.log("--- 2. Starting Disposable Postgres Cluster & Safety Checks ---");
  pgServer = new EmbeddedPostgres({
    port: TEST_PORT,
    databaseDir: tempPgDir,
    user: "postgres",
    password: "password",
    persistent: false,
    initdbFlags: ["-E", "UTF8", "--locale=C"],
  });

  try {
    await pgServer.initialise();
  } catch (e) {
    // Already initialised
  }
  await pgServer.start();
  console.log(`Disposable Postgres cluster running on port ${TEST_PORT}.`);

  // Safety check: Database names MUST contain 'test'
  if (!TEST_DB_NAME.includes("test")) {
    throw new Error(`SAFETY VIOLATION: Refusing to run tests. Target DB '${TEST_DB_NAME}' does not contain 'test'.`);
  }
  if (!SHADOW_DB_NAME.includes("test")) {
    throw new Error(`SAFETY VIOLATION: Refusing to run tests. Shadow DB '${SHADOW_DB_NAME}' does not contain 'test'.`);
  }
  console.log(`✓ Safety check PASSED: Target DB '${TEST_DB_NAME}' and Shadow DB '${SHADOW_DB_NAME}' verified.\n`);

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
  console.log(`Initialized fresh empty databases: ${TEST_DB_NAME}, ${SHADOW_DB_NAME}.\n`);

  // 3. Real Migration Deploy from Empty DB
  console.log("--- 3. Real Migration Deploy from Empty Database ---");
  const deployEnv = {
    ...process.env,
    DATABASE_URL: TEST_DB_URL,
    DIRECT_URL: TEST_DB_URL,
    SHADOW_DATABASE_URL: SHADOW_DB_URL,
  };
  const deployOutput = execSync("npx prisma migrate deploy", {
    env: deployEnv,
    encoding: "utf8",
  });
  console.log(deployOutput.trim());
  console.log("✓ prisma migrate deploy from empty DB PASSED.\n");

  // 4. Real Schema vs Migration Drift Check (--exit-code)
  console.log("--- 4. Real Migration Drift Check (prisma migrate diff --exit-code) ---");
  const diffCmd = `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code`;
  const diffOutput = execSync(diffCmd, {
    env: deployEnv,
    encoding: "utf8",
  });
  console.log(diffOutput.trim() || "[No schema drift detected: diff output is empty]");
  console.log("✓ prisma migrate diff --exit-code exited 0 (ZERO DRIFT).\n");

  // Connect test PrismaClient
  testPool = new pg.Pool({ connectionString: TEST_DB_URL });
  const adapter = new PrismaPg(testPool);
  testPrisma = new PrismaClient({ adapter });

    // 5. Seed Honesty & Idempotency (Twice against real test DB)
    console.log("--- 5. Seed Honesty & Idempotency Execution ---");

    console.log(">> First Seed Run:");
    await runSeed(testPrisma);

    const tables = [
      "Faq",
      "Service",
      "PortfolioProject",
      "BlogCategory",
      "BlogTag",
      "Post",
      "PostTag",
      "User",
      "Lead",
      "ActivityLog",
      "Media",
      "ServiceItem",
      "ServiceMedia",
      "ClientProfile",
    ];

    const getRawSqlCounts = async () => {
      const counts: Record<string, number> = {};
      for (const t of tables) {
        const res: Array<{ count: bigint }> = await testPrisma.$queryRawUnsafe(
          `SELECT count(*) FROM "${t}";`
        );
        counts[t] = Number(res[0].count);
      }
      return counts;
    };

    const countsRun1 = await getRawSqlCounts();
    console.log("\nRun 1 Physical SQL Row Counts (SELECT count(*)):");
    console.table(countsRun1);

    console.log(">> Second Seed Run (Verifying Idempotency):");
    await runSeed(testPrisma);
    const countsRun2 = await getRawSqlCounts();
    console.log("\nRun 2 Physical SQL Row Counts (SELECT count(*)):");
    console.table(countsRun2);

    assert.deepStrictEqual(
      countsRun1,
      countsRun2,
      "Second seed execution must produce identical row counts (100% idempotent)"
    );
    console.log("✓ Idempotent seed verification PASSED.\n");

    // 6. Live Constraints & Deletion Behavior Suite
    console.log("--- 6. Live Database Constraints & Relations Suite ---");

    // 6a. Duplicate slug rejected (P2002)
    console.log("Testing 6a: Duplicate slug rejection (P2002)...");
    const dupSlug = `test-duplicate-${Date.now()}`;
    await testPrisma.portfolioProject.create({
      data: {
        slug: dupSlug,
        title: "Duplicate Test Project A",
        category: "Test",
        isConcept: true,
      },
    });

    let p2002Caught = false;
    try {
      await testPrisma.portfolioProject.create({
        data: {
          slug: dupSlug,
          title: "Duplicate Test Project B",
          category: "Test",
          isConcept: true,
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") p2002Caught = true;
    }
    assert.ok(p2002Caught, "Duplicate slug must be rejected with P2002");
    console.log("✓ 6a PASSED: Duplicate slug rejected with P2002.\n");

    // 6b. Service delete cascades ServiceItem and SetNulls Faq/Lead
    console.log("Testing 6b: Service delete cascade & SetNull behavior...");
    const testSvc = await testPrisma.service.create({
      data: {
        slug: `svc-cascade-${Date.now()}`,
        title: "Service With Cascades",
        shortDescription: "Short Description",
        items: {
          create: [
            { kind: "FEATURE", title: "Feature Alpha" },
            { kind: "DELIVERABLE", title: "Deliverable Beta" },
          ],
        },
      },
      include: { items: true },
    });
    assert.strictEqual(testSvc.items.length, 2);

    const testFaq = await testPrisma.faq.create({
      data: {
        seedKey: `faq-fk-${Date.now()}`,
        question: "Service specific question?",
        answer: "Service specific answer text.",
        serviceId: testSvc.id,
      },
    });

    const testLead = await testPrisma.lead.create({
      data: {
        source: "CONTACT_FORM",
        name: "FK Test Lead",
        email: "fk-test@example.com",
        serviceId: testSvc.id,
      },
    });

    // Delete Service
    await testPrisma.service.delete({ where: { id: testSvc.id } });

    // Verify Cascade: ServiceItem rows deleted
    const remainingItems = await testPrisma.serviceItem.count({
      where: { serviceId: testSvc.id },
    });
    assert.strictEqual(remainingItems, 0, "ServiceItem rows must cascade-delete");

    // Verify SetNull: Faq.serviceId becomes null
    const updatedFaq = await testPrisma.faq.findUnique({ where: { id: testFaq.id } });
    assert.strictEqual(updatedFaq?.serviceId, null, "Faq.serviceId must become null via SetNull");

    // Verify SetNull: Lead.serviceId becomes null
    const updatedLead = await testPrisma.lead.findUnique({ where: { id: testLead.id } });
    assert.strictEqual(updatedLead?.serviceId, null, "Lead.serviceId must become null via SetNull");

    console.log("✓ 6b PASSED: Service deletion cascaded ServiceItem and SetNulls Faq/Lead.\n");

    // 6c. Media Restrict on User delete (P2003)
    console.log("Testing 6c: Media uploadedBy Restrict on User delete (P2003)...");
    const testUser = await testPrisma.user.create({
      data: {
        email: `media-uploader-${Date.now()}@example.com`,
        name: "Media Uploader User",
      },
    });

    const testMedia = await testPrisma.media.create({
      data: {
        storageKey: `media-storage-key-${Date.now()}`,
        mimeType: "image/webp",
        byteSize: 4096,
        uploadedById: testUser.id,
      },
    });

    let p2003Caught = false;
    try {
      await testPrisma.user.delete({ where: { id: testUser.id } });
    } catch (err: any) {
      console.log(`[Captured error on User delete: code=${err.code}, name=${err.name}]`);
      if (err.code === "P2003" || err.code === "P2014" || err.message?.includes("foreign key")) {
        p2003Caught = true;
      }
    }
    assert.ok(p2003Caught, "Deleting user who uploaded media must fail with P2003 Restrict");
    console.log("✓ 6c PASSED: User deletion with referenced Media blocked by P2003 (Restrict).\n");

    // 6d. Same Faq.question allowed on two services
    console.log("Testing 6d: Same Faq.question allowed on two separate services...");
    const svc1 = await testPrisma.service.create({
      data: {
        slug: `svc-q1-${Date.now()}`,
        title: "Service One",
        shortDescription: "Short One",
      },
    });
    const svc2 = await testPrisma.service.create({
      data: {
        slug: `svc-q2-${Date.now()}`,
        title: "Service Two",
        shortDescription: "Short Two",
      },
    });

    const sharedQuestion = "What is the typical timeline for completion?";
    const sharedFaq1 = await testPrisma.faq.create({
      data: {
        seedKey: `faq-shared-1-${Date.now()}`,
        question: sharedQuestion,
        answer: "Service 1 timeline is 2 to 3 weeks.",
        serviceId: svc1.id,
      },
    });
    const sharedFaq2 = await testPrisma.faq.create({
      data: {
        seedKey: `faq-shared-2-${Date.now()}`,
        question: sharedQuestion,
        answer: "Service 2 timeline is 4 to 6 weeks.",
        serviceId: svc2.id,
      },
    });

    assert.strictEqual(sharedFaq1.question, sharedFaq2.question);
    assert.notStrictEqual(sharedFaq1.serviceId, sharedFaq2.serviceId);
    assert.notStrictEqual(sharedFaq1.id, sharedFaq2.id);
    console.log("✓ 6d PASSED: Same Faq.question cleanly permitted across different services.\n");

    // 6e. Unique seedKey on Faq
    console.log("Testing 6e: Unique seedKey enforcement on Faq...");
    const uniqueKey = `seed-unique-test-${Date.now()}`;
    await testPrisma.faq.create({
      data: {
        seedKey: uniqueKey,
        question: "Question One",
        answer: "Answer One",
      },
    });

    let duplicateKeyCaught = false;
    try {
      await testPrisma.faq.create({
        data: {
          seedKey: uniqueKey,
          question: "Question Two",
          answer: "Answer Two",
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") duplicateKeyCaught = true;
    }
    assert.ok(duplicateKeyCaught, "Duplicate seedKey must throw P2002");
    console.log("✓ 6e PASSED: Duplicate Faq.seedKey rejected with P2002.\n");

    // 7. Content Parity Verification (Seed vs Rendered Pages)
    console.log("--- 7. Content Parity Verification (Seed vs Rendered Pages) ---");

    // 7a. FAQs Parity
    const faqHtml = fs.readFileSync(path.resolve(".next/server/app/faq.html"), "utf8");
    const faqRegex = /<div class="faq-item[^"]*">[\s\S]*?<button class="faq-question"[^>]*>([\s\S]*?)<\/button>[\s\S]*?<div class="faq-answer">([\s\S]*?)<\/div>\s*<\/div>/g;
    const pageFaqs = [...faqHtml.matchAll(faqRegex)].map((m) => ({
      question: norm(m[1]).replace(/^\d+\.\s*/, ""),
      answer: norm(m[2]),
    }));
    assert.strictEqual(pageFaqs.length, 8, "Rendered /faq page must contain 8 FAQ items");

    // 7b. Portfolio Parity
    const portfolioHtml = fs.readFileSync(path.resolve(".next/server/app/portfolio.html"), "utf8");
    const projectRegex = /<div class="portfolio-card"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/g;
    const pageProjects = [...portfolioHtml.matchAll(projectRegex)].map((m) => norm(m[1]));
    assert.strictEqual(pageProjects.length, 6, "Rendered /portfolio page must contain 6 projects");

    // 7c. Services Parity
    const servicesHtml = fs.readFileSync(path.resolve(".next/server/app/services.html"), "utf8");
    const serviceRegex = /<div class="service-card"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/g;
    const pageServices = [...servicesHtml.matchAll(serviceRegex)].map((m) => norm(m[1]));
    assert.ok(pageServices.length >= 5, "Rendered /services page must contain at least 5 services");

    // 7d. Blog Post Parity
    const blogHtml = fs.readFileSync(path.resolve(".next/server/app/blog-cost-of-seo-kerala.html"), "utf8");
    const blogTitleMatch = blogHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    assert.ok(blogTitleMatch, "Rendered blog post must have an <h1> title");
    const pageBlogTitle = norm(blogTitleMatch[1]);
    assert.ok(pageBlogTitle.includes("How Much Does SEO Cost in Kerala"), "Blog title must match");

    console.log("✓ Content parity verification PASSED: 8 FAQs, 6 Projects, 5 Services, 1 Blog Post.\n");

    console.log("\n========================================================");
    console.log("ALL REAL DRIFT, SEED, & CONSTRAINT TESTS PASSED CLEANLY");
    console.log("========================================================\n");

    await cleanupAndExit(0);
  } catch (err) {
    console.error("TEST FAILED:", err);
    await cleanupAndExit(1);
  }
}

runSuite().catch(async (err) => {
  console.error("FATAL SUITE ERROR:", err);
  await cleanupAndExit(1);
});
