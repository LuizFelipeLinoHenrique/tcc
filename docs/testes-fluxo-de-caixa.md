# Dados demonstrativos do fluxo de caixa

O conjunto foi ampliado de 68 para 140 exemplos em 09/11/2026, preservando os demais lançamentos e os exemplos já editados. Todos têm descrição iniciada por `[TESTE]` e identificador `[cash-flow-demo-v1:...]` nas observações. A carga completa contém 27 realizados, 87 pendentes e 26 cancelados, distribuídos em 12 categorias e no caixa único **Caixa principal**.

Os 72 novos exemplos cobrem seis meses anteriores (maio a outubro de 2026) e seis seguintes (dezembro de 2026 a maio de 2027). Cada mês recebe três entradas e três saídas. Nos meses anteriores há dois realizados, dois pendentes vencidos e dois cancelados; nos futuros, quatro pendentes e dois cancelados. Busque `mensal`, `pendente` ou `MM/AAAA` para localizá-los. A data de pagamento dos novos realizados é um dia após o vencimento, sempre no passado.

Os dados exercitam as funções do módulo; inserir exemplos não equivale a executar as ações da interface. Use o roteiro abaixo para a conferência manual.

| Função | Como conferir |
| --- | --- |
| Saldo inicial e saldo anterior | Consulte outubro e novembro de 2026. Há saldos iniciais, uma venda e uma compra anteriores a novembro. |
| Entradas e saídas realizadas | Confira vendas, serviços, aportes e despesas de materiais, salários, aluguel, impostos e transporte. |
| Data efetiva de pagamento | A venda vencida no mês anterior e recebida hoje aparece no mês do pagamento. |
| Caixa único | Confira que todos os exemplos entram nos indicadores e na projeção, sem seletor de contas. Novos lançamentos usam Caixa principal. |
| Categorias | Use a categoria personalizada Manutenção de equipamentos e compare o gráfico de saídas realizadas. |
| Situações e vencimentos | Compare Realizados, Pendentes, Vencidos e Cancelados. Há vencimentos anteriores, de hoje e futuros. Um imposto vencido está no mês anterior. |
| Cancelamentos | Os dois cancelamentos originais possuem valores altos; há também dois cancelados em cada um dos 12 meses adicionais. Não entram no saldo, no gráfico de saídas ou na projeção. Para testar a ação, edite um exemplo pendente e selecione Cancelado. |
| Projeção de 30 dias | A compra de máquina em 15 dias provoca saldo negativo. |
| Projeção de 60 dias | O recebimento de contrato em 35 dias recupera o saldo; há impostos em 50 dias. |
| Projeção de 90 dias | Há serviços em 75 dias e manutenção em 89 dias. O contrato de 120 dias fica fora de todos os horizontes. |
| Recorrência mensal | Busque Aluguel recorrente: quatro parcelas independentes com vencimentos em 30/11, 30/12, 30/01 e 28/02. Para testar a criação, cadastre uma nova série pendente com quantidade 4. |
| Busca textual | Pesquise paginação, manutenção, uma observação dos exemplos. |
| Paginação | Novembro de 2026 contém 55 exemplos. Sem filtros adicionais, navegue entre pelo menos três páginas. |
| Filtro mensal | Use Mês anterior e Próximo mês para consultar de maio/2026 a maio/2027, incluindo a virada do ano. Há seis novos exemplos por mês fora de novembro. Limpar filtros volta ao mês atual. Não há período personalizado. |
| Criar entrada e saída | Use Nova entrada/Nova saída para acrescentar exemplos. Registre um como Realizado e outro como Pendente. |
| Registrar pagamento | Busque Fornecedor com pagamento atrasado, revise valor e data e salve o pagamento. A pendência deve sair de A pagar e afetar o saldo. |
| Edição | Use Exemplo para editar descrição e categoria; altere valor ou observações e confirme o recálculo. |
| Exclusão | Use Exemplo para testar exclusão. Primeiro cancele a confirmação; depois confirme e confira a remoção. |
| Exportação CSV | Exporte sem filtros para conferir todos os resultados, inclusive fora da primeira página. Os exemplos de CSV contêm aspas, ponto e vírgula, acentos e uma fórmula que deve ser tratada como texto. No celular, confira o compartilhamento. |
| Atualização e persistência | Use Atualizar e reabra a tela após editar ou pagar um exemplo. As alterações devem permanecer. |
| Validação do formulário | Tente valor zero/negativo, campo obrigatório vazio, data 31/02/2027, pagamento futuro, quantidade 0 ou 25 e repetição com status Realizado. O formulário deve impedir o salvamento. Dados inválidos não são inseridos no banco. |
| Isolamento entre usuários | Entre com outra conta: estes exemplos não devem aparecer. |

## Referência de projeção

Na data da carga ampliada (09/11/2026), considerando **somente os 140 exemplos**, a projeção termina em -R$ 9.268,21 em 30 dias, R$ 18.053,16 em 60 dias e R$ 21.374,53 em 90 dias. Os demais registros e alterações feitas durante os testes modificam os valores exibidos na tela. As projeções também mudam com o avanço da data atual.

## Repetir a carga ou remover os exemplos

Scripts: `supabase/seeds/cash_flow_demo.sql` e `supabase/seeds/remove_cash_flow_demo.sql`. Antes de executar um deles, defina o usuário na mesma transação:

```sql
begin;
select set_config('app.cash_demo_user_id', 'UUID_DO_USUARIO', true);
-- Cole aqui o conteúdo do script de carga OU de remoção.
commit;
```

A carga usa datas relativas ao dia da execução em America/Sao_Paulo. Os IDs são estáveis por usuário e cenário; repetir a carga não duplica registros nem sobrescreve exemplos editados. Exemplos excluídos são recriados na próxima carga. Para reposicionar todos os exemplos em novas datas, remova o conjunto e execute a carga novamente.

O script de remoção identifica exatamente os 140 IDs do conjunto e preserva os outros lançamentos, inclusive se as descrições e observações dos exemplos tiverem sido editadas. Ele foi disponibilizado para uso posterior e não foi executado.
