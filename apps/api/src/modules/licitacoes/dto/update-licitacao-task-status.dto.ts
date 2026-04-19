import { IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateLicitacaoTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
