import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthUserPayload } from './types/auth-user-payload.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const memberships = user.memberships.map((membership) => ({
      membershipId: membership.id,
      organizationId: membership.organizationId,
      clientCompanyId: membership.clientCompanyId,
      scopeType: membership.scopeType,
      roleCode: membership.role.code,
    }));

    const payload: AuthUserPayload = {
      sub: user.id,
      email: user.email,
      memberships,
    };

    const accessExpiresIn = process.env.JWT_ACCESS_TTL ?? '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_TTL ?? '7d';

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessExpiresIn as never,
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpiresIn as never,
      }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        memberships,
      },
    };
  }

  async me(authUser: AuthUserPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            role: true,
            organization: true,
            clientCompany: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      lastLoginAt: user.lastLoginAt,
      memberships: user.memberships.map((membership) => ({
        membershipId: membership.id,
        organizationId: membership.organizationId,
        organizationName: membership.organization.tradeName ?? membership.organization.legalName,
        clientCompanyId: membership.clientCompanyId,
        clientCompanyName: membership.clientCompany?.tradeName ?? membership.clientCompany?.legalName ?? null,
        scopeType: membership.scopeType,
        roleCode: membership.role.code,
        roleName: membership.role.name,
      })),
    };
  }
}
