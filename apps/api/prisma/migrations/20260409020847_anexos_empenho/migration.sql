-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttachmentCategory" ADD VALUE 'DOCUMENTO_EMPENHO';
ALTER TYPE "AttachmentCategory" ADD VALUE 'BOLETO';
ALTER TYPE "AttachmentCategory" ADD VALUE 'COMPROVANTE_PAGAMENTO';
ALTER TYPE "AttachmentCategory" ADD VALUE 'OUTRO';

-- AlterEnum
ALTER TYPE "AttachmentEntityType" ADD VALUE 'EMPENHO';
