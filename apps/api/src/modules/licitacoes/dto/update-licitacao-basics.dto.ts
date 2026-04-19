import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLicitacaoBasicsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  numeroProcesso?: string;

  @IsOptional()
  @IsDateString()
  dataSessao?: string;
}
