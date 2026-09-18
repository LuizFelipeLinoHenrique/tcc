import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export type LineGraphProps = {
    title: string;
    subtitle?: string;
    data: any[];
    width: number;
    maxValue: number;
    spacing: number;
    noOfSections: number;
}

export function LineGraph({ title, subtitle, data, width, maxValue, spacing, noOfSections }: LineGraphProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text style={styles.subtitle}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.badge}>
                    <Ionicons name="trending-up" size={14} color="#79553D" />
                    <Text style={styles.badgeText}>Métricas</Text>
                </View>
            </View>

            <View style={styles.chartWrapper}>
                <LineChart
                    isAnimated
                    curved
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
                    spacing={spacing}
                    rulesColor="#ECE6DC"
                    rulesType="dashed"
                    initialSpacing={14}
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
};

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
        backgroundColor: "#F4EFEA",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    chartWrapper: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 8,
    },
    axisText: {
        color: "#8C8276",
        fontSize: 11,
        fontFamily: "WorksansRegular",
    },
});