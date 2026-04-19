import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTaskTemplateDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  defaultDueDays?: number;
}
