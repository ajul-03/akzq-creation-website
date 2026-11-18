-- AlterEnum
BEGIN;
CREATE TYPE "LeadSource_new" AS ENUM ('CONTACT_FORM', 'SERVICE_PAGE', 'OTHER');
ALTER TABLE "Lead" ALTER COLUMN "source" TYPE "LeadSource_new" USING ("source"::text::"LeadSource_new");
ALTER TYPE "LeadSource" RENAME TO "LeadSource_old";
ALTER TYPE "LeadSource_new" RENAME TO "LeadSource";
DROP TYPE "LeadSource_old";
COMMIT;

-- DropIndex
DROP INDEX "Faq_question_key";

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "seedKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Faq_seedKey_key" ON "Faq"("seedKey");
