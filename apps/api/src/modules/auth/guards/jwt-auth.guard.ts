import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUserPayload } from '../types/auth-user-payload.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: AuthUserPayload }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de acesso ausente');
    }

    const token = authorization.slice('Bearer '.length).trim();

    try {
      const payload = await this.jwtService.verifyAsync<AuthUserPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token de acesso invalido');
    }
  }
}
