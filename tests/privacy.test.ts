import assert from "assert";
import { hashIp } from "../src/lib/privacy";

console.log("=== RUNNING IP HASHING PRIVACY TESTS ===\n");

const ip1 = "192.168.1.1";
const ip2 = "192.168.1.2";
const validSecret = "super-secret-test-salt-32-chars-long!";

// Test 1: Length & format
console.log("TEST 1: Length & format (SHA-256 hex is 64 characters)");
const hash1 = hashIp(ip1, validSecret);
const hash2 = hashIp(ip2, validSecret);
const hash1Again = hashIp(ip1, validSecret);
assert.strictEqual(hash1.length, 64, "Hash must be 64 characters (SHA-256 hex)");
assert.ok(/^[0-9a-f]{64}$/.test(hash1), "Hash must be hexadecimal");
console.log("  ✓ PASSED");

// Test 2: Determinism
console.log("TEST 2: Determinism (identical IP and secret produce identical hash)");
assert.strictEqual(hash1, hash1Again, "Hashing must be deterministic for identical IP and secret");
console.log("  ✓ PASSED");

// Test 3: Differentiation
console.log("TEST 3: Differentiation (different IPs produce different hashes)");
assert.notStrictEqual(hash1, hash2, "Different IPs must produce different hashes");
console.log("  ✓ PASSED");

// Test 4: Secret sensitivity
console.log("TEST 4: Secret sensitivity (changing secret produces different hash)");
const hashDifferentSecret = hashIp(ip1, "another-secret-salt-key-here-12345");
assert.notStrictEqual(hash1, hashDifferentSecret, "Changing the secret must change the hash");
console.log("  ✓ PASSED");

// Test 5: Raw IP not recoverable in plaintext
console.log("TEST 5: Raw IP exclusion (hash does not contain raw IP)");
assert.strictEqual(hash1.includes(ip1), false, "Hash must not contain the raw IP");
console.log("  ✓ PASSED");

// Test 6: Missing secret throws
console.log("TEST 6: Missing secret rejection (throws if secret is undefined/empty)");
const savedEnv = process.env.IP_HASH_SECRET;
delete process.env.IP_HASH_SECRET;
assert.throws(
  () => hashIp(ip1),
  /IP_HASH_SECRET is missing, under 32 characters, or using placeholder/,
  "Must throw if secret is missing"
);
console.log("  ✓ PASSED");

// Test 7: Short secret (< 32 chars) throws
console.log("TEST 7: Short secret rejection (throws if secret is under 32 characters)");
assert.throws(
  () => hashIp(ip1, "too-short-key"),
  /IP_HASH_SECRET is missing, under 32 characters, or using placeholder/,
  "Must throw if secret is under 32 chars"
);
console.log("  ✓ PASSED");

// Test 8: Placeholder secret ("replace-with...") throws
console.log("TEST 8: Placeholder secret rejection (throws if secret begins with 'replace-with')");
assert.throws(
  () => hashIp(ip1, "replace-with-secure-random-secret-for-ip-hashing"),
  /IP_HASH_SECRET is missing, under 32 characters, or using placeholder/,
  "Must throw if secret begins with replace-with"
);
console.log("  ✓ PASSED");

if (savedEnv) {
  process.env.IP_HASH_SECRET = savedEnv;
}

console.log("\n✓ All 8 IP hashing privacy tests PASSED cleanly.\n");
