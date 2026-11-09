import { Colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export type LineGraphProps = {
    title: string;
    subtitle?: string;
    data: any[];
    width: number;
    maxValue: number;
    spacing: number;
    noOfSections: number;
    yAxisLabelWidth?: number;
    formatYLabel?: (label: string) => string;
    /** Altura total do traçado, incluindo a região abaixo do saldo zero. */
    plotHeight?: number;
    showHeader?: boolean;
};

export function LineGraph({
    title,
    subtitle,
    data,
    width,
    maxValue,
    spacing,
    noOfSections,
    yAxisLabelWidth = 24,
    formatYLabel,
    plotHeight,
    showHeader = true,
}: LineGraphProps) {
    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                {showHeader && <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    </View>
                </View>}
                <View style={styles.emptyContainer}>
                    <Ionicons name="analytics-outline" size={32} color={Colors.hex94A3B8} />
                    <Text style={styles.emptyText}>Nenhum pedido registrado no período selecionado</Text>
                </View>
            </View>
        );
    }

    const safeSpacing = data.length > 1 ? Math.max(spacing, 20) : 50;
    const safeInitialSpacing = data.length === 1 ? Math.max((width - 60) / 2, 20) : 14;
    const mostNegativeValue = Math.min(0, ...data.map(item => item.value ?? 0));
    const negativeSections = Math.ceil(-mostNegativeValue / ((maxValue || 10) / noOfSections));
    // Gifted Charts soma a altura negativa à prop height, que define só a região positiva.
    const positiveHeight = plotHeight === undefined
        ? undefined
        : plotHeight * noOfSections / (noOfSections + negativeSections);

    // Custom data point para Web que evita passar 'onPressOut' para elementos SVG <circle> nativos do DOM
    const renderCustomPoint = () => (
        <View style={styles.customPoint} />
    );

    return (
        <View style={styles.container}>
            {showHeader && <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <View style={styles.badge}>
                    <Ionicons name="trending-up" size={14} color={Colors.hex0B4F6C} />
                    <Text style={styles.badgeText}>Métricas</Text>
                </View>
            </View>}

            <View style={styles.chartWrapper} testID="line-graph-plot">
                <LineChart
                    isAnimated
                    curved={data.length > 1}
                    areaChart
                    rotateLabel={false}
                    width={width}
                    height={positiveHeight}
                    noOfSectionsBelowXAxis={plotHeight === undefined ? undefined : negativeSections}
                    data={data}
                    maxValue={maxValue || 10}
                    mostNegativeValue={mostNegativeValue}
                    color={Colors.hex0B4F6C}
                    thickness={3}
                    startFillColor={Colors.hex0B4F6C}
                    endFillColor={Colors.hexF8FAFC}
                    startOpacity={0.28}
                    endOpacity={0.02}
                    noOfSections={noOfSections}
                    animateOnDataChange
                    animationDuration={1000}
                    onDataChangeAnimationDuration={400}
                    yAxisTextStyle={styles.axisText}
                    dataPointsColor={Colors.hex0B4F6C}
                    dataPointsRadius={4}
                    dataPointsWidth={8}
                    dataPointsHeight={8}
                    customDataPoint={Platform.OS === "web" ? renderCustomPoint : undefined}
                    disableForeignObject={true}
                    focusEnabled={false}
                    spacing={safeSpacing}
                    rulesColor={Colors.hexE2EBF0}
                    rulesType="dashed"
                    initialSpacing={safeInitialSpacing}
                    yAxisThickness={0}
                    yAxisLabelWidth={yAxisLabelWidth}
                    formatYLabel={formatYLabel}
                    xAxisThickness={1}
                    xAxisColor={Colors.hexCBD8E2}
                    xAxisLabelTextStyle={styles.axisText}
                    xAxisLabelsHeight={24}
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
        width: "100%",
        paddingTop: 8,
    },
    axisText: {
        color: Colors.hex64748B,
        fontSize: 11,
        fontFamily: "WorksansRegular",
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
    customPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.hex0B4F6C,
        borderWidth: 1.5,
        borderColor: Colors.white,
        shadowColor: Colors.hex082F42,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
});
