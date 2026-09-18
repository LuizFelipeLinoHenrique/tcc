import { AnimatedButton } from "@/src/components/AnimatedButton";
import { LineGraph } from "@/src/components/LineGraph";
import { PagesLayout, pagesStyles } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { lineDataItem } from "react-native-gifted-charts";

export default function homeScreen() {
    const { graphWidth, maxCardWidth } = useResponsive();
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

    return (
        <PagesLayout scroll={true}>
            {!loadingData ?
                <>
                    <View style={styles.buttonContainer}>
                        <AnimatedButton
                            stylesAnimatedView={pagesStyles.animatedView}
                            title={"3 MESES"}
                            stylesPressable={[
                                active == 3
                                    ? pagesStyles.primaryButton
                                    : pagesStyles.secondaryButton,
                                {
                                    flex: 1
                                }
                            ]}
                            stylesText={
                                active == 3
                                    ? pagesStyles.primaryButtonText
                                    : pagesStyles.secondaryButtonText
                            }
                            onPress={() => {
                                setDateRange(3)
                                setActive(3)
                            }}
                        />
                        <AnimatedButton
                            stylesAnimatedView={pagesStyles.animatedView}
                            title={"6 MESES"}
                            stylesPressable={[
                                active == 6
                                    ? pagesStyles.primaryButton
                                    : pagesStyles.secondaryButton,
                                {
                                    flex: 1
                                }
                            ]}
                            stylesText={
                                active == 6
                                    ? pagesStyles.primaryButtonText
                                    : pagesStyles.secondaryButtonText
                            }
                            onPress={() => {
                                setDateRange(6)
                                setActive(6)
                            }}
                        />
                        <AnimatedButton
                            stylesAnimatedView={pagesStyles.animatedView}
                            title={"12 MESES"}
                            stylesPressable={[
                                active == 12
                                    ? pagesStyles.primaryButton
                                    : pagesStyles.secondaryButton,
                                {
                                    flex: 1
                                }
                            ]}
                            stylesText={
                                active == 12
                                    ? pagesStyles.primaryButtonText
                                    : pagesStyles.secondaryButtonText
                            }
                            onPress={() => {
                                setDateRange(12)
                                setActive(12)
                            }}
                        />
                    </View>
                    <View style={styles.graphContainer}>
                        <View
                            style={[
                                pagesStyles.card,
                                {
                                    backgroundColor: "#FFF",
                                    maxWidth: maxCardWidth,
                                }
                            ]}
                        >
                            <LineGraph
                                title={"Sample Graph"}
                                data={ordersNum}
                                width={graphWidth}
                                maxValue={maxValue}
                                spacing={spacing}
                                noOfSections={5}
                            />
                        </View>
                    </View>
                </>
                :
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <ActivityIndicator color={"#65442F"} />
                </View>
            }
        </PagesLayout>
    );
};
const styles = StyleSheet.create({
    graphContainer: {
        flexDirection: "row",
        width: "100%",
        gap: 16,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 32,
        gap: 16,
    }
})