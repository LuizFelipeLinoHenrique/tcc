-- Executar SOMENTE para remover os exemplos desse usuário.
-- Configure app.cash_demo_user_id na mesma sessão/transação, como no roteiro.
-- Os IDs estáveis permitem remover exemplos mesmo após editar descrição e notas.
do $cleanup$
declare
  owner_id uuid := coalesce(nullif(current_setting('app.cash_demo_user_id', true), '')::uuid, auth.uid());
begin
  if owner_id is null then
    raise exception 'Defina app.cash_demo_user_id antes de remover os exemplos.';
  end if;
  delete from public.cash_flow_entries
  where user_id = owner_id
    and id in (
      select md5('cash-flow-demo-v1:' || owner_id::text || ':' || key)::uuid
      from unnest(array[
        'opening-cash', 'opening-bank', 'prior-sale', 'prior-cost', 'sale-paid', 'service-paid', 'capital-paid', 'materials-paid', 'supplier-paid', 'salary-paid', 'rent-paid', 'tax-paid', 'transport-paid', 'custom-paid', 'late-payment', 'overdue-income', 'overdue-expense', 'old-overdue', 'today-income', 'today-expense', 'cancelled-income', 'cancelled-expense', 'edit', 'delete', 'csv', 'csv-formula', 'negative', 'recover', 'day50', 'day75', 'day89', 'outside', 'page-1', 'page-2', 'page-3', 'page-4', 'page-5', 'page-6', 'page-7', 'page-8', 'page-9', 'page-10', 'page-11', 'page-12', 'page-13', 'page-14', 'page-15', 'page-16', 'page-17', 'page-18', 'page-19', 'page-20', 'page-21', 'page-22', 'page-23', 'page-24', 'page-25', 'page-26', 'page-27', 'page-28', 'page-29', 'page-30', 'page-31', 'page-32', 'monthly-1', 'monthly-2', 'monthly-3', 'monthly-4'
      ]) as keys(key)
    );
end;
$cleanup$;
