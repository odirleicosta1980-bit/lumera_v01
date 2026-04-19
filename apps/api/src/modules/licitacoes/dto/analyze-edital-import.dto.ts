import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AnalyzeEditalImportDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(255)
  originalFileName!: string;

  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsString()
  storageKey!: string;

  @IsString()
  contentBase64!: string;

  @IsOptional()
  @IsString()
  checksumSha256?: string;
}