import crypto from "crypto";

/**
 * Hash IP addresses using HMAC-SHA256 with IP_HASH_SECRET.
 * Never stores raw IP addresses in the database.
 * Requires a minimum 32-character secret; throws if missing or too short.
 */
export function hashIp(ip: string, secret?: string): string {
  const hmacSecret = secret || process.env.IP_HASH_SECRET;
  if (!hmacSecret || hmacSecret.length < 32 || hmacSecret.startsWith("replace-with")) {
    throw new Error("IP_HASH_SECRET is missing, under 32 characters, or using placeholder");
  }
  return crypto.createHmac("sha256", hmacSecret).update(ip.trim()).digest("hex");
}
