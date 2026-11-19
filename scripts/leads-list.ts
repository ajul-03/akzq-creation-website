import fs from "fs";
import path from "path";

// Ensure local .env is parsed if running outside Next.js
if (!process.env.DATABASE_URL && fs.existsSync(path.resolve(".env"))) {
  const envContent = fs.readFileSync(path.resolve(".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

import { db } from "../src/lib/db";

async function main() {
  const leads = await db.lead.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      service: {
        select: { title: true, slug: true },
      },
    },
  });

  if (leads.length === 0) {
    console.log("No leads found in database.");
    return;
  }

  console.log(`=== LATEST ${leads.length} LEADS ===\n`);
  const formatted = leads.map((l) => ({
    ID: l.id,
    Created: l.createdAt.toISOString().slice(0, 19).replace("T", " "),
    Name: l.name,
    Email: l.email,
    Phone: l.phone || "-",
    Company: l.company || "-",
    Service: l.service?.title || l.serviceInterest || "-",
    Budget: l.budgetRange,
    Status: l.status,
  }));
  console.table(formatted);
}

main()
  .catch((e) => {
    console.error("Error listing leads:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
