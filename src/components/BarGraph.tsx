import { Colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export type BarGraphItem = {
    value: number;
    label: string;
    frontColor?: string;
};

export type BarGraphProps = {
    title: string;
    subtitle?: string;
    badgeText?: string;
    badgeIcon?: keyof typeof Ionicons.glyphMap;
    data: BarGraphItem[];
    width: number;
    maxValue?: number;
    noOfSections?: number;
};

export function BarGraph({
    title,
    subtitle,
    badgeText = "Ranking",
    badgeIcon = "bar-chart",
    data,
    width,
    maxValue,
    noOfSections = 4,
}: BarGraphProps) {
    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    </View>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="stats-chart-outline" size={32} color={Colors.hex94A3B8} />
                    <Text style={styles.emptyText}>Sem dados suficientes para o gráfico</Text>
                </View>
            </View>
        );
    }

    const calculatedMax = maxValue || Math.max(...data.map((d) => d.value), 10);
    const spacing = data.length > 1 ? Math.max((width - 70 - data.length * 32) / (data.length - 1), 16) : Math.max(width / 3, 30);
    const initialSpacing = data.length === 1 ? Math.max((width - 80) / 2, 20) : 18;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <View style={styles.badge}>
                    <Ionicons name={badgeIcon} size={14} color={Colors.hex0B4F6C} />
                    <Text style={styles.badgeText}>{badgeText}</Text>
                </View>
            </View>

            <View style={styles.chartWrapper}>
                <BarChart
                    isAnimated
                    animationDuration={800}
                    data={data}
                    width={width}
                    height={190}
                    barWidth={26}
                    barBorderRadius={6}
                    frontColor={Colors.hex0B4F6C}
                    maxValue={calculatedMax}
                    noOfSections={noOfSections}
                    yAxisTextStyle={styles.axisText}
                    xAxisLabelTextStyle={styles.axisText}
                    spacing={spacing}
                    initialSpacing={initialSpacing}
                    rulesColor={Colors.hexE2EBF0}
                    rulesType="dashed"
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={Colors.hexCBD8E2}
                    yAxisLabelWidth={28}
                    showValuesAsTopLabel
                    topLabelTextStyle={styles.topValueText}
                />
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
        color: Colors.hex0F172A,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: Colors.hex475569,
        marginTop: 2,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.hexE8F1F5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0B4F6C,
    },
    chartWrapper: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingTop: 10,
    },
    axisText: {
        color: Colors.hex64748B,
        fontSize: 11,
        fontFamily: "WorksansRegular",
    },
    topValueText: {
        color: Colors.hex0B4F6C,
        fontSize: 10,
        fontFamily: "WorksansSemiBold",
        marginBottom: 2,
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
        color: Colors.hex64748B,
    },
});
