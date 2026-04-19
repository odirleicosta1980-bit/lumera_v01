-- AlterTable
ALTER TABLE "Anexo" ADD COLUMN     "empenhoId" TEXT;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_empenhoId_fkey" FOREIGN KEY ("empenhoId") REFERENCES "LicitacaoEmpenho"("id") ON DELETE CASCADE ON UPDATE CASCADE;
