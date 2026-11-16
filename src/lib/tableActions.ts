import { supabase } from "./supabase";
import { orderItems } from "./orderItems";

type Table = "clientes" | "produtos" | "fornecedores" | "pedidos";

export function recordError(error: unknown): string {
    const code = (error as { code?: string } | null)?.code;
    if (code === "23503")
        return "Este registro está vinculado a outros dados. Verifique os pedidos e os registros relacionados.";
    if (code === "23505") return "Já existe um registro com esses dados.";
    if (code === "42501")
        return "Você não tem permissão para realizar esta ação.";
    if (code === "PGRST301" || code === "PGRST302" || code === "PGRST303")
        return "Sua sessão expirou. Entre novamente para continuar.";
    if (code?.startsWith("22") || code === "23502" || code === "23514")
        return "Os dados informados são inválidos. Revise os campos e tente novamente.";
    const message = (error as { message?: string } | null)?.message ?? "";
    if (code === "P0001" && message) return message;
    if (/fetch|network|timeout|connection|conexão|rede/i.test(message))
        return "Falha de conexão. Verifique sua internet e tente novamente.";
    if (error instanceof Error) return error.message;
    return "Não foi possível concluir a ação. Verifique sua conexão e tente novamente.";
}

export async function deleteRecord(table: Table, id: number) {
    if (table === "pedidos") {
        const { data, error } = await supabase.rpc("delete_cancelled_order", { p_pedido: id });
        if (error) throw error;
        if (!data) throw new Error("O pedido não foi excluído. Atualize a lista e tente novamente.");
        return;
    }
    const { data, error } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .select("id");
    if (error) throw error;
    if (!data?.length)
        throw new Error(
            "O registro não foi excluído. Ele pode não existir mais ou você não tem permissão para excluí-lo.",
        );
}

export async function updateRecord(
    table: Table,
    id: number,
    values: Record<string, unknown>,
) {
    const { data, error } = await supabase
        .from(table)
        .update(values)
        .eq("id", id)
        .select("id");
    if (error) throw error;
    if (!data?.length)
        throw new Error(
            "O registro não foi atualizado. Ele pode não existir mais ou você não tem permissão para editá-lo.",
        );
}

export function materialValues(
    produto: Record<string, unknown>,
    nome: string,
    descricao: string,
    preco: number,
) {
    const descriptionKey = Object.hasOwn(produto, "descricao")
        ? "descricao"
        : "descrição";
    const priceKey = Object.hasOwn(produto, "preco") ? "preco" : "preço";
    return { nome, [descriptionKey]: descricao, [priceKey]: preco };
}

export async function getOrderDetails(id: number) {
    const { data: pedido, error } = await supabase
        .from("pedidos")
        .select("*, itens:pedido_itens(id_produto, qtde, unit_price_cents)")
        .is("deleted_at", null)
        .eq("id", id)
        .single();
    if (error) throw error;
    const itens = orderItems(pedido);
    const [clientResult, ...materialResults] = await Promise.all([
        supabase
            .from("clientes")
            .select("*")
            .eq("id", pedido.id_cliente)
            .maybeSingle(),
        ...itens.map(item => supabase
            .from("produtos")
            .select("*")
            .eq("id", item.id_produto)
            .maybeSingle()),
    ]);
    if (clientResult.error) throw clientResult.error;
    for (const result of materialResults) if (result.error) throw result.error;
    const cliente = clientResult.data;
    const produto = materialResults[0]?.data;
    const produtos = itens.map((item, index) => {
        const produto = materialResults[index]?.data;
        const preco = item.unit_price_cents != null ? Number(item.unit_price_cents) / 100 : Number(produto?.preco ?? produto?.["preço"] ?? 0);
        return { ...item, nome: produto?.nome ?? "Produto indisponível", descricao: produto?.descricao ?? produto?.["descrição"] ?? "Não informado", preco_unit: preco, preco_total: preco * Number(item.qtde) };
    });
    const preco = produtos[0]?.preco_unit ?? 0;
    return {
        id_pedido: pedido.id,
        id_cliente: pedido.id_cliente,
        nome_cliente: cliente?.nome ?? "Cliente indisponível",
        telefone_cliente: String(cliente?.telefone ?? "Não informado"),
        endereco_cliente: cliente?.endereco ?? "Não informado",
        id_material: pedido.id_produto,
        nome_material: produto?.nome ?? "Produto indisponível",
        descricao_material:
            produto?.descricao ?? produto?.["descrição"] ?? "Não informado",
        preco_unit: preco,
        preco_total: produtos.reduce((total, item) => total + item.preco_total, 0),
        qtde_pedido: itens.reduce((total, item) => total + Number(item.qtde ?? 0), 0),
        produtos,
        data_pedido: pedido.data_pedido ?? pedido.created_at,
        status: pedido.status,
    };
}
