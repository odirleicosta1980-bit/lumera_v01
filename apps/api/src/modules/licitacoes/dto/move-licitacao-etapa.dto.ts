import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MoveLicitacaoEtapaDto {
  @IsUUID()
  etapaId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}