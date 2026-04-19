import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
const COBRANCA_MODELOS = ['FIXO', 'EXITO', 'FIXO_MAIS_EXITO', 'PERSONALIZADO'] as const;
const FORMAS_PAGAMENTO = ['PIX', 'BOLETO', 'TRANSFERENCIA', 'FATURAMENTO', 'OUTRO'] as const;
const FINANCEIRO_STATUS = ['NAO_APLICAVEL', 'PENDENTE', 'PARCIAL', 'PAGO', 'ATRASADO'] as const;
export class SetLicitacaoFinanceiroAllocationDto {
  @IsOptional()
  @IsString()
  userId?: string;
  @IsString()
  @MaxLength(120)
  label!: string;
  @IsOptional()
  @IsString()
  percentual?: string;
  @IsOptional()
  @IsString()
  valor?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
export class SetLicitacaoFinanceiroDto {
  @IsOptional()
  @IsString()
  valorEstimadoEdital?: string;
  @IsOptional()
  @IsString()
  valorPropostaEmpresa?: string;
  @IsOptional()
  @IsString()
  valorHomologado?: string;
  @IsString()
  @IsIn(COBRANCA_MODELOS)
  chargingModel!: (typeof COBRANCA_MODELOS)[number];
  @IsOptional()
  @IsString()
  percentualLumera?: string;
  @IsOptional()
  @IsString()
  valorFixoLumera?: string;
  @IsOptional()
  @IsIn(FORMAS_PAGAMENTO)
  formaPagamento?: (typeof FORMAS_PAGAMENTO)[number];
  @IsString()
  @IsIn(FINANCEIRO_STATUS)
  statusFinanceiro!: (typeof FINANCEIRO_STATUS)[number];
  @IsOptional()
  @IsString()
  vencimento?: string;
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SetLicitacaoFinanceiroAllocationDto)
  allocations?: SetLicitacaoFinanceiroAllocationDto[];
}