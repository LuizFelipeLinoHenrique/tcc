import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { CashEntry } from "@/src/lib/cashFlow";
import { monthlyCashReport } from "@/src/lib/cashReport";
import { exportCashReport } from "@/src/lib/exportCashReport";
import { Colors } from "@/src/theme/colors";
import { RecordModal } from "./RecordModal";

function ExportButton({ label, icon, onPress, disabled, primary }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, primary && styles.primary, (pressed || disabled) && { opacity: 0.5 }]}><Ionicons name={icon} size={17} color={primary ? Colors.white : Colors.hex475569} /><Text style={[styles.buttonText, primary && { color: Colors.white }]}>{label}</Text></Pressable>;
}

export function CashReportExport({ entries, month, disabled }: { entries: CashEntry[]; month: Date; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);

  async function download(format: "pdf" | "xlsx") {
    if (disabled || inFlight.current) return;
    inFlight.current = true;
    setExporting(format); setError(""); setNotice("");
    try {
      await exportCashReport(monthlyCashReport(entries, month), format);
      setOpen(false);
      setNotice(Platform.OS === "web" ? "Download do relatório mensal iniciado." : "Relatório mensal preparado para salvar ou compartilhar.");
    } catch {
      setError("Não foi possível gerar o relatório mensal. Tente novamente.");
    } finally { inFlight.current = false; setExporting(null); }
  }

  return <>
    <View style={styles.panel}>
      <View style={styles.between}>
        <View style={{ flex: 1, minWidth: 180, gap: 6 }}><Text style={styles.title}>Relatório mensal</Text><Text style={styles.small}>Exporte as métricas financeiras, os totais por categoria e a evolução diária do mês selecionado.</Text></View>
        <ExportButton label={exporting ? "Gerando relatório…" : "Exportar relatório mensal"} icon="document-text-outline" onPress={() => { setError(""); setNotice(""); setOpen(true); }} disabled={disabled || !!exporting} />
      </View>
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text>}
    </View>
    <RecordModal visible={open} title="Exportar relatório mensal" onClose={() => setOpen(false)} busy={!!exporting}>
      <View style={{ width: "100%", padding: 16, gap: 16 }}>
        <Text style={styles.title}>{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</Text>
        <Text style={styles.muted}>Resumo financeiro, quantidades por situação, categorias e evolução diária. Os filtros da lista não limitam o relatório.</Text>
        <Text style={styles.small}>{Platform.OS === "web" ? "Escolha o formato para baixar o arquivo." : "Escolha o formato para salvar ou compartilhar o arquivo."}</Text>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {!!exporting && <View style={styles.row}><ActivityIndicator color={Colors.hex0B4F6C} /><Text accessibilityLiveRegion="polite" style={styles.muted}>Gerando {exporting.toUpperCase()}…</Text></View>}
        <View style={styles.row}><ExportButton label="Baixar PDF" icon="document-text-outline" onPress={() => { void download("pdf"); }} primary disabled={disabled || !!exporting} /><ExportButton label="Baixar XLSX" icon="grid-outline" onPress={() => { void download("xlsx"); }} disabled={disabled || !!exporting} /></View>
      </View>
    </RecordModal>
  </>;
}

const styles = StyleSheet.create({
  panel: { padding: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 8, gap: 16 },
  between: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  title: { color: Colors.hex0F172A, fontSize: 16, fontFamily: "WorksansSemiBold" },
  muted: { color: Colors.hex64748B, fontSize: 13, lineHeight: 20 }, small: { color: Colors.hex64748B, fontSize: 12, lineHeight: 18 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 40, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 7, backgroundColor: Colors.white },
  primary: { backgroundColor: Colors.hex0B4F6C, borderColor: Colors.hex0B4F6C }, buttonText: { fontSize: 12, fontFamily: "WorksansSemiBold", color: Colors.hex475569 },
  success: { color: Colors.hex15803D, fontSize: 13 }, error: { color: Colors.hexB91C1C, fontSize: 13, lineHeight: 20 },
});
