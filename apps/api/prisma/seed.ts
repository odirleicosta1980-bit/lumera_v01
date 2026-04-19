import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    ['licitacoes.view', 'Visualizar licitacoes'],
    ['licitacoes.create', 'Criar licitacoes'],
    ['licitacoes.update', 'Editar licitacoes'],
    ['licitacoes.move', 'Mover licitacoes'],
    ['licitacoes.delete', 'Excluir licitacoes'],
    ['tasks.manage', 'Gerenciar tarefas'],
    ['comments.manage', 'Gerenciar comentarios'],
    ['attachments.manage', 'Gerenciar anexos'],
    ['users.manage', 'Gerenciar usuarios'],
    ['roles.manage', 'Gerenciar perfis'],
    ['audit.view', 'Visualizar auditoria']
  ];

  for (const [code, name] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }

  const roles = [
    ['LUMERA_ADMIN', 'Lumera Admin'],
    ['LUMERA_OPERACIONAL', 'Lumera Operacional'],
    ['CLIENTE_GESTOR', 'Cliente Gestor'],
    ['CLIENTE_CONSULTA', 'Cliente Consulta']
  ];

  for (const [code, name] of roles) {
    await prisma.role.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }

  const lumera = await prisma.organization.upsert({
    where: { slug: 'lumera' },
    update: {},
    create: {
      slug: 'lumera',
      type: 'LUMERA',
      legalName: 'Lumera Consultoria Juridica',
      tradeName: 'Lumera',
    },
  });

  const existingClient = await prisma.clientCompany.findFirst({
    where: {
      organizationId: lumera.id,
      tradeName: 'Empresa Exemplo',
    },
  });

  const client = existingClient ? await prisma.clientCompany.update({
      where: { id: existingClient.id },
      data: { segmento: 'Exemplo operacional' },
    }) :
    await prisma.clientCompany.create({
      data: {
        organizationId: lumera.id,
        legalName: 'Empresa Exemplo LTDA',
        tradeName: 'Empresa Exemplo',
        segmento: 'Exemplo operacional',
      },
    });

  const etapas = [
    ['RECEBIDO', 'Recebido', 10],
    ['AG_PUBLICACAO_EDITAL', 'Ag. Publicacao Edital', 20],
    ['LIC_ATIVA', 'Lic Ativa', 30],
    ['OUTRAS_DEMANDAS', 'Outras Demandas', 40],
    ['EM_ANALISE_INICIAL', 'Em Analise Inicial', 50],
    ['ELABORACAO', 'Elaboracao', 60],
    ['FASE_EXTERNA', 'Fase Externa', 70]
  ] as const;

  for (const [code, name, sortOrder] of etapas) {
    await prisma.etapaLicitacao.upsert({
      where: {
        organizationId_code: {
          organizationId: lumera.id,
          code,
        },
      },
      update: { name, sortOrder, isSystem: true, isActive: true },
      create: {
        organizationId: lumera.id,
        code,
        name,
        sortOrder,
        isSystem: true,
      },
    });
  }

  const taskTemplates = [
    ['Solicitar documentos da empresa', 'Solicitar e conferir a documentacao inicial da empresa participante.', 2],
    ['Analisar edital', 'Revisar edital, prazos, anexos e exigencias de habilitacao.', 1],
    ['Conferir habilitacao', 'Validar documentos de habilitacao e pendencias da empresa.', 3],
    ['Preparar esclarecimento ou impugnacao', 'Avaliar necessidade de pedido de esclarecimento ou impugnacao ao edital.', 2],
    ['Acompanhar sessao publica', 'Monitorar a sessao publica e registrar ocorrencias relevantes.', 0],
  ] as const;

  for (const [title, description, defaultDueDays] of taskTemplates) {
    await prisma.taskTemplate.upsert({
      where: {
        organizationId_title: {
          organizationId: lumera.id,
          title,
        },
      },
      update: {
        description,
        defaultDueDays,
        isActive: true,
      },
      create: {
        organizationId: lumera.id,
        title,
        description,
        defaultDueDays,
        isActive: true,
      },
    });
  }
  const companyDocumentTypes = [
    ['CONTRATO_SOCIAL', 'Contrato Social ou Estatuto Social vigente', 'HABILITACAO_JURIDICA', true, false, 10, 'Ultimos dois anos, com alteracoes ou consolidado.'],
    ['CARTAO_CNPJ', 'Cartao do CNPJ', 'HABILITACAO_JURIDICA', true, false, 20, 'Comprovante de inscricao e situacao cadastral.'],
    ['DOCUMENTO_SOCIOS', 'Documento de identificacao dos socios', 'HABILITACAO_JURIDICA', true, false, 30, 'RG e CPF ou CNH dos socios.'],
    ['CND_FEDERAL', 'Certidao Negativa de Debitos Federais', 'REGULARIDADE_FISCAL_TRABALHISTA', true, true, 40, 'Tributos Federais e Divida Ativa da Uniao.'],
    ['CND_ESTADUAL', 'Certidao de Regularidade Fiscal Estadual', 'REGULARIDADE_FISCAL_TRABALHISTA', true, true, 50, 'Certidao estadual vigente.'],
    ['CND_MUNICIPAL', 'Certidao de Regularidade Fiscal Municipal', 'REGULARIDADE_FISCAL_TRABALHISTA', true, true, 60, 'Certidao municipal vigente.'],
    ['CRF_FGTS', 'Certificado de Regularidade do FGTS', 'REGULARIDADE_FISCAL_TRABALHISTA', true, true, 70, 'CRF emitido pela Caixa Economica Federal.'],
    ['CNDT', 'Certidao Negativa de Debitos Trabalhistas', 'REGULARIDADE_FISCAL_TRABALHISTA', true, true, 80, 'Certidao trabalhista vigente.'],
    ['BALANCO_DRE', 'Balanco Patrimonial e DRE', 'QUALIFICACAO_ECONOMICO_FINANCEIRA', true, false, 90, 'Ultimo exercicio social.'],
    ['CERTIDAO_FALENCIA', 'Certidao de Falencia ou Recuperacao Judicial', 'QUALIFICACAO_ECONOMICO_FINANCEIRA', true, true, 100, 'Expedida pelo distribuidor da sede da empresa.'],
    ['SICAF', 'Comprovante de cadastro ativo no SICAF', 'CADASTRO_SISTEMA_ELETRONICO', false, false, 110, 'Documento opcional, quando aplicavel.'],
    ['CICAD', 'CICAD', 'OUTROS_DOCUMENTOS', true, true, 120, 'Cadastro estadual, quando exigido.'],
    ['CERTIDAO_SIMPLIFICADA', 'Certidao Simplificada', 'OUTROS_DOCUMENTOS', true, true, 130, 'Emitida pela Junta Comercial.'],
    ['ALVARA_FUNCIONAMENTO', 'Alvara de Funcionamento', 'OUTROS_DOCUMENTOS', true, true, 140, 'Alvara vigente.'],
    ['LICENCA_SANITARIA', 'Licenca Sanitaria', 'OUTROS_DOCUMENTOS', true, true, 150, 'Quando aplicavel ao ramo da empresa.'],
    ['SINTEGRA', 'Sintegra', 'OUTROS_DOCUMENTOS', true, true, 160, 'Comprovante de inscricao estadual.'],
    ['CARTAO_IDENTIFICACAO', 'Cartao de Identificacao', 'OUTROS_DOCUMENTOS', true, false, 170, 'Documento complementar exigido em alguns processos.'],
    ['CREA', 'Crea', 'OUTROS_DOCUMENTOS', false, true, 180, 'Registro no conselho, quando aplicavel.'],
  ] as const;

  for (const [code, name, group, isRequired, requiresExpiration, sortOrder, description] of companyDocumentTypes) {
    await prisma.clientCompanyDocumentType.upsert({
      where: {
        organizationId_code: {
          organizationId: lumera.id,
          code,
        },
      },
      update: {
        name,
        group: group as any,
        isRequired,
        requiresExpiration,
        sortOrder,
        description,
        isSystem: true,
        warningDays: 30,
      },
      create: {
        organizationId: lumera.id,
        code,
        name,
        group: group as any,
        isRequired,
        requiresExpiration,
        sortOrder,
        description,
        isSystem: true,
        warningDays: 30,
      },
    });
  }

  const lumeraPasswordHash = await argon2.hash('Lumera@123');
  const clientPasswordHash = await argon2.hash('Cliente@123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumera.local' },
    update: { name: 'Administrador Lumera', passwordHash: lumeraPasswordHash },
    create: {
      email: 'admin@lumera.local',
      name: 'Administrador Lumera',
      passwordHash: lumeraPasswordHash,
    },
  });

  const clienteGestor = await prisma.user.upsert({
    where: { email: 'gestor@empresaexemplo.local' },
    update: { name: 'Gestor Empresa Exemplo', passwordHash: clientPasswordHash },
    create: {
      email: 'gestor@empresaexemplo.local',
      name: 'Gestor Empresa Exemplo',
      passwordHash: clientPasswordHash,
    },
  });

  const clienteConsulta = await prisma.user.upsert({
    where: { email: 'consulta@empresaexemplo.local' },
    update: { name: 'Consulta Empresa Exemplo', passwordHash: clientPasswordHash },
    create: {
      email: 'consulta@empresaexemplo.local',
      name: 'Consulta Empresa Exemplo',
      passwordHash: clientPasswordHash,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'LUMERA_ADMIN' } });
  const clienteGestorRole = await prisma.role.findUniqueOrThrow({ where: { code: 'CLIENTE_GESTOR' } });
  const clienteConsultaRole = await prisma.role.findUniqueOrThrow({ where: { code: 'CLIENTE_CONSULTA' } });

  const memberships = [
    {
      userId: admin.id,
      organizationId: lumera.id,
      roleId: adminRole.id,
      scopeType: 'ORGANIZATION' as const,
      clientCompanyId: client.id,
    },
    {
      userId: clienteGestor.id,
      organizationId: lumera.id,
      roleId: clienteGestorRole.id,
      scopeType: 'CLIENT_COMPANY' as const,
      clientCompanyId: client.id,
    },
    {
      userId: clienteConsulta.id,
      organizationId: lumera.id,
      roleId: clienteConsultaRole.id,
      scopeType: 'CLIENT_COMPANY' as const,
      clientCompanyId: client.id,
    },
  ];

  for (const membershipData of memberships) {
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: membershipData.userId,
        organizationId: membershipData.organizationId,
        roleId: membershipData.roleId,
        clientCompanyId: membershipData.clientCompanyId,
      },
    });

    if (!existingMembership) {
      await prisma.membership.create({
        data: membershipData,
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

