-- ==============================================================================
-- Migration: Criação da função RPC get_orders_details
-- Descrição: Retorna os detalhes consolidados de pedidos, cruzando os dados da
--            tabela 'pedidos' com 'clientes' e 'produtos' (materiais).
-- Compatibilidade: Suporta automaticamente tanto colunas acentuadas ("descrição", "preço")
--                  quanto sem acento ("descricao", "preco").
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_orders_details(id_order_detail BIGINT DEFAULT NULL)
RETURNS TABLE (
    id_pedido BIGINT,
    id_cliente BIGINT,
    nome_cliente TEXT,
    telefone_cliente TEXT,
    endereco_cliente TEXT,
    id_material BIGINT,
    nome_material TEXT,
    descricao_material TEXT,
    preco_unit NUMERIC,
    preco_total NUMERIC,
    qtde_pedido NUMERIC,
    data_pedido TEXT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    col_desc TEXT;
    col_preco TEXT;
    sql_query TEXT;
BEGIN
    -- Verifica se a coluna na tabela produtos é 'descrição' ou 'descricao'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'produtos' AND column_name = 'descrição'
    ) THEN
        col_desc := 'pr."descrição"';
    ELSE
        col_desc := 'pr.descricao';
    END IF;

    -- Verifica se a coluna na tabela produtos é 'preco' ou 'preço'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'produtos' AND column_name = 'preco'
    ) THEN
        col_preco := 'pr.preco';
    ELSE
        col_preco := 'pr."preço"';
    END IF;

    sql_query := format('
        SELECT
            p.id::BIGINT AS id_pedido,
            c.id::BIGINT AS id_cliente,
            c.nome::TEXT AS nome_cliente,
            c.telefone::TEXT AS telefone_cliente,
            c.endereco::TEXT AS endereco_cliente,
            pr.id::BIGINT AS id_material,
            pr.nome::TEXT AS nome_material,
            COALESCE(%s::TEXT, '''') AS descricao_material,
            COALESCE(%s::NUMERIC, 0) AS preco_unit,
            (COALESCE(p.qtde, 0) * COALESCE(%s::NUMERIC, 0))::NUMERIC AS preco_total,
            p.qtde::NUMERIC AS qtde_pedido,
            p.data_pedido::TEXT AS data_pedido,
            p.status::TEXT AS status
        FROM
            pedidos p
            INNER JOIN clientes c ON c.id = p.id_cliente
            INNER JOIN produtos pr ON pr.id = p.id_produto
        WHERE
            ($1 IS NULL OR p.id = $1)
        ORDER BY
            p.id ASC
    ', col_desc, col_preco, col_preco);

    RETURN QUERY EXECUTE sql_query USING id_order_detail;
END;
$$;

-- Permissões de execução para o Supabase
GRANT EXECUTE ON FUNCTION get_orders_details(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_details(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION get_orders_details(BIGINT) TO service_role;
