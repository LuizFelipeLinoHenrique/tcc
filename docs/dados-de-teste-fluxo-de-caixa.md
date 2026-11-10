# Dados de teste do fluxo de caixa

Carga de 48 lançamentos: 9 realizados, 37 pendentes e 2 cancelados. Todos usam Caixa principal, descrição com `[TESTE]` e marcador `[cash-flow-test-v2:...]` nas observações.

Os exemplos incluem saldo inicial, vendas, serviços, materiais, aluguel, impostos, transporte, atrasos, vencimento hoje e projeção com compra de máquina em 15 dias e recebimento em 35 dias. Há 24 lançamentos adicionais no mês atual para conferir paginação, filtros e CSV, além de registros nos dois meses anteriores e quatro seguintes.

Script: `supabase/seeds/cash_flow_test_data.sql`. Execute no SQL Editor do Supabase:

```sql
begin;
select set_config('app.cash_test_user_id', 'UUID_DO_USUARIO', true);
-- Cole aqui o conteúdo de supabase/seeds/cash_flow_test_data.sql.
commit;
```

As datas seguem o dia da execução em America/Sao_Paulo. A carga é exclusiva do usuário informado e não altera outros lançamentos. Repetir o script não duplica nem sobrescreve os exemplos editados; exemplos excluídos são recriados. Na tela Fluxo de caixa, clique em Atualizar e busque `[TESTE]`.
