import { Colors } from "@/src/theme/colors";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { pagesStyles } from "./ScreensLayout";

type Status = "TODOS" | "P" | "E" | "C";
type Period = "TODOS" | "HOJE" | "7_DIAS" | "30_DIAS";
type Search = "PEDIDO" | "CLIENTE" | "MATERIAL";
type Props = {
  pesquisa: string; setPesquisa: React.Dispatch<React.SetStateAction<string>>;
  tipoPesquisa: Search; setTipoPesquisa: React.Dispatch<React.SetStateAction<Search>>;
  statusFiltro: Status; setStatusFiltro: React.Dispatch<React.SetStateAction<Status>>;
  periodoFiltro: Period; setPeriodoFiltro: React.Dispatch<React.SetStateAction<Period>>;
  onSearch: () => void; onClear: () => void; isMobile: boolean;
};
export function OrdersFilters(p: Props) {
  const [expanded, setExpanded] = useState(false);
  function choices<T extends string>(items: readonly (readonly [T, string])[], value: T, set: (value: T) => void) {
    return <View style={styles.options}>{items.map(([key, label]) =>
      <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: key === value }}
        onPress={() => set(key)} style={[styles.chip, key === value && styles.selected]}>
        <Text style={[styles.chipText, key === value && styles.selectedText]}>{label}</Text>
      </Pressable>)}</View>;
  }
  return <View testID="orders-filters" style={styles.panel}>
    <View style={styles.heading}><Text style={pagesStyles.textBold}>Filtros</Text>
      {p.isMobile && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.toggle}><Text style={pagesStyles.link}>{expanded ? "Recolher" : "Status e período"}</Text></Pressable>}
    </View>
    <View style={[styles.searchRow, p.isMobile && styles.column]}>
      <View style={styles.searchType}><Text style={pagesStyles.label}>Pesquisar por</Text>{choices<Search>([["PEDIDO", "Pedido"], ["CLIENTE", "Cliente"], ["MATERIAL", "Produto"]], p.tipoPesquisa, p.setTipoPesquisa)}</View>
      <View style={styles.searchField}><Text style={pagesStyles.label}>Identificador</Text><View style={styles.inputRow}>
        <TextInput accessibilityLabel="Identificador" placeholder={`ID do ${p.tipoPesquisa === "PEDIDO" ? "pedido" : p.tipoPesquisa === "CLIENTE" ? "cliente" : "produto"}`} keyboardType="number-pad" value={p.pesquisa} onChangeText={p.setPesquisa} onSubmitEditing={p.onSearch} style={[pagesStyles.input, styles.input]} />
        <Pressable accessibilityRole="button" onPress={p.onSearch} style={pagesStyles.primaryButton}><Text style={pagesStyles.primaryButtonText}>Pesquisar</Text></Pressable>
      </View></View>
    </View>
    {(!p.isMobile || expanded) && <View style={styles.filterRow}>
      <View style={styles.group}><Text style={pagesStyles.label}>Status</Text>{choices<Status>([["TODOS", "Todos"], ["P", "Pendente"], ["E", "Entregue"], ["C", "Cancelado"]], p.statusFiltro, p.setStatusFiltro)}</View>
      <View style={styles.group}><Text style={pagesStyles.label}>Período</Text>{choices<Period>([["TODOS", "Todo o período"], ["HOJE", "Hoje"], ["7_DIAS", "7 dias"], ["30_DIAS", "30 dias"]], p.periodoFiltro, p.setPeriodoFiltro)}</View>
    </View>}
    <Pressable accessibilityRole="button" onPress={p.onClear} style={styles.clear}><Text style={pagesStyles.link}>Limpar filtros</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  panel: { padding: 16, gap: 14, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 8 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggle: { paddingVertical: 8 }, column: { flexDirection: "column" },
  searchRow: { flexDirection: "row", gap: 20 }, searchType: { gap: 7 },
  searchField: { flex: 1, minWidth: 0, gap: 7 }, inputRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, minWidth: 0, paddingHorizontal: 10 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { minHeight: 36, paddingHorizontal: 12, justifyContent: "center", borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 6, backgroundColor: Colors.white },
  selected: { backgroundColor: Colors.hexE0F2FE, borderColor: Colors.hex0B4F6C },
  chipText: { fontFamily: "WorksansMedium", color: Colors.hex475569, fontSize: 12 },
  selectedText: { color: Colors.hex0B4F6C },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.hexDCE7EE },
  group: { gap: 7 }, clear: { alignSelf: "flex-start", paddingVertical: 6 },
});
