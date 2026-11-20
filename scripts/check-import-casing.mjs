import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const tracked = new Set(
  execSync("git ls-files", { encoding: "utf8" })
    .trim()
    .split("\n")
    .map((p) => p.trim().replace(/\r$/, ""))
);

let checkedImports = 0;
let checkedAssets = 0;
let errors = 0;

console.log("=== CHECKING IMPORT & ASSET CASING AGAINST GIT LS-FILES ===\n");

console.log("--- 1. Relative and Aliased Imports ---");
for (const file of tracked) {
  if (
    !file.endsWith(".ts") &&
    !file.endsWith(".tsx") &&
    !file.endsWith(".js") &&
    !file.endsWith(".mjs")
  ) {
    continue;
  }

  const content = fs.readFileSync(file, "utf8");
  const importRegex = /(?:from\s+['"]|import\s*\(?['"])([\.\/@\w\d_-]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const imp = match[1];
    let resolved = null;

    if (imp.startsWith(".")) {
      const dir = path.dirname(file);
      resolved = path.normalize(path.join(dir, imp)).replace(/\\/g, "/");
    } else if (imp.startsWith("@/")) {
      resolved = "src/" + imp.slice(2);
    }

    if (resolved) {
      const candidates = [
        resolved,
        resolved + ".ts",
        resolved + ".tsx",
        resolved + ".js",
        resolved + ".mjs",
        resolved + "/index.ts",
        resolved + "/index.tsx",
      ];
      const found = candidates.find((c) => tracked.has(c));
      if (found) {
        checkedImports++;
        console.log(`[OK IMPORT] ${file} -> "${imp}" resolved to: ${found}`);
      } else {
        console.error(`[FAIL IMPORT] Case or path mismatch in ${file}: "${imp}" -> "${resolved}" not found in git ls-files`);
        errors++;
      }
    }
  }
}

console.log("\n--- 2. Static Asset References (/assets/...) ---");
const assetRegex = /(?:src=["']|href=["']|url\(["']?|["'])(\/?assets\/[a-zA-Z0-9_\-\./]+)/g;

for (const file of tracked) {
  if (
    !file.endsWith(".ts") &&
    !file.endsWith(".tsx") &&
    !file.endsWith(".js") &&
    !file.endsWith(".mjs") &&
    !file.endsWith(".html") &&
    !file.endsWith(".css")
  ) {
    continue;
  }

  const content = fs.readFileSync(file, "utf8");
  let match;

  while ((match = assetRegex.exec(content)) !== null) {
    let rawAsset = match[1].replace(/["')]/g, "");
    if (rawAsset.startsWith("/")) rawAsset = rawAsset.slice(1);

    // Skip generic directory references
    if (rawAsset.endsWith("/")) continue;

    // Assets in public/assets/...
    const candidatePath = "public/" + rawAsset;
    if (tracked.has(candidatePath)) {
      checkedAssets++;
      console.log(`[OK ASSET]  ${file} -> "${match[1]}" resolved to: ${candidatePath}`);
    } else {
      console.error(`[FAIL ASSET] Asset casing or path mismatch in ${file}: "${match[1]}" -> "${candidatePath}" not found in git ls-files`);
      errors++;
    }
  }
}

console.log(`\nImport & Asset casing check complete:`);
console.log(`- ${checkedImports} code imports verified`);
console.log(`- ${checkedAssets} asset references verified`);
console.log(`- Total Mismatches: ${errors}`);

if (errors > 0) {
  process.exit(1);
}
