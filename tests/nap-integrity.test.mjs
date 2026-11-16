import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const targets = [...walk('src'), ...walk('public')];
const failures = [];

const allowedPhoneDigits = '7510109730';
const allowedPostalCode = '670675';

// Phone regex: matches 10-digit Indian numbers, tel:, wa.me/
const phoneRegex = /\b(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})\b|tel:([^\s"'<>]+)|wa\.me\/([0-9]+)/g;

// Postal code regex: matches 6-digit PIN codes (Kerala PINs start with 67, 68, 69)
const postalRegex = /\b(6[7-9]\d{4})\b/g;

for (const filePath of targets) {
  // Skip binary/image files
  if (/\.(png|jpg|jpeg|gif|ico|webp|svg|woff|woff2|ttf|eot)$/i.test(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check phone numbers
    let pMatch;
    const pRegex = new RegExp(phoneRegex);
    while ((pMatch = pRegex.exec(line)) !== null) {
      const raw = pMatch[0];
      const digits = raw.replace(/\D/g, '');
      const last10 = digits.slice(-10);

      // Verify digits end in 7510109730
      if (last10 && last10 !== allowedPhoneDigits) {
        failures.push({
          type: 'INVALID_PHONE',
          file: filePath.replace(/\\/g, '/'),
          line: lineNum,
          found: raw,
          expected: allowedPhoneDigits,
          snippet: line.trim(),
        });
      }
    }

    // Check postal codes
    let postMatch;
    const postR = new RegExp(postalRegex);
    while ((postMatch = postR.exec(line)) !== null) {
      const code = postMatch[1];
      if (code !== allowedPostalCode) {
        failures.push({
          type: 'INVALID_POSTAL_CODE',
          file: filePath.replace(/\\/g, '/'),
          line: lineNum,
          found: code,
          expected: allowedPostalCode,
          snippet: line.trim(),
        });
      }
    }
  });
}

console.log('=== NAP INTEGRITY AUDIT REPORT (src/ & public/) ===');
console.log(`Scanned ${targets.length} files across src/ and public/.`);

if (failures.length === 0) {
  console.log(`RESULT: PASS — Zero invalid phone numbers or postal codes found.`);
  console.log(`All phone references resolve strictly to +91 75101 09730.`);
  console.log(`All postal codes resolve strictly to 670675.`);
  process.exit(0);
} else {
  console.error(`RESULT: FAIL — Found ${failures.length} non-compliant NAP entries:`);
  console.table(failures);
  process.exit(1);
}
