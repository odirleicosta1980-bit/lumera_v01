import { IsBoolean } from 'class-validator';

export class SetEtapaLicitacaoStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
