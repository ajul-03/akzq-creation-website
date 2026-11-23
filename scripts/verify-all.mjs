import { spawn, execSync } from "node:child_process";
import fs from "node:fs";

const steps = [
  { name: "casing", cmd: "node", args: ["scripts/check-import-casing.mjs"] },
  {
    name: "build",
    cmd: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "build"],
    env: { DATABASE_URL: "", DIRECT_URL: "", TEST_DATABASE_URL: "" },
  },
  { name: "text-parity", cmd: "node", args: ["tests/text-parity-diff.mjs"] },
  { name: "location-isolation", cmd: "node", args: ["tests/location-isolation.test.mjs"] },
  { name: "nap", cmd: "node", args: ["tests/nap-integrity.test.mjs"] },
  { name: "csp", cmd: "node", args: ["tests/check-csp.mjs"] },
  { name: "parity-test", cmd: "node", args: ["tests/parity-test.mjs"] },
  { name: "privacy", cmd: process.platform === "win32" ? "npx.cmd" : "npx", args: ["tsx", "tests/privacy.test.ts"] },
  {
    name: "db.test",
    cmd: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["tsx", "tests/db.test.ts"],
    timeoutMs: 5 * 60 * 1000, // 5 min
  },
  {
    name: "leads-api",
    cmd: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["tsx", "tests/leads-api.test.ts"],
    timeoutMs: 10 * 60 * 1000, // 10 min
  },
  {
    name: "browser",
    cmd: "node",
    args: ["tests/contact-form-browser.test.mjs"],
    timeoutMs: 5 * 60 * 1000, // 5 min
  },
];

function runStep(step, env) {
  return new Promise((resolve) => {
    const child = spawn(step.cmd, step.args, {
      stdio: "inherit",
      env,
      shell: true,
    });

    let timedOut = false;
    let timer = null;
    if (step.timeoutMs) {
      timer = setTimeout(() => {
        timedOut = true;
        console.error(`\n❌ [STEP TIMEOUT: ${step.name}] Exceeded ${step.timeoutMs / 1000}s watchdog limit!`);
        console.error(`Currently running command: ${step.cmd} ${step.args.join(" ")} (PID: ${child.pid})`);
        if (child.pid) {
          try {
            if (process.platform === "win32") {
              execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: "ignore" });
            } else {
              child.kill("SIGKILL");
            }
          } catch {}
        }
      }, step.timeoutMs);
      timer.unref();
    }

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        resolve(1);
      } else {
        resolve(code ?? 0);
      }
    });

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      console.error(`Step error:`, err);
      resolve(1);
    });
  });
}

const results = [];
let hasFailed = false;

console.log("=== RUNNING FULL VERIFICATION PIPELINE (npm run verify) ===\n");

async function main() {
  for (const step of steps) {
    const watchdogLabel = step.timeoutMs ? ` [Watchdog: ${step.timeoutMs / 60000}m]` : "";
    console.log(`\n>>> [STEP: ${step.name}] Running: ${step.cmd} ${step.args.join(" ")}${watchdogLabel}`);
    let movedEnv = false;
    if (step.name === "build" && fs.existsSync(".env")) {
      fs.renameSync(".env", ".env.verify_tmp");
      movedEnv = true;
    }

    try {
      const env = { ...process.env, ...(step.env || {}) };
      if (step.name === "build") {
        delete env.DATABASE_URL;
        delete env.DIRECT_URL;
        delete env.TEST_DATABASE_URL;
      }

      const code = await runStep(step, env);
      results.push(`${step.name}=${code}`);
      if (code !== 0) {
        hasFailed = true;
        console.error(`\n❌ [STEP FAILED: ${step.name}] exited with code ${code}\n`);
        break;
      }
    } finally {
      if (movedEnv && fs.existsSync(".env.verify_tmp")) {
        fs.renameSync(".env.verify_tmp", ".env");
      }
    }
  }

  console.log("\n========================================================");
  console.log(`SUMMARY: ${results.join(", ")} (${hasFailed ? "FAILED" : "ALL PASSED"})`);
  console.log("========================================================\n");

  if (hasFailed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification pipeline error:", err);
  process.exit(1);
});
