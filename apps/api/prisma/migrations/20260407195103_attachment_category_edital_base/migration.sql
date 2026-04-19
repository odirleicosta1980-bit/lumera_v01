-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('GENERAL', 'EDITAL_BASE');

-- AlterTable
ALTER TABLE "Anexo" ADD COLUMN     "category" "AttachmentCategory" NOT NULL DEFAULT 'GENERAL';
