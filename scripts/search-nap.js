const fs = require('fs');
const path = require('path');

function walk(dir, fileList) {
  fileList = fileList || [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'package-lock.json') continue;
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

const allFiles = walk('.');
const results = [];

const pattern = /(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|wa\.me\/[0-9]+|tel:[0-9+]+|\b670\d{3}\b|\b97455\b|\b75101\b/g;

for (const file of allFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      let match;
      const r = new RegExp(pattern);
      while ((match = r.exec(line)) !== null) {
        results.push({
          file: file.replace(/\\/g, '/'),
          line: idx + 1,
          match: match[0],
          text: line.trim()
        });
      }
    });
  } catch (e) {}
}

console.log(JSON.stringify(results, null, 2));
