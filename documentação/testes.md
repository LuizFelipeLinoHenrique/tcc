# Testes e dados demonstrativos

## Validação local

Com as dependências instaladas, execute na raiz:

```powershell
npm test
npm run typecheck
npm run lint
```

- `npm test` roda os arquivos `tests/*.test.cjs` com o executor do Node. A cobertura inclui datas, paginação, operações de pedidos, ações de cadastro, caixa, dashboard, projeção, transição de login e saída da conta.
- `npm run typecheck` verifica os tipos sem gerar arquivos. `npm run lint` verifica as regras do ESLint.
- Os arquivos `tests/*.browser.cjs` são roteiros avulsos de navegador. Consulte o cabeçalho de cada script para o preparo isolado. Eles usam Playwright/Chromium e esbuild. O roteiro `redesign.browser.cjs` reutiliza o de dashboard.
- Para verificar o empacotamento web, use `npx expo export --platform web` com o ambiente configurado.

## Testes de banco

Execute os roteiros de [supabase/tests](../supabase/tests) por inteiro em um ambiente de teste com o esquema atualizado e os usuários exigidos no início de cada arquivo. Os roteiros usam dados temporários e terminam com `ROLLBACK`. Sequências de IDs podem avançar.

| Roteiro | Cobertura |
| --- | --- |
| `order_cash_integration.sql` | Criação de pedidos, sincronização com caixa, repetição da requisição, cancelamento, isolamento e legado |
| `delete_cancelled_orders.sql` | Elegibilidade, proteção de pagos e limpeza em cascata |
| `order_product_additions.sql` | Inclusão de itens e preservação de preços |
| `order_product_removal.sql` | Remoção de itens, totais e bloqueio do último item |
| `order_quantity_updates.sql` | Edição de quantidades, recálculo e bloqueios |

## Dados demonstrativos

Use os scripts em [supabase/seeds](../supabase/seeds) em um ambiente de teste. `cash_flow_test_data.sql` inclui 48 lançamentos do caixa com descrições iniciadas por `[TESTE]`. `business_test_data.sql` prepara um cenário com cadastros, pedidos e lançamentos para conferir o painel e os fluxos conectados. O segundo script também insere cadastros visíveis conforme as políticas das tabelas operacionais.

No SQL Editor ou cliente PostgreSQL, use o UUID de uma conta de teste existente. Execute o conteúdo de um seed entre a configuração e o commit, na mesma transação:

```sql
begin;
select set_config('app.cash_test_user_id', 'UUID_DO_USUARIO_DE_TESTE', true);
-- Cole aqui o conteúdo do seed escolhido antes de executar.
commit;
```

As datas do conjunto de caixa são relativas ao dia da execução em São Paulo. A carga do caixa pode ser repetida sem duplicar exemplos existentes ou sobrescrever edições. Os exemplos excluídos voltam na próxima carga.

## Conferência manual

1. Cadastre uma conta, entre, verifique as configurações e teste o encerramento da sessão. Confira também o e-mail de recuperação no domínio do ambiente.
2. Cadastre um cliente, um fornecedor e dois produtos. Edite os registros, pesquise por ID ou nome e confira os dados exibidos, incluindo a quantidade para pronta entrega.
3. Cadastre um pedido com dois produtos e vencimento. Confirme que existe uma única entrada pendente com o total correto. Ajuste a quantidade e acrescente ou remova um produto antes do recebimento. Compare o mesmo lançamento após cada edição.
4. Marque o pedido como entregue e confira que a entrada segue pendente. Registre o recebimento pelo caixa, cancele o pedido e confirme que ele mantém a entrada realizada. Em outro pedido, cancele antes de receber e confira a exclusão.
5. Cadastre uma despesa manual pendente e uma recorrência de quatro meses. Registre um pagamento e compare o mês do vencimento com o mês da realização. Verifique vencidos, categorias e projeções de 30, 60 e 90 dias.
6. Com mais de 25 lançamentos filtrados, compare o CSV com a listagem completa. Verifique também o mês, os filtros e a atualização após navegar de volta.
7. Abra o painel e compare os totais de cadastros, pedidos e caixa. Entre com outra conta e confira o isolamento dos lançamentos financeiros.
