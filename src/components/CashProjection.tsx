import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CashLineChart } from "@/src/components/CashLineChart";
import { displayDate, money } from "@/src/lib/cashFlow";
import { Colors } from "@/src/theme/colors";

export function CashProjection({ points }: { points: { date: string; balance: number }[] }) {
  const [containerWidth, setContainerWidth] = useState(0);
  if (points.length === 0) return <Text style={styles.note}>Nenhuma projeção disponível.</Text>;

  const values = points.map(point => point.balance);
  const minimum = Math.min(...values);
  const last = points[points.length - 1];

  return <View style={styles.container} testID="cash-projection">
    <View style={styles.row}><Text style={styles.muted}>Saldo projetado em {displayDate(last.date)}</Text><Text style={[styles.amount, { color: last.balance < 0 ? Colors.hexB91C1C : Colors.hex0B4F6C }]}>{money(last.balance)}</Text></View>
    <View
      style={styles.chart}
      onLayout={({ nativeEvent }) => setContainerWidth(nativeEvent.layout.width)}
      accessibilityRole="image"
      accessibilityLabel={`Projeção de saldo: início ${money(points[0].balance)}, mínimo ${money(minimum)}, final ${money(last.balance)}`}
    >
      {containerWidth > 0 && <CashLineChart points={points} width={containerWidth} />}
    </View>
    <Text style={styles.muted}>Mínimo: {money(minimum)} • Valores em R$</Text>
    {minimum < 0 && <Text style={styles.warning}>Atenção: há previsão de saldo negativo neste horizonte.</Text>}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  chart: { width: "100%", minWidth: 0 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  muted: { color: Colors.hex64748B, fontSize: 12 },
  amount: { fontSize: 22, fontFamily: "WorksansBold" },
  note: { fontSize: 12, color: Colors.hex64748B, lineHeight: 19 },
  warning: { color: Colors.hexB91C1C, fontSize: 13 },
});
