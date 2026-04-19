import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { AuthUserPayload, LUMERA_OPERATOR_ROLES } from '../auth/types/auth-user-payload.js';
import { CreateClientCompanyDto } from './dto/create-client-company.dto.js';
import { CreateClientCompanyDocumentDto } from './dto/create-client-company-document.dto.js';
import { UpdateClientCompanyDto } from './dto/update-client-company.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private isLumeraOperator(authUser: AuthUserPayload) {
    return authUser.memberships.some((membership) =>
      LUMERA_OPERATOR_ROLES.includes(membership.roleCode as (typeof LUMERA_OPERATOR_ROLES)[number]),
    );
  }

  private parseOptionalDecimal(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value.trim() === '') {
      return null;
    }

    const trimmed = value.trim();
    const normalized =
      trimmed.includes(',') && trimmed.includes('.')
        ? trimmed.replace(/\./g, '').replace(',', '.')
        : trimmed.includes(',')
          ? trimmed.replace(',', '.')
          : trimmed;
    const numericValue = Number(normalized);

    if (Number.isNaN(numericValue)) {
      throw new BadRequestException('Valor financeiro invalido informado para a empresa participante.');
    }

    return new Prisma.Decimal(numericValue);
  }

  private parseOptionalDate(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value.trim() === '') {
      return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Data invalida informada para o documento da empresa.');
    }

    return parsedDate;
  }

  private normalizeTaxId(value?: string | null) {
    const normalized = value?.trim() || null;
    return normalized && normalized.length ? normalized : null;
  }

  private ensureLumeraScope(organizationId: string, authUser: AuthUserPayload) {
    if (!this.isLumeraOperator(authUser)) {
      throw new NotFoundException('Operacao indisponivel para este perfil');
    }

    const allowedOrganizationIds = new Set(authUser.memberships.map((membership) => membership.organizationId));
    if (!allowedOrganizationIds.has(organizationId)) {
      throw new NotFoundException('Organizacao fora do escopo do usuario');
    }
  }

  private async ensureUniqueTaxId(organizationId: string, taxId?: string | null, currentClientCompanyId?: string) {
    const normalizedTaxId = this.normalizeTaxId(taxId);

    if (!normalizedTaxId) {
      return;
    }

    const existing = await this.prisma.clientCompany.findFirst({
      where: {
        taxId: normalizedTaxId,
        ...(currentClientCompanyId
          ? {
              id: {
                not: currentClientCompanyId,
              },
            }
          : {}),
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (existing) {
      if (existing.organizationId === organizationId) {
        throw new BadRequestException('Ja existe uma empresa participante cadastrada com este CNPJ.');
      }

      throw new BadRequestException('Este CNPJ ja esta vinculado a outra organizacao no sistema.');
    }
  }

  private buildFinancialRuleData(input: {
    chargingModel?: string;
    percentualLumera?: string;
    valorFixoLumera?: string;
    formaPagamento?: string;
    observacoesFinanceiras?: string;
  }) {
    const chargingModel = input.chargingModel;
    const percentualLumera = this.parseOptionalDecimal(input.percentualLumera);
    const valorFixoLumera = this.parseOptionalDecimal(input.valorFixoLumera);
    const formaPagamento = input.formaPagamento === undefined ? undefined : input.formaPagamento || null;
    const observacoes = input.observacoesFinanceiras === undefined ? undefined : input.observacoesFinanceiras?.trim() || null;

    const hasAnyField =
      chargingModel !== undefined ||
      percentualLumera !== undefined ||
      valorFixoLumera !== undefined ||
      formaPagamento !== undefined ||
      observacoes !== undefined;

    return {
      hasAnyField,
      data: {
        chargingModel,
        percentualLumera,
        valorFixoLumera,
        formaPagamento,
        observacoes,
      },
    };
  }

  private calculateDocumentStatus(input: {
    explicitStatus?: string | null;
    hasFile: boolean;
    expirationDate?: Date | null;
    requiresExpiration: boolean;
    warningDays: number;
  }) {
    if (input.explicitStatus === 'NAO_APLICAVEL') {
      return 'NAO_APLICAVEL';
    }

    if (!input.hasFile) {
      return 'PENDENTE';
    }

    if (input.requiresExpiration) {
      if (!input.expirationDate) {
        return 'ENVIADO';
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expirationDate = new Date(input.expirationDate);
      expirationDate.setHours(0, 0, 0, 0);

      if (expirationDate.getTime() < today.getTime()) {
        return 'VENCIDO';
      }

      const warningLimit = new Date(today);
      warningLimit.setDate(warningLimit.getDate() + input.warningDays);

      if (expirationDate.getTime() <= warningLimit.getTime()) {
        return 'VENCE_EM_BREVE';
      }
    }

    return 'VALIDO';
  }

  private serializeCompanyDocumentType(documentType: {
    id: string;
    code: string;
    name: string;
    group: string;
    description: string | null;
    requiresExpiration: boolean;
    warningDays: number;
    isRequired: boolean;
    isSystem: boolean;
    sortOrder: number;
  }) {
    return {
      id: documentType.id,
      code: documentType.code,
      name: documentType.name,
      group: documentType.group,
      description: documentType.description,
      requiresExpiration: documentType.requiresExpiration,
      warningDays: documentType.warningDays,
      isRequired: documentType.isRequired,
      isSystem: documentType.isSystem,
      sortOrder: documentType.sortOrder,
    };
  }

  private serializeCompanyDocument(
    documentType: {
      id: string;
      code: string;
      name: string;
      group: string;
      description: string | null;
      requiresExpiration: boolean;
      warningDays: number;
      isRequired: boolean;
      isSystem: boolean;
      sortOrder: number;
    },
    document?: {
      id: string;
      status: string;
      issueDate: Date | null;
      expirationDate: Date | null;
      deliveredAt: Date | null;
      lastValidatedAt: Date | null;
      checkedByUserId: string | null;
      observations: string | null;
      fileName: string | null;
      originalFileName: string | null;
      mimeType: string | null;
      sizeBytes: bigint | null;
      storageKey: string | null;
      checksumSha256: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    const effectiveStatus = this.calculateDocumentStatus({
      explicitStatus: document?.status,
      hasFile: Boolean(document?.storageKey || document?.fileName),
      expirationDate: document?.expirationDate ?? null,
      requiresExpiration: documentType.requiresExpiration,
      warningDays: documentType.warningDays,
    });

    return {
      id: document?.id ?? null,
      status: effectiveStatus,
      storedStatus: document?.status ?? null,
      issueDate: document?.issueDate?.toISOString() ?? null,
      expirationDate: document?.expirationDate?.toISOString() ?? null,
      deliveredAt: document?.deliveredAt?.toISOString() ?? null,
      lastValidatedAt: document?.lastValidatedAt?.toISOString() ?? null,
      checkedByUserId: document?.checkedByUserId ?? null,
      observations: document?.observations ?? null,
      fileName: document?.fileName ?? null,
      originalFileName: document?.originalFileName ?? null,
      mimeType: document?.mimeType ?? null,
      sizeBytes: document?.sizeBytes ? document.sizeBytes.toString() : null,
      storageKey: document?.storageKey ?? null,
      checksumSha256: document?.checksumSha256 ?? null,
      createdAt: document?.createdAt?.toISOString() ?? null,
      updatedAt: document?.updatedAt?.toISOString() ?? null,
      documentType: this.serializeCompanyDocumentType(documentType),
    };
  }

  async list(authUser: AuthUserPayload) {
    const organizationIds = Array.from(new Set(authUser.memberships.map((membership) => membership.organizationId)));
    const isLumeraOperator = this.isLumeraOperator(authUser);

    const organizations = await this.prisma.organization.findMany({
      where: {
        id: {
          in: organizationIds,
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        clientCompanyDocumentTypes: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        clientCompanies: {
          ...(isLumeraOperator
            ? {}
            : {
                where: {
                  id: {
                    in: authUser.memberships
                      .map((membership) => membership.clientCompanyId)
                      .filter((value): value is string => Boolean(value)),
                  },
                },
              }),
          include: {
            financialRule: true,
            documents: {
              orderBy: [{ createdAt: 'asc' }],
            },
          },
          orderBy: [{ isActive: 'desc' }, { tradeName: 'asc' }, { legalName: 'asc' }],
        },
      },
    });

    return organizations.map((organization) => ({
      id: organization.id,
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      clientCompanies: organization.clientCompanies.map((company) => {
        const documentsByTypeId = new Map(company.documents.map((document) => [document.documentTypeId, document]));

        const documentChecklist = organization.clientCompanyDocumentTypes.map((documentType) =>
          this.serializeCompanyDocument(documentType, documentsByTypeId.get(documentType.id)),
        );

        return {
          id: company.id,
          legalName: company.legalName,
          tradeName: company.tradeName,
          segmento: company.segmento,
          taxId: company.taxId,
          isActive: company.isActive,
          financialRule: company.financialRule,
          documents: documentChecklist,
        };
      }),
    }));
  }

  async createClientCompany(organizationId: string, input: CreateClientCompanyDto, authUser: AuthUserPayload) {
    this.ensureLumeraScope(organizationId, authUser);
    await this.ensureUniqueTaxId(organizationId, input.taxId);

    if (!input.percentualLumera || input.percentualLumera.trim() === '') {
      throw new BadRequestException('Informe o % da Lumera. O valor pode ser 0, mas precisa ser preenchido.');
    }

    const financialRule = this.buildFinancialRuleData(input);

    return this.prisma.clientCompany.create({
      data: {
        organizationId,
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        segmento: input.segmento?.trim() || null,
        taxId: this.normalizeTaxId(input.taxId),
        isActive: true,
        ...(financialRule.hasAnyField
          ? {
              financialRule: {
                create: {
                  chargingModel: (input.chargingModel as any) ?? 'EXITO',
                  percentualLumera: financialRule.data.percentualLumera,
                  valorFixoLumera: financialRule.data.valorFixoLumera,
                  formaPagamento: financialRule.data.formaPagamento as any,
                  observacoes: financialRule.data.observacoes,
                },
              },
            }
          : {}),
      },
      include: {
        financialRule: true,
      },
    });
  }

  async updateClientCompany(
    organizationId: string,
    clientCompanyId: string,
    input: UpdateClientCompanyDto,
    authUser: AuthUserPayload,
  ) {
    this.ensureLumeraScope(organizationId, authUser);

    const company = await this.prisma.clientCompany.findFirst({
      where: {
        id: clientCompanyId,
        organizationId,
      },
      include: {
        financialRule: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa participante nao encontrada');
    }

    if (input.taxId !== undefined) {
      await this.ensureUniqueTaxId(organizationId, input.taxId, clientCompanyId);
    }

    const financialRule = this.buildFinancialRuleData(input);

    return this.prisma.clientCompany.update({
      where: { id: clientCompanyId },
      data: {
        ...(input.legalName !== undefined ? { legalName: input.legalName.trim() } : {}),
        ...(input.tradeName !== undefined ? { tradeName: input.tradeName?.trim() || null } : {}),
        ...(input.segmento !== undefined ? { segmento: input.segmento?.trim() || null } : {}),
        ...(input.taxId !== undefined ? { taxId: this.normalizeTaxId(input.taxId) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(financialRule.hasAnyField
          ? {
              financialRule: company.financialRule
                ? {
                    update: {
                      ...(input.chargingModel !== undefined ? { chargingModel: input.chargingModel as any } : {}),
                      ...(financialRule.data.percentualLumera !== undefined ? { percentualLumera: financialRule.data.percentualLumera } : {}),
                      ...(financialRule.data.valorFixoLumera !== undefined ? { valorFixoLumera: financialRule.data.valorFixoLumera } : {}),
                      ...(financialRule.data.formaPagamento !== undefined ? { formaPagamento: financialRule.data.formaPagamento as any } : {}),
                      ...(financialRule.data.observacoes !== undefined ? { observacoes: financialRule.data.observacoes } : {}),
                    },
                  }
                : {
                    create: {
                      chargingModel: (input.chargingModel as any) ?? 'EXITO',
                      percentualLumera: financialRule.data.percentualLumera ?? null,
                      valorFixoLumera: financialRule.data.valorFixoLumera ?? null,
                      formaPagamento: financialRule.data.formaPagamento as any,
                      observacoes: financialRule.data.observacoes ?? null,
                    },
                  },
            }
          : {}),
      },
      include: {
        financialRule: true,
      },
    });
  }

  async upsertClientCompanyDocument(
    organizationId: string,
    clientCompanyId: string,
    documentTypeId: string,
    input: CreateClientCompanyDocumentDto,
    authUser: AuthUserPayload,
  ) {
    this.ensureLumeraScope(organizationId, authUser);

    const [company, documentType] = await Promise.all([
      this.prisma.clientCompany.findFirst({
        where: {
          id: clientCompanyId,
          organizationId,
        },
      }),
      this.prisma.clientCompanyDocumentType.findFirst({
        where: {
          id: documentTypeId,
          organizationId,
        },
      }),
    ]);

    if (!company) {
      throw new NotFoundException('Empresa participante nao encontrada');
    }

    if (!documentType) {
      throw new NotFoundException('Tipo de documento nao encontrado');
    }

    const issueDate = this.parseOptionalDate(input.issueDate);
    const expirationDate = this.parseOptionalDate(input.expirationDate);
    const deliveredAt = input.deliveredAt === undefined ? undefined : this.parseOptionalDate(input.deliveredAt);

    const existingDocument = await this.prisma.clientCompanyDocument.findUnique({
      where: {
        clientCompanyId_documentTypeId: {
          clientCompanyId,
          documentTypeId,
        },
      },
    });

    const nextHasFile = Boolean(
      input.storageKey || input.fileName || existingDocument?.storageKey || existingDocument?.fileName,
    );

    const nextExpirationDate = expirationDate === undefined ? existingDocument?.expirationDate ?? null : expirationDate;

    if (documentType.requiresExpiration && nextHasFile && input.status !== 'NAO_APLICAVEL' && nextExpirationDate === null) {
      throw new BadRequestException('Informe a data de validade para este documento.');
    }

    const nextStatus = this.calculateDocumentStatus({
      explicitStatus: input.status ?? existingDocument?.status ?? null,
      hasFile: nextHasFile,
      expirationDate: nextExpirationDate,
      requiresExpiration: documentType.requiresExpiration,
      warningDays: documentType.warningDays,
    });

    const document = await this.prisma.clientCompanyDocument.upsert({
      where: {
        clientCompanyId_documentTypeId: {
          clientCompanyId,
          documentTypeId,
        },
      },
      update: {
        status: nextStatus as any,
        ...(issueDate !== undefined ? { issueDate } : {}),
        ...(expirationDate !== undefined ? { expirationDate } : {}),
        ...((deliveredAt !== undefined || input.fileName !== undefined) ? { deliveredAt: deliveredAt ?? new Date() } : {}),
        ...(input.observations !== undefined ? { observations: input.observations?.trim() || null } : {}),
        ...(input.fileName !== undefined ? { fileName: input.fileName || null } : {}),
        ...(input.originalFileName !== undefined ? { originalFileName: input.originalFileName || null } : {}),
        ...(input.mimeType !== undefined ? { mimeType: input.mimeType || null } : {}),
        ...(input.sizeBytes !== undefined ? { sizeBytes: BigInt(input.sizeBytes) } : {}),
        ...(input.storageKey !== undefined ? { storageKey: input.storageKey || null } : {}),
        ...(input.checksumSha256 !== undefined ? { checksumSha256: input.checksumSha256 || null } : {}),
        lastValidatedAt: new Date(),
        checkedByUserId: authUser.sub,
      },
      create: {
        organizationId,
        clientCompanyId,
        documentTypeId,
        status: nextStatus as any,
        issueDate: issueDate ?? null,
        expirationDate: expirationDate ?? null,
        deliveredAt: nextHasFile ? deliveredAt ?? new Date() : null,
        lastValidatedAt: new Date(),
        checkedByUserId: authUser.sub,
        observations: input.observations?.trim() || null,
        fileName: input.fileName || null,
        originalFileName: input.originalFileName || null,
        mimeType: input.mimeType || null,
        sizeBytes: input.sizeBytes ? BigInt(input.sizeBytes) : null,
        storageKey: input.storageKey || null,
        checksumSha256: input.checksumSha256 || null,
      },
      include: {
        documentType: true,
      },
    });

    return this.serializeCompanyDocument(document.documentType, document);
  }
}
