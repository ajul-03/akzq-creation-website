import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const pages = [
  { name: 'home', staticUrl: 'http://localhost:8080/index.html', nextUrl: 'http://localhost:3000/' },
  { name: 'services', staticUrl: 'http://localhost:8080/services.html', nextUrl: 'http://localhost:3000/services' },
  { name: 'contact', staticUrl: 'http://localhost:8080/contact.html', nextUrl: 'http://localhost:3000/contact' },
  { name: 'blog', staticUrl: 'http://localhost:8080/blog.html', nextUrl: 'http://localhost:3000/blog' },
];

function calculateStats(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const spread = max - min;
  return { median, min, max, spread };
}

async function main() {
  console.log('Starting static server (8080) and Next.js production server (3000)...');
  const staticServer = spawn('python', ['-m', 'http.server', '8080'], { stdio: 'ignore' });
  const nextServer = spawn('cmd.exe', ['/c', 'npx next start -p 3000'], { stdio: 'ignore' });

  // Wait for servers to be ready
  await new Promise((r) => setTimeout(r, 4000));

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const RUNS = 5;
  const summaryResults = [];

  try {
    for (const page of pages) {
      for (const formFactor of ['mobile', 'desktop']) {
        console.log(`\nAuditing ${page.name} (${formFactor}) - 5 runs each...`);

        const staticRuns = [];
        const nextRuns = [];

        const lhConfig = {
          port: chrome.port,
          output: 'json',
          onlyCategories: ['performance'],
          formFactor: formFactor,
          throttlingMethod: 'provided',
          screenEmulation: {
            disabled: formFactor === 'desktop',
          },
        };

        for (let r = 1; r <= RUNS; r++) {
          process.stdout.write(`  [${r}/${RUNS}] `);

          // Run Static
          const sRes = await lighthouse(page.staticUrl, lhConfig);
          const sAudits = sRes.lhr.audits;
          const sPerf = Math.round((sRes.lhr.categories.performance?.score || 0) * 100);
          const sLcp = sAudits['largest-contentful-paint']?.numericValue || 0;
          const sTbt = sAudits['total-blocking-time']?.numericValue || 0;
          const sCls = sAudits['cumulative-layout-shift']?.numericValue || 0;
          staticRuns.push({ perf: sPerf, lcp: sLcp, tbt: sTbt, cls: sCls });

          // Run Next.js
          const nRes = await lighthouse(page.nextUrl, lhConfig);
          const nAudits = nRes.lhr.audits;
          const nPerf = Math.round((nRes.lhr.categories.performance?.score || 0) * 100);
          const nLcp = nAudits['largest-contentful-paint']?.numericValue || 0;
          const nTbt = nAudits['total-blocking-time']?.numericValue || 0;
          const nCls = nAudits['cumulative-layout-shift']?.numericValue || 0;
          nextRuns.push({ perf: nPerf, lcp: nLcp, tbt: nTbt, cls: nCls });

          console.log(`Static: ${sPerf} (${Math.round(sLcp)}ms) | Next: ${nPerf} (${Math.round(nLcp)}ms)`);
        }

        const staticScoreStats = calculateStats(staticRuns.map((r) => r.perf));
        const nextScoreStats = calculateStats(nextRuns.map((r) => r.perf));
        const staticLcpStats = calculateStats(staticRuns.map((r) => r.lcp));
        const nextLcpStats = calculateStats(nextRuns.map((r) => r.lcp));
        const staticTbtStats = calculateStats(staticRuns.map((r) => r.tbt));
        const nextTbtStats = calculateStats(nextRuns.map((r) => r.tbt));
        const staticClsStats = calculateStats(staticRuns.map((r) => r.cls));
        const nextClsStats = calculateStats(nextRuns.map((r) => r.cls));

        summaryResults.push({
          page: page.name,
          formFactor,
          runs: RUNS,
          staticScore: `${staticScoreStats.median} [${staticScoreStats.min}-${staticScoreStats.max}]`,
          nextScore: `${nextScoreStats.median} [${nextScoreStats.min}-${nextScoreStats.max}]`,
          staticLcpMedian: `${Math.round(staticLcpStats.median)} ms (spread ±${Math.round(staticLcpStats.spread)}ms)`,
          nextLcpMedian: `${Math.round(nextLcpStats.median)} ms (spread ±${Math.round(nextLcpStats.spread)}ms)`,
          staticTbtMedian: `${Math.round(staticTbtStats.median)} ms`,
          nextTbtMedian: `${Math.round(nextTbtStats.median)} ms`,
          staticClsMedian: Number(staticClsStats.median.toFixed(3)),
          nextClsMedian: Number(nextClsStats.median.toFixed(3)),
        });
      }
    }

    console.log('\n=== 5-RUN BENCHMARK SUMMARY TABLE ===');
    console.table(summaryResults);

    const outDir = path.resolve('docs/nextjs-lighthouse');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'multi-run-benchmark.json'), JSON.stringify(summaryResults, null, 2));
  } finally {
    await chrome.kill();
    staticServer.kill('SIGTERM');
    nextServer.kill('SIGTERM');
  }
}

main().catch(console.error);
