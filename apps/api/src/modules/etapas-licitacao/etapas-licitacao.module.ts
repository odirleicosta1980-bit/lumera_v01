import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EtapasLicitacaoController } from './etapas-licitacao.controller.js';
import { EtapasLicitacaoService } from './etapas-licitacao.service.js';

@Module({
  imports: [AuthModule],
  controllers: [EtapasLicitacaoController],
  providers: [EtapasLicitacaoService],
})
export class EtapasLicitacaoModule {}
