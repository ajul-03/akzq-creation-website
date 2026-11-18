import assert from 'assert';
import { hashIp } from '../src/lib/privacy';

console.log('=== RUNNING IP HASHING PRIVACY TESTS ===\n');

const ip1 = '192.168.1.1';
const ip2 = '192.168.1.2';
const secret = 'super-secret-test-salt-32-chars-long!';

const hash1 = hashIp(ip1, secret);
const hash2 = hashIp(ip2, secret);
const hash1Again = hashIp(ip1, secret);

// 1. Length & format: SHA-256 hex is 64 characters
assert.strictEqual(hash1.length, 64, 'Hash must be 64 characters (SHA-256 hex)');
assert(/^[0-9a-f]{64}$/.test(hash1), 'Hash must be hexadecimal');

// 2. Determinism: same IP + same secret = same hash
assert.strictEqual(hash1, hash1Again, 'Hashing must be deterministic for identical IP and secret');

// 3. Differentiation: different IPs = different hashes
assert.notStrictEqual(hash1, hash2, 'Different IPs must produce different hashes');

// 4. Secret sensitivity: different secrets = different hashes
const hashDifferentSecret = hashIp(ip1, 'another-secret-salt-key-here-12345');
assert.notStrictEqual(hash1, hashDifferentSecret, 'Changing the secret must change the hash');

// 5. Raw IP not recoverable in plaintext
assert.strictEqual(hash1.includes(ip1), false, 'Hash must not contain the raw IP');

console.log('✓ All 5 IP hashing privacy assertions PASSED.');
