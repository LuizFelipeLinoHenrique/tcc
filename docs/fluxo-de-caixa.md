# Fluxo de caixa

Dados demonstrativos e roteiro de conferência: [Testes do fluxo de caixa](testes-fluxo-de-caixa.md).

Acesse **Fluxo de caixa** no menu principal. Os lançamentos são persistidos no Supabase e pertencem ao usuário autenticado; outras contas de usuário não os acessam. Não há criação automática de recebimentos a partir de pedidos.

## Operação

- Cadastre entradas ou saídas com descrição, valor, categoria, vencimento e observações.
- Use **Pendente** para contas a pagar/receber e **Realizado** para dinheiro efetivamente movimentado. **Editar** abre o lançamento com a situação atual. **Registrar pagamento** abre a revisão do valor e da data antes de salvar.
- Para informar um saldo anterior, registre uma entrada realizada (ou saída, se negativo) com a categoria **Saldo inicial**, na data anterior ao início do acompanhamento.
- A repetição mensal cria de 1 a 24 lançamentos pendentes de mesmo valor, em uma única operação. Cada lançamento é independente. Vencimentos no dia 31 são ajustados ao último dia de meses mais curtos.
- Edite, cancele ou exclua lançamentos individualmente. Cancelamentos não afetam saldos ou projeções; exclusões exigem confirmação.
- O fluxo usa um único caixa, com novos lançamentos em **Caixa principal**. Registros antigos entram nos totais, preservando os dados de origem.
- Filtre mês, tipo, situação, categoria e texto. A listagem tem páginas de 25 itens. CSV exporta todos os resultados filtrados e fica indisponível enquanto a atualização falhar; no celular, abre o compartilhamento do conteúdo CSV.

## Relatório mensal em PDF e XLSX

Selecione o mês pelas setas e use **Exportar relatório mensal**. Escolha **Baixar PDF** ou **Baixar XLSX**. No navegador, o arquivo é baixado; no Android/iOS, abre as opções do sistema para salvar ou compartilhar. As métricas consideram o mês inteiro, independentemente dos filtros e da paginação da lista. Meses sem movimentações também podem ser exportados.

O arquivo contém apenas métricas: resumo financeiro (incluindo saldo anterior, realizado e previsto, do mês e acumulado), quantidades por situação, totais por categoria e evolução diária. Não inclui textos explicativos, descrições, observações ou listagem individual dos lançamentos. O XLSX organiza as quatro seções em abas, com valores numéricos em reais, cabeçalhos fixos e filtros. O PDF apresenta as métricas desde a primeira página e repete os cabeçalhos nas páginas das tabelas.

As regras de competência são as mesmas dos indicadores: realizados entram pela data do pagamento; pendentes e cancelados, pelo vencimento. Cancelados aparecem nas quantidades e nos totais por categoria, sem compor saldos. Vencidos são parte das pendências, classificados pela data de referência do relatório. A evolução diária do arquivo inclui o saldo anterior; seu saldo previsto final corresponde ao saldo anterior somado ao saldo previsto do mês.

Durante a geração, os botões ficam bloqueados para evitar downloads duplicados. Falhas permitem tentar novamente. A exportação fica indisponível enquanto os dados carregam ou quando o carregamento falha. As bibliotecas nativas adicionadas exigem recompilar builds de desenvolvimento/distribuição já instalados.

Testes: `node --test tests/cashReport.test.cjs` verifica os cálculos, o conteúdo real dos arquivos, a proteção de textos e o compartilhamento nativo com APIs simuladas. `node tests/cashReport.browser.cjs` usa o runtime existente em `.expo/dashboard-tests` (Playwright e esbuild) e valida downloads em 390 e 1366 pixels, filtros ativos, paginação, mês vazio, falha e nova tentativa. A impressão e o compartilhamento nativos ainda devem ser conferidos em dispositivo.

## Indicadores

Os indicadores usam o mês selecionado como referência. Entradas e saídas realizadas usam a data do pagamento; a receber e a pagar usam o vencimento das pendências. O saldo do mês é a diferença entre entradas e saídas realizadas, sem acumular outros meses. O saldo anterior reúne os lançamentos realizados antes do mês, e o saldo acumulado soma esse valor ao resultado realizado do mês. O saldo previsto soma o resultado do mês ao valor a receber e subtrai o valor a pagar do mês. O aviso de vencidos também se limita ao mês consultado.

O gráfico mostra a evolução diária do caixa no mês selecionado, partindo de zero e incluindo realizados e pendentes nas suas respectivas datas. Cancelamentos não entram nos valores. O saldo final do gráfico corresponde ao saldo previsto do mês. Os filtros de tipo, situação, categoria e texto continuam exclusivos da listagem.

O painel **Saídas por categoria** soma as saídas realizadas e pendentes em dia do mês, excluindo canceladas e pendentes vencidas. Realizadas pertencem ao mês do pagamento; pendentes, ao mês do vencimento. O painel **Saídas vencidas por categoria** mostra separadamente as pendentes com vencimento anterior a hoje no mês selecionado, com total e proporções próprios. Vencimentos de hoje permanecem em dia; pagamentos realizados com atraso entram nas realizadas.

Valores são armazenados em centavos inteiros. O formulário e o banco usam o fuso de São Paulo para determinar a data atual. Datas de pagamento futuras e valores nulos, negativos ou inválidos são rejeitados no formulário e no banco.

## Banco e validação

Migração: `supabase/migrations/20261109225547_cash_flow.sql`. A tabela `public.cash_flow_entries` usa RLS por `user_id`, políticas separadas de leitura, inclusão, alteração e exclusão, e índices por proprietário. A API carrega todos os registros por cursor para evitar que o limite padrão de resultados trunque os saldos.

Validação local: `npx tsc --noEmit` e `node --test tests/*.test.cjs`. A exportação web pode ser verificada com `npx expo export --platform web`.
