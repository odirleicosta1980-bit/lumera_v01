import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AuthUserPayload } from '../auth/types/auth-user-payload.js';
import { CreateEtapaLicitacaoDto } from './dto/create-etapa-licitacao.dto.js';
import { ReorderEtapaLicitacaoDto } from './dto/reorder-etapa-licitacao.dto.js';
import { SetEtapaLicitacaoStatusDto } from './dto/set-etapa-licitacao-status.dto.js';
import { UpdateEtapaLicitacaoDto } from './dto/update-etapa-licitacao.dto.js';
import { EtapasLicitacaoService } from './etapas-licitacao.service.js';

@UseGuards(JwtAuthGuard)
@Controller('etapas-licitacao')
export class EtapasLicitacaoController {
  constructor(private readonly etapasLicitacaoService: EtapasLicitacaoService) {}

  @Get()
  list(
    @Req() request: { user: AuthUserPayload },
    @Query('organizationId') organizationId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.etapasLicitacaoService.list(request.user, organizationId, includeInactive === 'true');
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Post()
  create(@Body() input: CreateEtapaLicitacaoDto, @Req() request: { user: AuthUserPayload }) {
    return this.etapasLicitacaoService.create(input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() input: UpdateEtapaLicitacaoDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.etapasLicitacaoService.update(id, input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Patch(':id/order')
  reorder(
    @Param('id') id: string,
    @Body() input: ReorderEtapaLicitacaoDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.etapasLicitacaoService.reorder(id, input.direction, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body() input: SetEtapaLicitacaoStatusDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.etapasLicitacaoService.setStatus(id, input.isActive, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: { user: AuthUserPayload }) {
    return this.etapasLicitacaoService.remove(id, request.user);
  }
}
