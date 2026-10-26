import { AnimatedButton } from "@/src/components/AnimatedButton";
import { BarGraph, BarGraphItem } from "@/src/components/BarGraph";
import { LineGraph } from "@/src/components/LineGraph";
import { PieGraph, PieGraphItem } from "@/src/components/PieGraph";
import { PagesLayout, pagesStyles } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { lineDataItem } from "react-native-gifted-charts";

export default function HomeScreen() {
    const { isMobile, graphWidth, maxCardWidth } = useResponsive();

    const [ordersNum, setOrdersNum] = useState<lineDataItem[]>([]);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [maxValue, setMaxValue] = useState<number>(10);

    // Métricas calculadas sobre os pedidos
    const [totalPedidos, setTotalPedidos] = useState<number>(0);
    const [pedidosPendentes, setPedidosPendentes] = useState<number>(0);
    const [pedidosEntregues, setPedidosEntregues] = useState<number>(0);
    const [pedidosCancelados, setPedidosCancelados] = useState<number>(0);
    const [totalUnidades, setTotalUnidades] = useState<number>(0);
    const [faturamentoEstimado, setFaturamentoEstimado] = useState<number>(0);
    const [ticketMedio, setTicketMedio] = useState<number>(0);

    // Métricas de catálogo e parceiros
    const [totalClientes, setTotalClientes] = useState<number>(0);
    const [totalMateriais, setTotalMateriais] = useState<number>(0);
    const [totalFornecedores, setTotalFornecedores] = useState<number>(0);
    const [precoMedioMateriais, setPrecoMedioMateriais] = useState<number>(0);

    // Dados para os gráficos
    const [statusPieData, setStatusPieData] = useState<PieGraphItem[]>([]);
    const [topMateriaisData, setTopMateriaisData] = useState<BarGraphItem[]>([]);

    const [active, setActive] = useState<number>(3);

    const spacing =
        ordersNum.length > 1
            ? Math.max((graphWidth - 40) / (ordersNum.length - 1), 20)
            : 50;

    useEffect(() => {
        async function loadAllMetrics() {
            setLoadingData(true);

            try {
                // 1. Carregar Pedidos
                const { data: pedidos, error: pedidosError } = await supabase
                    .from("pedidos")
                    .select("*");

                if (pedidosError) {
                    console.error("Erro ao carregar pedidos no dashboard:", pedidosError);
                }

                const listaPedidos = pedidos ?? [];

                // 2. Carregar Produtos / Materiais
                const { data: produtos } = await supabase
                    .from("produtos")
                    .select("*");

                const listaProdutos = produtos ?? [];

                // 3. Carregar Clientes
                const { count: countClientes } = await supabase
                    .from("clientes")
                    .select("*", { count: "exact", head: true });

                // 4. Carregar Fornecedores
                const { count: countFornecedores } = await supabase
                    .from("fornecedores")
                    .select("*", { count: "exact", head: true });

                setTotalClientes(countClientes || 0);
                setTotalFornecedores(countFornecedores || 0);

                // Mapeamento de produtos por ID e cálculo de preço médio
                const produtosMap = new Map<number, { nome: string; preco: number }>();
                let somaPrecos = 0;

                if (listaProdutos.length > 0) {
                    setTotalMateriais(listaProdutos.length);
                    listaProdutos.forEach((p: any) => {
                        const preco = Number(p.preco ?? p["preço"] ?? p.preco_unit ?? 0);
                        somaPrecos += preco;
                        produtosMap.set(p.id, {
                            nome: p.nome ?? `Material #${p.id}`,
                            preco,
                        });
                    });
                    setPrecoMedioMateriais(somaPrecos / listaProdutos.length);
                } else {
                    setTotalMateriais(0);
                    setPrecoMedioMateriais(0);
                }

                // Processamento dos pedidos
                const total = listaPedidos.length;
                setTotalPedidos(total);

                let countP = 0;
                let countE = 0;
                let countC = 0;
                let somaQtde = 0;
                let somaFaturamento = 0;
                const demandaPorProduto = new Map<number, number>();

                listaPedidos.forEach((ped: any) => {
                    const rawStatus = String(ped.status || "").trim().toUpperCase();
                    if (rawStatus === "E" || rawStatus.startsWith("ENTR")) {
                        countE++;
                    } else if (rawStatus === "C" || rawStatus.startsWith("CANC")) {
                        countC++;
                    } else {
                        countP++;
                    }

                    const qtde = Number(ped.qtde ?? ped.quantidade ?? 1);
                    somaQtde += qtde;

                    const idProd = ped.id_produto ?? ped.id_material ?? ped.produto_id;
                    const prodInfo = idProd ? produtosMap.get(idProd) : undefined;
                    const precoUnit = prodInfo
                        ? prodInfo.preco
                        : listaProdutos.length > 0
                            ? Number(listaProdutos[0].preco ?? listaProdutos[0]["preço"] ?? 0)
                            : 0;

                    somaFaturamento += qtde * precoUnit;

                    if (idProd) {
                        const demAtual = demandaPorProduto.get(idProd) || 0;
                        demandaPorProduto.set(idProd, demAtual + qtde);
                    }
                });

                setPedidosPendentes(countP);
                setPedidosEntregues(countE);
                setPedidosCancelados(countC);
                setTotalUnidades(somaQtde);
                setFaturamentoEstimado(somaFaturamento);
                setTicketMedio(total > 0 ? somaFaturamento / total : 0);

                // Gráfico Donut de Status
                setStatusPieData([
                    { label: "Pendente", value: countP, color: "#D97706" },
                    { label: "Entregue", value: countE, color: "#16A34A" },
                    { label: "Cancelado", value: countC, color: "#DC2626" },
                ]);

                // Gráfico de Barras: Top Materiais com Demanda
                const coresBarras = ["#0B4F6C", "#0E7490", "#145D7E", "#38BDF8"];
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
                        const label =
                            nomeRaw.length > 8 ? nomeRaw.slice(0, 7) + "…" : nomeRaw;

                        topBars.push({
                            value: dem > 0 ? dem : somaQtde > 0 && index === 0 ? somaQtde : 1,
                            label,
                            frontColor: coresBarras[index % coresBarras.length],
                        });
                    });
                } else if (listaPedidos.length > 0) {
                    topBars.push({
                        value: somaQtde > 0 ? somaQtde : 1,
                        label: "Pedido #1",
                        frontColor: "#0B4F6C",
                    });
                }

                setTopMateriaisData(topBars);

                // Gráfico de Linha: Evolução Temporal com Garantia de Exibição
                // Gera a lista dos N meses selecionados
                const timelinePoints = buildTimelineData(listaPedidos, active);
                setOrdersNum(timelinePoints);

                const maiorValor = Math.max(...timelinePoints.map((p) => p.value ?? 0), 0);
                setMaxValue(Math.max(Math.ceil((maiorValor + 2) / 2) * 2, 5));
            } catch (err) {
                console.error("Erro geral ao processar métricas do dashboard:", err);
            } finally {
                setLoadingData(false);
            }
        }

        loadAllMetrics();
    }, [active]);

    // Função para gerar os pontos mensais do gráfico de linha
    function buildTimelineData(pedidos: any[], monthsCount: number): lineDataItem[] {
        const now = new Date();
        const monthsList: { key: string; label: string; value: number }[] = [];

        // Verifica a data do pedido mais recente caso todos os pedidos sejam de datas antigas
        let referenceDate = now;
        let temPedidoNoPeriodoPadrao = false;

        const defaultKeys = new Set<string>();
        for (let i = monthsCount - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            defaultKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }

        let pedidoMaisRecente: Date | null = null;
        pedidos.forEach((p) => {
            const dateStr = p.data_pedido ?? p.created_at;
            if (dateStr) {
                const pDate = new Date(dateStr);
                if (!isNaN(pDate.getTime())) {
                    const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
                    if (defaultKeys.has(key)) {
                        temPedidoNoPeriodoPadrao = true;
                    }
                    if (!pedidoMaisRecente || pDate > pedidoMaisRecente) {
                        pedidoMaisRecente = pDate;
                    }
                }
            }
        });

        // Se nenhum pedido cai nos últimos meses atuais, ancorar na data do pedido existente
        if (!temPedidoNoPeriodoPadrao && pedidoMaisRecente && pedidos.length > 0) {
            referenceDate = pedidoMaisRecente;
        }

        // Gera os meses da janela
        for (let i = monthsCount - 1; i >= 0; i--) {
            const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleDateString("pt-BR", {
                month: "2-digit",
                year: "2-digit",
            });
            monthsList.push({ key, label, value: 0 });
        }

        // Contabiliza pedidos nos meses correspondentes
        let pedidosContabilizados = 0;
        pedidos.forEach((p) => {
            const dateStr = p.data_pedido ?? p.created_at;
            let targetKey: string;

            if (dateStr) {
                const pDate = new Date(dateStr);
                if (!isNaN(pDate.getTime())) {
                    targetKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
                } else {
                    targetKey = monthsList[monthsList.length - 1].key;
                }
            } else {
                targetKey = monthsList[monthsList.length - 1].key;
            }

            const monthItem = monthsList.find((m) => m.key === targetKey);
            if (monthItem) {
                monthItem.value += 1;
                pedidosContabilizados++;
            }
        });

        // Se houver pedidos no banco mas nenhum caiu nas chaves geradas, atribuir ao último mês
        if (pedidosContabilizados === 0 && pedidos.length > 0) {
            monthsList[monthsList.length - 1].value = pedidos.length;
        }

        return monthsList.map((m) => ({
            value: m.value,
            label: m.label,
        }));
    }

    function formatCurrency(val: number): string {
        return `R$ ${val.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    const taxaEntrega =
        totalPedidos > 0 ? ((pedidosEntregues / totalPedidos) * 100).toFixed(0) : "0";
    const mediaUnidadesPorPedido =
        totalPedidos > 0 ? (totalUnidades / totalPedidos).toFixed(1) : "0";

    return (
        <PagesLayout scroll={true}>
            {/* Cabeçalho do Dashboard */}
            <View style={styles.dashboardHeader}>
                <Text style={pagesStyles.brand}>PAINEL DE GESTÃO • TCC</Text>
                <Text style={styles.dashboardTitle}>Dashboard de Pedidos & Operações</Text>
                <Text style={styles.dashboardSubtitle}>
                    Métricas consolidadas de faturamento, fluxo de pedidos, materiais e parceiros
                </Text>
            </View>

            {!loadingData ? (
                <>
                    {/* Linha 1 de KPIs: Faturamento, Total, Volume e Ticket Médio */}
                    <View style={styles.kpiContainer}>
                        {/* Faturamento Estimado */}
                        <View style={[styles.kpiCard, styles.kpiCardHighlight, isMobile && styles.kpiCardMobile]}>
                            <View style={[styles.kpiIconWrapper, { backgroundColor: "#E0EDF4" }]}>
                                <Ionicons name="cash" size={22} color="#0B4F6C" />
                            </View>
                            <View style={styles.kpiContent}>
                                <Text style={styles.kpiLabel}>Faturamento dos Pedidos</Text>
                                <Text style={[styles.kpiValue, styles.kpiValueLarge]} numberOfLines={1}>
                                    {formatCurrency(faturamentoEstimado)}
                                </Text>
                                <Text style={styles.kpiFootnote}>valor total movimentado</Text>
                            </View>
                        </View>

                        {/* Total de Pedidos */}
                        <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
                            <View style={[styles.kpiIconWrapper, { backgroundColor: "#EAF2EA" }]}>
                                <Ionicons name="cube" size={22} color="#4A754D" />
                            </View>
                            <View style={styles.kpiContent}>
                                <Text style={styles.kpiLabel}>Total de Pedidos</Text>
                                <Text style={styles.kpiValue}>{totalPedidos}</Text>
                                <Text style={styles.kpiFootnote}>pedidos registrados</Text>
                            </View>
                        </View>

                        {/* Volume Total de Itens */}
                        <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
                            <View style={[styles.kpiIconWrapper, { backgroundColor: "#F7F1E6" }]}>
                                <Ionicons name="layers" size={22} color="#9C773D" />
                            </View>
                            <View style={styles.kpiContent}>
                                <Text style={styles.kpiLabel}>Volume de Unidades</Text>
                                <Text style={styles.kpiValue}>{totalUnidades.toLocaleString("pt-BR")}</Text>
                                <Text style={styles.kpiFootnote}>méd. {mediaUnidadesPorPedido} un./pedido</Text>
                            </View>
                        </View>

                        {/* Ticket Médio */}
                        <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
                            <View style={[styles.kpiIconWrapper, { backgroundColor: "#EEF2F6" }]}>
                                <Ionicons name="pricetag" size={22} color="#3B6998" />
                            </View>
                            <View style={styles.kpiContent}>
                                <Text style={styles.kpiLabel}>Ticket Médio</Text>
                                <Text style={styles.kpiValue} numberOfLines={1}>
                                    {formatCurrency(ticketMedio)}
                                </Text>
                                <Text style={styles.kpiFootnote}>média por pedido</Text>
                            </View>
                        </View>
                    </View>

                    {/* Linha 2 de KPIs: Detalhamento por Status dos Pedidos */}
                    <View style={styles.statusCardsRow}>
                        {/* Pendentes */}
                        <View style={[styles.statusCard, styles.statusCardPending]}>
                            <View style={styles.statusCardHeader}>
                                <View style={[styles.statusMiniIcon, { backgroundColor: "#FEF3C7" }]}>
                                    <Ionicons name="time" size={16} color="#D97706" />
                                </View>
                                <Text style={styles.statusCardLabel}>Pendentes</Text>
                            </View>
                            <Text style={[styles.statusCardNumber, { color: "#B45309" }]}>
                                {pedidosPendentes}
                            </Text>
                            <Text style={styles.statusCardSub}>em processamento</Text>
                        </View>

                        {/* Entregues */}
                        <View style={[styles.statusCard, styles.statusCardDelivered]}>
                            <View style={styles.statusCardHeader}>
                                <View style={[styles.statusMiniIcon, { backgroundColor: "#DCFCE7" }]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                                </View>
                                <Text style={styles.statusCardLabel}>Entregues</Text>
                            </View>
                            <View style={styles.statusNumberRow}>
                                <Text style={[styles.statusCardNumber, { color: "#15803D" }]}>
                                    {pedidosEntregues}
                                </Text>
                                <View style={styles.ratePill}>
                                    <Text style={styles.ratePillText}>{taxaEntrega}%</Text>
                                </View>
                            </View>
                            <Text style={styles.statusCardSub}>conclusão com sucesso</Text>
                        </View>

                        {/* Cancelados */}
                        <View style={[styles.statusCard, styles.statusCardCanceled]}>
                            <View style={styles.statusCardHeader}>
                                <View style={[styles.statusMiniIcon, { backgroundColor: "#FEE2E2" }]}>
                                    <Ionicons name="close-circle" size={16} color="#DC2626" />
                                </View>
                                <Text style={styles.statusCardLabel}>Cancelados</Text>
                            </View>
                            <Text style={[styles.statusCardNumber, { color: "#B91C1C" }]}>
                                {pedidosCancelados}
                            </Text>
                            <Text style={styles.statusCardSub}>pedidos estornados</Text>
                        </View>
                    </View>

                    {/* Gráfico 1: Evolução Temporal com Seletor de Período */}

                    {/* Visão de Suporte Operacional (Clientes, Materiais e Fornecedores) */}
                    <View style={[pagesStyles.card, styles.supportCard, { width: "100%" }]}>
                        <View style={styles.supportHeader}>
                            <View style={styles.supportIcon}>
                                <Ionicons name="business" size={20} color="#0B4F6C" />
                            </View>
                            <View>
                                <Text style={styles.supportTitle}>Infraestrutura & Parceiros</Text>
                                <Text style={styles.supportSubtitle}>
                                    Base ativa de clientes, catálogo e fornecedores da cadeia
                                </Text>
                            </View>
                        </View>
                        <View style={styles.supportMetricsRow}>
                            <View style={styles.supportMetricItem}>
                                <Text style={styles.supportMetricNum}>{totalClientes}</Text>
                                <Text style={styles.supportMetricLabel}>Clientes Ativos</Text>
                            </View>

                            <View style={styles.supportDivider} />

                            <View style={styles.supportMetricItem}>
                                <Text style={styles.supportMetricNum}>{totalMateriais}</Text>
                                <Text style={styles.supportMetricLabel}>Materiais Cadastrados</Text>
                            </View>

                            <View style={styles.supportDivider} />

                            <View style={styles.supportMetricItem}>
                                <Text style={styles.supportMetricNum}>{totalFornecedores}</Text>
                                <Text style={styles.supportMetricLabel}>Fornecedores</Text>
                            </View>

                            <View style={styles.supportDivider} />

                            <View style={styles.supportMetricItem}>
                                <Text style={styles.supportMetricNum} numberOfLines={1}>
                                    {formatCurrency(precoMedioMateriais)}
                                </Text>
                                <Text style={styles.supportMetricLabel}>Preço Médio Catálogo</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionMargin}>
                        <View style={styles.periodHeader}>
                            <Ionicons name="calendar-outline" size={16} color="#475569" />
                            <Text style={styles.periodSectionLabel}>Filtrar Período do Histórico:</Text>
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
                                onPress={() => setActive(3)}
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
                                onPress={() => setActive(6)}
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
                                onPress={() => setActive(12)}
                            />
                        </View>

                        {/* Seção Gráfica 2: Distribuição por Status (Donut) & Top Materiais (Barras) */}
                        <View style={[styles.dualGrid, isMobile && styles.dualGridMobile]}>
                            <View style={[pagesStyles.card, styles.graphCard, { maxWidth: maxCardWidth }]}>
                                <LineGraph
                                    title="Evolução Temporal dos Pedidos"
                                    subtitle={`Histórico mensal de pedidos registrados nos últimos ${active} meses`}
                                    data={ordersNum}
                                    width={graphWidth}
                                    maxValue={maxValue}
                                    spacing={spacing}
                                    noOfSections={5}
                                />
                            </View>
                            {/* Donut Chart - Status dos Pedidos */}
                            <View style={[pagesStyles.card, styles.dualCard, isMobile && styles.dualCardMobile]}>
                                <PieGraph
                                    title="Status dos Pedidos"
                                    subtitle="Proporção e taxa de conclusão da operação"
                                    data={statusPieData}
                                    totalCount={totalPedidos}
                                    centerLabelTitle={String(totalPedidos)}
                                    centerLabelSub="Pedidos"
                                />
                            </View>
                        </View>

                        {/* Bar Chart - Top Materiais Solicitados */}
                        <View style={[pagesStyles.card, styles.dualCard, isMobile && styles.dualCardMobile]}>
                            <BarGraph
                                title="Materiais Mais Solicitados"
                                subtitle="Unidades demandadas nos pedidos"
                                badgeText="Demanda"
                                badgeIcon="trending-up"
                                data={topMateriaisData}
                                width={isMobile ? graphWidth : Math.min(graphWidth / 2, 450)}
                            />
                        </View>
                    </View>
                </>
            ) : (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0B4F6C" />
                    <Text style={styles.loadingText}>Carregando métricas consolidadas...</Text>
                </View>
            )
            }
        </PagesLayout >
    );
}

const styles = StyleSheet.create({
    dashboardHeader: {
        marginBottom: 18,
    },
    dashboardTitle: {
        fontSize: 24,
        fontFamily: "WorksansBold",
        color: "#0F172A",
        marginTop: 4,
    },
    dashboardSubtitle: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: "#475569",
        marginTop: 2,
    },
    kpiContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 14,
    },
    kpiCard: {
        flex: 1,
        minWidth: 155,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#DCE7EE",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        shadowColor: "#082F42",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    kpiCardHighlight: {
        borderColor: "#CBD8E2",
        backgroundColor: "#FFFFFF",
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
        color: "#475569",
    },
    kpiValue: {
        fontSize: 20,
        fontFamily: "WorksansBold",
        color: "#0F172A",
        marginTop: 2,
    },
    kpiValueLarge: {
        fontSize: 18,
        color: "#0B4F6C",
    },
    kpiFootnote: {
        fontSize: 11,
        fontFamily: "WorksansRegular",
        color: "#64748B",
        marginTop: 1,
    },
    statusCardsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
        flexWrap: "wrap",
    },
    statusCard: {
        flex: 1,
        minWidth: 110,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    statusCardPending: {
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },
    statusCardDelivered: {
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0",
    },
    statusCardCanceled: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },
    statusCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statusMiniIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    statusCardLabel: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#1E293B",
    },
    statusNumberRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
    },
    statusCardNumber: {
        fontSize: 20,
        fontFamily: "WorksansBold",
        marginTop: 4,
    },
    ratePill: {
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratePillText: {
        fontSize: 11,
        fontFamily: "WorksansBold",
        color: "#15803D",
    },
    statusCardSub: {
        fontSize: 10,
        fontFamily: "WorksansRegular",
        color: "#78716C",
        marginTop: 2,
    },
    sectionMargin: {
        marginBottom: 20,
    },
    periodHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    periodSectionLabel: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#475569",
    },
    buttonContainer: {
        flexDirection: "row",
        backgroundColor: "#D9E5EC",
        borderRadius: 12,
        padding: 4,
        gap: 4,
        marginBottom: 12,
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
        shadowColor: "#082F42",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    periodButtonText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#475569",
    },
    periodButtonTextActive: {
        color: "#0B4F6C",
        fontFamily: "WorksansBold",
    },
    graphCard: {
        width: "100%",
        padding: 20,
    },
    dualGrid: {
        flexDirection: "row",
        gap: 14,
        marginBottom: 20,
    },
    dualGridMobile: {
        flexDirection: "column",
    },
    dualCard: {
        flex: 1,
        padding: 20,
    },
    dualCardMobile: {
        width: "100%",
    },
    supportCard: {
        width: "100%",
        padding: 20,
        backgroundColor: "#FFFFFF",
        marginBottom: 30,
    },
    supportHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    supportIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#E8F1F5",
        alignItems: "center",
        justifyContent: "center",
    },
    supportTitle: {
        fontSize: 16,
        fontFamily: "WorksansBold",
        color: "#0F172A",
    },
    supportSubtitle: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: "#475569",
    },
    supportMetricsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#DDE8EF",
        paddingVertical: 14,
        paddingHorizontal: 12,
        flexWrap: "wrap",
        gap: 8,
    },
    supportMetricItem: {
        flex: 1,
        minWidth: 70,
        alignItems: "center",
    },
    supportDivider: {
        width: 1,
        height: 28,
        backgroundColor: "#CFDDE6",
    },
    supportMetricNum: {
        fontSize: 16,
        fontFamily: "WorksansBold",
        color: "#0B4F6C",
    },
    supportMetricLabel: {
        fontSize: 11,
        fontFamily: "WorksansMedium",
        color: "#64748B",
        marginTop: 2,
        textAlign: "center",
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
        color: "#0B4F6C",
    },
});
