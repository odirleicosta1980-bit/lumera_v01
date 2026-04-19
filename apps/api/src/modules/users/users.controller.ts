import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AuthUserPayload } from '../auth/types/auth-user-payload.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(
    @Req() request: { user: AuthUserPayload },
    @Query('organizationId') organizationId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.usersService.list(request.user, organizationId, includeInactive === 'true');
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Post()
  create(@Body() input: CreateUserDto, @Req() request: { user: AuthUserPayload }) {
    return this.usersService.create(input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() input: UpdateUserDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.usersService.update(id, input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: { user: AuthUserPayload }) {
    return this.usersService.remove(id, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @Req() request: { user: AuthUserPayload }) {
    return this.usersService.reactivate(id, request.user);
  }
}
