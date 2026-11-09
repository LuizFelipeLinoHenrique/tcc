import { supabase } from "./supabase";
import { CashEntry } from "./cashFlow";

export type CashDraft = Omit<CashEntry, "id" | "user_id" | "created_at">;

export async function loadCashEntries(): Promise<CashEntry[]> {
  // Percorre todas as páginas: o limite padrão da API não pode truncar saldos.
  const entries: CashEntry[] = [];
  let cursor: string | null = null;
  while (true) {
    let query = supabase.from("cash_flow_entries").select("*").order("id").limit(500);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw error;
    entries.push(...(data as CashEntry[]));
    if (data.length < 500) return entries;
    cursor = data[data.length - 1].id;
  }
}

export async function saveCashEntries(drafts: CashDraft[], id?: string): Promise<CashEntry[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Sua sessão expirou. Entre novamente.");
  const query = id
    ? supabase.from("cash_flow_entries").update(drafts[0]).eq("id", id).eq("user_id", user.id)
    : supabase.from("cash_flow_entries").insert(drafts.map(draft => ({ ...draft, user_id: user.id })));
  const { data, error } = await query.select();
  if (error) throw error;
  if (!data?.length) throw new Error("O lançamento não foi encontrado ou você não tem permissão para alterá-lo.");
  return data as CashEntry[];
}

export async function deleteCashEntry(id: string) {
  const { data, error } = await supabase.from("cash_flow_entries").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("O lançamento não foi encontrado ou você não tem permissão para excluí-lo.");
}

export function cashError(error: unknown): string {
  const value = error as { code?: string; message?: string };
  if (value?.code === "42P01" || value?.code === "PGRST205") return "A estrutura do fluxo de caixa ainda não está disponível no banco. Aplique a migração cash_flow.";
  return value?.message || "Não foi possível acessar o fluxo de caixa. Tente novamente.";
}
