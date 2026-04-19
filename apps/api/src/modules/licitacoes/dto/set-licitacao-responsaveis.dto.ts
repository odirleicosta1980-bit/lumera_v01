import { IsArray, IsUUID } from 'class-validator';

export class SetLicitacaoResponsaveisDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds!: string[];
}
