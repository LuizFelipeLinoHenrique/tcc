import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CashEntry, addMonths, cashCategories, displayDate, cashToday, parseDate, parseMoney } from "@/src/lib/cashFlow";
import { CashDraft, cashError, saveCashEntries } from "@/src/lib/cashFlowRepository";
import { Colors } from "@/src/theme/colors";

export function CashChoices<T extends string>({ values, value, onChange, disabled = false }: { values: { value: T; label: string }[]; value: T; onChange: (value: T) => void; disabled?: boolean }) {
  return <View style={styles.choices}>{values.map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: value === item.value, disabled }} disabled={disabled} onPress={() => onChange(item.value)} style={[styles.choice, value === item.value && styles.selected]}><Text style={[styles.choiceText, value === item.value && styles.selectedText]}>{item.label}</Text></Pressable>)}</View>;
}

export function CashEntryForm({ entry, initialType, onSaved, onBusy }: { entry?: CashEntry; initialType: CashEntry["type"]; onSaved: (entries: CashEntry[]) => void; onBusy: (busy: boolean) => void }) {
  const [description, setDescription] = useState(entry?.description ?? "");
  const [type, setType] = useState(entry?.type ?? initialType);
  const [amount, setAmount] = useState(entry ? (entry.amount_cents / 100).toFixed(2).replace(".", ",") : "");
  const [category, setCategory] = useState(entry?.category ?? "Outros");
  const [dueDate, setDueDate] = useState(displayDate(entry?.due_date ?? cashToday()));
  const [status, setStatus] = useState(entry?.status ?? "pending");
  const [paidDate, setPaidDate] = useState(displayDate(entry?.paid_date ?? cashToday()));
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [repetitions, setRepetitions] = useState("1");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  const field = (label: string, value: string, change: (value: string) => void, placeholder = "", maxLength = 160, numeric = false) => <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} editable={!busy} value={value} onChangeText={change} placeholder={placeholder} placeholderTextColor={Colors.hex94A3B8} maxLength={maxLength} keyboardType={numeric ? "decimal-pad" : "default"} style={styles.input} /></View>;

  async function save() {
    if (saving.current) return;
    setError("");
    const cents = parseMoney(amount), due = parseDate(dueDate), paid = parseDate(paidDate), count = Number(repetitions);
    if (!description.trim() || !category.trim()) return setError("Preencha a descrição e a categoria.");
    if (!cents) return setError("Informe um valor positivo em reais, como 1.250,50 (até R$ 9.999.999.999,99).");
    if (!due) return setError("Informe um vencimento válido no formato DD/MM/AAAA.");
    if (status === "paid" && (!paid || paid > cashToday())) return setError("A data de pagamento deve ser válida e não pode estar no futuro.");
    if (!entry && (!/^\d+$/.test(repetitions) || !Number.isInteger(count) || count < 1 || count > 24)) return setError("Informe de 1 a 24 lançamentos mensais.");
    if (!entry && count > 1 && status !== "pending") return setError("Para repetir mensalmente, use o status Pendente. Registre cada pagamento quando acontecer.");
    if (!entry && Number(addMonths(due, count - 1).split("-")[0]) > 9999) return setError("Os vencimentos devem estar entre os anos 1900 e 9999.");
    const drafts: CashDraft[] = Array.from({ length: entry ? 1 : count }, (_, index) => ({ description: description.trim(), type, amount_cents: cents, category: category.trim(), account: entry?.account ?? "Caixa principal", due_date: addMonths(due, index), status, paid_date: status === "paid" ? paid : null, notes: notes.trim() }));
    saving.current = true; setBusy(true); onBusy(true);
    try { onSaved(await saveCashEntries(drafts, entry?.id)); }
    catch (cause) { setError(cashError(cause)); }
    finally { saving.current = false; setBusy(false); onBusy(false); }
  }

  return <View style={styles.form}>
    <Text style={styles.hint}>Valores em reais. O saldo considera apenas pagamentos e recebimentos realizados.</Text>
    <CashChoices values={[{ value: "income", label: "Entrada" }, { value: "expense", label: "Saída" }]} value={type} onChange={setType} disabled={busy} />
    {field("Descrição *", description, setDescription, "Ex.: recebimento de venda")}
    {field("Valor (R$) *", amount, setAmount, "0,00", 20, true)}
    <Text style={styles.label}>Categoria *</Text>
    <CashChoices values={cashCategories.map(value => ({ value, label: value }))} value={category} onChange={setCategory} disabled={busy} />
    {field("Categoria personalizada", category, setCategory, "Categoria", 80)}
    {field("Vencimento *", dueDate, setDueDate, "DD/MM/AAAA", 10)}
    <Text style={styles.label}>Situação</Text>
    <CashChoices values={[{ value: "pending", label: "Pendente" }, { value: "paid", label: "Realizado" }, { value: "cancelled", label: "Cancelado" }]} value={status} onChange={setStatus} disabled={busy} />
    {status === "paid" && field("Data do pagamento / recebimento *", paidDate, setPaidDate, "DD/MM/AAAA", 10)}
    {!entry && <>{field("Quantidade de lançamentos mensais", repetitions, setRepetitions, "1", 2, true)}<Text style={styles.hint}>1 cria um lançamento único. Até 24 repetições com o mesmo valor; cada uma poderá ser editada separadamente.</Text></>}
    <Text style={styles.label}>Observações</Text><TextInput accessibilityLabel="Observações" editable={!busy} value={notes} onChangeText={setNotes} multiline maxLength={2000} style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={save} style={[styles.save, busy && { opacity: 0.5 }]}><Text style={styles.selectedText}>{busy ? "Salvando…" : entry ? "Salvar alterações" : "Registrar lançamento"}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  form: { width: "100%", maxWidth: 650, padding: 12, gap: 12 },
  field: { gap: 7 }, label: { fontSize: 13, color: Colors.hex334155, fontFamily: "WorksansSemiBold" },
  hint: { fontSize: 12, lineHeight: 19, color: Colors.hex64748B },
  input: { borderWidth: 1, borderColor: Colors.hexCBD8E2, borderRadius: 7, padding: 12, color: Colors.hex0F172A, backgroundColor: Colors.white, fontSize: 14 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 7, borderWidth: 1, borderColor: Colors.hexDCE7EE, backgroundColor: Colors.hexF8FAFC },
  selected: { backgroundColor: Colors.hex0B4F6C, borderColor: Colors.hex0B4F6C },
  choiceText: { fontSize: 12, color: Colors.hex475569 }, selectedText: { fontSize: 13, color: Colors.white, fontFamily: "WorksansSemiBold" },
  save: { padding: 15, alignItems: "center", borderRadius: 7, backgroundColor: Colors.hex0B4F6C, marginTop: 6 },
  error: { color: Colors.hexB91C1C, fontSize: 13, lineHeight: 20 },
});
