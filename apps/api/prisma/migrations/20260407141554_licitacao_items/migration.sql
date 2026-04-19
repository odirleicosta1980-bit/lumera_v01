-- CreateEnum
CREATE TYPE "LicitacaoItemStatus" AS ENUM ('PENDENTE', 'EM_PRECIFICACAO', 'PRECIFICADO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "LicitacaoItem" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "numeroItem" TEXT,
    "numeroLote" TEXT,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT,
    "quantidade" DECIMAL(14,4),
    "valorReferencia" DECIMAL(14,2),
    "valorProposto" DECIMAL(14,2),
    "marcaModelo" TEXT,
    "observacoes" TEXT,
    "status" "LicitacaoItemStatus" NOT NULL DEFAULT 'PENDENTE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicitacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LicitacaoItem_licitacaoId_sortOrder_idx" ON "LicitacaoItem"("licitacaoId", "sortOrder");

-- CreateIndex
CREATE INDEX "LicitacaoItem_licitacaoId_status_idx" ON "LicitacaoItem"("licitacaoId", "status");

-- AddForeignKey
ALTER TABLE "LicitacaoItem" ADD CONSTRAINT "LicitacaoItem_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "Licitacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
