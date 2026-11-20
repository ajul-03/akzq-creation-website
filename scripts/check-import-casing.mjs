import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const tracked = new Set(
  execSync("git ls-files", { encoding: "utf8" })
    .trim()
    .split("\n")
    .map((p) => p.trim().replace(/\r$/, ""))
);

let checked = 0;
let errors = 0;

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
        checked++;
      } else {
        console.error(`Case or path mismatch in ${file}: "${imp}" -> "${resolved}" not found in git ls-files`);
        errors++;
      }
    }
  }
}

console.log(`\nImport casing check complete: ${checked} relative/alias imports checked against git ls-files. Mismatches: ${errors}.`);
if (errors > 0) {
  process.exit(1);
}
