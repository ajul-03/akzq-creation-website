import crypto from "crypto";

/**
 * Hash IP addresses using HMAC-SHA256 with IP_HASH_SECRET.
 * Never stores raw IP addresses in the database.
 */
export function hashIp(ip: string, secret?: string): string {
  const hmacSecret =
    secret || process.env.IP_HASH_SECRET || "default-secret-salt-change-in-prod";
  return crypto.createHmac("sha256", hmacSecret).update(ip.trim()).digest("hex");
}
