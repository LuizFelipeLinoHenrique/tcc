import { ReactNode, useState } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  compact: boolean;
  panelStyle: StyleProp<ViewStyle>;
  projection: ReactNode;
  categoryHeader: ReactNode;
  children: ReactNode;
};

export function CashAnalyticsPanels({ compact, panelStyle, projection, categoryHeader, children }: Props) {
  const [projectionHeight, setProjectionHeight] = useState<number>();

  return <View style={[styles.panels, compact && styles.stacked]}>
    <View
      testID="cash-projection-card"
      style={[panelStyle, !compact && styles.projection]}
      onLayout={({ nativeEvent }) => {
        const height = nativeEvent.layout.height;
        if (height > 0) setProjectionHeight(previous => previous === undefined || Math.abs(previous - height) > 0.5 ? height : previous);
      }}
    >{projection}</View>
    <View testID="cash-categories-card" style={[panelStyle, styles.categories, !compact && styles.categoryColumn, { height: projectionHeight ?? 320 }]}>
      {categoryHeader}
      <ScrollView
        showsHorizontalScrollIndicator={false}
        testID="cash-categories-scroll"
        accessibilityLabel="Lista de saídas por categoria"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.items}
      >{children}</ScrollView>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  panels: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  stacked: { flexDirection: "column", alignItems: "stretch" },
  projection: { flex: 2 },
  categoryColumn: { flex: 1 },
  categories: { minHeight: 0, overflow: "hidden" },
  scroll: { flex: 1, minHeight: 0 },
  items: { gap: 16, paddingBottom: 4 },
});
