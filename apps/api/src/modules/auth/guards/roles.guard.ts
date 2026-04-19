import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/roles-key.js';
import { AuthUserPayload } from '../types/auth-user-payload.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUserPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario autenticado nao encontrado');
    }

    const hasRequiredRole = user.memberships.some((membership) => requiredRoles.includes(membership.roleCode));

    if (!hasRequiredRole) {
      throw new ForbiddenException('Perfil sem permissao para esta operacao');
    }

    return true;
  }
}
