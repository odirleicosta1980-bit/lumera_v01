-- CreateEnum
CREATE TYPE "ClientCompanyDocumentGroup" AS ENUM ('HABILITACAO_JURIDICA', 'REGULARIDADE_FISCAL_TRABALHISTA', 'QUALIFICACAO_ECONOMICO_FINANCEIRA', 'CADASTRO_SISTEMA_ELETRONICO', 'OUTROS_DOCUMENTOS');

-- CreateEnum
CREATE TYPE "ClientCompanyDocumentStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'VALIDO', 'VENCE_EM_BREVE', 'VENCIDO', 'NAO_APLICAVEL');

-- CreateTable
CREATE TABLE "ClientCompanyDocumentType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "ClientCompanyDocumentGroup" NOT NULL,
    "description" TEXT,
    "requiresExpiration" BOOLEAN NOT NULL DEFAULT false,
    "warningDays" INTEGER NOT NULL DEFAULT 30,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCompanyDocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCompanyDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "status" "ClientCompanyDocumentStatus" NOT NULL DEFAULT 'PENDENTE',
    "issueDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "checkedByUserId" TEXT,
    "observations" TEXT,
    "fileName" TEXT,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "storageKey" TEXT,
    "checksumSha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientCompanyDocumentType_organizationId_sortOrder_idx" ON "ClientCompanyDocumentType"("organizationId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ClientCompanyDocumentType_organizationId_code_key" ON "ClientCompanyDocumentType"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ClientCompanyDocument_storageKey_key" ON "ClientCompanyDocument"("storageKey");

-- CreateIndex
CREATE INDEX "ClientCompanyDocument_organizationId_status_idx" ON "ClientCompanyDocument"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ClientCompanyDocument_clientCompanyId_status_idx" ON "ClientCompanyDocument"("clientCompanyId", "status");

-- CreateIndex
CREATE INDEX "ClientCompanyDocument_clientCompanyId_expirationDate_idx" ON "ClientCompanyDocument"("clientCompanyId", "expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "ClientCompanyDocument_clientCompanyId_documentTypeId_key" ON "ClientCompanyDocument"("clientCompanyId", "documentTypeId");

-- AddForeignKey
ALTER TABLE "ClientCompanyDocumentType" ADD CONSTRAINT "ClientCompanyDocumentType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCompanyDocument" ADD CONSTRAINT "ClientCompanyDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCompanyDocument" ADD CONSTRAINT "ClientCompanyDocument_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "ClientCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCompanyDocument" ADD CONSTRAINT "ClientCompanyDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "ClientCompanyDocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCompanyDocument" ADD CONSTRAINT "ClientCompanyDocument_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
