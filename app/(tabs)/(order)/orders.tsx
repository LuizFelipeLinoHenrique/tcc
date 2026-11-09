import { createPagination, mergeById } from "@/src/lib/pagination";
import { RecordModal } from "@/src/components/RecordModal";
import { useRecordDeletion } from "@/src/hooks/useRecordDeletion";
import { getOrderDetails, recordError } from "@/src/lib/tableActions";
import { Colors } from "@/src/theme/colors";
import { AnimatedButton } from "@/src/components/AnimatedButton";
import { OrderCard, OrderTableHeader } from "@/src/components/OrdersCard";
import {
    OrderDetail,
    OrderDetailsCard,
} from "@/src/components/OrdersDetails";
import { EditOrderCard } from "@/src/components/OrdersEdit";
import { OrdersFilters } from "@/src/components/OrdersFilters";
import {
    PagesLayout,
    pagesStyles,
} from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";

import { useCallback, useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Pedido = {
    id: number;
    data_pedido: string;
    id_cliente: number;
    qtde: number;
    id_produto: number;
    status: string;
};

type PedidoDetalhes = {
    id_pedido: number;
    id_cliente: number;
    nome_cliente: string;
    telefone_cliente: string;
    endereco_cliente: string;
    id_material: number;
    nome_material: string;
    descricao_material: string;
    preco_unit: number;
    preco_total: number;
    qtde_pedido: number;
    data_pedido: string;
    status: string;
};

type StatusFiltro = "TODOS" | "P" | "E" | "C";

type PeriodoFiltro = "TODOS" | "HOJE" | "7_DIAS" | "30_DIAS";

type TipoPesquisa = "PEDIDO" | "CLIENTE" | "MATERIAL";

const PAGE_SIZE = 50;

export default function Orders() {
    const { isMobile } = useResponsive();

    const [hasMore, setHasMore] = useState<boolean>(true);

    const [pesquisa, setPesquisa] = useState<string>("");

    const [tipoPesquisa, setTipoPesquisa] = useState<TipoPesquisa>("PEDIDO");

    const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("TODOS");

    const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>("TODOS");

    const [pedidos, setPedidos] = useState<Pedido[]>([]);

    const [pedidoSelecionado, setPedidoSelecionado] =
        useState<PedidoDetalhes | null>(null);

    const [pedidoEditar, setPedidoEditar] = useState<number | null>(null);

    const [loadingDetalhes, setLoadingDetalhes] = useState<boolean>(false);

    const [detalhesAberto, setDetalhesAberto] = useState<boolean>(false);

    const [editarAberto, setEditarAberto] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);

    const [reloadOrders, setReloadOrders] = useState<number>(0);

    const pagination = useRef(createPagination()).current;

    const detailsRequest = useRef(0);
    const detailsOrderId = useRef<number | null>(null);
    const [detailsError, setDetailsError] = useState("");
    const { requestDelete, deletionDialog } = useRecordDeletion(
        "pedidos",
        (id) => {
            setPedidos((prev) => prev.filter((record) => record.id !== id));
        },
    );

    const loadOrders = useCallback(
        async (reset = false) => {
            const request = pagination.begin(reset);
            if (!request) return;
            setLoading(true);
            try {
                let query = supabase.from("pedidos").select("*");

                const textoPesquisa = pesquisa.trim();

                if (textoPesquisa) {
                    const numero = Number(textoPesquisa);

                    if (!isNaN(numero)) {
                        if (tipoPesquisa === "PEDIDO") {
                            query = query.eq("id", numero);
                        }

                        if (tipoPesquisa === "CLIENTE") {
                            query = query.eq("id_cliente", numero);
                        }

                        if (tipoPesquisa === "MATERIAL") {
                            query = query.eq("id_produto", numero);
                        }
                    }
                }

                if (statusFiltro !== "TODOS") {
                    query = query.eq("status", statusFiltro);
                }

                if (periodoFiltro !== "TODOS") {
                    const agora = new Date();
                    const inicio = new Date(agora);

                    if (periodoFiltro === "HOJE") {
                        inicio.setHours(0, 0, 0, 0);
                    }

                    if (periodoFiltro === "7_DIAS") {
                        inicio.setDate(inicio.getDate() - 7);
                    }

                    if (periodoFiltro === "30_DIAS") {
                        inicio.setDate(inicio.getDate() - 30);
                    }

                    query = query.gte("data_pedido", inicio.toISOString());
                }

                if (request.cursor !== null) {
                    query = query.gt("id", request.cursor);
                }

                query = query.order("id", {
                    ascending: true,
                });

                query = query.limit(PAGE_SIZE);

                const { data, error } = await query;
                if (!pagination.isCurrent(request)) return;

                if (error) {
                    console.error("Erro ao carregar pedidos:", error);

                    setLoading(false);
                    return;
                }

                const rows = (data ?? []) as Pedido[];
                pagination.accept(request, rows, PAGE_SIZE);
                setPedidos((prev) => mergeById(reset ? [] : prev, rows));
                setHasMore(rows.length === PAGE_SIZE);
            } finally {
                if (pagination.isCurrent(request)) {
                    pagination.finish(request);
                    setLoading(false);
                }
            }
        },
        [pagination, pesquisa, tipoPesquisa, statusFiltro, periodoFiltro],
    );

    useEffect(() => {
        pagination.invalidate();
        setLoading(false);
        const timeout = setTimeout(() => {
            setHasMore(true);

            loadOrders(true);
        }, 300);

        return () => {
            clearTimeout(timeout);
            pagination.invalidate();
        };
    }, [
        pesquisa,
        tipoPesquisa,
        statusFiltro,
        periodoFiltro,
        reloadOrders,
        loadOrders,
        pagination,
    ]);

    function handlePesquisa() {
        setHasMore(true);

        loadOrders(true);
    }

    function limparFiltros() {
        setPesquisa("");
        setTipoPesquisa("PEDIDO");
        setStatusFiltro("TODOS");
        setPeriodoFiltro("TODOS");

        setHasMore(true);
    }

    async function abrirDetalhes(idPedido: number) {
        detailsOrderId.current = idPedido;
        const request = ++detailsRequest.current;
        setDetalhesAberto(true);
        setLoadingDetalhes(true);
        setDetailsError("");
        setPedidoSelecionado(null);
        try {
            const data = await getOrderDetails(idPedido);
            if (request === detailsRequest.current) setPedidoSelecionado(data);
        } catch (cause) {
            if (request === detailsRequest.current)
                setDetailsError(recordError(cause));
        } finally {
            if (request === detailsRequest.current) setLoadingDetalhes(false);
        }
    }

    function fecharDetalhes() {
        detailsRequest.current += 1;
        setDetalhesAberto(false);
        setPedidoSelecionado(null);
    }

    function abrirEditar(idPedido: number) {
        setPedidoEditar(null);
        setPedidoEditar(idPedido);
        setEditarAberto(true);
    }

    function fecharEditar() {
        setEditarAberto(false);
        setPedidoEditar(null);
        setReloadOrders((prev) => prev + 1);
    }

    const detalhes: OrderDetail[] = pedidoSelecionado
        ? [
              {
                  label: "ID do Pedido",
                  value: pedidoSelecionado.id_pedido,
              },
              {
                  label: "Cliente",
                  value: pedidoSelecionado.nome_cliente,
              },
              {
                  label: "Telefone",
                  value: pedidoSelecionado.telefone_cliente,
              },
              {
                  label: "Endereço",
                  value: pedidoSelecionado.endereco_cliente,
                  fullWidth: true,
              },
              {
                  label: "Material",
                  value: pedidoSelecionado.nome_material,
              },
              {
                  label: "Descrição do Material",
                  value: pedidoSelecionado.descricao_material,
                  fullWidth: true,
              },
              {
                  label: "Preço Unitário",
                  value: `R$ ${Number(pedidoSelecionado.preco_unit).toFixed(
                      2,
                  )}`,
              },
              {
                  label: "Quantidade Pedida",
                  value: pedidoSelecionado.qtde_pedido,
              },
              {
                  label: "Preço Total",
                  value: `R$ ${Number(pedidoSelecionado.preco_total).toFixed(
                      2,
                  )}`,
              },
              {
                  label: "Data do Pedido",
                  value: pedidoSelecionado.data_pedido,
              },
              {
                  label: "Status",
                  value: pedidoSelecionado.status,
              },
          ]
        : [];

    return (
        <PagesLayout
            scroll={false}
            noScrollContent={{
                paddingVertical: 10,
            }}
        >
            <View style={styles.container}>
                <OrdersFilters
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                    tipoPesquisa={tipoPesquisa}
                    setTipoPesquisa={setTipoPesquisa}
                    statusFiltro={statusFiltro}
                    setStatusFiltro={setStatusFiltro}
                    periodoFiltro={periodoFiltro}
                    setPeriodoFiltro={setPeriodoFiltro}
                    onSearch={handlePesquisa}
                    onClear={limparFiltros}
                    isMobile={isMobile}
                />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tableScroll}
                    contentContainerStyle={styles.tableScrollContent}
                >
                    <View style={styles.tableContainer}>
                        <FlatList
                            showsHorizontalScrollIndicator={false}
                            data={pedidos}
                            ListHeaderComponent={<OrderTableHeader />}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item, index }) => (
                                <OrderCard
                                    index={index}
                                    pedido={item}
                                    iconDetails={() => abrirDetalhes(item.id)}
                                    iconEdit={() => abrirEditar(item.id)}
                                    iconDelete={() =>
                                        requestDelete(
                                            item.id,
                                            `Pedido #${item.id}`,
                                        )
                                    }
                                />
                            )}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                <View
                                    style={{
                                        justifyContent: "center",
                                        alignItems: "center",
                                        paddingVertical: 20,
                                    }}
                                >
                                    {hasMore ? (
                                        <AnimatedButton
                                            stylesPressable={[
                                                pagesStyles.primaryButton,
                                                {
                                                    minWidth: !isMobile
                                                        ? 200
                                                        : 100,
                                                },
                                            ]}
                                            stylesText={
                                                pagesStyles.primaryButtonText
                                            }
                                            title={
                                                loading ? (
                                                    <ActivityIndicator
                                                        color={Colors.hexF7F4EE}
                                                    />
                                                ) : (
                                                    <Text
                                                        style={
                                                            pagesStyles.primaryButtonText
                                                        }
                                                    >
                                                        Carregar mais
                                                    </Text>
                                                )
                                            }
                                            onPress={() => loadOrders(false)}
                                        />
                                    ) : null}
                                </View>
                            }
                        />
                    </View>
                </ScrollView>

                <RecordModal
                    visible={detalhesAberto}
                    onClose={fecharDetalhes}
                    title="Detalhes do pedido"
                >
                    {loadingDetalhes ? (
                        <ActivityIndicator
                            size="large"
                            color={Colors.hex0B4F6C}
                        />
                    ) : detailsError ? (
                        <View style={{ padding: 20, gap: 16 }}>
                            <Text accessibilityRole="alert">
                                {detailsError}
                            </Text>
                            <AnimatedButton
                                title="Tentar novamente"
                                stylesPressable={pagesStyles.primaryButton}
                                stylesText={pagesStyles.primaryButtonText}
                                onPress={() => {
                                    if (detailsOrderId.current !== null)
                                        abrirDetalhes(detailsOrderId.current);
                                }}
                            />
                        </View>
                    ) : pedidoSelecionado ? (
                        <OrderDetailsCard
                            title={`Pedido #${pedidoSelecionado.id_pedido}`}
                            data={detalhes}
                        />
                    ) : null}
                </RecordModal>

                <RecordModal
                    visible={editarAberto}
                    onClose={fecharEditar}
                    title="Editar pedido"
                >
                    {pedidoEditar !== null && (
                        <EditOrderCard
                            idPedido={pedidoEditar}
                            onSaveSuccess={fecharEditar}
                        />
                    )}
                </RecordModal>
                {deletionDialog}
            </View>
        </PagesLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    },
    tableScroll: {
        flex: 1,
        width: "100%",
        marginTop: 10,
    },
    tableScrollContent: {
        minWidth: "100%",
        flexGrow: 1,
    },
    tableContainer: {
        minWidth: "100%",
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.hexDCE7EE,
        overflow: "hidden",
        shadowColor: Colors.hex082F42,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
});
