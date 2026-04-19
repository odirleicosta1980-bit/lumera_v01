import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { AuthUserPayload, LUMERA_OPERATOR_ROLES } from '../auth/types/auth-user-payload.js';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto.js';

@Injectable()
export class TaskTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureOperator(authUser: AuthUserPayload) {
    const isOperator = authUser.memberships.some((membership) =>
      LUMERA_OPERATOR_ROLES.includes(membership.roleCode as (typeof LUMERA_OPERATOR_ROLES)[number]),
    );

    if (!isOperator) {
      throw new NotFoundException('Modelos de tarefa indisponiveis para este perfil');
    }
  }

  async list(organizationId: string, authUser: AuthUserPayload) {
    this.ensureOperator(authUser);

    const allowedOrganizationIds = new Set(authUser.memberships.map((membership) => membership.organizationId));
    if (!allowedOrganizationIds.has(organizationId)) {
      throw new NotFoundException('Organizacao fora do escopo do usuario');
    }

    return this.prisma.taskTemplate.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: [{ title: 'asc' }],
    });
  }

  async create(organizationId: string, input: CreateTaskTemplateDto, authUser: AuthUserPayload) {
    this.ensureOperator(authUser);

    const allowedOrganizationIds = new Set(authUser.memberships.map((membership) => membership.organizationId));
    if (!allowedOrganizationIds.has(organizationId)) {
      throw new NotFoundException('Organizacao fora do escopo do usuario');
    }

    return this.prisma.taskTemplate.upsert({
      where: {
        organizationId_title: {
          organizationId,
          title: input.title,
        },
      },
      update: {
        description: input.description,
        defaultDueDays: input.defaultDueDays,
        isActive: true,
        createdByUserId: authUser.sub,
      },
      create: {
        organizationId,
        title: input.title,
        description: input.description,
        defaultDueDays: input.defaultDueDays,
        createdByUserId: authUser.sub,
      },
    });
  }
}
