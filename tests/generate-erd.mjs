import fs from "fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");

const modelRegex = /model\s+(\w+)\s+\{([\s\S]*?)\}/g;
let match;
const models = [];
const modelNames = new Set();

// First pass: collect model names
while ((match = modelRegex.exec(schema)) !== null) {
  modelNames.add(match[1]);
}

// Second pass: parse fields and relations
modelRegex.lastIndex = 0;
const relations = [];

while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1];
  const body = match[2];
  const fields = [];
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("@@"));

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const fieldName = parts[0];
      const fieldType = parts[1];
      const cleanType = fieldType.replace("?", "").replace("[]", "");

      if (modelNames.has(cleanType)) {
        // Relation field
        const isList = fieldType.includes("[]");
        const isOptional = fieldType.includes("?");
        const relMatch = line.match(/@relation\(([^)]+)\)/);
        let relationName = "";
        let fieldsRef = "";
        let referencesRef = "";
        if (relMatch) {
          const content = relMatch[1];
          const nameM = content.match(/"([^"]+)"/);
          if (nameM) relationName = nameM[1];
          const fM = content.match(/fields:\s*\[([^\]]+)\]/);
          if (fM) fieldsRef = fM[1].trim();
          const rM = content.match(/references:\s*\[([^\]]+)\]/);
          if (rM) referencesRef = rM[1].trim();
        }
        if (fieldsRef) {
          // This side owns the FK
          relations.push({
            from: modelName,
            to: cleanType,
            fkField: fieldsRef,
            label: fieldName,
            isOptional,
          });
        }
      } else {
        // Scalar field
        const isPk = line.includes("@id");
        const isUnique = line.includes("@unique");
        let modifier = "";
        if (isPk) modifier = "PK";
        else if (isUnique) modifier = "UK";
        fields.push({ name: fieldName, type: cleanType, modifier });
      }
    }
  }
  models.push({ name: modelName, fields });
}

console.log("erDiagram");
for (const m of models) {
  console.log(`  ${m.name} {`);
  for (const f of m.fields) {
    console.log(`    ${f.type} ${f.name}${f.modifier ? " " + f.modifier : ""}`);
  }
  console.log("  }");
}

// Generate relationships based on parsed FK definitions
for (const r of relations) {
  const leftCard = "}o";
  const rightCard = r.isOptional ? "o|" : "||";
  console.log(`  ${r.to} ${rightCard}--${leftCard} ${r.from} : "${r.label}"`);
}
