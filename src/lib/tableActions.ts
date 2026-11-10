import { supabase } from "./supabase";

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
    if (/fetch|network|timeout|connection|conexão|rede/i.test(message))
        return "Falha de conexão. Verifique sua internet e tente novamente.";
    if (error instanceof Error) return error.message;
    return "Não foi possível concluir a ação. Verifique sua conexão e tente novamente.";
}

export async function deleteRecord(table: Table, id: number) {
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
    material: Record<string, unknown>,
    nome: string,
    descricao: string,
    preco: number,
) {
    const descriptionKey = Object.hasOwn(material, "descricao")
        ? "descricao"
        : "descrição";
    const priceKey = Object.hasOwn(material, "preco") ? "preco" : "preço";
    return { nome, [descriptionKey]: descricao, [priceKey]: preco };
}

export async function getOrderDetails(id: number) {
    const { data: pedido, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw error;
    const [clientResult, materialResult] = await Promise.all([
        supabase
            .from("clientes")
            .select("*")
            .eq("id", pedido.id_cliente)
            .maybeSingle(),
        supabase
            .from("produtos")
            .select("*")
            .eq("id", pedido.id_produto)
            .maybeSingle(),
    ]);
    if (clientResult.error) throw clientResult.error;
    if (materialResult.error) throw materialResult.error;
    const cliente = clientResult.data;
    const material = materialResult.data;
    const preco = Number(material?.preco ?? material?.["preço"] ?? 0);
    return {
        id_pedido: pedido.id,
        id_cliente: pedido.id_cliente,
        nome_cliente: cliente?.nome ?? "Cliente indisponível",
        telefone_cliente: String(cliente?.telefone ?? "Não informado"),
        endereco_cliente: cliente?.endereco ?? "Não informado",
        id_material: pedido.id_produto,
        nome_material: material?.nome ?? "Material indisponível",
        descricao_material:
            material?.descricao ?? material?.["descrição"] ?? "Não informado",
        preco_unit: preco,
        preco_total: preco * Number(pedido.qtde ?? 0),
        qtde_pedido: pedido.qtde,
        data_pedido: pedido.data_pedido,
        status: pedido.status,
    };
}
