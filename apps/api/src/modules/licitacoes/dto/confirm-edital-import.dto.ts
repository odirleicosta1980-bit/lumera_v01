import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateLicitacaoAttachmentDto } from './create-licitacao-attachment.dto.js';
import { CreateLicitacaoItemDto } from './create-licitacao-item.dto.js';

export class ConfirmEditalImportDto {
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
  @IsString()
  orgao?: string;

  @IsOptional()
  @IsString()
  modalidade?: string;

  @IsOptional()
  @IsString()
  valorEstimado?: string;

  @IsOptional()
  @IsDateString()
  dataSessao?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  responsavelIds?: string[];

  @ValidateNested()
  @Type(() => CreateLicitacaoAttachmentDto)
  edital!: CreateLicitacaoAttachmentDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLicitacaoItemDto)
  itens!: CreateLicitacaoItemDto[];
}