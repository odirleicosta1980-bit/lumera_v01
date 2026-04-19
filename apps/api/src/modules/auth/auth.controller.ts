import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthUserPayload } from './types/auth-user-payload.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: { user: AuthUserPayload }) {
    return this.authService.me(request.user);
  }
}
