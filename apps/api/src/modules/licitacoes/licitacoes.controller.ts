import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { LicitacoesService } from './licitacoes.service.js';
import { CreateLicitacaoDto } from './dto/create-licitacao.dto.js';
import { UpdateLicitacaoBasicsDto } from './dto/update-licitacao-basics.dto.js';
import { MoveLicitacaoEtapaDto } from './dto/move-licitacao-etapa.dto.js';
import { CreateLicitacaoTaskDto } from './dto/create-licitacao-task.dto.js';
import { UpdateLicitacaoTaskStatusDto } from './dto/update-licitacao-task-status.dto.js';
import { CreateLicitacaoCommentDto } from './dto/create-licitacao-comment.dto.js';
import { CreateLicitacaoAttachmentDto } from './dto/create-licitacao-attachment.dto.js';
import { SetLicitacaoResponsaveisDto } from './dto/set-licitacao-responsaveis.dto.js';
import { CreateLicitacaoItemDto } from './dto/create-licitacao-item.dto.js';
import { UpdateLicitacaoItemDto } from './dto/update-licitacao-item.dto.js';
import { CreateLicitacaoEmpenhoDto } from './dto/create-licitacao-empenho.dto.js';
import { SetLicitacaoFinanceiroDto } from './dto/set-licitacao-financeiro.dto.js';
import type { AuthUserPayload } from '../auth/types/auth-user-payload.js';
import { AnalyzeEditalImportDto } from './dto/analyze-edital-import.dto.js';
import { ConfirmEditalImportDto } from './dto/confirm-edital-import.dto.js';

@Controller('licitacoes')
@UseGuards(JwtAuthGuard)
export class LicitacoesController {
  constructor(private readonly licitacoesService: LicitacoesService) {}

  @Get()
  list(@Req() request: { user: AuthUserPayload }) {
    return this.licitacoesService.list(request.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: { user: AuthUserPayload }) {
    return this.licitacoesService.findOne(id, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Patch(':id')
  updateBasics(
    @Param('id') id: string,
    @Body() input: UpdateLicitacaoBasicsDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.updateBasics(id, input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Post()
  create(@Body() input: CreateLicitacaoDto, @Req() request: { user: AuthUserPayload }) {
    return this.licitacoesService.create(input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Patch(':id/etapa')
  updateEtapa(
    @Param('id') id: string,
    @Body() input: MoveLicitacaoEtapaDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.moveToEtapa(id, input.etapaId, request.user, input.sortOrder);
  }

  @Put(':id/responsaveis')
  setResponsaveis(
    @Param('id') id: string,
    @Body() input: SetLicitacaoResponsaveisDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.setResponsaveis(id, input.userIds, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Put(':id/financeiro')
  setFinanceiro(
    @Param('id') id: string,
    @Body() input: SetLicitacaoFinanceiroDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.setFinanceiro(id, input, request.user);
  }

  @Post(':id/tarefas')
  createTask(
    @Param('id') id: string,
    @Body() input: CreateLicitacaoTaskDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.createTask(id, input, request.user);
  }

  @Patch(':id/tarefas/:taskId')
  updateTaskStatus(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() input: UpdateLicitacaoTaskStatusDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.updateTaskStatus(id, taskId, input.status, request.user);
  }

  @Post(':id/comentarios')
  createComment(
    @Param('id') id: string,
    @Body() input: CreateLicitacaoCommentDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.createComment(id, input, request.user);
  }

  @Post(':id/itens')
  createItem(
    @Param('id') id: string,
    @Body() input: CreateLicitacaoItemDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.createItem(id, input, request.user);
  }

  @Patch(':id/itens/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() input: UpdateLicitacaoItemDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.updateItem(id, itemId, input, request.user);
  }

  @Delete(':id/itens/:itemId')
  deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.deleteItem(id, itemId, request.user);
  }

  @Post(':id/empenhos')
  createEmpenho(
    @Param('id') id: string,
    @Body() input: CreateLicitacaoEmpenhoDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.createEmpenho(id, input, request.user);
  }

  @Patch(':id/empenhos/:empenhoId')
  updateEmpenho(
    @Param('id') id: string,
    @Param('empenhoId') empenhoId: string,
    @Body() input: CreateLicitacaoEmpenhoDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.updateEmpenho(id, empenhoId, input, request.user);
  }

  @Post(':id/empenhos/:empenhoId/anexos')
  createEmpenhoAttachment(
    @Param('id') id: string,
    @Param('empenhoId') empenhoId: string,
    @Body() input: any,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.createEmpenhoAttachment(id, empenhoId, input, request.user);
  }

  @Post(':id/anexos')
  createAttachment(
    @Param('id') id: string,
    @Body() input: CreateLicitacaoAttachmentDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.createAttachment(id, input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Post('import-editais')
  importEdital(@Body() input: AnalyzeEditalImportDto, @Req() request: { user: AuthUserPayload }) {
    return this.licitacoesService.analyzeEditalImport(input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Post('import-editais/confirm')
  confirmImportedEdital(
    @Body() input: ConfirmEditalImportDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.licitacoesService.confirmEditalImport(input, request.user);
  }
}
