-- CreateEnum
CREATE TYPE "CobrancaModelo" AS ENUM ('FIXO', 'EXITO', 'FIXO_MAIS_EXITO', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'BOLETO', 'TRANSFERENCIA', 'FATURAMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "FinanceiroStatus" AS ENUM ('NAO_APLICAVEL', 'PENDENTE', 'PARCIAL', 'PAGO', 'ATRASADO');

-- CreateTable
CREATE TABLE "ClientCompanyFinancialRule" (
    "id" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "chargingModel" "CobrancaModelo" NOT NULL DEFAULT 'EXITO',
    "percentualLumera" DECIMAL(7,4),
    "valorFixoLumera" DECIMAL(14,2),
    "formaPagamento" "FormaPagamento",
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCompanyFinancialRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicitacaoFinanceiro" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "valorEstimadoEdital" DECIMAL(14,2),
    "valorPropostaEmpresa" DECIMAL(14,2),
    "valorHomologado" DECIMAL(14,2),
    "chargingModel" "CobrancaModelo" NOT NULL DEFAULT 'EXITO',
    "percentualLumera" DECIMAL(7,4),
    "valorFixoLumera" DECIMAL(14,2),
    "valorReceitaLumera" DECIMAL(14,2),
    "formaPagamento" "FormaPagamento",
    "statusFinanceiro" "FinanceiroStatus" NOT NULL DEFAULT 'PENDENTE',
    "vencimento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicitacaoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicitacaoFinanceiroRateio" (
    "id" TEXT NOT NULL,
    "licitacaoFinanceiroId" TEXT NOT NULL,
    "userId" TEXT,
    "label" TEXT NOT NULL,
    "percentual" DECIMAL(7,4),
    "valor" DECIMAL(14,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicitacaoFinanceiroRateio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientCompanyFinancialRule_clientCompanyId_key" ON "ClientCompanyFinancialRule"("clientCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "LicitacaoFinanceiro_licitacaoId_key" ON "LicitacaoFinanceiro"("licitacaoId");

-- CreateIndex
CREATE INDEX "LicitacaoFinanceiroRateio_licitacaoFinanceiroId_sortOrder_idx" ON "LicitacaoFinanceiroRateio"("licitacaoFinanceiroId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ClientCompanyFinancialRule" ADD CONSTRAINT "ClientCompanyFinancialRule_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicitacaoFinanceiro" ADD CONSTRAINT "LicitacaoFinanceiro_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "Licitacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicitacaoFinanceiroRateio" ADD CONSTRAINT "LicitacaoFinanceiroRateio_licitacaoFinanceiroId_fkey" FOREIGN KEY ("licitacaoFinanceiroId") REFERENCES "LicitacaoFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicitacaoFinanceiroRateio" ADD CONSTRAINT "LicitacaoFinanceiroRateio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
