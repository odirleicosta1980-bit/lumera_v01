import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TaskTemplatesController } from './task-templates.controller.js';
import { TaskTemplatesService } from './task-templates.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TaskTemplatesController],
  providers: [TaskTemplatesService],
})
export class TaskTemplatesModule {}
