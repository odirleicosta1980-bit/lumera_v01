import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLicitacaoEmpenhoDto {
  @IsString()
  @MaxLength(120)
  codigoEmpenho!: string;

  @IsString()
  @MaxLength(50)
  valor!: string;

  @IsOptional()
  @IsString()
  dataEmpenho?: string;

  @IsOptional()
  @IsString()
  dataPagamentoEmpenho?: string;

  @IsOptional()
  @IsString()
  dataGeracaoBoleto?: string;

  @IsOptional()
  @IsString()
  dataPagamentoBoleto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}