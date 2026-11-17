alter table public.produtos
  add column quantidade_pronta_entrega integer not null default 0
  constraint produtos_quantidade_pronta_entrega_nonnegative
  check (quantidade_pronta_entrega >= 0);
