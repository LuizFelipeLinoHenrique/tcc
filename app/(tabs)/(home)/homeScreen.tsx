import { orderItems, orderQuantity } from "@/src/lib/orderItems";
import { Colors } from "@/src/theme/colors";
import { BarGraphItem } from "@/src/components/BarGraph";
import { DashboardTrend, DashboardRanking, DashboardOrderMix } from "@/src/components/DashboardCharts";
import { PieGraphItem } from "@/src/components/PieGraph";
import { PagesLayout } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { dashboardCash } from "@/src/lib/dashboardCash";
import { cashToday, money } from "@/src/lib/cashFlow";
import { cashError, loadCashEntries } from "@/src/lib/cashFlowRepository";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { lineDataItem } from "react-native-gifted-charts";

function buildTimelineData(pedidos: any[], monthsCount: number): lineDataItem[] {
    const today = cashToday();
    const [year, month] = today.split("-").map(Number);
    return Array.from({ length: monthsCount }, (_, index) => {
        const date = new Date(year, month - monthsCount + index, 1, 12);
        const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
        return {
            label: date.toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" }),
            value: pedidos.filter(pedido => {
                const day = String(pedido.data_pedido ?? pedido.created_at ?? "").slice(0, 10);
                return day.startsWith(key) && day <= today;
            }).length,
        };
    });
}

export default function HomeScreen() {
    const { width } = useResponsive();
    const [contentWidth, setContentWidth] = useState(Math.min(1440, Math.max(0, width - 48)));
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const compact = contentWidth < 640;
    const gridWidth = (columns: number) => (contentWidth - 16 * (columns - 1)) / columns;
    const metricWidth = compact ? "100%" as const : gridWidth(3);
    const chartColumns = contentWidth >= 1100 ? 3 : contentWidth >= 720 ? 2 : 1;
    const chartWidth = gridWidth(chartColumns);
    const pairWidth = contentWidth >= 720 ? gridWidth(2) : contentWidth;
    const today = cashToday();
    const monthLabel = new Date(today + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const [ordersNum, setOrdersNum] = useState<lineDataItem[]>([]);
    const [financials, setFinancials] = useState(() => dashboardCash([], 3));
    const [loadError, setLoadError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [loadingData, setLoadingData] = useState<boolean>(true);

    // Métricas calculadas sobre os pedidos
    const [totalPedidos, setTotalPedidos] = useState<number>(0);
    const [pedidosPendentes, setPedidosPendentes] = useState<number>(0);
    const [pedidosEntregues, setPedidosEntregues] = useState<number>(0);
    const [pedidosCancelados, setPedidosCancelados] = useState<number>(0);

    // Métricas de catálogo e parceiros
    const [totalClientes, setTotalClientes] = useState<number>(0);
    const [totalMateriais, setTotalMateriais] = useState<number>(0);
    const [totalFornecedores, setTotalFornecedores] = useState<number>(0);

    // Dados para os gráficos
    const [statusPieData, setStatusPieData] = useState<PieGraphItem[]>([]);
    const [topMateriaisData, setTopMateriaisData] = useState<BarGraphItem[]>([]);
    const [topClientesData, setTopClientesData] = useState<BarGraphItem[]>([]);

    const [active, setActive] = useState<number>(3);

    useFocusEffect(useCallback(() => {
        let disposed = false;
        let running = false;
        async function loadAllMetrics(showLoading = false) {
            if (running) return;
            running = true;
            if (showLoading) setLoadingData(true);

            try {
                const [cashEntries, ordersResult, productsResult, clientsResult, suppliersResult] = await Promise.all([
                    loadCashEntries(),
                    supabase.from("pedidos").select("*, itens:pedido_itens(id_produto, qtde, unit_price_cents)").is("deleted_at", null),
                    supabase.from("produtos").select("*"),
                    supabase.from("clientes").select("id, nome"),
                    supabase.from("fornecedores").select("*", { count: "exact", head: true }),
                ]);
                if (disposed) return;
                for (const result of [ordersResult, productsResult, clientsResult, suppliersResult]) {
                    if (result.error) throw result.error;
                }
                const listaPedidos = ordersResult.data ?? [];
                const listaProdutos = productsResult.data ?? [];
                const listaClientes = clientsResult.data ?? [];
                setFinancials(dashboardCash(cashEntries, active));
                setLoadError("");
                setTotalClientes(listaClientes.length);
                setTotalFornecedores(suppliersResult.count ?? 0);
                setTotalMateriais(listaProdutos.length);

                // Processamento dos pedidos
                const total = listaPedidos.length;
                setTotalPedidos(total);

                let countP = 0;
                let countE = 0;
                let countC = 0;
                const demandaPorProduto = new Map<number, number>();
                const demandaPorCliente = new Map<number, number>();

                listaPedidos.forEach((ped: any) => {
                    const rawStatus = String(ped.status || "").trim().toUpperCase();
                    if (rawStatus === "E" || rawStatus.startsWith("ENTR")) {
                        countE++;
                    } else if (rawStatus === "C" || rawStatus.startsWith("CANC")) {
                        countC++;
                    } else {
                        countP++;
                    }

                    const itens = orderItems(ped);
                    const qtde = orderQuantity(ped);
                    // Pedidos cancelados sao mantidos no historico de status, mas nao
                    // entram em demanda, volume ou receita operacional.
                    if (rawStatus === "C" || rawStatus.startsWith("CANC")) {
                        return;
                    }

                    itens.forEach(item => {
                        demandaPorProduto.set(item.id_produto, (demandaPorProduto.get(item.id_produto) || 0) + Number(item.qtde));
                    });

                    const idCliente = ped.id_cliente ?? ped.cliente_id;
                    if (idCliente) {
                        demandaPorCliente.set(idCliente, (demandaPorCliente.get(idCliente) || 0) + qtde);
                    }
                });

                setPedidosPendentes(countP);
                setPedidosEntregues(countE);
                setPedidosCancelados(countC);
                // Gráfico Donut de Status
                setStatusPieData([
                    { label: "Pendente", value: countP, color: Colors.hexD97706 },
                    { label: "Entregue", value: countE, color: Colors.hex16A34A },
                    { label: "Cancelado", value: countC, color: Colors.hexDC2626 },
                ]);

                // Gráfico de Barras: Top Produtos com Demanda
                const coresBarras = [Colors.hex0B4F6C, Colors.hex0E7490, Colors.hex145D7E, Colors.hex38BDF8];
                const topBars: BarGraphItem[] = [];

                if (listaProdutos.length > 0) {
                    // Ordena produtos pela demanda dos pedidos (se houver) ou lista os cadastrados
                    const sortedProds = [...listaProdutos].sort((a, b) => {
                        const demA = demandaPorProduto.get(a.id) || 0;
                        const demB = demandaPorProduto.get(b.id) || 0;
                        return demB - demA;
                    });

                    sortedProds.slice(0, 4).forEach((prod, index) => {
                        const dem = demandaPorProduto.get(prod.id) || 0;
                        const nomeRaw = prod.nome ?? `Item #${prod.id}`;
                        const label = nomeRaw;

                        topBars.push({
                            value: dem,
                            label,
                            frontColor: coresBarras[index % coresBarras.length],
                        });
                    });
                }

                setTopMateriaisData(topBars);

                // Ranking de clientes por unidades em pedidos ativos.
                const coresClientes = [Colors.hex3B6998, Colors.hex0E7490, Colors.hex4A754D, Colors.hex9C773D];
                const nomesClientes = new Map(listaClientes.map((cliente: any) => [cliente.id, cliente.nome]));
                const topClientes = [...demandaPorCliente.entries()]
                    .sort(([, volumeA], [, volumeB]) => volumeB - volumeA)
                    .slice(0, 4)
                    .map(([idCliente, volume], index) => {
                        const nome = nomesClientes.get(idCliente) || `Cliente #${idCliente}`;
                        return {
                            value: volume,
                            label: nome,
                            frontColor: coresClientes[index % coresClientes.length],
                        };
                    });
                setTopClientesData(topClientes);

                // Mantém o histórico no período atual, inclusive meses sem pedidos.
                const timelinePoints = buildTimelineData(listaPedidos, active);
                setOrdersNum(timelinePoints);

                setLastUpdated(new Date());

            } catch (err) {
                if (!disposed) setLoadError(cashError(err));
            } finally {
                running = false;
                if (!disposed) setLoadingData(false);
            }
        }
        void loadAllMetrics(true);
        const refresh = setInterval(() => { void loadAllMetrics(); }, 30000);
        return () => { disposed = true; clearInterval(refresh); };
    // O botão de atualização reinicia a leitura e invalida respostas anteriores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, refreshKey]));

    const taxaEntrega =
        totalPedidos > 0 ? ((pedidosEntregues / totalPedidos) * 100).toFixed(0) : "0";

    return (
        <PagesLayout scroll={true} scrollContent={[styles.pagePadding, width < 640 && styles.pagePaddingCompact]}>
            <View testID="dashboard-content" style={styles.content} onLayout={event => setContentWidth(event.nativeEvent.layout.width)}>
                <View style={[styles.pageHeader, compact && styles.pageHeaderCompact]}>
                    <View style={styles.headerCopy}>
                        <Text style={styles.eyebrow}>VISÃO GERAL</Text>
                        <Text accessibilityRole="header" style={[styles.pageTitle, compact && styles.pageTitleCompact]}>Painel de operações</Text>
                        <Text style={styles.description}>Acompanhe a base do negócio, o caixa e o andamento dos pedidos.</Text>
                    </View>
                    <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
                        {lastUpdated && <Text style={styles.updateTime}>Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}</Text>}
                        <Pressable accessibilityRole="button" accessibilityLabel="Atualizar dashboard" disabled={loadingData}
                            onPress={() => setRefreshKey(value => value + 1)}
                            style={({ pressed }) => [styles.refreshButton, (pressed || loadingData) && styles.pressed]}>
                            <Ionicons name="refresh-outline" size={16} color={Colors.hex475569} /><Text style={styles.refreshText}>Atualizar</Text>
                        </Pressable>
                    </View>
                </View>
                {!!loadError && <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={20} color={Colors.hexB91C1C} /><Text accessibilityRole="alert" style={styles.errorText}>{loadError} Atualize para tentar novamente.</Text></View>}
                {loadingData ? <View style={styles.loading}><ActivityIndicator size="large" color={Colors.hex0B4F6C} /><Text style={styles.description}>Carregando indicadores…</Text></View> : !loadError && <>
                    <View testID="dashboard-partners" style={styles.partnersPanel}>
                        <View style={styles.panelHeading}>
                            <View style={styles.panelIcon}><Ionicons name="business-outline" size={20} color={Colors.hex0B4F6C} /></View>
                            <View style={styles.flexCopy}><Text accessibilityRole="header" style={styles.panelTitle}>Cadastros da operação</Text><Text style={styles.panelDescription}>Clientes, produtos e fornecedores cadastrados</Text></View>
                        </View>
                        <View style={[styles.partnerGrid, compact && styles.partnerGridCompact]}>
                            {([
                                { label: "Clientes", caption: "na sua base de relacionamento", value: totalClientes, icon: "people-outline" },
                                { label: "Produtos", caption: "cadastrados no catálogo", value: totalMateriais, icon: "layers-outline" },
                                { label: "Fornecedores", caption: "na sua rede de parceiros", value: totalFornecedores, icon: "business-outline" },
                            ] as const).map((item, index) => <View key={item.label} style={[styles.partnerItem, index > 0 && (compact ? styles.partnerTopBorder : styles.partnerLeftBorder)]}>
                                <View style={styles.partnerLabelRow}><Ionicons name={item.icon} size={16} color={Colors.hex64748B} /><Text style={styles.partnerLabel}>{item.label}</Text></View>
                                <Text style={styles.partnerValue}>{item.value.toLocaleString("pt-BR")}</Text>
                                <Text style={styles.caption}>{item.caption}</Text>
                            </View>)}
                        </View>
                    </View>

                    <View testID="dashboard-financial" style={styles.section}>
                        <View style={styles.sectionHeading}><View style={styles.flexCopy}><Text accessibilityRole="header" style={styles.sectionTitle}>Situação financeira</Text><Text style={styles.description}>Saldo realizado até hoje e compromissos do mês.</Text></View><View style={styles.monthBadge}><Ionicons name="calendar-outline" size={13} color={Colors.hex64748B} /><Text style={styles.monthBadgeText}>{monthLabel}</Text></View></View>
                        <View style={styles.grid}>
                            {([
                                { label: "Saldo atual", value: financials.summary.current, note: "Realizado acumulado até hoje", icon: "wallet-outline", color: financials.summary.current < 0 ? Colors.hexB91C1C : Colors.hex0B4F6C, background: Colors.hexE0EDF4, primary: true },
                                { label: "A receber", value: financials.summary.receivable, note: "Pendências com vencimento no mês", icon: "arrow-down-outline", color: Colors.hex15803D, background: Colors.hexDCFCE7, primary: false },
                                { label: "A pagar", value: financials.summary.payable, note: "Pendências com vencimento no mês", icon: "arrow-up-outline", color: Colors.hexB45309, background: Colors.hexFEF3C7, primary: false },
                            ] as const).map(item => <View key={item.label} testID="dashboard-financial-card" style={[styles.metricCard, { width: metricWidth }, item.primary && styles.balanceCard]}>
                                <View style={styles.metricHeading}><Text style={styles.metricLabel}>{item.label}</Text><View style={[styles.metricIcon, { backgroundColor: item.background }]}><Ionicons name={item.icon} size={18} color={item.color} /></View></View>
                                <Text style={[styles.moneyValue, { color: item.color }]} numberOfLines={1} adjustsFontSizeToFit>{money(item.value)}</Text>
                                <Text style={styles.caption}>{item.note}</Text>
                            </View>)}
                        </View>
                    </View>

                    <View testID="dashboard-orders" style={styles.section}>
                        <View><Text accessibilityRole="header" style={styles.sectionTitle}>Situação dos pedidos</Text><Text style={styles.description}>Visão consolidada de todos os pedidos registrados.</Text></View>
                        <View style={styles.grid}>
                            {([
                                { label: "Pendentes", value: pedidosPendentes, note: "Em processamento", icon: "time-outline", color: Colors.hexB45309, background: Colors.hexFEF3C7 },
                                { label: "Entregues", value: pedidosEntregues, note: taxaEntrega + "% dos pedidos registrados", icon: "checkmark-circle-outline", color: Colors.hex15803D, background: Colors.hexDCFCE7 },
                                { label: "Cancelados", value: pedidosCancelados, note: "Cancelados na operação", icon: "close-circle-outline", color: Colors.hexB91C1C, background: Colors.hexFEE2E2 },
                            ] as const).map(item => <View key={item.label} style={[styles.orderCard, { width: metricWidth }]}>
                                <View style={[styles.metricIcon, { backgroundColor: item.background }]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
                                <View style={styles.flexCopy}><Text style={styles.metricLabel}>{item.label}</Text><Text style={styles.caption}>{item.note}</Text></View>
                                <Text style={[styles.orderValue, { color: item.color }]}>{item.value.toLocaleString("pt-BR")}</Text>
                            </View>)}
                        </View>
                    </View>

                    <View style={styles.history}>
                        <View style={[styles.historyHeader, compact && styles.historyHeaderCompact]}>
                            <View style={styles.flexCopy}><Text style={styles.eyebrow}>ANÁLISE DO HISTÓRICO</Text><Text accessibilityRole="header" style={styles.sectionTitle}>Como o negócio evoluiu</Text><Text style={styles.description}>Compare os últimos {active} meses, incluindo o mês atual.</Text></View>
                            <View accessibilityRole="tablist" accessibilityLabel="Período dos gráficos de evolução" style={styles.periodControl}>
                                {([3, 6, 12] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityLabel={value + " meses"} accessibilityState={{ selected: active === value }} aria-selected={active === value} onPress={() => setActive(value)}
                                    style={({ pressed }) => [styles.periodButton, active === value && styles.periodButtonActive, pressed && styles.pressed]}><Text style={[styles.periodText, active === value && styles.periodTextActive]}>{value} meses</Text></Pressable>)}
                            </View>
                        </View>
                        <View style={styles.section}>
                            <Text accessibilityRole="header" style={styles.groupTitle}>Movimentação financeira</Text>
                            <View style={styles.grid}>
                                {([
                                    { title: "Entradas realizadas", field: "income", subtitle: "Recebimentos por mês · R$", color: Colors.hex15803D },
                                    { title: "Saídas realizadas", field: "expense", subtitle: "Pagamentos por mês · R$", color: Colors.hexB45309 },
                                    { title: "Resultado realizado", field: "balance", subtitle: "Entradas menos saídas · R$", color: Colors.hex0B4F6C },
                                ] as const).map((item, index) => <View key={item.field} testID="dashboard-financial-chart" style={[styles.chartPanel, { width: chartColumns === 2 && index === 2 ? contentWidth : chartWidth }]}>
                                    <Text style={styles.panelTitle}>{item.title}</Text><Text style={styles.panelDescription}>{item.subtitle}</Text>
                                    <DashboardTrend monetary color={item.color} data={financials.months.map(month => ({ label: month.label, value: month[item.field] / 100 }))} />
                                </View>)}
                            </View>
                        </View>
                        <View style={styles.section}>
                            <Text accessibilityRole="header" style={styles.groupTitle}>Atividade dos pedidos</Text>
                            <View style={styles.grid}>
                                <View testID="dashboard-orders-chart" style={[styles.chartPanel, { width: pairWidth }]}><Text style={styles.panelTitle}>Evolução dos pedidos</Text><Text style={styles.panelDescription}>Pedidos registrados por mês</Text><DashboardTrend data={ordersNum.map(point => ({ label: String(point.label ?? ""), value: point.value ?? 0 }))} /></View>
                                <View style={[styles.chartPanel, { width: pairWidth }]}><Text style={styles.panelTitle}>Distribuição por status</Text><Text style={styles.panelDescription}>Todos os pedidos · posição atual</Text><DashboardOrderMix data={statusPieData} /></View>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <View><Text accessibilityRole="header" style={styles.groupTitle}>Clientes e produtos em destaque</Text><Text style={styles.description}>Ranking geral por unidades em pedidos não cancelados.</Text></View>
                            <View style={styles.grid}>
                                <View testID="dashboard-ranking" style={[styles.chartPanel, { width: pairWidth }]}><Text style={styles.panelTitle}>Clientes com maior volume</Text><Text style={styles.panelDescription}>Os quatro clientes com mais unidades em pedidos</Text><DashboardRanking data={topClientesData} emptyLabel="Nenhum cliente com pedidos ativos." /></View>
                                <View testID="dashboard-ranking" style={[styles.chartPanel, { width: pairWidth }]}><Text style={styles.panelTitle}>Produtos mais solicitados</Text><Text style={styles.panelDescription}>Os quatro produtos com maior demanda</Text><DashboardRanking data={topMateriaisData} emptyLabel="Nenhum produto com demanda registrada." /></View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.footer}><View style={styles.liveDot} /><Text style={styles.caption}>Atualização automática a cada 30 segundos enquanto esta tela estiver aberta.</Text></View>
                </>}
            </View>
        </PagesLayout>
    );
}

const styles = StyleSheet.create({
    pagePadding: { padding: 24, paddingBottom: 36 },
    pagePaddingCompact: { padding: 16, paddingBottom: 28 },
    content: { width: "100%", maxWidth: 1440, alignSelf: "center", gap: 28, minWidth: 0 },
    pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 20 },
    pageHeaderCompact: { flexDirection: "column", alignItems: "stretch", gap: 16 },
    headerCopy: { flex: 1, minWidth: 0, gap: 5 },
    eyebrow: { fontSize: 10, letterSpacing: 1.6, fontFamily: "WorksansSemiBold", color: Colors.hex0B4F6C, marginBottom: 4 },
    pageTitle: { fontSize: 28, lineHeight: 36, fontFamily: "WorksansSemiBold", color: Colors.hex0F172A },
    pageTitleCompact: { fontSize: 25, lineHeight: 32 },
    description: { fontSize: 12, lineHeight: 19, fontFamily: "WorksansRegular", color: Colors.hex64748B },
    headerActions: { alignItems: "flex-end", gap: 8 },
    headerActionsCompact: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
    updateTime: { fontSize: 10, fontFamily: "WorksansRegular", color: Colors.hex64748B },
    refreshButton: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.hexDCE7EE, paddingHorizontal: 14, minHeight: 42, borderRadius: 10 },
    refreshText: { fontSize: 12, color: Colors.hex475569, fontFamily: "WorksansMedium" },
    pressed: { opacity: 0.55 },
    section: { gap: 14 },
    sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
    sectionTitle: { fontSize: 18, lineHeight: 26, fontFamily: "WorksansSemiBold", color: Colors.hex0F172A },
    groupTitle: { fontSize: 14, lineHeight: 22, fontFamily: "WorksansSemiBold", color: Colors.hex334155 },
    monthBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: Colors.hexEEF2F6, borderRadius: 8 },
    monthBadgeText: { fontSize: 10, fontFamily: "WorksansMedium", color: Colors.hex475569, textTransform: "capitalize" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "stretch" },
    partnersPanel: { borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 14, backgroundColor: Colors.white, padding: 20, gap: 20 },
    panelHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
    panelIcon: { width: 40, height: 40, backgroundColor: Colors.hexE0EDF4, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    flexCopy: { flex: 1, minWidth: 0, gap: 3 },
    panelTitle: { fontSize: 14, lineHeight: 21, fontFamily: "WorksansSemiBold", color: Colors.hex1E293B },
    panelDescription: { fontSize: 11, lineHeight: 17, fontFamily: "WorksansRegular", color: Colors.hex64748B, marginTop: 3 },
    partnerGrid: { flexDirection: "row" },
    partnerGridCompact: { flexDirection: "column" },
    partnerItem: { flex: 1, paddingHorizontal: 16, paddingVertical: 10, gap: 4, minWidth: 0 },
    partnerLeftBorder: { borderLeftWidth: 1, borderLeftColor: Colors.hexE2EBF0 },
    partnerTopBorder: { borderTopWidth: 1, borderTopColor: Colors.hexE2EBF0 },
    partnerLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    partnerLabel: { fontSize: 12, color: Colors.hex475569, fontFamily: "WorksansMedium" },
    partnerValue: { fontSize: 27, lineHeight: 36, fontFamily: "WorksansSemiBold", color: Colors.hex0F172A },
    caption: { fontSize: 10, lineHeight: 16, color: Colors.hex64748B, fontFamily: "WorksansRegular" },
    metricCard: { borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 8, backgroundColor: Colors.white, padding: 20, gap: 10, minWidth: 0 },
    balanceCard: { borderColor: Colors.hexCBD8E2, backgroundColor: Colors.hexEDF3F7 },
    metricHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
    metricLabel: { fontSize: 12, fontFamily: "WorksansMedium", color: Colors.hex475569 },
    metricIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", flexShrink: 0 },
    moneyValue: { fontSize: 26, lineHeight: 34, fontFamily: "WorksansSemiBold", fontVariant: ["tabular-nums"] },
    orderCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 8, backgroundColor: Colors.white, minWidth: 0 },
    orderValue: { fontSize: 24, fontFamily: "WorksansSemiBold", fontVariant: ["tabular-nums"] },
    history: { borderTopWidth: 1, borderTopColor: Colors.hexDCE7EE, paddingTop: 28, gap: 24 },
    historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 20 },
    historyHeaderCompact: { flexDirection: "column", alignItems: "stretch", gap: 16 },
    periodControl: { flexDirection: "row", padding: 6, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 11, backgroundColor: Colors.hexEEF2F6, gap: 4 },
    periodButton: { flex: 1, minWidth: 76, minHeight: 40, justifyContent: "center", alignItems: "center", paddingHorizontal: 12, borderRadius: 8 },
    periodButtonActive: { backgroundColor: Colors.white, shadowColor: Colors.hex082F42, shadowOpacity: 0, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 0 },
    periodText: { fontSize: 11, fontFamily: "WorksansMedium", color: Colors.hex64748B },
    periodTextActive: { fontFamily: "WorksansSemiBold", color: Colors.hex0B4F6C },
    chartPanel: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.hexDCE7EE, borderRadius: 8, padding: 20, minWidth: 0, overflow: "hidden" },
    footer: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", paddingVertical: 6 },
    liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.hex16A34A, flexShrink: 0 },
    errorBox: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: Colors.hexFECACA, backgroundColor: Colors.hexFEF2F2, padding: 16, borderRadius: 8 },
    errorText: { flex: 1, color: Colors.hexB91C1C, fontSize: 12, lineHeight: 19, fontFamily: "WorksansRegular" },
    loading: { alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 },
});
