const fs = require('fs');
const path = require('path');

function walk(dir) {
  let fileList = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', '.next', '.git', 'package-lock.json'].includes(file)) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fileList = fileList.concat(walk(filePath));
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = walk('.');
const occurrences = [];

// Match any 6-digit postal code or phone numbers or tel: or wa.me/
const postalRegex = /\b670\d{3}\b/g;
const phoneRegex = /\b\+?91[\s-]?[6-9]\d{4}[\s-]?\d{5}\b|\b[6-9]\d{4}[\s-]?\d{5}\b|tel:[^\s"'<>]+|wa\.me\/[0-9]+/g;

for (const file of allFiles) {
  // Skip huge JSON files in docs except summary JSONs
  if (file.includes('docs') && file.endsWith('.json') && !file.includes('summary') && !file.includes('comparison') && !file.includes('benchmark')) continue;
  try {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      let m;
      const pR = new RegExp(postalRegex);
      while ((m = pR.exec(line)) !== null) {
        occurrences.push({ type: 'POSTAL_CODE', value: m[0], file: file.replace(/\\/g, '/'), line: idx + 1, snippet: line.trim() });
      }
      const phR = new RegExp(phoneRegex);
      while ((m = phR.exec(line)) !== null) {
        occurrences.push({ type: 'PHONE', value: m[0], file: file.replace(/\\/g, '/'), line: idx + 1, snippet: line.trim() });
      }
    });
  } catch (e) {}
}

console.log('Total occurrences:', occurrences.length);
occurrences.forEach(o => {
  console.log(`[${o.type}] ${o.file}:${o.line} | ${o.value} | ${o.snippet.substring(0, 100)}`);
});
