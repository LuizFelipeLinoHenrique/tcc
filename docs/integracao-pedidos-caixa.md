# Integração entre pedidos e fluxo de caixa

## Remoção de produtos — 16/11/2026

A migration `20261116034117_allow_order_product_removal.sql`, aplicada ao Supabase conectado, permite remover produtos de pedidos com recebimento pendente. A tela apresenta uma lixeira por item e impede remover o último produto. O texto explicativo de acréscimos e o rótulo visível “Remover” foram retirados; os botões mantêm rótulos de acessibilidade.

A RPC salva a lista restante, mantém os preços históricos e sincroniza os totais do pedido e do caixa na mesma transação. Se o primeiro produto for removido, o cabeçalho passa a apontar para um item restante. O pedido deve manter ao menos um produto e total financeiro positivo. Pedidos pagos ou cancelados bloqueiam remoções. A validação diferida cobre também DELETE direto, e os testes de exclusão por cascata continuam passando.

Validação: 75 testes JavaScript, checagem de tipos e os quatro roteiros SQL passaram. A suite `order_product_removal.sql` foi repetida após aplicar a migration, sempre com rollback dos dados temporários. ESLint do formulário sem erros, com o aviso de hook preexistente. Não houve teste manual em navegador autenticado.

## Acréscimos após criação — 16/11/2026

A migration `20261116033152_allow_order_product_additions.sql`, aplicada ao projeto conectado, permite adicionar novos produtos quando o recebimento ainda está pendente. A tela consulta o recebimento para liberar o botão e os campos dos novos itens. Cliente, vencimento, quantidades e preços dos itens já registrados permanecem preservados; pedidos pagos ou cancelados não aceitam acréscimos.

A RPC `save_order_items` recebe a lista completa, insere apenas os produtos novos com o preço atual do catálogo e atualiza o total do pedido e o mesmo lançamento pendente na mesma transação. Repetir o payload não duplica itens nem receita. Locks no pedido e no recebimento protegem as operações concorrentes; um trigger diferido rejeita inclusões diretas que deixem os totais inconsistentes. Produtos de preço zero são aceitos. A edição de legados e a exclusão de cancelados sem recebimento continuam funcionando.

Validação: 74 testes JavaScript e a checagem de tipos passaram. O ESLint do formulário passou sem erros, com um aviso preexistente de dependência de hook. Os três roteiros SQL (`order_product_additions.sql`, `order_cash_integration.sql` e `delete_cancelled_orders.sql`) passaram no banco conectado com assertions e rollback, cobrindo preços históricos, retry, totais, limites, falhas, pagamento, cancelamento e RLS. Não houve teste manual em navegador autenticado nem teste com duas conexões simultâneas.

As seções abaixo registram a implementação anterior; a restrição absoluta de acréscimos foi substituída pelo comportamento acima.

## Comportamento implementado

- Novos pedidos são gravados por `save_order_items` com itens, preços efetivos em centavos, vencimento informado e uma chave UUID da requisição.
- O banco cria uma entrada `income`, `pending`, na categoria existente `Vendas`, conta `Caixa principal`, com descrição e `order_id` identificando o pedido.
- Cabeçalho, itens e recebimento pertencem à mesma transação. Uma constraint diferida confere o total dos itens antes do commit. Qualquer erro reverte toda a operação.
- A combinação usuário/chave identifica uma tentativa de criação. Enquanto o pedido existir, repetir os mesmos dados retorna o mesmo pedido, mesmo após alteração de preço no catálogo ou cancelamento posterior. Reutilizar a chave com outros dados produz erro. Um advisory lock serializa requisições concorrentes com a mesma chave; `UNIQUE(order_id)` impede dois recebimentos do mesmo pedido.
- O preço é obtido de `produtos.preco` no banco, convertido para centavos e preservado em `pedido_itens.unit_price_cents`. O total usa aritmética `numeric`, com o limite financeiro já existente. O cliente não escolhe o valor financeiro.
- O vencimento é obrigatório no cadastro, em `DD/MM/AAAA`. Não é inferido da data de criação.
- `P`, `E` e `C` continuam sendo status operacionais. Entregar não registra pagamento. O recebimento usa a edição/ação existente do caixa e exige uma data válida de realização.
- Cancelar um pedido cancela somente sua entrada pendente. Uma entrada realizada permanece realizada, sem estorno automático. Pedidos cancelados não podem ser reabertos nesta integração.
- Após registrar um pedido integrado, cliente, itens, preços, valor e vencimento ficam preservados. O formulário de edição permite alterar o status operacional. O banco também bloqueia alterações diretas que causem divergência.
- Cancelar pedido pago continua permitido: pedido e recebimento permanecem vinculados, e todos os campos do recebimento realizado são preservados. A exclusão, definitiva ou lógica, é bloqueada se houver recebimento realizado. O botão `Excluir` não aparece nesses pedidos; é mostrada uma explicação do bloqueio.
- Um cancelado sem recebimento pode ser excluído definitivamente. A RPC apaga o cabeçalho, e as FKs removem itens e movimentações não recebidas na mesma transação, sem resíduos. O banco valida status, propriedade e recebimentos sob locks, inclusive em `DELETE` direto. Não se pode apagar primeiro a entrada do caixa para contornar a proteção. A limpeza do caixa só é permitida pela cascata de um pedido já validado.
- A lista carrega o status do vínculo financeiro pela relação um para um (`order_id` único). Um pedido integrado com vínculo não visível por RLS não oferece exclusão. Uma mudança de status concorrente continua sujeita à verificação do banco, mesmo que a tela esteja desatualizada.
- Entradas realizadas ou canceladas não podem voltar a pendentes, e a data de um recebimento já realizado fica preservada. Isso mantém o registro de um recebimento realizado, impedindo sua reversão para liberar a exclusão. Descrição, categoria, conta e observações continuam sujeitos às validações existentes.

## Segurança e compatibilidade

As funções novas usam `SECURITY INVOKER` e `search_path` vazio; a RPC é executável apenas por `authenticated`. As políticas RLS existentes do caixa continuam restringindo cada usuário ao próprio financeiro. Como os pedidos atuais são compartilhados, `financial_user_id` registra o criador e os triggers impedem que outro usuário altere um pedido integrado ou seu recebimento. A visualização de pedidos permanece compartilhada.

Não há geração retroativa de entradas para pedidos antigos. Esses pedidos continuam editáveis pela RPC e não recebem vínculo financeiro ao editar. Os preços históricos anteriores à integração não podem ser recuperados com segurança: itens legados mantêm `unit_price_cents = NULL` e a exibição anterior baseada no catálogo. Lançamentos manuais também mantêm seu comportamento.

As fórmulas do caixa não foram alteradas: pendências entram em valores a receber e saldo previsto pelo vencimento; recebimentos realizados entram nos saldos pela data efetiva de recebimento. Os detalhes do pedido e o faturamento estimado do dashboard passaram a usar os preços preservados quando disponíveis.

Na etapa de proteção de pedidos pagos, não houve alteração no código nem nas fórmulas do dashboard ou do fluxo de caixa. A migration apenas restaura `deleted_at = NULL` em pedidos pagos ocultados pela regra anterior, recuperando sua rastreabilidade, sem modificar status, itens, valor ou data de recebimento.

## Arquivos desta implementação

- `supabase/migrations/20261116002940_order_cash_integration.sql`: colunas, vínculo, constraints, triggers e RPC.
- `supabase/migrations/20261116005215_delete_cancelled_orders.sql`: exclusão de cancelados, validação no banco e RPC `delete_cancelled_order`.
- `supabase/migrations/20261116011853_protect_paid_order_deletion.sql`: bloqueio de exclusão paga, exclusão definitiva não paga com cascata protegida e recuperação de visibilidade de pagos.
- `supabase/tests/order_cash_integration.sql`: validação transacional no PostgreSQL com RLS.
- `supabase/tests/delete_cancelled_orders.sql`: status elegíveis, bloqueio de exclusão paga por RPC/DELETE/UPDATE, preservação integral do recebimento, limpeza sem resíduos, rollback de lote misto, legado, RLS e saldos. Usa venda de R$ 150 em fixtures e termina com rollback.
- `app/(tabs)/(order)/addOrder.tsx`: vencimento e chave da requisição.
- `src/components/OrdersEdit.tsx`: preservação dos itens após registro e explicação dos cancelamentos.
- `src/lib/orderItems.ts`: tipo do preço efetivo dos itens.
- `src/lib/tableActions.ts`: detalhes com preço efetivo e mensagens de negócio retornadas pelo banco.
- `src/components/OrdersCard.tsx`, `app/(tabs)/(order)/orders.tsx` e `src/hooks/useRecordDeletion.tsx`: status financeiro na consulta, exclusão apenas de cancelados sem recebimento e confirmação da remoção definitiva.
- `app/(tabs)/(home)/homeScreen.tsx`: uso de preços efetivos nos valores dos pedidos.
- `src/lib/cashFlow.ts` e `src/lib/cashFlowRepository.ts`: tipos do vínculo, sem alteração de fórmulas.
- `src/components/CashEntryForm.tsx` e `app/(tabs)/cashFlow.tsx`: proteção dos campos vinculados, ação de recebimento e preservação do histórico.
- `tests/orders.test.cjs`, `tests/tableActions.test.cjs` e `tests/cashFlow.test.cjs`: testes da interface, preços históricos, repetição após falha de rede e indicadores.

As outras alterações locais que já existiam no projeto foram preservadas.

## Migration e execução

A migration depende das estruturas `cash_flow` e `order_items`. Foi aplicada ao projeto conectado `TCC` (`gifpdryselinuhehbucc`) na versão `20261116002940`; o arquivo local corresponde a essa versão. Não precisa ser reaplicada nesse projeto. A criação da RPC anterior sem vencimento deixa de funcionar para novos pedidos; atualizar o frontend junto com o banco é necessário.

A primeira regra de exclusão lógica foi aplicada na versão `20261116005215`. Ela foi substituída pela migration `20261116011853_protect_paid_order_deletion.sql`, aplicada ao mesmo projeto e alinhada ao arquivo local. As funções permanecem `SECURITY INVOKER`, com `search_path` vazio e RPC restrita a `authenticated`; as políticas RLS existentes não foram ampliadas.

A RPC `delete_cancelled_order` agora realiza `DELETE`, com guards que bloqueiam pedidos não cancelados ou pagos e validam o criador antes da cascata. Os recebimentos são bloqueados durante a verificação; qualquer falha reverte toda a exclusão. Se o pedido já tiver sido removido, uma repetição informa que ele não foi encontrado ou já foi excluído.

Na inspeção do projeto, o pedido real de R$ 150 com recebimento realizado foi identificado como `279`. Estava cancelado e ocultado pela exclusão lógica anterior. A migration recuperou sua visibilidade; a leitura posterior confirmou `status = C`, `deleted_at = NULL` e recebimento `paid` de 15000 centavos, realizado em 15/11/2026. Nenhum teste cancelou ou excluiu esse pedido real.

As migrations anteriores já possuíam timestamps locais diferentes do histórico remoto. Antes de usar comandos que apliquem todas as migrations pendentes nesse projeto, conferir o histórico para não reaplicar `cash_flow` ou `order_items`.

O roteiro `supabase/tests/order_cash_integration.sql` pode ser executado em uma única chamada no SQL Editor, como `postgres`. Requer dois usuários existentes para simular as sessões. Cria dados temporários de teste e termina com `ROLLBACK`; não deixa pedidos ou lançamentos de teste persistidos. Sequências de IDs podem avançar, como é normal no PostgreSQL mesmo com rollback.

## Validações e limites

O roteiro SQL foi executado no projeto conectado, com papel `authenticated`, cobrindo um e vários produtos, totais, categoria/vencimento, exatamente uma entrada pendente, repetição da chave, alteração do catálogo, entrega sem recebimento, recebimento explícito, cancelamento pendente e pago, bloqueios de alteração/exclusão, rollback por inconsistência, RLS entre usuários e edição de pedido legado. Os testes JavaScript verificam também a transição dos indicadores e a reutilização da chave após uma falha de rede.

Resultados desta execução:

- `npm test`: 63 testes passaram, nenhum falhou, incluindo bloqueio da UI para cancelado pago, mensagem da RPC e indicadores após preservação do recebido/remoção do cancelado não pago.
- `npm run typecheck`: passou.
- `npx --no-install expo export --platform web --output-dir dist --max-workers 2`: passou; exportou 59 rotas em `dist`.
- Os dois roteiros SQL passaram com assertions habilitadas e rollback final, após a correção de exclusão.
- `git diff --check`: passou, sem erros de whitespace.
- `npm run lint -- --format json --output-file .local/lint-paid-order-deletion.json`: falhou com os mesmos 101 erros e 13 avisos da execução anterior. Não foram feitas refatorações fora do escopo para corrigir o lint global.

Limitações que exigem validação manual:

- Não foi feito um fluxo completo em navegador autenticado. Conferir cadastro com vencimento, visualização no caixa, recebimento e atualização dos cards ao navegar para o caixa; a tela já recarrega os dados ao receber foco.
- Não foi executado teste com duas conexões simultâneas. O roteiro repete requisições sequencialmente; a serialização concorrente depende do advisory lock, dos locks de linha e das constraints do PostgreSQL. Em disputa entre cancelamento e recebimento, um deadlock pode abortar uma operação com segurança; atualizar a tela antes de repetir.
- A chave de criação fica na instância do formulário. Após fechar/recarregar a página durante uma resposta incerta, consultar a lista antes de cadastrar novamente. Não há deduplicação de vendas distintas com UUIDs diferentes.
- A exclusão definitiva remove também a chave de criação do pedido não pago. Não há retenção de tombstones para deduplicar uma tentativa de criação reapresentada depois de uma exclusão definitiva já confirmada.
- Pedidos sem pagamento que já tinham sido ocultados pela exclusão lógica anterior não são apagados automaticamente nesta migration. Podem ser removidos pela mesma RPC, após verificação de status e recebimento. A recuperação automática de visibilidade se limita aos pedidos pagos, para preservar sua rastreabilidade.
- O gerador de UUID usa `crypto.randomUUID()` do navegador: validar em HTTPS ou localhost. Não houve validação de builds nativos.
- Não há pagamento parcial, estorno nem alteração comercial de um pedido já registrado. Um pedido pendente incorreto pode ser cancelado e cadastrado novamente; vendas já recebidas exigem tratamento financeiro explícito fora desta etapa.
- O advisor de segurança manteve os avisos anteriores relativos à RPC legada `get_orders_details` (search path e `SECURITY DEFINER`) e à proteção de senhas vazadas. Essa RPC não é usada pelo fluxo atual de detalhes em `tableActions.ts`; não foi alterada nesta entrega.
