import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { AuthUserPayload, LUMERA_OPERATOR_ROLES } from '../auth/types/auth-user-payload.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private isLumeraOperator(authUser: AuthUserPayload) {
    return authUser.memberships.some((membership) =>
      LUMERA_OPERATOR_ROLES.includes(membership.roleCode as (typeof LUMERA_OPERATOR_ROLES)[number]),
    );
  }

  async list(authUser: AuthUserPayload) {
    if (!this.isLumeraOperator(authUser)) {
      return [];
    }

    return this.prisma.notification.findMany({
      where: { userId: authUser.sub },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
  }

  async markAsRead(id: string, authUser: AuthUserPayload) {
    if (!this.isLumeraOperator(authUser)) {
      return null;
    }

    return this.prisma.notification.updateMany({
      where: {
        id,
        userId: authUser.sub,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }
}
