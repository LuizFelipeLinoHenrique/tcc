-- As instalações existentes podem ter executado os scripts legados separadamente.
DO $$
BEGIN
  IF to_regclass('public.fornecedores') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Permitir leitura para anon" ON public.fornecedores;
    REVOKE ALL ON TABLE public.fornecedores FROM PUBLIC, anon;
  END IF;

  IF to_regprocedure('public.get_orders_details(bigint)') IS NOT NULL THEN
    ALTER FUNCTION public.get_orders_details(bigint) SECURITY INVOKER;
    ALTER FUNCTION public.get_orders_details(bigint) SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.get_orders_details(bigint) FROM PUBLIC, anon;
  END IF;
END;
$$;
