-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "creditBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "secondaryPhone" TEXT;
