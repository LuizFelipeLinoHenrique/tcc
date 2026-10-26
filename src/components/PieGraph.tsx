import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

export type PieGraphItem = {
    value: number;
    color: string;
    label: string;
    text?: string;
};

export type PieGraphProps = {
    title: string;
    subtitle?: string;
    data: PieGraphItem[];
    totalCount?: number;
    centerLabelTitle?: string;
    centerLabelSub?: string;
};

export function PieGraph({
    title,
    subtitle,
    data,
    totalCount,
    centerLabelTitle,
    centerLabelSub = "Total",
}: PieGraphProps) {
    const total = totalCount ?? data.reduce((acc, curr) => acc + (curr.value || 0), 0);

    if (total === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    </View>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="pie-chart-outline" size={32} color="#94A3B8" />
                    <Text style={styles.emptyText}>Nenhum pedido registrado para o gráfico</Text>
                </View>
            </View>
        );
    }

    const activePieData = data.filter((item) => item.value > 0);
    const pieData = (activePieData.length > 0 ? activePieData : [{ value: 1, color: "#CBD8E2", text: "" }]).map((item) => ({
        value: item.value,
        color: item.color,
        text: item.value > 0 && total > 0 ? `${Math.round((item.value / total) * 100)}%` : "",
        textColor: "#FFFFFF",
        textSize: 11,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <View style={styles.badge}>
                    <Ionicons name="pie-chart" size={14} color="#0B4F6C" />
                    <Text style={styles.badgeText}>Status</Text>
                </View>
            </View>

            <View style={styles.contentRow}>
                {/* Gráfico Donut */}
                <View style={styles.chartWrapper}>
                    <PieChart
                        donut
                        isAnimated
                        animationDuration={600}
                        radius={70}
                        innerRadius={46}
                        innerCircleColor="#FFFFFF"
                        data={pieData}
                        centerLabelComponent={() => (
                            <View style={styles.centerLabel}>
                                <Text style={styles.centerValue}>
                                    {centerLabelTitle ?? total}
                                </Text>
                                <Text style={styles.centerSubText}>{centerLabelSub}</Text>
                            </View>
                        )}
                    />
                </View>

                {/* Legendas e Indicadores */}
                <View style={styles.legendContainer}>
                    {data.map((item) => {
                        const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
                        return (
                            <View key={item.label} style={styles.legendItem}>
                                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                                <View style={styles.legendInfo}>
                                    <Text style={styles.legendLabel} numberOfLines={1}>
                                        {item.label}
                                    </Text>
                                    <View style={styles.legendValues}>
                                        <Text style={styles.legendCount}>{item.value}</Text>
                                        <Text style={styles.legendPct}>({pct}%)</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontFamily: "WorksansBold",
        color: "#0F172A",
    },
    subtitle: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: "#475569",
        marginTop: 2,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#E8F1F5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: "#0B4F6C",
    },
    contentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        flexWrap: "wrap",
        gap: 16,
        paddingVertical: 6,
    },
    chartWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    centerLabel: {
        alignItems: "center",
        justifyContent: "center",
    },
    centerValue: {
        fontSize: 18,
        fontFamily: "WorksansBold",
        color: "#0F172A",
    },
    centerSubText: {
        fontSize: 10,
        fontFamily: "WorksansRegular",
        color: "#64748B",
    },
    legendContainer: {
        flex: 1,
        minWidth: 150,
        gap: 10,
        justifyContent: "center",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendInfo: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    legendLabel: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: "#1E293B",
    },
    legendValues: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    legendCount: {
        fontSize: 13,
        fontFamily: "WorksansBold",
        color: "#0F172A",
    },
    legendPct: {
        fontSize: 11,
        fontFamily: "WorksansRegular",
        color: "#64748B",
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    emptyText: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: "#64748B",
    },
});
