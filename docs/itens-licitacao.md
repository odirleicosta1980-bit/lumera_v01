# Itens da licitacao

## Objetivo

Esta modelagem prepara o sistema para controlar os itens ou lotes de cada licitacao, permitindo cadastro manual, precificacao posterior e futura importacao assistida a partir do edital.

## Estrutura recomendada

Cada licitacao pode possuir varios itens.

Campos modelados no banco:

- `numeroItem`
  - numero original do item no edital
- `numeroLote`
  - numero do lote, quando existir
- `descricao`
  - descricao principal do item
- `unidade`
  - unidade de medida
- `quantidade`
  - quantidade prevista
- `valorReferencia`
  - valor de referencia do edital
- `valorProposto`
  - valor proposto pela empresa participante
- `marcaModelo`
  - marca, modelo ou observacao comercial do item
- `observacoes`
  - anotacoes livres
- `status`
  - `PENDENTE`
  - `EM_PRECIFICACAO`
  - `PRECIFICADO`
  - `DESCARTADO`
- `sortOrder`
  - ordem de exibicao do item dentro da licitacao

## Regras iniciais

- item pertence a uma unica licitacao
- exclusao do item deve apagar apenas o proprio item
- licitacao pode existir sem itens no inicio
- itens podem ser cadastrados manualmente antes da importacao automatica do edital

## Proximo passo recomendado

Implementar o cadastro manual de itens dentro da tela de detalhe da licitacao, com:

- inclusao
- edicao
- exclusao
- alteracao de status
- valores de referencia e proposto