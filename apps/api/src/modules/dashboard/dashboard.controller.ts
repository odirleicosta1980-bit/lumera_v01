import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AuthUserPayload } from '../auth/types/auth-user-payload.js';
import { DashboardService } from './dashboard.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(
    @Req() request: { user: AuthUserPayload },
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const parsedMonth = month ? Number(month) : undefined;
    const parsedYear = year ? Number(year) : undefined;

    return this.dashboardService.summary(request.user, {
      month: Number.isInteger(parsedMonth) ? parsedMonth : undefined,
      year: Number.isInteger(parsedYear) ? parsedYear : undefined,
    });
  }

  @Get('executive')
  executive(@Req() request: { user: AuthUserPayload }) {
    return this.dashboardService.executive(request.user);
  }
}
