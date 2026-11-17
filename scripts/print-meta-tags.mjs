import fs from 'fs';

const pages = [
  { name: 'Home (/)', file: '.next/server/app/index.html' },
  { name: 'Kannur (/kannur)', file: '.next/server/app/kannur.html' },
  { name: 'Thalassery (/thalassery)', file: '.next/server/app/thalassery.html' },
];

console.log('=== RAW OG:IMAGE, TWITTER:IMAGE, AND CANONICAL TAGS ===\n');

for (const p of pages) {
  const html = fs.readFileSync(p.file, 'utf8');
  
  const ogImg = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"[^>]*>/i) ||
                html.match(/<meta\s+content="([^"]*)"\s+property="og:image"[^>]*>/i);
  const twImg = html.match(/<meta\s+name="twitter:image"\s+content="([^"]*)"[^>]*>/i) ||
                html.match(/<meta\s+content="([^"]*)"\s+name="twitter:image"[^>]*>/i);
  const canon = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"[^>]*>/i) ||
                html.match(/<link\s+href="([^"]*)"\s+rel="canonical"[^>]*>/i);

  console.log(`Page: ${p.name}`);
  console.log('  Canonical:     ', canon ? canon[0] : 'NOT FOUND');
  console.log('  og:image:      ', ogImg ? ogImg[0] : 'NOT FOUND');
  console.log('  twitter:image: ', twImg ? twImg[0] : 'NOT FOUND');
  console.log('');
}
