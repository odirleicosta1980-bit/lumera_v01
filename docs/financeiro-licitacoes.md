# Financeiro das licitacoes

## Objetivo

Este documento define a primeira proposta de modelagem funcional e tecnica para os dados financeiros do sistema Lumera, evitando retrabalho antes da implementacao.

A premissa principal e separar claramente:

- dados financeiros da licitacao
- dados financeiros da relacao comercial entre a empresa participante e a Lumera

Essa separacao evita misturar o valor do processo licitatorio com honorarios, encargos e cobrancas da operacao da Lumera.

## Separacao de conceitos

### 1. Financeiro da licitacao

Representa os valores relacionados ao processo licitatorio em si.

Campos recomendados:

- valorEstimadoEdital
  - valor estimado publicado no edital ou termo de referencia
- valorPropostaEmpresa
  - valor da proposta apresentada pela empresa participante
- valorHomologado
  - valor final homologado/adjudicado, quando houver
- moeda
  - padrao inicial BRL
- observacoesFinanceirasLicitacao
  - campo livre para anotacoes sobre valores do processo

### 2. Financeiro da Lumera

Representa a relacao comercial da Lumera com a empresa participante.

Campos recomendados:

- modeloCobrancaLumera
  - FIXO
  - EXITO
  - FIXO_MAIS_EXITO
  - PERSONALIZADO
- valorFixoLumera
  - valor fixo contratado com a empresa
- percentualExitoLumera
  - percentual sobre exito, quando aplicavel
- valorExitoLumera
  - valor nominal pactuado de exito, se aplicavel
- formaPagamentoLumera
  - PIX
  - BOLETO
  - TRANSFERENCIA
  - FATURAMENTO
  - OUTRO
- statusFinanceiroLumera
  - NAO_APLICAVEL
  - PENDENTE
  - PARCIAL
  - PAGO
  - ATRASADO
- vencimentoFinanceiroLumera
  - data prevista para recebimento
- observacoesFinanceirasLumera
  - campo livre para anotacoes comerciais/financeiras

### 3. Encargos e custos

Para nao complicar cedo demais, a recomendacao inicial e tratar encargos/custos como registros complementares da operacao, e nao como calculo automatico no MVP.

Campos recomendados para fase posterior:

- descricao
- tipoEncargo
- valor
- dataReferencia
- observacoes

Exemplos:

- taxa operacional
- custo de deslocamento
- taxa bancaria
- custo documental
- custo juridico extraordinario

## Regra de negocio recomendada

Cada licitacao deve ter no maximo um bloco financeiro principal da licitacao e um bloco financeiro principal da relacao com a Lumera.

Ou seja:

- 1 licitacao -> 1 registro financeiro da licitacao
- 1 licitacao -> 1 registro financeiro da Lumera

No futuro, caso a regra comercial fique mais complexa, podemos evoluir para:

- parcelas
- historico de cobranca
- registros de recebimento
- centro de custos

## MVP recomendado

Entrar agora:

### Bloco 1. Dados financeiros da licitacao

- valor estimado do edital
- valor da proposta da empresa
- valor homologado
- observacoes financeiras da licitacao

### Bloco 2. Dados financeiros da Lumera

- modelo de cobranca
- valor fixo
- percentual de exito
- forma de pagamento
- status financeiro
- vencimento
- observacoes financeiras da Lumera

### Bloco 3. Interface

- exibir esses campos na tela de detalhe da licitacao
- permitir edicao apenas para usuarios da Lumera
- clientes apenas visualizam os dados que a Lumera decidir compartilhar no futuro

## Fase 2 recomendada

Deixar para depois:

- encargos/custos detalhados por licitacao
- parcelas e recebimentos
- calculo automatico de exito
- dashboard financeiro
- relatorios financeiros por empresa e periodo
- exportacao de dados financeiros

## Proposta de modelagem no banco

### Tabela `licitacao_financeiro`

Campos sugeridos:

- id
- licitacaoId (unique)
- valorEstimadoEdital numeric(15,2)
- valorPropostaEmpresa numeric(15,2)
- valorHomologado numeric(15,2)
- moeda varchar(3) default 'BRL'
- observacoes text
- createdAt
- updatedAt

### Tabela `licitacao_financeiro_lumera`

Campos sugeridos:

- id
- licitacaoId (unique)
- modeloCobranca varchar(30)
- valorFixo numeric(15,2)
- percentualExito numeric(7,4)
- valorExito numeric(15,2)
- formaPagamento varchar(30)
- statusFinanceiro varchar(30)
- vencimento date
- observacoes text
- createdAt
- updatedAt

### Tabela futura `licitacao_encargo`

Campos sugeridos:

- id
- licitacaoId
- descricao varchar(255)
- tipoEncargo varchar(50)
- valor numeric(15,2)
- dataReferencia date
- observacoes text
- createdAt
- updatedAt

## Regras de interface recomendadas

### Lumera

Pode:

- preencher e editar dados financeiros
- acompanhar status financeiro
- futuramente registrar encargos e recebimentos

### Cliente Gestor / Cliente Consulta

No momento:

- nao editar dados financeiros
- nao ver automaticamente dados comerciais da Lumera

No futuro:

- pode haver uma versao compartilhada de parte do bloco financeiro da licitacao, se fizer sentido ao negocio

## Proximo passo tecnico recomendado

Antes de codar a parte financeira, a melhor ordem e:

1. validar com o cliente o significado exato de cada campo
2. confirmar quais campos entram no MVP
3. confirmar o que o cliente pode ou nao pode visualizar
4. so depois implementar no banco, backend e tela de detalhe

## Recomendacao final

Implementar agora apenas o bloco minimo financeiro e manter a separacao entre:

- valor da licitacao
- financeiro/comercial da Lumera

Essa decisao reduz retrabalho e deixa o sistema preparado para evolucao futura sem misturar conceitos.