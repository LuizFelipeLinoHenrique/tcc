# Dados demonstrativos do fluxo de caixa

Foram inseridos 68 exemplos na conta do acesso mais recente em 09/11/2026, preservando os dois lançamentos anteriores. Todos têm descrição iniciada por `[TESTE]` e identificador `[cash-flow-demo-v1:...]` nas observações. São 15 realizados, 51 pendentes e 2 cancelados, distribuídos em 12 categorias e nas contas **Caixa principal** e **Banco operacional**.

Os dados exercitam as funções do módulo; inserir exemplos não equivale a executar as ações da interface. Use o roteiro abaixo para a conferência manual.

| Função | Como conferir |
| --- | --- |
| Saldo inicial e saldo anterior | Consulte outubro e novembro de 2026. Há saldos iniciais, uma venda e uma compra anteriores a novembro. |
| Entradas e saídas realizadas | Confira vendas, serviços, aportes e despesas de materiais, salários, aluguel, impostos e transporte. |
| Data efetiva de pagamento | A venda vencida no mês anterior e recebida hoje aparece no mês do pagamento. |
| Filtro por conta | Alterne Caixa principal, Banco operacional e Todas as contas; os indicadores e a projeção acompanham a seleção. |
| Categorias | Use a categoria personalizada Manutenção de equipamentos e compare o gráfico de saídas realizadas. |
| Situações e vencimentos | Compare Realizados, Pendentes, Vencidos e Cancelados. Há vencimentos anteriores, de hoje e futuros. Um imposto vencido está no mês anterior. |
| Cancelamentos | Os dois cancelamentos possuem valores altos e não entram no saldo, no gráfico de saídas ou na projeção. Para testar a ação, edite um exemplo pendente e selecione Cancelado. |
| Projeção de 30 dias | A compra de máquina em 15 dias provoca saldo negativo. |
| Projeção de 60 dias | O recebimento de contrato em 35 dias recupera o saldo; há impostos em 50 dias. |
| Projeção de 90 dias | Há serviços em 75 dias e manutenção em 89 dias. O contrato de 120 dias fica fora de todos os horizontes. |
| Recorrência mensal | Busque Aluguel recorrente: quatro parcelas independentes com vencimentos em 30/11, 30/12, 30/01 e 28/02. Para testar a criação, cadastre uma nova série pendente com quantidade 4. |
| Busca textual | Pesquise paginação, manutenção, uma conta ou uma observação dos exemplos. |
| Paginação | Novembro de 2026 contém 55 exemplos. Sem filtros adicionais, navegue entre pelo menos três páginas. |
| Período personalizado | Consulte de 01/10/2026 a 28/02/2027 e compare os lançamentos de meses diferentes. Limpar filtros volta ao mês atual. |
| Criar entrada e saída | Use Nova entrada/Nova saída para acrescentar exemplos. Registre um como Realizado e outro como Pendente. |
| Registrar pagamento | Busque Fornecedor com pagamento atrasado, revise valor e data e salve o pagamento. A pendência deve sair de A pagar e afetar o saldo. |
| Edição | Use Exemplo para editar descrição e categoria; altere valor, conta ou observações e confirme o recálculo. |
| Exclusão | Use Exemplo para testar exclusão. Primeiro cancele a confirmação; depois confirme e confira a remoção. |
| Exportação CSV | Exporte sem filtros para conferir todos os resultados, inclusive fora da primeira página. Os exemplos de CSV contêm aspas, ponto e vírgula, acentos e uma fórmula que deve ser tratada como texto. No celular, confira o compartilhamento. |
| Atualização e persistência | Use Atualizar e reabra a tela após editar ou pagar um exemplo. As alterações devem permanecer. |
| Validação do formulário | Tente valor zero/negativo, campo obrigatório vazio, data 31/02/2027, pagamento futuro, quantidade 0 ou 25 e repetição com status Realizado. O formulário deve impedir o salvamento. Dados inválidos não são inseridos no banco. |
| Isolamento entre usuários | Entre com outra conta: estes exemplos não devem aparecer. |

## Referência de projeção

Na data da carga (09/11/2026), considerando **somente os 68 exemplos**, a projeção termina em -R$ 14.839,58 em 30 dias, R$ 11.860,42 em 60 dias e R$ 14.560,42 em 90 dias. Os dois registros anteriores e alterações feitas durante os testes modificam os valores exibidos na tela. As projeções também mudam com o avanço da data atual.

## Repetir a carga ou remover os exemplos

Scripts: `supabase/seeds/cash_flow_demo.sql` e `supabase/seeds/remove_cash_flow_demo.sql`. Antes de executar um deles, defina o usuário na mesma transação:

```sql
begin;
select set_config('app.cash_demo_user_id', 'UUID_DO_USUARIO', true);
-- Cole aqui o conteúdo do script de carga OU de remoção.
commit;
```

A carga usa datas relativas ao dia da execução em America/Sao_Paulo. Os IDs são estáveis por usuário e cenário; repetir a carga não duplica registros nem sobrescreve exemplos editados. Exemplos excluídos são recriados na próxima carga. Para reposicionar todos os exemplos em novas datas, remova o conjunto e execute a carga novamente.

O script de remoção identifica exatamente os 68 IDs do conjunto e preserva os outros lançamentos, inclusive se as descrições e observações dos exemplos tiverem sido editadas. Ele foi disponibilizado para uso posterior e não foi executado.
