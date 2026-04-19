import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const EMPENHO_ATTACHMENT_CATEGORIES = ['DOCUMENTO_EMPENHO', 'BOLETO', 'COMPROVANTE_PAGAMENTO', 'OUTRO'] as const;

export class CreateEmpenhoAttachmentDto {
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

  @IsString()
  @IsIn(EMPENHO_ATTACHMENT_CATEGORIES)
  category!: (typeof EMPENHO_ATTACHMENT_CATEGORIES)[number];
}