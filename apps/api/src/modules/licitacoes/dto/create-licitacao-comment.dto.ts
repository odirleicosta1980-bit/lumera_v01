import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLicitacaoCommentDto {
  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
