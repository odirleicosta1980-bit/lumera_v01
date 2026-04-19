# Empenhos da Licitacao

## Objetivo
Registrar os pagamentos da empresa por empenho dentro de cada licitacao.

## Estrutura proposta
A entidade `LicitacaoEmpenho` pertence a uma `Licitacao` e permite multiplos registros por processo.

## Campos
- `codigoEmpenho`: codigo textual do empenho
- `valor`: valor do empenho
- `dataEmpenho`: data de emissao do empenho
- `dataPagamentoEmpenho`: data do pagamento do empenho
- `dataGeracaoBoleto`: data em que o boleto foi gerado
- `dataPagamentoBoleto`: data em que o boleto foi pago
- `observacoes`: anotacoes livres
- `sortOrder`: ordem de exibicao dentro da licitacao

## Regras iniciais
- uma licitacao pode ter varios empenhos
- o empenho pertence sempre a uma licitacao
- a exclusao da licitacao exclui seus empenhos
- o valor do empenho sera usado futuramente para relatorios e conciliacao financeira

## Proximo passo
- criar cadastro manual de empenhos no detalhe da licitacao
- listar empenhos abaixo do bloco financeiro
- depois calcular totais pagos, pendentes e saldo