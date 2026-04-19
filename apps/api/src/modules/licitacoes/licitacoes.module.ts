import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { LicitacoesController } from './licitacoes.controller.js';
import { LicitacoesService } from './licitacoes.service.js';

@Module({
  imports: [AuthModule],
  controllers: [LicitacoesController],
  providers: [LicitacoesService],
})
export class LicitacoesModule {}
