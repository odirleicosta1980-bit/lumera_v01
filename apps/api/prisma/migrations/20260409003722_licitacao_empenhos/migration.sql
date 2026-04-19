-- CreateTable
CREATE TABLE "LicitacaoEmpenho" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "codigoEmpenho" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "dataEmpenho" TIMESTAMP(3),
    "dataPagamentoEmpenho" TIMESTAMP(3),
    "dataGeracaoBoleto" TIMESTAMP(3),
    "dataPagamentoBoleto" TIMESTAMP(3),
    "observacoes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicitacaoEmpenho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LicitacaoEmpenho_licitacaoId_sortOrder_idx" ON "LicitacaoEmpenho"("licitacaoId", "sortOrder");

-- CreateIndex
CREATE INDEX "LicitacaoEmpenho_licitacaoId_dataEmpenho_idx" ON "LicitacaoEmpenho"("licitacaoId", "dataEmpenho");

-- AddForeignKey
ALTER TABLE "LicitacaoEmpenho" ADD CONSTRAINT "LicitacaoEmpenho_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "Licitacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
