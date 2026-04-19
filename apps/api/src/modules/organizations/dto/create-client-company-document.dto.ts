import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const DOCUMENT_STATUSES = ['PENDENTE', 'ENVIADO', 'VALIDO', 'VENCE_EM_BREVE', 'VENCIDO', 'NAO_APLICAVEL'] as const;

export class CreateClientCompanyDocumentDto {
  @IsOptional()
  @IsIn(DOCUMENT_STATUSES)
  status?: (typeof DOCUMENT_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  originalFileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  checksumSha256?: string;
}
