import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { AuthUserPayload, LUMERA_OPERATOR_ROLES } from '../auth/types/auth-user-payload.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    memberships: Array<{
      id: string;
      organizationId: string;
      clientCompanyId: string | null;
      role: { code: string; name: string };
      clientCompany: { tradeName: string | null; legalName: string } | null;
    }>;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      memberships: user.memberships.map((membership) => ({
        id: membership.id,
        organizationId: membership.organizationId,
        clientCompanyId: membership.clientCompanyId,
        clientCompanyName: membership.clientCompany?.tradeName ?? membership.clientCompany?.legalName ?? null,
        roleCode: membership.role.code,
        roleName: membership.role.name,
      })),
    };
  }

  private ensureLumeraAdmin(authUser: AuthUserPayload, organizationId?: string) {
    const adminMembership = authUser.memberships.find(
      (membership) =>
        membership.roleCode === 'LUMERA_ADMIN' &&
        (!organizationId || membership.organizationId === organizationId),
    );

    if (!adminMembership) {
      throw new BadRequestException('Somente um usuario Lumera Admin pode gerenciar manutencao de usuarios.');
    }

    return adminMembership;
  }

  async list(authUser: AuthUserPayload, organizationId?: string, includeInactive = false) {
    const organizationIds = Array.from(new Set(authUser.memberships.map((membership) => membership.organizationId)));
    const scopedOrganizationIds = organizationId
      ? organizationIds.includes(organizationId)
        ? [organizationId]
        : []
      : organizationIds;

    if (!scopedOrganizationIds.length) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        memberships: {
          some: {
            organizationId: {
              in: scopedOrganizationIds,
            },
            ...(includeInactive ? {} : { isActive: true }),
          },
        },
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
      include: {
        memberships: {
          where: {
            organizationId: {
              in: scopedOrganizationIds,
            },
            ...(includeInactive ? {} : { isActive: true }),
          },
          include: {
            role: true,
            clientCompany: true,
          },
        },
      },
    });

    return users.map((user) => this.mapUser(user));
  }

  async create(input: CreateUserDto, authUser: AuthUserPayload) {
    const canManage = authUser.memberships.some((membership) =>
      LUMERA_OPERATOR_ROLES.includes(membership.roleCode as (typeof LUMERA_OPERATOR_ROLES)[number]),
    );

    if (!canManage) {
      throw new BadRequestException('Somente a equipe Lumera pode cadastrar usuarios.');
    }

    const allowedOrganizationIds = new Set(authUser.memberships.map((membership) => membership.organizationId));
    if (!allowedOrganizationIds.has(input.organizationId)) {
      throw new NotFoundException('Organizacao fora do escopo do usuario.');
    }

    const role = await this.prisma.role.findUnique({
      where: { code: input.roleCode },
    });

    if (!role) {
      throw new NotFoundException('Perfil nao encontrado.');
    }

    const isClientRole = input.roleCode.startsWith('CLIENTE_');
    let clientCompanyId: string | null = null;
    let scopeType: 'ORGANIZATION' | 'CLIENT_COMPANY' = 'ORGANIZATION';

    if (isClientRole) {
      if (!input.clientCompanyId) {
        throw new BadRequestException('Selecione a empresa participante para usuarios do cliente.');
      }

      const company = await this.prisma.clientCompany.findFirst({
        where: {
          id: input.clientCompanyId,
          organizationId: input.organizationId,
          isActive: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa participante nao encontrada ou inativa.');
      }

      clientCompanyId = company.id;
      scopeType = 'CLIENT_COMPANY';
    }

    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Ja existe um usuario com este e-mail.');
    }

    const passwordHash = await argon2.hash(input.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          isActive: true,
          memberships: {
            create: {
              organizationId: input.organizationId,
              roleId: role.id,
              scopeType,
              clientCompanyId,
              isActive: true,
            },
          },
        },
        include: {
          memberships: {
            include: {
              role: true,
              clientCompany: true,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: input.organizationId,
          entityType: 'USUARIO',
          entityId: user.id,
          action: 'USER_CREATED',
          description: `Usuario ${user.name} cadastrado no sistema`,
          metadata: {
            roleCode: role.code,
            clientCompanyId,
          },
        },
      });

      return this.mapUser(user);
    });
  }

  async update(userId: string, input: UpdateUserDto, authUser: AuthUserPayload) {
    this.ensureLumeraAdmin(authUser, input.organizationId);

    const role = await this.prisma.role.findUnique({
      where: { code: input.roleCode },
    });

    if (!role) {
      throw new NotFoundException('Perfil nao encontrado.');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
        memberships: {
          some: {
            isActive: true,
            organizationId: input.organizationId,
          },
        },
      },
      include: {
        memberships: {
          where: {
            isActive: true,
            organizationId: input.organizationId,
          },
          include: {
            role: true,
            clientCompany: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario nao encontrado no escopo informado.');
    }

    const targetMembership = targetUser.memberships[0];
    if (!targetMembership) {
      throw new NotFoundException('Vinculo ativo do usuario nao encontrado.');
    }

    const isClientRole = input.roleCode.startsWith('CLIENTE_');
    let clientCompanyId: string | null = null;
    let scopeType: 'ORGANIZATION' | 'CLIENT_COMPANY' = 'ORGANIZATION';

    if (isClientRole) {
      if (!input.clientCompanyId) {
        throw new BadRequestException('Selecione a empresa participante para usuarios do cliente.');
      }

      const company = await this.prisma.clientCompany.findFirst({
        where: {
          id: input.clientCompanyId,
          organizationId: input.organizationId,
          isActive: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa participante nao encontrada ou inativa.');
      }

      clientCompanyId = company.id;
      scopeType = 'CLIENT_COMPANY';
    }

    if (targetUser.email === authUser.email && input.roleCode !== 'LUMERA_ADMIN') {
      throw new BadRequestException('Nao e permitido remover o proprio perfil de Lumera Admin.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: input.name?.trim() || undefined,
          email: input.email?.trim().toLowerCase() || undefined,
          memberships: {
            update: {
              where: { id: targetMembership.id },
              data: {
                roleId: role.id,
                clientCompanyId,
                scopeType,
              },
            },
          },
        },
        include: {
          memberships: {
            where: {
              isActive: true,
              organizationId: input.organizationId,
            },
            include: {
              role: true,
              clientCompany: true,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: input.organizationId,
          entityType: 'USUARIO',
          entityId: updatedUser.id,
          action: 'USER_UPDATED',
          description: `Usuario ${updatedUser.name} teve o perfil atualizado`,
          metadata: {
            roleCode: role.code,
            clientCompanyId,
          },
        },
      });

      return this.mapUser(updatedUser);
    });
  }

  async remove(userId: string, authUser: AuthUserPayload) {
    const adminMembership = this.ensureLumeraAdmin(authUser);

    if (authUser.sub === userId) {
      throw new BadRequestException('Nao e permitido inativar o proprio usuario.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: true,
      },
    });

    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundException('Usuario nao encontrado ou ja inativo.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.membership.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await tx.activityLog.create({
        data: {
          organizationId: adminMembership.organizationId,
          entityType: 'USUARIO',
          entityId: userId,
          action: 'USER_DEACTIVATED',
          description: `Usuario ${targetUser.name} foi inativado`,
        },
      });
    });

    return { success: true };
  }

  async reactivate(userId: string, authUser: AuthUserPayload) {
    const adminMembership = this.ensureLumeraAdmin(authUser);

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    if (targetUser.isActive) {
      throw new BadRequestException('Usuario ja esta ativo.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      await tx.membership.updateMany({
        where: {
          userId,
          organizationId: adminMembership.organizationId,
        },
        data: { isActive: true },
      });

      await tx.activityLog.create({
        data: {
          organizationId: adminMembership.organizationId,
          entityType: 'USUARIO',
          entityId: userId,
          action: 'USER_REACTIVATED',
          description: `Usuario ${targetUser.name} foi reativado`,
        },
      });
    });

    return { success: true };
  }
}
