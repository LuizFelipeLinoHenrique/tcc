import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { LineGraph } from "./LineGraph";
import { Colors } from "../theme/colors";

type Point = { label: string; value: number };
type Group = Point & { color: string };

export function DashboardTrend({ data, color = Colors.hex0B4F6C, monetary = false }: { data: Point[]; color?: string; monetary?: boolean }) {
    const [width, setWidth] = useState(0);
    const axisWidth = monetary ? 58 : 32;
    const plotWidth = Math.max(40, width - axisWidth - 24);
    const labelInterval = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotWidth / 50))));
    const points = data.map((point, index) => {
        const visible = index === data.length - 1 || (index % labelInterval === 0 && data.length - 1 - index >= labelInterval);
        return { ...point, labelComponent: () => <Text style={styles.axisLabel}>{visible ? point.label : ""}</Text> };
    });
    const max = Math.max(monetary ? 5 : 4, ...data.map(point => Math.abs(point.value)));
    return <View testID="dashboard-trend" style={styles.trend} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && <LineGraph title="" showHeader={false} data={points} color={color} curved={false}
            width={plotWidth} maxValue={Math.ceil(max / 4) * 4} spacing={(plotWidth - 28) / Math.max(data.length - 1, 1)}
            minSpacing={8} noOfSections={4} plotHeight={180} yAxisLabelWidth={axisWidth}
            formatYLabel={label => Number(label).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: monetary ? 1 : 0 })} />}
    </View>;
}

export function DashboardRanking({ data, emptyLabel }: { data: Point[]; emptyLabel: string }) {
    const maximum = Math.max(1, ...data.map(item => item.value));
    const items = data.filter(item => item.value > 0);
    if (!items.length) return <View style={styles.empty}><Text style={styles.muted}>{emptyLabel}</Text></View>;
    return <View style={styles.ranking}>
        {items.map((item, index) => <View key={item.label + index} style={styles.rankRow}>
            <Text style={styles.rankNumber}>{String(index + 1).padStart(2, "0")}</Text>
            <View style={styles.rankContent}>
                <View style={styles.rankHeading}><Text style={styles.rankLabel}>{item.label}</Text><Text style={styles.rankValue}>{item.value.toLocaleString("pt-BR")} <Text style={styles.unit}>un.</Text></Text></View>
                <View style={styles.track}><View style={[styles.bar, { width: `${item.value / maximum * 100}%`, opacity: 1 - index * 0.15 }]} /></View>
            </View>
        </View>)}
    </View>;
}

export function DashboardOrderMix({ data }: { data: Group[] }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return <View style={styles.mix}>
        <View style={styles.donut} accessibilityLabel={total ? "Distribuição dos pedidos por status" : "Nenhum pedido registrado"}>
            <Svg width={136} height={136} viewBox="0 0 136 136">
                <Circle cx={68} cy={68} r={radius} fill="none" stroke={Colors.hexEEF2F6} strokeWidth={12} />
                {total > 0 && data.filter(item => item.value > 0).map(item => {
                    const length = item.value / total * circumference;
                    const start = offset;
                    offset += length;
                    return <Circle key={item.label} cx={68} cy={68} r={radius} fill="none" stroke={item.color} strokeWidth={12}
                        strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} transform="rotate(-90 68 68)" />;
                })}
            </Svg>
            <View style={styles.donutCenter}><Text style={styles.donutValue}>{total ? "100%" : "—"}</Text><Text style={styles.muted}>distribuição</Text></View>
        </View>
        <View style={styles.legend}>{data.map(item => <View key={item.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} /><Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendValue}>{total ? Math.round(item.value / total * 100) : 0}%</Text>
        </View>)}</View>
    </View>;
}

const styles = StyleSheet.create({
    axisLabel: { width: 44, alignSelf: "center", textAlign: "center", fontSize: 10, fontFamily: "WorksansRegular", color: Colors.hex64748B },
    trend: { width: "100%", minHeight: 224, minWidth: 0, paddingTop: 12 },
    ranking: { gap: 22, paddingVertical: 16 },
    rankRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    rankNumber: { color: Colors.hex94A3B8, fontSize: 12, fontFamily: "WorksansMedium", width: 20 },
    rankContent: { flex: 1, minWidth: 0, gap: 9 },
    rankHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    rankLabel: { flex: 1, color: Colors.hex334155, fontSize: 13, lineHeight: 19, fontFamily: "WorksansMedium" },
    rankValue: { color: Colors.hex0F172A, fontSize: 13, fontFamily: "WorksansSemiBold", flexShrink: 0 },
    unit: { color: Colors.hex64748B, fontSize: 11, fontFamily: "WorksansRegular" },
    track: { height: 6, backgroundColor: Colors.hexEEF2F6, borderRadius: 3, overflow: "hidden" },
    bar: { height: "100%", backgroundColor: Colors.hex0B4F6C, borderRadius: 3 },
    empty: { minHeight: 180, alignItems: "center", justifyContent: "center", padding: 16 },
    muted: { color: Colors.hex64748B, fontSize: 11, lineHeight: 16, fontFamily: "WorksansRegular", textAlign: "center" },
    mix: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 24, paddingVertical: 20, minHeight: 224 },
    donut: { width: 136, height: 136, alignItems: "center", justifyContent: "center" },
    donutCenter: { position: "absolute", alignItems: "center", gap: 2 },
    donutValue: { color: Colors.hex0F172A, fontSize: 25, fontFamily: "WorksansSemiBold" },
    legend: { flexGrow: 1, flexBasis: 130, gap: 18 },
    legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { height: 8, width: 8, borderRadius: 4 },
    legendLabel: { flex: 1, fontSize: 12, color: Colors.hex475569, fontFamily: "WorksansRegular" },
    legendValue: { fontSize: 12, color: Colors.hex1E293B, fontFamily: "WorksansSemiBold" },
});
