import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AuthUserPayload } from '../auth/types/auth-user-payload.js';
import { CreateClientCompanyDto } from './dto/create-client-company.dto.js';
import { CreateClientCompanyDocumentDto } from './dto/create-client-company-document.dto.js';
import { UpdateClientCompanyDto } from './dto/update-client-company.dto.js';
import { OrganizationsService } from './organizations.service.js';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list(@Req() request: { user: AuthUserPayload }) {
    return this.organizationsService.list(request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Post(':organizationId/client-companies')
  createClientCompany(
    @Param('organizationId') organizationId: string,
    @Body() input: CreateClientCompanyDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.organizationsService.createClientCompany(organizationId, input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Patch(':organizationId/client-companies/:clientCompanyId')
  updateClientCompany(
    @Param('organizationId') organizationId: string,
    @Param('clientCompanyId') clientCompanyId: string,
    @Body() input: UpdateClientCompanyDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.organizationsService.updateClientCompany(organizationId, clientCompanyId, input, request.user);
  }

  @UseGuards(RolesGuard)
  @Roles('LUMERA_ADMIN', 'LUMERA_OPERACIONAL')
  @Put(':organizationId/client-companies/:clientCompanyId/documents/:documentTypeId')
  upsertClientCompanyDocument(
    @Param('organizationId') organizationId: string,
    @Param('clientCompanyId') clientCompanyId: string,
    @Param('documentTypeId') documentTypeId: string,
    @Body() input: CreateClientCompanyDocumentDto,
    @Req() request: { user: AuthUserPayload },
  ) {
    return this.organizationsService.upsertClientCompanyDocument(
      organizationId,
      clientCompanyId,
      documentTypeId,
      input,
      request.user,
    );
  }
}
