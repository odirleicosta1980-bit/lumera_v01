import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  organizationId!: string;

  @IsString()
  roleCode!: string;

  @IsOptional()
  @IsString()
  clientCompanyId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
