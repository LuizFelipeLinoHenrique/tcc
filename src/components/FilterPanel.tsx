import { Colors } from "@/src/theme/colors";
import { ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { pagesStyles } from "./ScreensLayout";

type FilterPanelProps = {
  children: ReactNode;
  onClear: () => void;
  isMobile: boolean;
  additionalFilters?: ReactNode;
  additionalFiltersLabel?: string;
  testID?: string;
};

export function FilterPanel({ children, onClear, isMobile, additionalFilters, additionalFiltersLabel = "Mais filtros", testID }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  return <View testID={testID} style={filterStyles.panel}>
    <View style={filterStyles.heading}>
      <Text style={pagesStyles.textBold}>Filtros</Text>
      {isMobile && additionalFilters && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={filterStyles.toggle}>
        <Text style={pagesStyles.link}>{expanded ? "Recolher" : additionalFiltersLabel}</Text>
      </Pressable>}
    </View>
    {children}
    {additionalFilters && (!isMobile || expanded) && <View style={filterStyles.filterRow}>{additionalFilters}</View>}
    <Pressable accessibilityRole="button" onPress={onClear} style={filterStyles.clear}><Text style={pagesStyles.link}>Limpar filtros</Text></Pressable>
  </View>;
}

export function FilterChoices<T extends string>({ items, value, onChange }: {
  items: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return <View style={filterStyles.options}>{items.map(([key, label]) =>
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: key === value }}
      onPress={() => onChange(key)} style={[filterStyles.chip, key === value && filterStyles.selected]}>
      <Text style={[filterStyles.chipText, key === value && filterStyles.selectedText]}>{label}</Text>
    </Pressable>)}</View>;
}

export const filterStyles = StyleSheet.create({
  panel: { padding: 16, gap: 14, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 8 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggle: { paddingVertical: 8 }, column: { flexDirection: "column" },
  searchRow: { flexDirection: "row", gap: 20 }, searchType: { gap: 7, flexShrink: 1 },
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
