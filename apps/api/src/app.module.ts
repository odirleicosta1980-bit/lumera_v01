import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { EtapasLicitacaoModule } from './modules/etapas-licitacao/etapas-licitacao.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { LicitacoesModule } from './modules/licitacoes/licitacoes.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { TaskTemplatesModule } from './modules/task-templates/task-templates.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    DashboardModule,
    EtapasLicitacaoModule,
    OrganizationsModule,
    UsersModule,
    TaskTemplatesModule,
    NotificationsModule,
    LicitacoesModule,
  ],
})
export class AppModule {}
