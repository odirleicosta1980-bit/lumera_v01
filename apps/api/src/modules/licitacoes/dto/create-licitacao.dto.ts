import { IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLicitacaoDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  clientCompanyId!: string;

  @IsUUID()
  etapaId!: string;

  @IsString()
  @MaxLength(255)
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  numeroProcesso?: string;

  @IsOptional()
  @IsDateString()
  dataSessao?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  responsavelIds?: string[];
}
