# Arquitetura e banco de dados

O aplicativo Expo usa rotas por arquivo e acessa Supabase Auth e a API de dados diretamente pelo cliente JavaScript. O PostgreSQL executa as regras transacionais dos pedidos e do recebimento vinculado.

## Navegação e código

| Local | Responsabilidade |
| --- | --- |
| `app/_layout.tsx` | Inicializa fontes e sessão, verifica o usuário e responde a eventos de autenticação |
| `app/(auth)/` | Entrada, cadastro e solicitação de recuperação de senha |
| `app/(recovering)/` | Redefinição de senha com a sessão de recuperação |
| `app/(tabs)/` | Painel, clientes, fornecedores, produtos, pedidos, caixa e configurações |
| `src/components/` | Layout responsivo, formulários, filtros, modais, animações e gráficos |
| `src/hooks/` e `src/theme/` | Comportamento responsivo, confirmação de exclusão e estilos compartilhados |
| `src/lib/` e `src/types/` | Cliente Supabase, operações de registros, cálculos, datas, paginação e tipos dos pedidos |

[supabase.ts](../src/lib/supabase.ts) habilita persistência e renovação da sessão. No nativo, usa AsyncStorage. Na web, detecta a sessão na URL para os fluxos do Auth. [ErpShell.tsx](../src/components/ErpShell.tsx) centraliza a navegação da área autenticada.

As telas de cadastro e listagem consultam tabelas pelo SDK. [pagination.ts](../src/lib/pagination.ts) mantém o cursor e descarta respostas de consultas antigas após mudanças de filtro. [tableActions.ts](../src/lib/tableActions.ts) reúne operações e detalhes de registros. [cashFlowRepository.ts](../src/lib/cashFlowRepository.ts) lê o caixa em lotes de até 500 registros por cursor. [cashFlow.ts](../src/lib/cashFlow.ts), [dashboardCash.ts](../src/lib/dashboardCash.ts) e [dashboardOrders.ts](../src/lib/dashboardOrders.ts) concentram cálculos e agregações.

## Modelo de dados

O quadro descreve os campos e relacionamentos usados pela aplicação. O DDL completo das tabelas-base `clientes`, `produtos` e `pedidos` precisa vir do ambiente que serve de base ao projeto.

| Tabela | Campos e relacionamentos |
| --- | --- |
| `clientes` | `id`, nome, e-mail, telefone e endereço |
| `fornecedores` | `id`, nome, CNPJ, e-mail, telefone, endereço, contato e data de criação |
| `produtos` | `id`, nome, descrição, preço e `quantidade_pronta_entrega`, inteiro não negativo com padrão zero |
| `pedidos` | Cabeçalho com cliente, status e data de criação. `id_produto` e `qtde` representam o primeiro item por compatibilidade. Integração usa `financial_user_id`, `due_date`, `total_cents` e `request_id` |
| `pedido_itens` | Relação entre pedido e produto com quantidade. `unit_price_cents` guarda o preço histórico dos itens integrados |
| `cash_flow_entries` | Proprietário em `user_id`, tipo, valor em centavos, categoria, conta, datas, situação e observações. `order_id` opcional e único liga a entrada a um pedido |
| `auth.users` | Identidade da conta, referenciada pelo caixa e pela integração financeira |

Um cliente pode ter vários pedidos, e um pedido tem um ou mais itens. Cada item aponta para um produto. Um pedido pode ter uma entrada no caixa, ou nenhuma no caso dos pedidos legados. A aplicação usa o catálogo ao exibir valores de itens legados sem preço registrado.

## Operações no banco

- `save_order_items(p_cliente, p_itens, p_status, p_pedido, p_due_date, p_request_id)` recebe a lista completa de itens no formato `[{ id_produto, qtde }]` e retorna o ID do pedido. Na criação, a tela fornece vencimento e UUID da solicitação. Na edição, informa o ID do pedido existente.
- O banco calcula o total a partir dos preços do catálogo na criação, preserva os preços já gravados na edição e sincroniza a entrada pendente da categoria **Vendas**. Cabeçalho, itens e caixa são gravados na mesma transação. A verificação diferida compara o valor dos itens ao total antes do commit.
- A chave da solicitação é única por usuário. A repetição da mesma criação retorna o pedido existente. A reutilização da chave com conteúdo diferente é rejeitada. Um lock serializa tentativas concorrentes com a mesma chave. Como a chave fica no formulário, após recarregar a página durante uma falha de rede, procure o pedido antes de repetir a criação.
- `delete_cancelled_order(p_pedido)` retorna o ID excluído ao remover um cancelado elegível. O banco verifica situação, propriedade e recebimento. As referências em cascata removem os itens e o vínculo financeiro elegível na mesma transação.
- [get_orders_details.sql](../migrations/get_orders_details.sql) registra uma consulta legada. A interface atual resolve os detalhes em [tableActions.ts](../src/lib/tableActions.ts).

## Sessão e autorização

O caixa aplica RLS por `user_id` nas quatro operações. As migrações de itens e pedidos tratam o histórico operacional como compartilhado e os triggers de integração restringem alterações do pedido integrado ao proprietário financeiro. As funções de gravação de pedidos usam `SECURITY INVOKER`, com execução destinada ao papel autenticado. A proteção da rota na interface organiza a navegação. A autorização dos dados depende das permissões e políticas do banco.

O [SQL histórico de fornecedores](../migrations/fornecedores/01_create_fornecedores_table.sql) inclui acesso completo para autenticados e leitura para `anon`. O esquema versionado não descreve todas as políticas das tabelas-base nem confirma quais estão ativas em uma instância remota. Confira as políticas do ambiente antes de usar dados reais.

## Migrações e dependências

Os scripts em [supabase/migrations](../supabase/migrations) são incrementais. Para preparar um banco novo, obtenha a estrutura-base autorizada de clientes, produtos e pedidos e confira as permissões. A criação de fornecedores está em [migrations/fornecedores](../migrations/fornecedores). Compare o histórico do ambiente com os arquivos antes de aplicar scripts pendentes, pois o histórico do projeto registra diferenças entre timestamps locais e remotos.

| Versão | Alteração |
| --- | --- |
| `20261109225547` | Tabela, índices e políticas do fluxo de caixa |
| `20261115235030` | Itens de pedido, migração dos itens legados e primeira RPC de gravação |
| `20261116002940` | Vínculo pedido-caixa, preços históricos, sincronização e validação financeira |
| `20261116005215` | Regra inicial de exclusão lógica de cancelados |
| `20261116011853` | Proteção de recebimentos realizados e exclusão definitiva de cancelados elegíveis |
| `20261116033152` e `20261116034117` | Inclusão e remoção de itens enquanto o recebimento está pendente |
| `20261116231922` e `20261116232029` | Edição de quantidades e ajuste da validação aplicada aos itens |
| `20261117231608` | Restaura chaves estrangeiras do cabeçalho para cliente e produto |
| `20261117232109` | Adiciona a quantidade para pronta entrega ao catálogo |

A coluna `deleted_at` permanece no esquema por compatibilidade com a exclusão lógica anterior. Listagens e painel usam a coluna para ignorar os pedidos que ainda estiverem ocultos.
