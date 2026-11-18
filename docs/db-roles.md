# Database Roles & Least-Privilege Architecture (Neon Postgres)

> [!IMPORTANT]
> Do NOT execute these commands on production without provisioning the dedicated runtime user credentials in Neon first.

## Role Separation Overview

AKZQ.Creation implements a dual-role database security model for Neon PostgreSQL:

1. **Migration Role (`<migration_role>`)**:
   - Connection: `DIRECT_URL` (direct unpooled compute endpoint `ep-...`).
   - Privileges: Full DDL (`CREATE`, `ALTER`, `DROP`) + DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
   - Used by: Prisma CLI (`prisma migrate dev`, `prisma migrate deploy`), schema migrations, and CI deployment pipelines.

2. **Runtime Application Role (`runtime_user`)**:
   - Connection: `DATABASE_URL` (pooled connection endpoint `ep-...-pooler`).
   - Privileges: DML-only (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on `public` tables; no DDL permissions.
   - Purpose: Enforces least-privilege execution in Next.js Server Components, Server Actions, and API routes. Prevents application-layer vulnerabilities from executing structural schema mutations.

---

## Provisioning Script

Run the following SQL using the admin/migration role in the database console:

```sql
-- 1. Create the isolated runtime application role
CREATE ROLE runtime_user WITH LOGIN PASSWORD 'replace_with_secure_runtime_password';

-- 2. Grant schema usage
GRANT USAGE ON SCHEMA public TO runtime_user;

-- 3. Grant DML on existing tables and sequences
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO runtime_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO runtime_user;

-- 4. Configure default privileges for all future tables created by the migration role
ALTER DEFAULT PRIVILEGES FOR ROLE <migration_role> IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO runtime_user;

ALTER DEFAULT PRIVILEGES FOR ROLE <migration_role> IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO runtime_user;
```

### Why Both Commands Are Strictly Required

In PostgreSQL:
1. `GRANT ... ON ALL TABLES IN SCHEMA public`: Grants permissions **only on tables that exist at the exact moment this statement is executed**. Any table created in the future (for example, during future Prisma migrations) will **not** automatically receive these permissions.
2. `ALTER DEFAULT PRIVILEGES FOR ROLE <migration_role> IN SCHEMA public GRANT ...`: Modifies the default permissions that will be applied to **future objects created by the specified `<migration_role>`**. It does **not** grant permissions retroactively to existing tables.

Executing both commands is mandatory: the first provides immediate access to current tables, while the second ensures runtime access persists uninterrupted when future schema migrations create new tables.

---

## Neon Configuration Mapping

- **Direct Migration Access (`DIRECT_URL`)**:
  ```
  postgresql://<migration_role>:<migration_password>@ep-sample.region.neon.tech/neondb?sslmode=require
  ```
- **Pooled Runtime Access (`DATABASE_URL`)**:
  ```
  postgresql://runtime_user:replace_with_secure_runtime_password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require
  ```
