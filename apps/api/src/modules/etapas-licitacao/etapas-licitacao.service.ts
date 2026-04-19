import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { AuthUserPayload, LUMERA_OPERATOR_ROLES } from '../auth/types/auth-user-payload.js';
import { CreateEtapaLicitacaoDto } from './dto/create-etapa-licitacao.dto.js';
import { UpdateEtapaLicitacaoDto } from './dto/update-etapa-licitacao.dto.js';

@Injectable()
export class EtapasLicitacaoService {
  constructor(private readonly prisma: PrismaService) {}

  private isLumeraOperator(authUser: AuthUserPayload) {
    return authUser.memberships.some((membership) =>
      LUMERA_OPERATOR_ROLES.includes(membership.roleCode as (typeof LUMERA_OPERATOR_ROLES)[number]),
    );
  }

  private getScopedOrganizationIds(authUser: AuthUserPayload) {
    return Array.from(new Set(authUser.memberships.map((membership) => membership.organizationId)));
  }

  private ensureOrganizationScope(authUser: AuthUserPayload, organizationId: string) {
    const organizationIds = this.getScopedOrganizationIds(authUser);

    if (!organizationIds.includes(organizationId)) {
      throw new NotFoundException('Organizacao fora do escopo do usuario.');
    }

    return organizationId;
  }

  private async getEtapaOrFail(id: string, authUser: AuthUserPayload) {
    const organizationIds = this.getScopedOrganizationIds(authUser);
    const etapa = await this.prisma.etapaLicitacao.findFirst({
      where: {
        id,
        organizationId: {
          in: organizationIds,
        },
      },
    });

    if (!etapa) {
      throw new NotFoundException('Etapa nao encontrada.');
    }

    return etapa;
  }

  private normalizeCode(name: string) {
    const normalized = name
      .normalize('NFD')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .toUpperCase();

    return normalized || 'ETAPA';
  }

  private async generateUniqueCode(organizationId: string, name: string) {
    const baseCode = this.normalizeCode(name);
    let code = baseCode;
    let suffix = 2;

    while (
      await this.prisma.etapaLicitacao.findUnique({
        where: {
          organizationId_code: {
            organizationId,
            code,
          },
        },
      })
    ) {
      code = `${baseCode}_${suffix}`;
      suffix += 1;
    }

    return code;
  }

  async list(authUser: AuthUserPayload, organizationId?: string, includeInactive = false) {
    const organizationIds = this.getScopedOrganizationIds(authUser);
    const scopedOrganizationIds = organizationId
      ? organizationIds.includes(organizationId)
        ? [organizationId]
        : []
      : organizationIds;

    if (!scopedOrganizationIds.length) {
      return [];
    }

    return this.prisma.etapaLicitacao.findMany({
      where: {
        organizationId: {
          in: scopedOrganizationIds,
        },
        ...(includeInactive && this.isLumeraOperator(authUser) ? {} : { isActive: true }),
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async create(input: CreateEtapaLicitacaoDto, authUser: AuthUserPayload) {
    const organizationId = this.ensureOrganizationScope(authUser, input.organizationId);
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Informe o nome da coluna.');
    }

    const code = await this.generateUniqueCode(organizationId, trimmedName);
    const aggregate = await this.prisma.etapaLicitacao.aggregate({
      where: { organizationId },
      _max: { sortOrder: true },
    });

    return this.prisma.etapaLicitacao.create({
      data: {
        organizationId,
        name: trimmedName,
        code,
        sortOrder: (aggregate._max.sortOrder ?? 0) + 10,
        isActive: true,
        isSystem: false,
      },
    });
  }

  async update(id: string, input: UpdateEtapaLicitacaoDto, authUser: AuthUserPayload) {
    const etapa = await this.getEtapaOrFail(id, authUser);
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Informe o nome da coluna.');
    }

    return this.prisma.etapaLicitacao.update({
      where: { id: etapa.id },
      data: {
        name: trimmedName,
      },
    });
  }

  async reorder(id: string, direction: 'up' | 'down', authUser: AuthUserPayload) {
    const etapa = await this.getEtapaOrFail(id, authUser);
    const neighbor = await this.prisma.etapaLicitacao.findFirst({
      where: {
        organizationId: etapa.organizationId,
        sortOrder: direction === 'up' ? { lt: etapa.sortOrder } : { gt: etapa.sortOrder },
      },
      orderBy: {
        sortOrder: direction === 'up' ? 'desc' : 'asc',
      },
    });

    if (!neighbor) {
      return etapa;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.etapaLicitacao.update({
        where: { id: etapa.id },
        data: { sortOrder: neighbor.sortOrder },
      });

      await tx.etapaLicitacao.update({
        where: { id: neighbor.id },
        data: { sortOrder: etapa.sortOrder },
      });

      return tx.etapaLicitacao.findUniqueOrThrow({ where: { id: etapa.id } });
    });
  }

  async setStatus(id: string, isActive: boolean, authUser: AuthUserPayload) {
    const etapa = await this.getEtapaOrFail(id, authUser);

    if (!isActive) {
      const activeCount = await this.prisma.etapaLicitacao.count({
        where: {
          organizationId: etapa.organizationId,
          isActive: true,
        },
      });

      if (activeCount <= 1) {
        throw new BadRequestException('Mantenha ao menos uma coluna ativa no fluxo.');
      }

      const licitacoesCount = await this.prisma.licitacao.count({
        where: { etapaId: etapa.id },
      });

      if (licitacoesCount > 0) {
        throw new BadRequestException('Nao e possivel inativar uma coluna que ainda possui licitacoes.');
      }
    }

    return this.prisma.etapaLicitacao.update({
      where: { id: etapa.id },
      data: { isActive },
    });
  }

  async remove(id: string, authUser: AuthUserPayload) {
    const etapa = await this.getEtapaOrFail(id, authUser);
    const licitacoesCount = await this.prisma.licitacao.count({
      where: { etapaId: etapa.id },
    });

    if (licitacoesCount > 0) {
      throw new BadRequestException('Nao e possivel excluir uma coluna que ainda possui licitacoes.');
    }

    if (etapa.isActive) {
      const activeCount = await this.prisma.etapaLicitacao.count({
        where: {
          organizationId: etapa.organizationId,
          isActive: true,
        },
      });

      if (activeCount <= 1) {
        throw new BadRequestException('Mantenha ao menos uma coluna ativa no fluxo.');
      }
    }

    await this.prisma.etapaLicitacao.delete({ where: { id: etapa.id } });
    return { id: etapa.id };
  }
}
