import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ITEM_STATUS = ['PENDENTE', 'EM_PRECIFICACAO', 'PRECIFICADO', 'DESCARTADO'] as const;

export class UpdateLicitacaoItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroItem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroLote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  quantidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  valorReferencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  valorProposto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  marcaModelo?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  @IsIn(ITEM_STATUS)
  status?: (typeof ITEM_STATUS)[number];
}