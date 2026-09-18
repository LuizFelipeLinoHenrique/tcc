import { AnimatedButton } from "@/src/components/AnimatedButton";
import { OrderCard } from "@/src/components/OrdersCard";
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

import { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
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

    const [tipoPesquisa, setTipoPesquisa] =
        useState<TipoPesquisa>("PEDIDO");

    const [statusFiltro, setStatusFiltro] =
        useState<StatusFiltro>("TODOS");

    const [periodoFiltro, setPeriodoFiltro] =
        useState<PeriodoFiltro>("TODOS");

    const [pedidos, setPedidos] = useState<Pedido[]>([]);

    const [pedidoSelecionado, setPedidoSelecionado] =
        useState<PedidoDetalhes | null>(null);

    const [pedidoEditar, setPedidoEditar] =
        useState<number | null>(null);

    const [loadingDetalhes, setLoadingDetalhes] =
        useState<boolean>(false);

    const [detalhesAberto, setDetalhesAberto] =
        useState<boolean>(false);

    const [editarAberto, setEditarAberto] =
        useState<boolean>(false);

    const [loading, setLoading] =
        useState<boolean>(false);

    const [reloadPage, setReloadPage] =
        useState<boolean>(false);

    const [reloadOrders, setReloadOrders] =
        useState<number>(0);

    const [deleting, setDeleting] =
        useState<boolean>(false);

    const [lastId, setLastId] =
        useState<number | null>(null);

    const loadOrders = useCallback(

        async (reset = false) => {

            if (loading) {
                return;
            };

            if (!reset && !hasMore) {
                return;
            };

            setLoading(true);

            let query = supabase
                .from("pedidos")
                .select("*");

            const textoPesquisa = pesquisa.trim();

            if (textoPesquisa) {
                const numero = Number(textoPesquisa);

                if (!isNaN(numero)) {
                    if (tipoPesquisa === "PEDIDO") {
                        query = query.eq("id", numero);
                    };

                    if (tipoPesquisa === "CLIENTE") {
                        query = query.eq(
                            "id_cliente",
                            numero
                        );
                    };

                    if (tipoPesquisa === "MATERIAL") {
                        query = query.eq(
                            "id_produto",
                            numero
                        );
                    };
                };
            };

            if (statusFiltro !== "TODOS") {
                query = query.eq(
                    "status",
                    statusFiltro
                );
            };

            if (periodoFiltro !== "TODOS") {
                const agora = new Date();
                const inicio = new Date(agora);

                if (periodoFiltro === "HOJE") {
                    inicio.setHours(0, 0, 0, 0);
                };

                if (periodoFiltro === "7_DIAS") {
                    inicio.setDate(
                        inicio.getDate() - 7
                    );
                };

                if (periodoFiltro === "30_DIAS") {
                    inicio.setDate(
                        inicio.getDate() - 30
                    );
                };

                query = query.gte(
                    "data_pedido",
                    inicio.toISOString()
                );
            };

            if (!reset && lastId !== null) {
                query = query.gt("id", lastId);
            };

            query = query.order("id", {
                ascending: true,
            });

            query = query.limit(PAGE_SIZE);

            const { data, error } = await query;

            if (error) {
                console.error(
                    "Erro ao carregar pedidos:",
                    error
                );

                setLoading(false);
                return;
            };

            if (!data || data.length === 0) {
                if (reset) {
                    setPedidos([]);
                    setLastId(null);
                }

                setHasMore(false);
                setLoading(false);

                return;
            };

            if (reset) {
                setPedidos(data);

                setLastId(
                    data[data.length - 1].id
                );
            } else {

                setPedidos((prev) => [
                    ...prev,
                    ...data,
                ]);

                setLastId(
                    data[data.length - 1].id
                );
            };

            if (data.length < PAGE_SIZE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            };

            setLoading(false);
        },
        [
            loading,
            hasMore,
            pesquisa,
            tipoPesquisa,
            statusFiltro,
            periodoFiltro,
            lastId,
        ]
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLastId(null);

            setHasMore(true);

            loadOrders(true);
        }, 300);

        return () => {
            clearTimeout(timeout);
        };
    }, [
        pesquisa,
        tipoPesquisa,
        statusFiltro,
        periodoFiltro,
        reloadOrders,
    ]);

    function handlePesquisa() {
        setLastId(null);
        setHasMore(true);

        loadOrders(true);
    };

    function limparFiltros() {
        setPesquisa("");
        setTipoPesquisa("PEDIDO");
        setStatusFiltro("TODOS");
        setPeriodoFiltro("TODOS");

        setLastId(null);
        setHasMore(true);
    };

    async function abrirDetalhes(
        idPedido: number
    ) {
        console.log(
            "Abrindo detalhes do pedido:",
            idPedido
        );

        setDetalhesAberto(true);
        setLoadingDetalhes(true);
        setPedidoSelecionado(null);

        const {
            data,
            error,
        } = await supabase.rpc(
            "get_orders_details",
            {
                id_order_detail: idPedido,
            }
        );

        if (error) {
            console.error(
                "Erro ao buscar detalhes do pedido:",
                error
            );

            setLoadingDetalhes(false);
            return;
        };

        if (!data || data.length === 0) {
            console.warn(
                "A RPC não retornou nenhum pedido para o ID:",
                idPedido
            );

            setLoadingDetalhes(false);
            return;
        };

        setPedidoSelecionado(data[0]);
        setLoadingDetalhes(false);
    };

    async function deleteOrder(
        idDelete: number
    ) {
        setDeleting(true);

        const {
            error,
        } = await supabase
            .from("pedidos")
            .delete()
            .eq("id", idDelete);

        if (error) {
            console.error(
                "Erro ao deletar pedido:",
                error
            );

            setDeleting(false);
            return;
        };

        setPedidos((prev) =>
            prev.filter(
                (pedido) =>
                    pedido.id !== idDelete
            )
        );

        setDeleting(false);
    };

    function fecharDetalhes() {
        setDetalhesAberto(false);
        setPedidoSelecionado(null);
    };

    function abrirEditar(idPedido: number) {
        setPedidoEditar(null);
        setPedidoEditar(idPedido);
        setEditarAberto(true);
    };

    function fecharEditar() {
        setReloadPage(true);

        setReloadOrders(
            (prev) => prev + 1
        );

        setEditarAberto(false);
        setPedidoEditar(null);

        setTimeout(() => {
            setReloadPage(false);
        }, 1000);
    };

    const detalhes: OrderDetail[] =
        pedidoSelecionado
            ? [
                {
                    label: "ID do Pedido",
                    value:
                        pedidoSelecionado.id_pedido,
                },
                {
                    label: "Cliente",
                    value:
                        pedidoSelecionado.nome_cliente,
                },
                {
                    label: "Telefone",
                    value:
                        pedidoSelecionado.telefone_cliente,
                },
                {
                    label: "Endereço",
                    value:
                        pedidoSelecionado.endereco_cliente,
                    fullWidth: true,
                },
                {
                    label: "Material",
                    value:
                        pedidoSelecionado.nome_material,
                },
                {
                    label:
                        "Descrição do Material",
                    value:
                        pedidoSelecionado.descricao_material,
                    fullWidth: true,
                },
                {
                    label: "Preço Unitário",
                    value: `R$ ${Number(
                        pedidoSelecionado.preco_unit
                    ).toFixed(2)}`,
                },
                {
                    label: "Quantidade Pedida",
                    value:
                        pedidoSelecionado.qtde_pedido,
                },
                {
                    label: "Preço Total",
                    value: `R$ ${Number(
                        pedidoSelecionado.preco_total
                    ).toFixed(2)}`,
                },
                {
                    label: "Data do Pedido",
                    value:
                        pedidoSelecionado.data_pedido,
                },
                {
                    label: "Status",
                    value:
                        pedidoSelecionado.status,
                },
            ]
            :
            [];

    return (
        <PagesLayout
            scroll={false}
            noScrollContent={{
                paddingVertical: 10,
            }}
        >
            <View
                style={{
                    flex: 1,
                }}
            >
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

                <FlatList
                    data={pedidos}
                    numColumns={
                        isMobile ? 1 : 2
                    }
                    keyExtractor={(item) =>
                        item.id.toString()
                    }
                    renderItem={({ item }) => (
                        <OrderCard
                            pedido={item}
                            iconDetails={() =>
                                abrirDetalhes(
                                    item.id
                                )
                            }
                            iconEdit={() =>
                                abrirEditar(
                                    item.id
                                )
                            }
                            iconDelete={() =>
                                deleteOrder(
                                    item.id
                                )
                            }
                        />
                    )}
                    showsVerticalScrollIndicator={
                        false
                    }
                    ListFooterComponent={
                        <View
                            style={{
                                justifyContent:
                                    "center",
                                alignItems:
                                    "center",
                                paddingVertical: 20,
                            }}
                        >
                            {hasMore
                                ? (
                                    <AnimatedButton
                                        stylesPressable={[pagesStyles.primaryButton, { minWidth: !isMobile ? 200 : 100 }]}
                                        stylesText={pagesStyles.primaryButtonText}
                                        title={
                                            loading
                                                ? (
                                                    <ActivityIndicator
                                                        color="#F7F4EE"
                                                    />
                                                )
                                                : (
                                                    <Text
                                                        style={
                                                            pagesStyles.primaryButtonText
                                                        }
                                                    >
                                                        Carregar
                                                        mais
                                                    </Text>
                                                )
                                        }
                                        onPress={() => loadOrders(false)}
                                    />
                                )
                                :
                                null
                            }
                        </View>
                    }
                />

                <Modal
                    visible={reloadPage}
                    transparent
                    animationType="fade"
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor:
                                "rgba(0, 0, 0, 0.5)",
                            justifyContent:
                                "center",
                            alignItems:
                                "center",
                            padding: isMobile ? 8 : 20,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor:
                                    "#F7F4EE",
                                borderRadius: 12,
                                padding: 30,
                            }}
                        >
                            <ActivityIndicator
                                color="#65442F"
                            />
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={deleting}
                    transparent
                    animationType="fade"
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor:
                                "rgba(0, 0, 0, 0.5)",
                            justifyContent:
                                "center",
                            alignItems:
                                "center",
                            padding: isMobile ? 8 : 20,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor:
                                    "#F7F4EE",
                                borderRadius: 12,
                                padding: 30,
                            }}
                        >
                            <ActivityIndicator
                                size="large"
                                color="#65442F"
                            />
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={detalhesAberto}
                    transparent
                    animationType="fade"
                    onRequestClose={fecharDetalhes}
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor:
                                "rgba(0, 0, 0, 0.5)",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: isMobile ? 8 : 20,
                        }}
                    >
                        <Pressable
                            onPress={fecharDetalhes}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        />

                        {loadingDetalhes ? (
                            <View
                                style={{
                                    backgroundColor: "#F7F4EE",
                                    borderRadius: 12,
                                    padding: 30,
                                }}
                            >
                                <ActivityIndicator
                                    size="large"
                                    color="#65442F"
                                />
                            </View>
                        ) : pedidoSelecionado ? (
                            <View
                                style={{
                                    width: "100%",
                                    maxWidth: 900,
                                    maxHeight: isMobile
                                        ? "90%"
                                        : "100%",
                                }}
                            >
                                <ScrollView
                                    style={{
                                        width: "100%",
                                    }}
                                    contentContainerStyle={{
                                        flexGrow: 1,
                                    }}
                                    showsVerticalScrollIndicator={
                                        false
                                    }
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <OrderDetailsCard
                                        title={`Pedido #${pedidoSelecionado.id_pedido}`}
                                        data={detalhes}
                                    />
                                </ScrollView>
                            </View>
                        ) : null}
                    </View>
                </Modal>

                <Modal
                    visible={editarAberto}
                    transparent
                    animationType="fade"
                    onRequestClose={fecharEditar}
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor:
                                "rgba(0, 0, 0, 0.5)",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: isMobile ? 8 : 20,
                        }}
                    >
                        <Pressable
                            onPress={fecharEditar}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        />

                        {pedidoEditar != null ? (
                            <View
                                style={{
                                    width: "100%",
                                    maxWidth: 900,
                                    maxHeight: isMobile
                                        ? "90%"
                                        : "100%",
                                }}
                            >
                                <ScrollView
                                    style={{
                                        width: "100%",
                                    }}
                                    contentContainerStyle={{
                                        flexGrow: 1,
                                    }}
                                    showsVerticalScrollIndicator={
                                        false
                                    }
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <EditOrderCard
                                        idPedido={pedidoEditar}
                                    />
                                </ScrollView>
                            </View>
                        ) : null}
                    </View>
                </Modal>
            </View >
        </PagesLayout >
    );
}