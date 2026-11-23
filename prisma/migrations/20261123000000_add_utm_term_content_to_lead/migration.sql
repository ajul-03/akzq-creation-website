-- AddColumn: utmTerm and utmContent to Lead (nullable, no data loss)
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;
