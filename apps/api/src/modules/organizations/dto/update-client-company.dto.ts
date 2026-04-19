import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const COBRANCA_MODELOS = ['FIXO', 'EXITO', 'FIXO_MAIS_EXITO', 'PERSONALIZADO'] as const;
const FORMAS_PAGAMENTO = ['PIX', 'BOLETO', 'TRANSFERENCIA', 'FATURAMENTO', 'OUTRO'] as const;

export class UpdateClientCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  segmento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  taxId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsIn(COBRANCA_MODELOS)
  chargingModel?: (typeof COBRANCA_MODELOS)[number];

  @IsOptional()
  @IsString()
  percentualLumera?: string;

  @IsOptional()
  @IsString()
  valorFixoLumera?: string;

  @IsOptional()
  @IsIn(FORMAS_PAGAMENTO)
  formaPagamento?: (typeof FORMAS_PAGAMENTO)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoesFinanceiras?: string;
}