# Deployment Environment & Lead Capture Configuration Guide

This document details the environment configuration, data layer setup, and security guarantees for deploying the migrated Next.js application (Phase F3: Lead Capture).

---

## 1. Required Environment Variables

Configure these environment variables in your deployment platform (Vercel, AWS Amplify, Docker, or Node.js server):

| Variable | Required | Description | Example / Format |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Neon pooled Postgres connection string with SSL | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | **Yes** | Neon direct (non-pooled) connection string for migrations | `postgresql://user:pass@ep-direct.neon.tech/neondb?sslmode=require` |
| `IP_HASH_SECRET` | **Yes** | High-entropy secret key for HMAC-SHA256 IP hashing (min 32 chars) | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical public site URL (used for CORS and canonical tags) | `https://akzqcreation.com` |
| `RESEND_API_KEY` | Optional | API key for Resend email notifications (default: disabled) | `re_123456789...` |
| `NOTIFY_EMAIL` | Optional | Recipient email address for new lead notifications | `hello@akzqcreation.com` |
| `RESEND_FROM_EMAIL`| Optional | Verified sending email address on Resend | `leads@akzqcreation.com` |

> [!IMPORTANT]
> The build process (`next build`) is completely decoupled from database availability. `DATABASE_URL` does NOT need to be accessible during CI/CD build steps. All 15 marketing and service pages are statically prerendered (`○`), and `/api/leads` is compiled as an on-demand server-rendered route (`ƒ`).

---

## 2. Security & Privacy Guarantees

1. **Zero Raw IP Storage**:
   - Client IP addresses are never written to the database.
   - All IPs are converted using `crypto.createHmac("sha256", IP_HASH_SECRET).update(ip).digest("hex")`.
   - Salt/Secret rotation invalidates old hashes without exposing visitor identities.

2. **Zero PII in Audit Logs**:
   - `ActivityLog` captures actions such as `lead.created` and `lead.notify_failed`.
   - The `metadata` payload strictly logs operational flags (`source`, `hasPhone`, `budgetRange`) and strictly excludes personal data (no names, emails, phone numbers, or freeform messages).

3. **Rate Limiting & Abuse Defense**:
   - **Origin Verification**: Only requests from `NEXT_PUBLIC_SITE_URL` (or localhost in dev) are accepted (403 for external origins).
   - **Content-Type Enforcement**: Only `application/json` is accepted (415 otherwise).
   - **Payload Ceiling**: Max body size is capped at 10KB (413 otherwise).
   - **Rate Limit**: Max 5 submissions per hour, max 20 per day per `ipHash` (429 with `Retry-After: 3600`).
   - **Honeypot Trap**: Off-screen hidden field `hp_field` silently traps bot traffic (201 `ack` without inserting).
   - **Sub-2-Second Trap**: Submissions faster than 2000ms (`elapsedMs`) silently return 201 `ack` without inserting.
   - **Deduplication**: Identical submissions (same email + same message) within a 10-minute window silently return the existing lead ID without inserting duplicates.

4. **HTTP Route Protection**:
   - No `GET` handler exists on `/api/leads` (leads cannot be queried over HTTP; returns 405).
   - Responses are always marked `Cache-Control: no-store`.

---

## 3. Database Migration & Deployment Workflow

1. **Deploy Migrations to Target Database**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Initial Reference Data (Idempotent)**:
   ```bash
   npm run db:seed
   ```

3. **Inspect Leads Securely via CLI**:
   ```bash
   npm run leads:list
   ```

4. **Run Health & Parity Suite**:
   ```bash
   npm run test:leads
   node tests/text-parity-diff.mjs
   node tests/parity-test.mjs
   ```
