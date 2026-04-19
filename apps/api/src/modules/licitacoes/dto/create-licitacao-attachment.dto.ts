import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const ATTACHMENT_CATEGORIES = ['GENERAL', 'EDITAL_BASE', 'DOCUMENTO_EMPENHO', 'BOLETO', 'COMPROVANTE_PAGAMENTO', 'OUTRO'] as const;

export class CreateLicitacaoAttachmentDto {
  @IsString()
  fileName!: string;

  @IsString()
  originalFileName!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsString()
  storageKey!: string;

  @IsOptional()
  @IsString()
  checksumSha256?: string;

  @IsOptional()
  @IsString()
  @IsIn(ATTACHMENT_CATEGORIES)
  category?: (typeof ATTACHMENT_CATEGORIES)[number];
}