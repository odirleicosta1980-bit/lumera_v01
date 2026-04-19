import { IsString } from 'class-validator';

export class CreateEtapaLicitacaoDto {
  @IsString()
  organizationId!: string;

  @IsString()
  name!: string;
}
