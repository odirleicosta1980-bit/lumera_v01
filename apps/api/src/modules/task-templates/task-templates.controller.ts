import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AuthUserPayload } from '../auth/types/auth-user-payload.js';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto.js';
import { TaskTemplatesService } from './task-templates.service.js';

@UseGuards(JwtAuthGuard)
@Controller('task-templates')
export class TaskTemplatesController {
  constructor(private readonly taskTemplatesService: TaskTemplatesService) {}

  @Get()
  list(@Query('organizationId') organizationId: string, @Req() request: { user: AuthUserPayload }) {
    return this.taskTemplatesService.list(organizationId, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Post()
  create(
    @Query('organizationId') organizationId: string,
    @Body() input: CreateTaskTemplateDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.taskTemplatesService.create(organizationId, input, request.user);
  }
}
