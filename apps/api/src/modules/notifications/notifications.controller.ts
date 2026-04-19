import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthUserPayload } from '../auth/types/auth-user-payload.js';
import { NotificationsService } from './notifications.service.js';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() request: { user: AuthUserPayload }) {
    return this.notificationsService.list(request.user);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() request: { user: AuthUserPayload }) {
    return this.notificationsService.markAsRead(id, request.user);
  }
}
