# Fluxo de caixa

O fluxo de caixa reúne lançamentos manuais e recebimentos vinculados a pedidos. Cada usuário consulta seus próprios lançamentos. Novos registros usam **Caixa principal**.

## Lançamentos

- Use **Nova entrada** ou **Nova saída**. Informe descrição, valor, categoria, vencimento e, se necessário, observações.
- Marque **Pendente** para compromissos futuros ou ainda em aberto. Use **Realizado** para dinheiro efetivamente movimentado. A data de pagamento deve ser válida e pode ir até hoje.
- Para registrar um saldo anterior, crie uma entrada realizada com categoria **Saldo inicial** e data de pagamento anterior ao início do acompanhamento. Use uma saída realizada se o saldo inicial for negativo.
- Na inclusão de uma pendência manual, a repetição mensal cria de 1 a 24 lançamentos independentes do mesmo valor. Meses mais curtos usam seu último dia quando o dia original excede a duração do mês.
- Para baixar uma pendência, use **Registrar pagamento**, confira os dados e salve a data de realização. Lançamentos manuais podem ser editados, cancelados ou excluídos individualmente. A exclusão exige confirmação.

## Recebimentos de pedidos

Ao salvar um novo pedido, o banco cria uma entrada pendente de categoria **Vendas** com o valor dos itens e o vencimento informado no pedido. Alterações de itens permitidas enquanto o recebimento está pendente atualizam a mesma entrada. Valor e vencimento vinculados são protegidos no formulário e no banco.

Registre o recebimento pelo caixa. A entrega do pedido e a baixa financeira são ações independentes. O cancelamento do pedido cancela o recebimento pendente e preserva o realizado. A aplicação trabalha com o recebimento integral do pedido. Pedidos antigos sem vínculo não geram entradas retroativas.

## Indicadores e projeção

| Indicador | Cálculo |
| --- | --- |
| Entradas e saídas realizadas | Somadas pela data de pagamento no mês selecionado |
| A receber e a pagar | Pendências somadas pelo vencimento no mês selecionado |
| Saldo do mês | Entradas realizadas do mês menos saídas realizadas do mês |
| Saldo anterior | Resultado realizado acumulado antes do mês |
| Saldo acumulado | Saldo anterior mais saldo do mês |
| Saldo previsto do mês | Saldo do mês mais valores a receber menos valores a pagar |

O gráfico mensal parte de zero e inclui realizados pela data de pagamento e pendências pela data de vencimento. Seu último ponto corresponde ao saldo previsto do mês. O painel de saídas por categoria inclui realizadas e pendentes em dia. Saídas pendentes vencidas têm um painel separado. Vencimentos de hoje contam como em dia. Cancelados ficam fora dos indicadores e da projeção.

A projeção parte do saldo realizado até hoje e incorpora as pendências de entrada e saída. Vencimentos de hoje e atrasos compõem o ponto inicial. Consulte os horizontes de 30, 60 e 90 dias e observe o aviso quando a curva indicar saldo negativo. A aplicação usa o fuso `America/Sao_Paulo` para a data de referência e armazena valores em centavos inteiros.

## Filtros e CSV

Escolha o mês e refine a listagem por tipo, situação, categoria ou texto. O mês também define a base dos indicadores mensais. Os filtros complementares atuam na listagem. Cada página mostra até 25 registros.

A exportação CSV inclui todos os resultados filtrados. No celular, o aplicativo abre o compartilhamento do conteúdo. Se a atualização dos dados falhar, recarregue com sucesso para liberar a exportação.

Para conferir os cálculos e as ações com dados controlados, consulte [Testes e dados demonstrativos](testes.md).
