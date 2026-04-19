import { IsString } from 'class-validator';

export class UpdateEtapaLicitacaoDto {
  @IsString()
  name!: string;
}
