import { Injectable } from '@nestjs/common';
import { TaskStatus, Prisma, FinanceiroStatus } from '@prisma/client';

const CLOSED_FINANCIAL_STATUSES: FinanceiroStatus[] = [FinanceiroStatus.PAGO, FinanceiroStatus.NAO_APLICAVEL];
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { AuthUserPayload } from '../auth/types/auth-user-payload.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getAccessibleScope(authUser: AuthUserPayload): Prisma.LicitacaoWhereInput {
    const adminOrganizationIds = Array.from(
      new Set(
        authUser.memberships
          .filter((membership) => membership.roleCode === 'LUMERA_ADMIN')
          .map((membership) => membership.organizationId),
      ),
    );
    const operacionalOrganizationIds = Array.from(
      new Set(
        authUser.memberships
          .filter((membership) => membership.roleCode === 'LUMERA_OPERACIONAL')
          .map((membership) => membership.organizationId),
      ),
    );
    const clientCompanyIdsByOrganization = new Map<string, string[]>();

    for (const membership of authUser.memberships) {
      if (
        membership.roleCode === 'LUMERA_ADMIN' ||
        membership.roleCode === 'LUMERA_OPERACIONAL' ||
        !membership.clientCompanyId
      ) {
        continue;
      }

      const existing = clientCompanyIdsByOrganization.get(membership.organizationId) ?? [];
      if (!existing.includes(membership.clientCompanyId)) {
        existing.push(membership.clientCompanyId);
        clientCompanyIdsByOrganization.set(membership.organizationId, existing);
      }
    }

    const scopes: Prisma.LicitacaoWhereInput[] = [];

    if (adminOrganizationIds.length) {
      scopes.push({
        organizationId: {
          in: adminOrganizationIds,
        },
      });
    }

    if (operacionalOrganizationIds.length) {
      scopes.push({
        organizationId: {
          in: operacionalOrganizationIds,
        },
        responsaveis: {
          some: {
            userId: authUser.sub,
          },
        },
      });
    }

    for (const [organizationId, clientCompanyIds] of clientCompanyIdsByOrganization.entries()) {
      scopes.push({
        organizationId,
        clientCompanyId: {
          in: clientCompanyIds,
        },
        visibility: 'SHARED_WITH_CLIENT',
      });
    }

    if (!scopes.length) {
      return {
        id: '__no_access__',
      };
    }

    return scopes.length === 1 ? scopes[0] : { OR: scopes };
  }

  private decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      return Number(value);
    }

    return value.toNumber();
  }

  private calculateCompanyDocumentStatus(input: {
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

  async summary(
    authUser: AuthUserPayload,
    period?: {
      month?: number;
      year?: number;
    },
  ) {
    const licitacaoWhere = this.getAccessibleScope(authUser);
    const organizationIds = Array.from(new Set(authUser.memberships.map((membership) => membership.organizationId)));
    const now = new Date();
    const selectedYear =
      period?.year && period.year >= 2000 && period.year <= 2100 ? period.year : now.getFullYear();
    const selectedMonth =
      period?.month && period.month >= 1 && period.month <= 12 ? period.month - 1 : now.getMonth();
    const monthStart = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    const [etapas, licitacoes, documentTypes, monthTasks, openTasksCount, recentActivities] = await Promise.all([
      this.prisma.etapaLicitacao.findMany({
        where: {
          organizationId: { in: organizationIds },
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          sortOrder: true,
        },
      }),
      this.prisma.licitacao.findMany({
        where: licitacaoWhere,
        orderBy: [{ updatedAt: 'desc' }],
        select: {
          id: true,
          organizationId: true,
          titulo: true,
          numeroProcesso: true,
          dataSessao: true,
          etapaId: true,
          etapa: {
            select: {
              name: true,
            },
          },
          clientCompanyId: true,
          clientCompany: {
            select: {
              legalName: true,
              tradeName: true,
              documents: {
                select: {
                  documentTypeId: true,
                  status: true,
                  expirationDate: true,
                  storageKey: true,
                  fileName: true,
                  originalFileName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.clientCompanyDocumentType.findMany({
        where: {
          organizationId: { in: organizationIds },
          isRequired: true,
        },
        select: {
          id: true,
          organizationId: true,
          requiresExpiration: true,
          warningDays: true,
        },
      }),
      this.prisma.tarefa.findMany({
        where: {
          dueDate: {
            gte: monthStart,
            lte: monthEnd,
          },
          licitacao: licitacaoWhere,
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          licitacao: {
            select: {
              id: true,
              clientCompanyId: true,
              titulo: true,
              clientCompany: {
                select: {
                  legalName: true,
                  tradeName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.tarefa.count({
        where: {
          status: {
            in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
          },
          licitacao: licitacaoWhere,
        },
      }),
      this.prisma.activityLog.findMany({
        where: {
          organizationId: {
            in: organizationIds,
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 8,
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true,
          licitacaoId: true,
          licitacao: {
            select: {
              titulo: true,
            },
          },
        },
      }),
    ]);

    const stageCounts = etapas.map((etapa) => ({
      etapaId: etapa.id,
      name: etapa.name,
      count: licitacoes.filter((licitacao) => licitacao.etapaId === etapa.id).length,
    }));

    const documentTypesByOrganization = new Map<string, typeof documentTypes>();
    for (const documentType of documentTypes) {
      const existing = documentTypesByOrganization.get(documentType.organizationId) ?? [];
      existing.push(documentType);
      documentTypesByOrganization.set(documentType.organizationId, existing);
    }

    const companyCountMap = new Map<
      string,
      {
        clientCompanyId: string;
        name: string;
        count: number;
        documentosPendentes: number;
        documentosVencendo: number;
        documentosVencidos: number;
      }
    >();
    for (const licitacao of licitacoes) {
      const existing = companyCountMap.get(licitacao.clientCompanyId);
      const companyName = licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName;

      if (existing) {
        existing.count += 1;
      } else {
        const requiredDocumentTypes = documentTypesByOrganization.get(licitacao.organizationId) ?? [];
        const documentsByType = new Map(
          (licitacao.clientCompany.documents ?? []).map((documento) => [documento.documentTypeId, documento]),
        );

        let documentosPendentes = 0;
        let documentosVencendo = 0;
        let documentosVencidos = 0;

        for (const documentType of requiredDocumentTypes) {
          const documento = documentsByType.get(documentType.id);
          const status = this.calculateCompanyDocumentStatus({
            explicitStatus: documento?.status ?? null,
            hasFile: Boolean(documento?.storageKey || documento?.fileName || documento?.originalFileName),
            expirationDate: documento?.expirationDate ?? null,
            requiresExpiration: documentType.requiresExpiration,
            warningDays: documentType.warningDays,
          });

          if (status === 'PENDENTE') {
            documentosPendentes += 1;
          }
          if (status === 'VENCE_EM_BREVE') {
            documentosVencendo += 1;
          }
          if (status === 'VENCIDO') {
            documentosVencidos += 1;
          }
        }

        companyCountMap.set(licitacao.clientCompanyId, {
          clientCompanyId: licitacao.clientCompanyId,
          name: companyName,
          count: 1,
          documentosPendentes,
          documentosVencendo,
          documentosVencidos,
        });
      }
    }

    const companyCounts = Array.from(companyCountMap.values()).sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.name.localeCompare(right.name, 'pt-BR');
    });

    const upcomingSessions = licitacoes
      .filter((licitacao) => {
        if (!licitacao.dataSessao) {
          return false;
        }

        const dataSessao = new Date(licitacao.dataSessao);
        return dataSessao >= monthStart && dataSessao <= monthEnd;
      })
      .sort((left, right) => Number(new Date(left.dataSessao ?? 0)) - Number(new Date(right.dataSessao ?? 0)))
      .map((licitacao) => ({
        id: licitacao.id,
        clientCompanyId: licitacao.clientCompanyId,
        titulo: licitacao.titulo,
        numeroProcesso: licitacao.numeroProcesso,
        dataSessao: licitacao.dataSessao,
        company: licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName,
        etapa: licitacao.etapa.name,
      }));

    return {
      generatedAt: now.toISOString(),
      period: {
        month: selectedMonth + 1,
        year: selectedYear,
      },
      metrics: {
        totalLicitacoes: licitacoes.length,
        empresasParticipantes: companyCounts.length,
        sessoesProximas: upcomingSessions.length,
        tarefasNoMes: monthTasks.length,
        tarefasEmAberto: openTasksCount,
      },
      stageCounts,
      companyCounts: companyCounts.slice(0, 8),
      upcomingSessions,
      monthTasks: monthTasks.map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        licitacaoId: task.licitacao.id,
        clientCompanyId: task.licitacao.clientCompanyId,
        licitacaoTitulo: task.licitacao.titulo,
        company: task.licitacao.clientCompany.tradeName ?? task.licitacao.clientCompany.legalName,
      })),
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        description: activity.description,
        createdAt: activity.createdAt,
        licitacaoId: activity.licitacaoId,
        licitacaoTitulo: activity.licitacao?.titulo ?? null,
      })),
    };
  }

  async executive(authUser: AuthUserPayload) {
    const licitacaoWhere = this.getAccessibleScope(authUser);
    const organizationIds = Array.from(new Set(authUser.memberships.map((membership) => membership.organizationId)));
    const now = new Date();
    const receivableLimit = new Date(now);
    receivableLimit.setDate(receivableLimit.getDate() + 30);

    const [etapas, licitacoes, responsaveis] = await Promise.all([
      this.prisma.etapaLicitacao.findMany({
        where: {
          organizationId: { in: organizationIds },
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
        },
      }),
      this.prisma.licitacao.findMany({
        where: licitacaoWhere,
        orderBy: [{ updatedAt: 'desc' }],
        select: {
          id: true,
          titulo: true,
          numeroProcesso: true,
          etapaId: true,
          clientCompanyId: true,
          clientCompany: {
            select: {
              legalName: true,
              tradeName: true,
              segmento: true,
            },
          },
          financeiro: {
            select: {
              valorEstimadoEdital: true,
              valorHomologado: true,
              valorReceitaLumera: true,
              statusFinanceiro: true,
              vencimento: true,
            },
          },
        },
      }),
      this.prisma.licitacaoResponsavel.findMany({
        where: {
          licitacao: licitacaoWhere,
        },
        select: {
          licitacaoId: true,
          isPrimary: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const metrics = {
      totalLicitacoes: licitacoes.length,
      empresasParticipantes: new Set(licitacoes.map((licitacao) => licitacao.clientCompanyId)).size,
      licitacoesComFinanceiro: licitacoes.filter((licitacao) => licitacao.financeiro).length,
      valorEstimadoEdital: licitacoes.reduce(
        (total, licitacao) => total + this.decimalToNumber(licitacao.financeiro?.valorEstimadoEdital),
        0,
      ),
      valorHomologado: licitacoes.reduce(
        (total, licitacao) => total + this.decimalToNumber(licitacao.financeiro?.valorHomologado),
        0,
      ),
      receitaLumeraPrevista: licitacoes.reduce(
        (total, licitacao) => total + this.decimalToNumber(licitacao.financeiro?.valorReceitaLumera),
        0,
      ),
      pagamentosPendentes: licitacoes.filter(
        (licitacao) =>
          licitacao.financeiro &&
          !CLOSED_FINANCIAL_STATUSES.includes(licitacao.financeiro.statusFinanceiro),
      ).length,
    };

    const stageCounts = etapas.map((etapa) => ({
      etapaId: etapa.id,
      name: etapa.name,
      count: licitacoes.filter((licitacao) => licitacao.etapaId === etapa.id).length,
    }));

    const companyMap = new Map<
      string,
      {
        clientCompanyId: string;
        name: string;
        segmento: string | null;
        totalLicitacoes: number;
        valorHomologado: number;
        receitaLumeraPrevista: number;
      }
    >();

    for (const licitacao of licitacoes) {
      const name = licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName;
      const existing = companyMap.get(licitacao.clientCompanyId);
      if (existing) {
        existing.totalLicitacoes += 1;
        existing.valorHomologado += this.decimalToNumber(licitacao.financeiro?.valorHomologado);
        existing.receitaLumeraPrevista += this.decimalToNumber(licitacao.financeiro?.valorReceitaLumera);
      } else {
        companyMap.set(licitacao.clientCompanyId, {
          clientCompanyId: licitacao.clientCompanyId,
          name,
          segmento: licitacao.clientCompany.segmento ?? null,
          totalLicitacoes: 1,
          valorHomologado: this.decimalToNumber(licitacao.financeiro?.valorHomologado),
          receitaLumeraPrevista: this.decimalToNumber(licitacao.financeiro?.valorReceitaLumera),
        });
      }
    }

    const companyPerformance = Array.from(companyMap.values())
      .sort((left, right) => {
        if (right.receitaLumeraPrevista !== left.receitaLumeraPrevista) {
          return right.receitaLumeraPrevista - left.receitaLumeraPrevista;
        }
        if (right.totalLicitacoes !== left.totalLicitacoes) {
          return right.totalLicitacoes - left.totalLicitacoes;
        }
        return left.name.localeCompare(right.name, 'pt-BR');
      })
      .map((company) => ({
        ...company,
        ticketMedio: company.totalLicitacoes ? company.receitaLumeraPrevista / company.totalLicitacoes : 0,
      }));

    const responsibleMap = new Map<string, { userId: string; name: string; totalLicitacoes: number; primaryAssignments: number }>();
    for (const responsavel of responsaveis) {
      const existing = responsibleMap.get(responsavel.user.id);
      if (existing) {
        existing.totalLicitacoes += 1;
        if (responsavel.isPrimary) {
          existing.primaryAssignments += 1;
        }
      } else {
        responsibleMap.set(responsavel.user.id, {
          userId: responsavel.user.id,
          name: responsavel.user.name,
          totalLicitacoes: 1,
          primaryAssignments: responsavel.isPrimary ? 1 : 0,
        });
      }
    }

    const responsibleLoad = Array.from(responsibleMap.values()).sort((left, right) => {
      if (right.totalLicitacoes !== left.totalLicitacoes) {
        return right.totalLicitacoes - left.totalLicitacoes;
      }
      return left.name.localeCompare(right.name, 'pt-BR');
    });

    const financialStatusMap = new Map<string, number>();
    for (const licitacao of licitacoes) {
      const status = licitacao.financeiro?.statusFinanceiro ?? 'SEM_FINANCEIRO';
      financialStatusMap.set(status, (financialStatusMap.get(status) ?? 0) + 1);
    }

    const financialStatusCounts = Array.from(financialStatusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((left, right) => right.count - left.count);

    const upcomingReceivables = licitacoes
      .filter(
        (licitacao) =>
          licitacao.financeiro?.vencimento &&
          licitacao.financeiro.vencimento >= now &&
          licitacao.financeiro.vencimento <= receivableLimit &&
          !CLOSED_FINANCIAL_STATUSES.includes(licitacao.financeiro.statusFinanceiro),
      )
      .sort(
        (left, right) =>
          Number(new Date(left.financeiro?.vencimento ?? 0)) - Number(new Date(right.financeiro?.vencimento ?? 0)),
      )
      .slice(0, 8)
      .map((licitacao) => ({
        id: licitacao.id,
        titulo: licitacao.titulo,
        numeroProcesso: licitacao.numeroProcesso,
        company: licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName,
        vencimento: licitacao.financeiro?.vencimento ?? null,
        statusFinanceiro: licitacao.financeiro?.statusFinanceiro ?? 'SEM_FINANCEIRO',
        valorReceitaLumera: this.decimalToNumber(licitacao.financeiro?.valorReceitaLumera),
      }));

    return {
      generatedAt: now.toISOString(),
      metrics,
      stageCounts,
      companyPerformance: companyPerformance.slice(0, 10),
      responsibleLoad: responsibleLoad.slice(0, 10),
      financialStatusCounts,
      upcomingReceivables,
    };
  }
}
