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
};

export function LineGraph({
    title,
    subtitle,
    data,
    width,
    maxValue,
    spacing,
    noOfSections,
}: LineGraphProps) {
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
                    <Ionicons name="analytics-outline" size={32} color="#C2B8AD" />
                    <Text style={styles.emptyText}>Nenhum pedido registrado no período selecionado</Text>
                </View>
            </View>
        );
    }

    const safeSpacing = data.length > 1 ? Math.max(spacing, 20) : 50;
    const safeInitialSpacing = data.length === 1 ? Math.max((width - 60) / 2, 20) : 14;

    // Custom data point para Web que evita passar 'onPressOut' para elementos SVG <circle> nativos do DOM
    const renderCustomPoint = () => (
        <View style={styles.customPoint} />
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <View style={styles.badge}>
                    <Ionicons name="trending-up" size={14} color="#79553D" />
                    <Text style={styles.badgeText}>Métricas</Text>
                </View>
            </View>

            <View style={styles.chartWrapper}>
                <LineChart
                    isAnimated
                    curved={data.length > 1}
                    areaChart
                    rotateLabel={false}
                    width={width}
                    data={data}
                    maxValue={maxValue || 10}
                    color="#79553D"
                    thickness={3}
                    startFillColor="#79553D"
                    endFillColor="#FAF7F2"
                    startOpacity={0.28}
                    endOpacity={0.02}
                    noOfSections={noOfSections}
                    animateOnDataChange
                    animationDuration={1000}
                    onDataChangeAnimationDuration={400}
                    yAxisTextStyle={styles.axisText}
                    dataPointsColor="#79553D"
                    dataPointsRadius={4}
                    dataPointsWidth={8}
                    dataPointsHeight={8}
                    customDataPoint={Platform.OS === "web" ? renderCustomPoint : undefined}
                    disableForeignObject={true}
                    focusEnabled={false}
                    spacing={safeSpacing}
                    rulesColor="#ECE6DC"
                    rulesType="dashed"
                    initialSpacing={safeInitialSpacing}
                    yAxisThickness={0}
                    yAxisLabelWidth={24}
                    xAxisThickness={1}
                    xAxisColor="#E0D7CB"
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
        color: "#2C2520",
    },
    subtitle: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: "#766E64",
        marginTop: 2,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F4EDE6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    chartWrapper: {
        width: "100%",
        paddingTop: 8,
    },
    axisText: {
        color: "#8C8276",
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
        color: "#9C948A",
    },
    customPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#79553D",
        borderWidth: 1.5,
        borderColor: "#FFFFFF",
        shadowColor: "#30241A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 1,
    },
});
