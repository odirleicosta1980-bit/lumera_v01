import { IsBoolean } from 'class-validator';

export class SetClientCompanyStatusDto {
  @IsBoolean()
  isActive!: boolean;
}