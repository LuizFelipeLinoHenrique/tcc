# Fluxo de caixa

Dados demonstrativos e roteiro de conferência: [Testes do fluxo de caixa](testes-fluxo-de-caixa.md).

Acesse **Fluxo de caixa** no menu principal. Os lançamentos são persistidos no Supabase e pertencem ao usuário autenticado; outras contas de usuário não os acessam. Não há criação automática de recebimentos a partir de pedidos.

## Operação

- Cadastre entradas ou saídas com descrição, valor, categoria, conta, vencimento e observações.
- Use **Pendente** para contas a pagar/receber e **Realizado** para dinheiro efetivamente movimentado. **Registrar pagamento** abre a revisão do valor e da data antes de salvar.
- Para informar um saldo anterior, registre uma entrada realizada (ou saída, se negativo) com a categoria **Saldo inicial**, na data anterior ao início do acompanhamento.
- A repetição mensal cria de 1 a 24 lançamentos pendentes de mesmo valor, em uma única operação. Cada lançamento é independente. Vencimentos no dia 31 são ajustados ao último dia de meses mais curtos.
- Edite, cancele ou exclua lançamentos individualmente. Cancelamentos não afetam saldos ou projeções; exclusões exigem confirmação.
- Filtre mês ou período personalizado, conta, tipo, situação, categoria e texto. A listagem tem páginas de 25 itens. CSV exporta todos os resultados filtrados; no celular, abre o compartilhamento do conteúdo CSV.

## Indicadores

O saldo atual considera todos os lançamentos realizados até hoje na conta selecionada. Entradas e saídas do período usam a data do pagamento, não o vencimento. O saldo anterior soma os realizados antes do início do período; o saldo final soma o saldo anterior às entradas e subtrai as saídas realizadas no período. A receber/a pagar usam vencimentos de pendências no período.

A projeção de 30, 60 ou 90 dias parte do saldo atual e aplica os lançamentos pendentes nas datas de vencimento. Pendências vencidas entram no primeiro dia. O cálculo considera a conta selecionada e independe dos filtros da listagem ou do mês consultado. Não confirma pagamentos nem estima vendas ainda não cadastradas. O gráfico sinaliza saldo negativo e apresenta o saldo mínimo.

Valores são armazenados em centavos inteiros. Datas de pagamento futuras e valores nulos, negativos ou inválidos são rejeitados no formulário e no banco.

## Banco e validação

Migração: `supabase/migrations/20261109225547_cash_flow.sql`. A tabela `public.cash_flow_entries` usa RLS por `user_id`, políticas separadas de leitura, inclusão, alteração e exclusão, e índices por proprietário. A API carrega todos os registros por cursor para evitar que o limite padrão de resultados trunque os saldos.

Validação local: `npx tsc --noEmit` e `node --test tests/*.test.cjs`. A exportação web pode ser verificada com `npx expo export --platform web`.
