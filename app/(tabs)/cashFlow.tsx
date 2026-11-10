import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, Platform, Pressable, Share, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CashChoices, CashEntryForm } from "@/src/components/CashEntryForm";
import { CashProjection } from "@/src/components/CashProjection";
import { CashAnalyticsPanels } from "@/src/components/CashAnalyticsPanels";
import { RecordModal } from "@/src/components/RecordModal";
import { CashEntry, cashMonthData, cashCsv, displayDate, effectiveDate, isoDate, money } from "@/src/lib/cashFlow";
import { cashError, deleteCashEntry, loadCashEntries } from "@/src/lib/cashFlowRepository";
import { Colors } from "@/src/theme/colors";

const statusLabels = { pending: "Pendente", paid: "Realizado", cancelled: "Cancelado" };
const ALL = "__all_categories__";

export default function CashFlowScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 800;
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState(ALL);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ entry?: CashEntry; type: CashEntry["type"] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<CashEntry | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const mutation = useRef(false);
  const request = useRef(0);
  const today = isoDate();

  const load = useCallback(async () => {
    const token = ++request.current;
    setLoading(true); setError("");
    try { const data = await loadCashEntries(); if (request.current === token) { setEntries(data); setLoaded(true); } }
    catch (cause) { if (request.current === token) setError(cashError(cause)); }
    finally { if (request.current === token) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load]));

  const start = isoDate(month);
  const end = isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0, 12));
  const summary = cashMonthData(entries, start, end, today);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return entries.filter(entry => {
      const date = effectiveDate(entry);
      return date >= start && date <= end && (type === "all" || entry.type === type) &&
        (status === "all" || (status === "overdue" ? entry.status === "pending" && entry.due_date < today : entry.status === status)) &&
        (category === ALL || entry.category === category) &&
        (!query || [entry.description, entry.category, entry.notes].some(value => value.toLocaleLowerCase("pt-BR").includes(query)));
    }).sort((a, b) => effectiveDate(b).localeCompare(effectiveDate(a)) || b.id.localeCompare(a.id));
  }, [entries, start, end, type, status, category, search, today]);
  const categories = Array.from(new Set(entries.map(entry => entry.category))).sort();
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 25, currentPage * 25);
  const expenses = new Map<string, number>();
  const overdueExpenses = new Map<string, number>();
  for (const entry of summary.entries) {
    if (entry.type !== "expense" || entry.status === "cancelled") continue;
    const groups = entry.status === "pending" && entry.due_date < today ? overdueExpenses : expenses;
    groups.set(entry.category, (groups.get(entry.category) ?? 0) + entry.amount_cents);
  }
  const expenseGroups = [...expenses].sort((a, b) => b[1] - a[1]);
  const totalExpenses = expenseGroups.reduce((total, [, amount]) => total + amount, 0);
  const overdueExpenseGroups = [...overdueExpenses].sort((a, b) => b[1] - a[1]);
  const totalOverdueExpenses = overdueExpenseGroups.reduce((total, [, amount]) => total + amount, 0);

  function changeMonth(offset: number) { setMonth(previous => new Date(previous.getFullYear(), previous.getMonth() + offset, 1, 12)); setPage(1); }
  function resetFilters() { setSearch(""); setType("all"); setStatus("all"); setCategory(ALL); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12)); setPage(1); }
  function saved(records: CashEntry[]) { request.current++; setLoading(false); setEntries(previous => [...previous.filter(entry => !records.some(record => record.id === entry.id)), ...records]); setForm(null); setNotice(records.length > 1 ? `${records.length} lançamentos registrados.` : "Lançamento salvo."); }

  async function remove() {
    if (!toDelete || mutation.current) return;
    mutation.current = true; setBusy(true); setDeleteError("");
    try { await deleteCashEntry(toDelete.id); request.current++; setLoading(false); setEntries(previous => previous.filter(entry => entry.id !== toDelete.id)); setToDelete(null); setNotice("Lançamento excluído."); }
    catch (cause) { setDeleteError(cashError(cause)); }
    finally { mutation.current = false; setBusy(false); }
  }

  async function exportCsv() {
    try {
      const csv = cashCsv(filtered);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        const link = document.createElement("a"); link.href = url; link.download = `fluxo-de-caixa-${start}-${end}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else await Share.share({ title: "Fluxo de caixa (CSV)", message: csv });
      setNotice("Exportação preparada com os lançamentos filtrados.");
    } catch { setError("Não foi possível exportar os lançamentos. Tente novamente."); }
  }

  const button = (label: string, icon: keyof typeof Ionicons.glyphMap, action: () => void, primary = false, disabled = false) => <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={action} disabled={disabled} style={({ pressed }) => [styles.button, primary && styles.primaryButton, (pressed || disabled) && { opacity: 0.5 }]}><Ionicons name={icon} size={17} color={primary ? Colors.white : Colors.hex475569} /><Text style={[styles.buttonText, primary && { color: Colors.white }]}>{label}</Text></Pressable>;
  const metric = (label: string, value: number, icon: keyof typeof Ionicons.glyphMap, color = Colors.hex0F172A as string, subtitle?: string) => <View style={styles.metric}><View style={styles.between}><Text style={styles.muted}>{label}</Text><Ionicons name={icon} size={19} color={color} /></View><Text style={[styles.metricValue, { color }]}>{money(value)}</Text>{subtitle && <Text style={styles.small}>{subtitle}</Text>}</View>;

  const header = <View style={styles.sections}>
    <View style={styles.between}><View style={{ flex: 1, minWidth: 220 }}><Text style={styles.title}>Fluxo de caixa</Text><Text style={styles.subtitle}>Organize suas movimentações e antecipe o saldo do seu negócio.</Text></View><View style={styles.row}>{button("Nova saída", "arrow-up-outline", () => { setNotice(""); setForm({ type: "expense" }); }, false, !loaded || loading || !!error)}{button("Nova entrada", "add-outline", () => { setNotice(""); setForm({ type: "income" }); }, true, !loaded || loading || !!error)}</View></View>
    {!!error && <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>{button("Tentar novamente", "refresh-outline", load, false, loading)}</View>}
    {!!notice && <View style={styles.notice}><Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text>{button("Fechar aviso", "close-outline", () => setNotice(""))}</View>}
    <View style={styles.monthNavigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={() => changeMonth(-1)} style={({ pressed }) => [styles.monthArrow, pressed && { opacity: 0.5 }]}><Ionicons name="chevron-back" size={22} color={Colors.hex0B4F6C} /></Pressable>
      <Text accessibilityLiveRegion="polite" style={[styles.panelTitle, styles.monthLabel]}>{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" onPress={() => changeMonth(1)} style={({ pressed }) => [styles.monthArrow, pressed && { opacity: 0.5 }]}><Ionicons name="chevron-forward" size={22} color={Colors.hex0B4F6C} /></Pressable>
    </View>
    {loading && <View style={styles.row}><ActivityIndicator color={Colors.hex0B4F6C} /><Text style={styles.muted}>Atualizando movimentações…</Text></View>}
    {loaded && <>
      <View style={styles.metrics}>{metric("Saldo do mês", summary.balance, "wallet-outline", summary.balance < 0 ? Colors.hexB91C1C : Colors.hex0B4F6C, "Entradas menos saídas realizadas no mês")}{metric("Entradas realizadas", summary.income, "arrow-down-outline", Colors.hex15803D, "No mês selecionado")}{metric("Saídas realizadas", summary.expense, "arrow-up-outline", Colors.hexB91C1C, "No mês selecionado")}{metric("Saldo previsto no mês", summary.expected, "cash-outline", Colors.hex0F172A, "Saldo do mês + a receber − a pagar")}</View>
      <View style={styles.metrics}>{metric("A receber", summary.receivable, "time-outline", Colors.hex15803D, "Pendências com vencimento no mês")}{metric("A pagar", summary.payable, "time-outline", Colors.hexB45309, "Pendências com vencimento no mês")}</View>
      {summary.overdue > 0 && <View style={styles.warning}><Ionicons name="alert-circle-outline" size={20} color={Colors.hexB45309} /><Text style={styles.warningText}>{summary.overdue} lançamento(s) vencido(s) no mês selecionado. Use o filtro Vencidos para consultá-los.</Text></View>}
      <CashAnalyticsPanels compact={compact} panelStyle={styles.panel}
        projection={<><Text style={styles.panelTitle}>Evolução do caixa no mês</Text><Text style={styles.small}>Realizados e pendentes nas respectivas datas do mês selecionado.</Text><CashProjection points={summary.projection} /></>}
        categoryHeader={<><Text style={styles.panelTitle}>Saídas por categoria</Text><Text style={styles.small}>Realizadas e pendentes em dia no mês</Text></>}>
        {!expenseGroups.length ? <Text style={styles.muted}>Nenhuma saída neste mês.</Text> : expenseGroups.map(([name, total]) => <View key={name} style={{ gap: 7 }}><View style={styles.between}><Text style={styles.label}>{name}</Text><Text style={styles.label}>{money(total)}</Text></View><View style={styles.barTrack}><View style={[styles.bar, { width: `${total / totalExpenses * 100}%` }]} /></View></View>)}
      </CashAnalyticsPanels>
      <View style={styles.panel}>
        <View style={styles.between}><Text style={styles.panelTitle}>Saídas vencidas por categoria</Text><Text style={[styles.entryAmount, { color: Colors.hexB45309 }]}>{money(totalOverdueExpenses)}</Text></View>
        <Text style={styles.small}>Saídas pendentes do mês selecionado com vencimento anterior a hoje.</Text>
        {!overdueExpenseGroups.length ? <Text style={styles.muted}>Nenhuma saída vencida neste mês.</Text> : overdueExpenseGroups.map(([name, total]) => <View key={name} style={{ gap: 7 }}><View style={styles.between}><Text style={styles.label}>{name}</Text><Text style={styles.label}>{money(total)}</Text></View><View style={styles.barTrack}><View style={[styles.bar, { backgroundColor: Colors.hexB45309, width: `${total / totalOverdueExpenses * 100}%` }]} /></View></View>)}
      </View>
    </>}
    <View style={styles.panel}><View style={styles.between}><View><Text style={styles.panelTitle}>Movimentações</Text><Text style={styles.small}>{filtered.length} lançamento(s) no mês</Text></View><View style={styles.row}>{button("Atualizar", "refresh-outline", load, false, loading)}{button("Exportar CSV", "download-outline", exportCsv, false, !loaded || loading || !filtered.length)}</View></View>
      <TextInput accessibilityLabel="Buscar movimentações" placeholder="Buscar descrição, categoria ou observações" placeholderTextColor={Colors.hex94A3B8} value={search} onChangeText={value => { setSearch(value); setPage(1); }} style={styles.input} />
      <CashChoices values={[{ value: "all", label: "Todos os tipos" }, { value: "income", label: "Entradas" }, { value: "expense", label: "Saídas" }]} value={type} onChange={value => { setType(value); setPage(1); }} />
      <CashChoices values={[{ value: "all", label: "Todas as situações" }, { value: "pending", label: "Pendentes" }, { value: "paid", label: "Realizados" }, { value: "overdue", label: "Vencidos" }, { value: "cancelled", label: "Cancelados" }]} value={status} onChange={value => { setStatus(value); setPage(1); }} />
      {!!categories.length && <CashChoices values={[ALL, ...categories].map(value => ({ value, label: value === ALL ? "Todas as categorias" : value }))} value={category} onChange={value => { setCategory(value); setPage(1); }} />}
      <View style={styles.between}><Text style={[styles.small, { flex: 1 }]}>Realizados são filtrados pela data do pagamento; pendentes e cancelados, pelo vencimento. Os indicadores acima consideram o mês selecionado.</Text>{button("Limpar filtros", "close-circle-outline", resetFilters)}</View>
    </View>
  </View>;

  return <>
    <FlatList
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={visible} keyExtractor={entry => entry.id} contentContainerStyle={[styles.content, compact && { padding: 16 }]} ListHeaderComponent={header} keyboardShouldPersistTaps="handled"
      ListEmptyComponent={!loading && loaded ? <View style={styles.empty}><Ionicons name="wallet-outline" size={38} color={Colors.hex94A3B8} /><Text style={styles.panelTitle}>{entries.length ? "Nenhuma movimentação encontrada" : "Seu fluxo de caixa começa aqui"}</Text><Text style={styles.muted}>{entries.length ? "Ajuste o mês e os filtros para consultar os lançamentos." : "Registre a primeira entrada ou saída. Para incluir um saldo anterior, crie um lançamento realizado na categoria Saldo inicial."}</Text></View> : null}
      renderItem={({ item }) => <View style={[styles.entry, compact && { flexDirection: "column", alignItems: "stretch" }]}><View style={styles.entryMain}><View style={[styles.entryIcon, { backgroundColor: item.type === "income" ? Colors.hexDCFCE7 : Colors.hexFEE2E2 }]}><Ionicons name={item.type === "income" ? "arrow-down" : "arrow-up"} size={19} color={item.type === "income" ? Colors.hex15803D : Colors.hexB91C1C} /></View><View style={{ flex: 1, gap: 5 }}><Text style={styles.entryTitle}>{item.description}</Text><Text style={styles.small}>{item.category}</Text><Text style={styles.small}>Vence em {displayDate(item.due_date)}{item.paid_date ? ` • Realizado em ${displayDate(item.paid_date)}` : ""}</Text>{!!item.notes && <Text style={styles.small} numberOfLines={2}>{item.notes}</Text>}</View></View><View style={styles.entryEnd}><View style={{ alignItems: "flex-end", gap: 5 }}><Text style={[styles.entryAmount, { color: item.status === "cancelled" ? Colors.hex94A3B8 : item.type === "income" ? Colors.hex15803D : Colors.hexB91C1C }]}>{item.type === "income" ? "+ " : "− "}{money(item.amount_cents)}</Text><Text style={[styles.small, item.status === "pending" && item.due_date < today && { color: Colors.hexB45309 }]}>{item.status === "pending" && item.due_date < today ? "Vencido" : statusLabels[item.status]}</Text></View><View style={styles.row}>{button(item.status === "pending" ? "Registrar pagamento" : "Editar", item.status === "pending" ? "checkmark-circle-outline" : "create-outline", () => { setNotice(""); setForm({ type: item.type, entry: item.status === "pending" ? { ...item, status: "paid", paid_date: today } : item }); })}{button("Excluir", "trash-outline", () => { setDeleteError(""); setToDelete(item); })}</View></View></View>}
      ListFooterComponent={loaded && filtered.length > 0 ? <View style={[styles.between, { paddingVertical: 20 }]}>{button("Anterior", "chevron-back", () => setPage(currentPage - 1), false, currentPage === 1)}<Text style={styles.muted}>Página {currentPage} de {pages}</Text>{button("Próxima", "chevron-forward", () => setPage(currentPage + 1), false, currentPage === pages)}</View> : null} />
    <RecordModal visible={!!form} title={form?.entry ? "Editar lançamento" : "Novo lançamento"} onClose={() => setForm(null)} busy={busy}>{form && <CashEntryForm key={form.entry?.id ?? form.type} entry={form.entry} initialType={form.type} onSaved={saved} onBusy={setBusy} />}</RecordModal>
    <RecordModal visible={!!toDelete} title="Excluir lançamento" onClose={() => setToDelete(null)} busy={busy}><View style={{ width: "100%", padding: 16, gap: 20 }}><Text style={styles.label}>Excluir “{toDelete?.description}”? Essa ação remove o lançamento e recalcula os saldos.</Text>{!!deleteError && <Text accessibilityRole="alert" style={styles.error}>{deleteError}</Text>}<View style={styles.row}>{button("Cancelar", "close", () => setToDelete(null), false, busy)}{button(busy ? "Excluindo…" : "Confirmar exclusão", "trash-outline", remove, true, busy)}</View></View></RecordModal>
  </>;
}

const styles = StyleSheet.create({
  content: { padding: 28, paddingBottom: 40, gap: 10 }, sections: { gap: 20, marginBottom: 10 },
  title: { color: Colors.hex0F172A, fontFamily: "WorksansBold", fontSize: 27 }, subtitle: { color: Colors.hex64748B, fontSize: 14, lineHeight: 21, marginTop: 7 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, between: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 },
  monthNavigation: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  monthArrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  monthLabel: { textAlign: "center", flexShrink: 1 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 40, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 7, backgroundColor: Colors.white }, primaryButton: { backgroundColor: Colors.hex0B4F6C, borderColor: Colors.hex0B4F6C }, buttonText: { fontSize: 12, fontFamily: "WorksansSemiBold", color: Colors.hex475569 },
  panel: { padding: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 10, gap: 16, minWidth: 0 }, panelTitle: { color: Colors.hex0F172A, fontSize: 16, fontFamily: "WorksansSemiBold" }, label: { color: Colors.hex334155, fontSize: 13, fontFamily: "WorksansMedium" }, muted: { color: Colors.hex64748B, fontSize: 13, lineHeight: 20 }, small: { color: Colors.hex64748B, fontSize: 12, lineHeight: 18 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, metric: { flex: 1, minWidth: 210, backgroundColor: Colors.white, padding: 20, gap: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.hexDCE7EE }, metricValue: { fontSize: 25, fontFamily: "WorksansBold" },
  analytics: { flexDirection: "row", alignItems: "flex-start", gap: 16 }, input: { borderWidth: 1, borderColor: Colors.hexCBD8E2, borderRadius: 7, padding: 12, fontSize: 14, color: Colors.hex0F172A, backgroundColor: Colors.white },
  warning: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.hexFFFBEB, borderRadius: 8, padding: 15 }, warningText: { flex: 1, color: Colors.hexB45309, fontSize: 13, lineHeight: 20 },
  errorBox: { backgroundColor: Colors.hexFEF2F2, borderRadius: 8, padding: 15, gap: 12 }, error: { color: Colors.hexB91C1C, fontSize: 13, lineHeight: 20 }, notice: { backgroundColor: Colors.hexF0FDF4, padding: 12, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, success: { color: Colors.hex15803D, fontSize: 13, flex: 1 },
  barTrack: { height: 7, borderRadius: 4, backgroundColor: Colors.hexEEF2F6, overflow: "hidden" }, bar: { height: 7, borderRadius: 4, backgroundColor: Colors.hex0B4F6C },
  entry: { backgroundColor: Colors.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.hexDCE7EE, padding: 16, gap: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, entryMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }, entryIcon: { width: 38, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center" }, entryTitle: { fontSize: 14, fontFamily: "WorksansSemiBold", color: Colors.hex0F172A }, entryEnd: { alignItems: "flex-end", gap: 10 }, entryAmount: { fontSize: 17, fontFamily: "WorksansBold" }, empty: { alignItems: "center", padding: 30, gap: 14, backgroundColor: Colors.white, borderRadius: 10 },
});
