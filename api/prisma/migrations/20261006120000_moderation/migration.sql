-- AlterTable
ALTER TABLE "Business" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN "resolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Report" ADD COLUMN "action" TEXT;
