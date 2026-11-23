# Deployment Environment & Lead Capture Configuration Guide

This document details the environment configuration, data layer setup, and security guarantees for deploying the migrated Next.js application (Phase F3: Lead Capture).

---

## 1. Required Environment Variables

Configure these environment variables in your deployment platform (Vercel, AWS Amplify, Docker, or Node.js server):

| Variable | Required | Description | Example / Format |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Neon pooled Postgres connection string with SSL (used by Prisma Client runtime) | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | **Yes** | Neon direct (non-pooled) connection string (MUST be used for migrations and schema operations) | `postgresql://user:pass@ep-direct.neon.tech/neondb?sslmode=require` |
| `IP_HASH_SECRET` | **Yes** | High-entropy secret key for privacy-minded design (IP hashing); legal review of the notice and retention is the owner's responsibility (MUST be at least 32 characters) | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical public site URL (used for CORS and canonical tags) | `https://akzqcreation.com` |
| `ALLOWED_ORIGINS` | Optional | Comma-separated list of additional allowed origins for `/api/leads`. Note: `www` subdomain should redirect to apex (`https://akzqcreation.com`) at DNS/host level; preview deployments are not allowed by default unless explicitly listed here | `https://preview.example.com` |
| `RESEND_API_KEY` | Optional | API key for Resend email notifications (default: disabled if unset) | `re_123456789...` |
| `LEAD_NOTIFICATION_TO` | Optional | Recipient email address for new lead notifications (must be set alongside `RESEND_API_KEY` and `LEAD_NOTIFICATION_FROM` to enable email alerts) | `you@example.com` |
| `LEAD_NOTIFICATION_FROM` | Optional | Verified sending email address on Resend (must use a verified domain) | `leads@example.com` |
| `RESEND_BASE_URL` | Optional | Custom base URL for Resend API (default: https://api.resend.com, useful for mock servers or proxying) | `https://api.resend.com` |

> [!IMPORTANT]
> - **Build Decoupling**: The build process (`next build`) is completely decoupled from database availability. `DATABASE_URL` does NOT need to be accessible during CI/CD build steps. All 15 marketing and service pages are statically prerendered (`○`), and `/api/leads` is compiled as an on-demand server-rendered route (`ƒ`).
> - **Unpooled Migration Requirement**: Prisma migrations (`npx prisma migrate deploy`) and seeding must strictly connect via `DIRECT_URL` (direct unpooled Postgres endpoint). Connection poolers (such as PgBouncer) do not support the session-level advisory locks required by Prisma migration deployment.

---

## 2. Security & Abuse Defense Guarantees

1. **Zero Raw IP Storage (privacy-minded design (IP hashing); legal review of the notice and retention is the owner's responsibility)**:
   - Client IP addresses are never written to the database.
   - All IPs are hashed using `crypto.createHmac("sha256", IP_HASH_SECRET).update(ip).digest("hex")`.
   - The route strictly enforces that `IP_HASH_SECRET` is set and at least 32 characters, and does not start with `"replace-with"`; if invalid, it aborts with HTTP 503 and never hashes with an empty or insecure key.
   - For clients where no IP header is present, submissions are grouped into a shared `"unknown"` bucket with a stricter rate limit (max 2/hour, max 5/day).

2. **Zero PII in Audit Logs**:
   - `ActivityLog` captures actions such as `lead.created` and `lead.notify_failed`.
   - The `metadata` payload strictly logs operational flags (`source`, `serviceInterest` from verified database Service rows, `hasPhone`, `budgetRange`) and strictly excludes personal data (no names, emails, phone numbers, or freeform messages).

3. **Rate Limiting & Abuse Defense**:
   - **Origin Verification**: Checked against `NEXT_PUBLIC_SITE_URL` and `ALLOWED_ORIGINS` via parsed exact origin comparison (`new URL(origin).origin === allowed`). Malformed origins or unauthorized origins receive HTTP 403.
   - **Content-Type Enforcement**: Only `application/json` is accepted (415 otherwise).
   - **Payload Ceiling**: Max body size is capped at 10KB (413 otherwise) via streaming request reader.
   - **Dynamic Rate Limit**: Max 5 submissions per hour, max 20 per day per `ipHash` for known IPs. Stricter limits for unknown IPs (max 2/hour, max 5/day). Returns 429 with dynamic `Retry-After` header computed from the remaining lifetime of the oldest in-window row, minimum 1 second.
   - **Uniform 201 Response Shape**:
     - Genuine valid submissions, Honeypot traps (`hp_field`), Fast submissions (`elapsedMs < 2000`), and Deduplications (same email + message within 10 minutes) **all return the exact same 201 `{"ok":true}` response** with `Cache-Control: no-store` and identical headers.
     - No database lead ID is ever returned to the client in any scenario.

4. **HTTP Route Protection**:
   - No `GET` handler exists on `/api/leads` (leads cannot be queried over HTTP; returns 405 Method Not Allowed with `Allow: POST`).
   - Responses are always marked `Cache-Control: no-store`.

---

## 3. Production Deployment Step-by-Step Sequence (Vercel + Neon)

Follow this strict deployment order:

1. **Step 1: Create Neon Project & Branches**
   - Create a Postgres project in Neon.
   - Note the connection strings:
     - Pooled connection (`DATABASE_URL`) with `?sslmode=require`
     - Direct non-pooled connection (`DIRECT_URL`) with `?sslmode=require`

2. **Step 2: Run Database Migrations from Trusted Machine**
   - Deploy all migrations to the target database using `DIRECT_URL`:
     ```bash
     npx prisma migrate deploy
     ```

3. **Step 3: Seed Reference Content (Idempotent)**
   - Populate canonical services, portfolio, blog post, and FAQ records:
     ```bash
     npm run db:seed
     ```

4. **Step 4: Configure Environment Variables in Vercel**
   - Set the following in Vercel Project Settings > Environment Variables:
     - `DATABASE_URL` (pooled connection string)
     - `DIRECT_URL` (direct unpooled connection string)
     - `IP_HASH_SECRET` (generate using `openssl rand -hex 32`)
     - `NEXT_PUBLIC_SITE_URL` (`https://akzqcreation.com`)
     - *(Optional)* `ALLOWED_ORIGINS` (e.g. for preview domains)
     - *(Optional)* `RESEND_API_KEY` (if email notifications enabled)
     - *(Optional)* `LEAD_NOTIFICATION_TO` (`you@example.com`)
     - *(Optional)* `LEAD_NOTIFICATION_FROM` (`leads@example.com`)

5. **Step 5: Deploy Application to Vercel**
   - > [!WARNING]
     > **Do not merge to main or deploy without the owner's explicit approval; main holds the legacy static site.**
   - Trigger deployment from the approved branch via Vercel dashboard or CLI.
   - Build completes with zero DB queries during build time (`next build --webpack`).

6. **Step 6: Real Post-Deploy Verification**
   - Note: `npm run test:leads` uses a local embedded disposable Postgres database for integration testing; it is **NOT** a post-deployment verification check.
   - For real post-deployment verification:
     1. **Verify GET 405 Method Not Allowed**:
        ```bash
        curl -i -X GET https://akzqcreation.com/api/leads
        ```
        Confirm it returns `HTTP/1.1 405 Method Not Allowed` with `Allow: POST`.
     2. **Verify Contact Form Load**:
        Open `https://akzqcreation.com/contact` in a browser. Confirm the page and form render with 0 console errors and 0 CSP violations.
     3. **Submit One Test Lead & Delete It**:
        Submit one test lead ONLY to a non-production Neon branch (never to production):
        ```bash
        curl -i -X POST https://akzqcreation.com/api/leads \
          -H "Content-Type: application/json" \
          -H "Origin: https://akzqcreation.com" \
          -d '{"name":"Post-Deploy Smoke Test","email":"smoketest@example.com","service":"Branding & Identity","elapsedMs":3500}'
        ```
        Confirm response is `HTTP/1.1 201 Created` with body `{"ok":true}`.
     4. **Manual Cleanup SQL**:
        Remove the smoke test record from the database:
        ```sql
        DELETE FROM "ActivityLog" WHERE "entityId" IN (SELECT id FROM "Lead" WHERE email = 'smoketest@example.com');
        DELETE FROM "Lead" WHERE email = 'smoketest@example.com';
        ```

---

## 4. Upstream Dependency Override Notes

In `package.json`:
```json
"overrides": {
  "effect": "^3.22.5"
}
```
This override resolves security vulnerability **GHSA-7589-6fvf-x4pw** in the `effect` package, which is pulled in transitively by `@prisma/client`. Once Prisma releases an upstream version of `@prisma/client` that depends on `effect >= 3.22.5`, this override can and should be safely removed.

---

## 5. Dependency Justifications

- **`zod`**: Zod is used exclusively for runtime schema validation and sanitization of incoming lead capture payloads, ensuring strict type safety and control character rejection before database persistence.
- **`dotenv`**: Loaded in `prisma.config.ts` to read `.env` credentials when running Prisma CLI commands (e.g. `prisma migrate status`) in standalone shells without external environment exports.
- **`pg` & `@types/pg`**: Direct dependency required by `@prisma/adapter-pg` for connection pooling, pool size capping (max 3), query timeout enforcement (10000ms), and idle connection lifecycle management.
