import { AnimatedButton } from "@/src/components/AnimatedButton";
import { LineGraph } from "@/src/components/LineGraph";
import { PagesLayout, pagesStyles } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { lineDataItem } from "react-native-gifted-charts";

export default function homeScreen() {
    const { isMobile, graphWidth, maxCardWidth } = useResponsive();
    const [ordersNum, setOrdersNum] = useState<lineDataItem[]>([]);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const spacing =
        ordersNum.length > 1
            ? (graphWidth - 30 /* apenas para dar espaço, evitando cortar os labels */) / (ordersNum.length - 1)
            : 0;
    const [maxValue, setMaxValue] = useState<number>(0);

    const getStartDate = (months: number) => {
        const date = new Date();

        date.setDate(1);
        date.setMonth(date.getMonth() - months + 1);

        return date;
    };

    const [startDate, setStartDate] = useState<Date>(
        getStartDate(3)
    );

    const [endDate, setEndDate] = useState<Date>(
        new Date()
    );

    const [active, setActive] = useState<number>(3);

    useEffect(() => {
        async function loadData() {
            setLoadingData(true);

            const { data, error } = await supabase.rpc("get_orders_per_month", {
                start_date: startDate.toLocaleDateString("en-CA"),
                end_date: endDate.toLocaleDateString("en-CA")
            });

            if (error) {
                console.log("Erro: ", error.message);
                setLoadingData(false);
                return;
            }

            if (data) {
                setOrdersNum(
                    data.map((orders: {
                        total_orders: number;
                        month: string;
                    }) => {
                        const date = new Date(orders.month);

                        return {
                            value: Number(orders.total_orders),
                            label: date.toLocaleDateString("pt-BR", {
                                month: "2-digit",
                                year: "2-digit"
                            })
                        };
                    })
                );

                const maior = Math.max(
                    ...data.map(
                        (item: { total_orders: number }) =>
                            item.total_orders
                    )
                );

                setMaxValue(Math.ceil((maior + 5) / 5) * 5);
            };
            setLoadingData(false);
        };
        loadData();

    }, [startDate, endDate]);

    function setDateRange(months: number): void {
        setStartDate(getStartDate(months));
        setEndDate(new Date());
    }

    // Cálculos derivados para KPIs do dashboard
    const totalOrders = ordersNum.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const avgOrders = ordersNum.length > 0 ? (totalOrders / ordersNum.length).toFixed(1) : "0";
    const peakOrder = ordersNum.length > 0 ? Math.max(...ordersNum.map((o) => o.value || 0)) : 0;

    return (
        <PagesLayout scroll={true}>
            {/* Dashboard Header */}
            <View style={styles.dashboardHeader}>
                <View>
                    <Text style={pagesStyles.brand}>PAINEL DE CONTROLE • TCC</Text>
                    <Text style={styles.dashboardTitle}>Visão Geral de Desempenho</Text>
                    <Text style={styles.dashboardSubtitle}>
                        Métricas consolidadas e evolução temporal de pedidos
                    </Text>
                </View>
            </View>

            {!loadingData ? (
                <>
                    {/* KPI Cards Row */}
                    <View style={styles.kpiContainer}>
                        <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
                            <View style={[styles.kpiIconWrapper, { backgroundColor: "#F5EEE8" }]}>
                                <Ionicons name="cube" size={22} color="#79553D" />
                            </View>
                            <View style={styles.kpiContent}>
                                <Text style={styles.kpiLabel}>Total no Período</Text>
                                <Text style={styles.kpiValue}>{totalOrders}</Text>
                                <Text style={styles.kpiFootnote}>pedidos registrados</Text>
                            </View>
                        </View>

                        <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
                            <View style={[styles.kpiIconWrapper, { backgroundColor: "#EAF2EA" }]}>
                                <Ionicons name="trending-up" size={22} color="#4A754D" />
                            </View>
                            <View style={styles.kpiContent}>
                                <Text style={styles.kpiLabel}>Média Mensal</Text>
                                <Text style={styles.kpiValue}>{avgOrders}</Text>
                                <Text style={styles.kpiFootnote}>pedidos por mês</Text>
                            </View>
                        </View>

                        <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
                            <View style={[styles.kpiIconWrapper, { backgroundColor: "#F7F1E6" }]}>
                                <Ionicons name="trophy" size={22} color="#9C773D" />
                            </View>
                            <View style={styles.kpiContent}>
                                <Text style={styles.kpiLabel}>Pico de Vendas</Text>
                                <Text style={styles.kpiValue}>{peakOrder}</Text>
                                <Text style={styles.kpiFootnote}>maior volume mensal</Text>
                            </View>
                        </View>
                    </View>

                    {/* Period Switcher */}
                    <View style={styles.periodSection}>
                        <View style={styles.periodHeader}>
                            <Ionicons name="calendar-outline" size={16} color="#766E64" />
                            <Text style={styles.periodSectionLabel}>Filtrar Período do Gráfico:</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <AnimatedButton
                                stylesAnimatedView={pagesStyles.animatedView}
                                title="3 MESES"
                                stylesPressable={[
                                    styles.periodButton,
                                    active === 3 && styles.periodButtonActive,
                                ]}
                                stylesText={[
                                    styles.periodButtonText,
                                    active === 3 && styles.periodButtonTextActive,
                                ]}
                                onPress={() => {
                                    setDateRange(3);
                                    setActive(3);
                                }}
                            />
                            <AnimatedButton
                                stylesAnimatedView={pagesStyles.animatedView}
                                title="6 MESES"
                                stylesPressable={[
                                    styles.periodButton,
                                    active === 6 && styles.periodButtonActive,
                                ]}
                                stylesText={[
                                    styles.periodButtonText,
                                    active === 6 && styles.periodButtonTextActive,
                                ]}
                                onPress={() => {
                                    setDateRange(6);
                                    setActive(6);
                                }}
                            />
                            <AnimatedButton
                                stylesAnimatedView={pagesStyles.animatedView}
                                title="12 MESES"
                                stylesPressable={[
                                    styles.periodButton,
                                    active === 12 && styles.periodButtonActive,
                                ]}
                                stylesText={[
                                    styles.periodButtonText,
                                    active === 12 && styles.periodButtonTextActive,
                                ]}
                                onPress={() => {
                                    setDateRange(12);
                                    setActive(12);
                                }}
                            />
                        </View>
                    </View>

                    {/* Main Chart Card */}
                    <View style={styles.graphContainer}>
                        <View
                            style={[
                                pagesStyles.card,
                                {
                                    backgroundColor: "#FFFFFF",
                                    maxWidth: maxCardWidth,
                                }
                            ]}
                        >
                            <LineGraph
                                title="Evolução de Pedidos"
                                subtitle={`Histórico temporal dos últimos ${active} meses`}
                                data={ordersNum}
                                width={graphWidth}
                                maxValue={maxValue}
                                spacing={spacing}
                                noOfSections={5}
                            />
                        </View>
                    </View>
                </>
            ) : (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#79553D" />
                    <Text style={styles.loadingText}>Carregando métricas...</Text>
                </View>
            )}
        </PagesLayout>
    );
};

const styles = StyleSheet.create({
    dashboardHeader: {
        marginBottom: 20,
    },
    dashboardTitle: {
        fontSize: 24,
        fontFamily: "WorksansBold",
        color: "#2C2520",
        marginTop: 4,
    },
    dashboardSubtitle: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: "#766E64",
        marginTop: 2,
    },
    kpiContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20,
    },
    kpiCard: {
        flex: 1,
        minWidth: 150,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E8E2D8",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        shadowColor: "#30241A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    kpiCardMobile: {
        minWidth: "100%",
    },
    kpiIconWrapper: {
        width: 46,
        height: 46,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    kpiContent: {
        flex: 1,
    },
    kpiLabel: {
        fontSize: 12,
        fontFamily: "WorksansMedium",
        color: "#766E64",
    },
    kpiValue: {
        fontSize: 22,
        fontFamily: "WorksansBold",
        color: "#2C2520",
        marginTop: 2,
    },
    kpiFootnote: {
        fontSize: 11,
        fontFamily: "WorksansRegular",
        color: "#9C948A",
    },
    periodSection: {
        marginBottom: 20,
        gap: 8,
    },
    periodHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    periodSectionLabel: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#6E665E",
    },
    buttonContainer: {
        flexDirection: "row",
        backgroundColor: "#EAE3D8",
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    periodButton: {
        minHeight: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        paddingHorizontal: 8,
    },
    periodButtonActive: {
        backgroundColor: "#FFFFFF",
        shadowColor: "#30241A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    periodButtonText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#6E665E",
    },
    periodButtonTextActive: {
        color: "#79553D",
        fontFamily: "WorksansBold",
    },
    graphContainer: {
        flexDirection: "row",
        width: "100%",
    },
    loadingContainer: {
        flex: 1,
        minHeight: 300,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: "WorksansRegular",
        color: "#79553D",
    },
});