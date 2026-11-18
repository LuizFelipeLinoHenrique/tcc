# Manual de uso

## Conta e configurações

Na tela inicial, entre com e-mail e senha ou crie uma conta com nome, e-mail e senha. Se a confirmação de e-mail estiver habilitada no Supabase, conclua essa etapa antes de entrar. Use **Esqueceu a senha?** para solicitar um link de redefinição.

Em **Configurações**, consulte os dados da conta, solicite a troca de senha por e-mail ou escolha **Desconectar da Conta** e confirme a saída.

## Painel de operações

- **Cadastros da operação** mostra as contagens de clientes, produtos e fornecedores.
- **Situação financeira** mostra o saldo realizado acumulado até hoje e as pendências a receber e a pagar com vencimento no mês atual.
- **Situação dos pedidos** mostra pendentes, entregues e cancelados. A taxa de entrega usa todos os pedidos considerados pelo painel.
- **Análise do histórico** apresenta tendências mensais de caixa e pedidos. Altere o período pelos botões acima dos gráficos.
- **Clientes e produtos em destaque** classifica pelo volume de unidades dos pedidos não cancelados.

Use **Atualizar** para recarregar os dados. A tela também atualiza a cada 30 segundos enquanto está aberta.

## Clientes, produtos e fornecedores

Em cada área, abra o formulário de cadastro pelo botão da listagem. Pesquise registros, abra os detalhes e use as ações de edição ou exclusão. As listas carregam em blocos de 50 registros. A exclusão pede confirmação e está sujeita às referências do banco.

| Área | Dados do cadastro |
| --- | --- |
| Clientes | Nome, e-mail, telefone e endereço |
| Produtos | Nome, descrição, preço e quantidade para pronta entrega |
| Fornecedores | Nome, CNPJ, telefone, e-mail, contato e endereço |

A quantidade para pronta entrega aceita números inteiros de 0 a 2.147.483.647. Um campo vazio equivale a zero. O valor é informado no cadastro ou na edição do produto e pode ser consultado na interface. A rotina de pedidos registra quantidades pedidas em uma estrutura própria, sem baixar automaticamente o campo de pronta entrega.

## Pedidos

1. Abra **Pedidos** e escolha a opção para adicionar um pedido.
2. Selecione o cliente e adicione pelo menos um produto. Informe uma quantidade inteira positiva por produto. Cada produto aparece uma vez na lista de itens.
3. Informe o vencimento do recebimento no formato `DD/MM/AAAA` e salve.
4. Abra os detalhes para conferir os itens. Em **Fluxo de caixa**, localize a entrada pendente criada para o pedido.

A lista permite buscar por ID do pedido, cliente ou produto e filtrar por situação ou período.

| Situação | Efeito |
| --- | --- |
| Pendente (`P`) | Pedido registrado e aguardando entrega |
| Entregue (`E`) | Marca a entrega. O recebimento é registrado separadamente no caixa |
| Cancelado (`C`) | Encerra o pedido. Se a entrada vinculada estiver pendente, ela é cancelada. Se já estiver realizada, o recebimento é preservado |

Enquanto o recebimento estiver pendente e o pedido estiver ativo, a edição permite acrescentar produtos, remover itens e mudar quantidades. Preserve pelo menos um item e um total financeiro positivo. Os itens existentes conservam o preço registrado e novos itens usam o preço vigente no catálogo. Pedidos pagos ou cancelados bloqueiam mudanças nos itens. Pedidos integrados cancelados não podem ser reabertos.

Use **Excluir** em um pedido cancelado elegível e confirme. A operação remove o pedido, seus itens e a entrada vinculada ainda não recebida. Pedidos com recebimento realizado ficam preservados. A edição de pedidos anteriores à integração continua disponível e não cria entradas retroativas.
