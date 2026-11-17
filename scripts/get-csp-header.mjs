import { spawn } from 'child_process';
import http from 'http';

function waitForServer(port = 3000, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => resolve(res));
      req.on('error', (err) => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Server did not start on port ${port} within ${timeout}ms: ${err.message}`));
        } else {
          setTimeout(ping, 500);
        }
      });
    }
    ping();
  });
}

async function main() {
  const server = spawn('cmd.exe', ['/c', 'npx next start -H 127.0.0.1 -p 3000'], {
    stdio: 'ignore',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  try {
    const res = await waitForServer(3000);
    console.log('HTTP Status:', res.statusCode);
    console.log('Content-Security-Policy:');
    console.log(res.headers['content-security-policy']);
    console.log('\nAll Headers:');
    console.log(JSON.stringify(res.headers, null, 2));
  } finally {
    if (server.pid) {
      try {
        spawn('cmd.exe', ['/c', `taskkill /pid ${server.pid} /f /t`], { stdio: 'ignore' });
      } catch (e) {
        server.kill('SIGTERM');
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
