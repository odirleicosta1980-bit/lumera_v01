import { IsIn } from 'class-validator';

export class ReorderEtapaLicitacaoDto {
  @IsIn(['up', 'down'])
  direction!: 'up' | 'down';
}
