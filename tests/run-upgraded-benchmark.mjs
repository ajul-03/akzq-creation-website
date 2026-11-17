import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { spawn } from 'child_process';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

// 1. Create a compressed static HTTP server for the baseline
function startCompressedStaticServer(port = 8080) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(process.cwd(), reqPath.replace(/^\//, ''));

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      return res.end('Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const rawData = fs.readFileSync(filePath);

    if (/\bgzip\b/.test(acceptEncoding)) {
      zlib.gzip(rawData, (err, gzipped) => {
        if (err) {
          res.writeHead(500);
          return res.end('Server Error');
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Encoding': 'gzip',
          'Vary': 'Accept-Encoding',
        });
        res.end(gzipped);
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(rawData);
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Compressed baseline static server listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}

function calculateStats(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const spread = max - min;
  return { median, min, max, spread };
}

const pages = [
  { name: 'home', staticUrl: 'http://localhost:8080/index.html', nextUrl: 'http://localhost:3000/' },
  { name: 'services', staticUrl: 'http://localhost:8080/services.html', nextUrl: 'http://localhost:3000/services' },
  { name: 'contact', staticUrl: 'http://localhost:8080/contact.html', nextUrl: 'http://localhost:3000/contact' },
  { name: 'blog', staticUrl: 'http://localhost:8080/blog.html', nextUrl: 'http://localhost:3000/blog' },
];

async function main() {
  console.log('Starting compressed baseline server (8080) and Next.js 16 production server (3000)...');
  const staticServer = await startCompressedStaticServer(8080);
  const nextServer = spawn('cmd.exe', ['/c', 'npx next start -p 3000'], { stdio: 'ignore' });

  // Wait for servers to be warm and ready
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

          // Run Baseline
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

        // Evaluate whether improvement exceeds the spread
        // Difference in medians:
        const lcpDelta = staticLcpStats.median - nextLcpStats.median;
        const maxSpread = Math.max(staticLcpStats.spread, nextLcpStats.spread);
        const lcpImprovementClaimable = lcpDelta > maxSpread;

        summaryResults.push({
          page: page.name,
          formFactor,
          runs: RUNS,
          staticScore: `${staticScoreStats.median} [${staticScoreStats.min}-${staticScoreStats.max}]`,
          nextScore: `${nextScoreStats.median} [${nextScoreStats.min}-${nextScoreStats.max}]`,
          staticLcpMedian: `${Math.round(staticLcpStats.median)} ms (spread ±${Math.round(staticLcpStats.spread)}ms)`,
          nextLcpMedian: `${Math.round(nextLcpStats.median)} ms (spread ±${Math.round(nextLcpStats.spread)}ms)`,
          lcpDelta: `${Math.round(lcpDelta)} ms`,
          maxSpread: `±${Math.round(maxSpread)} ms`,
          improvementExceedsSpread: lcpImprovementClaimable,
          staticTbtMedian: `${Math.round(staticTbtStats.median)} ms`,
          nextTbtMedian: `${Math.round(nextTbtStats.median)} ms`,
          staticClsMedian: Number(staticClsStats.median.toFixed(3)),
          nextClsMedian: Number(nextClsStats.median.toFixed(3)),
        });
      }
    }

    console.log('\n=== UPGRADED 5-RUN BENCHMARK SUMMARY TABLE ===');
    console.table(summaryResults);

    const outDir = path.resolve('docs/nextjs-lighthouse');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'upgraded-benchmark.json'), JSON.stringify(summaryResults, null, 2));
  } finally {
    await chrome.kill();
    staticServer.close();
    nextServer.kill('SIGTERM');
  }
}

main().catch(console.error);
