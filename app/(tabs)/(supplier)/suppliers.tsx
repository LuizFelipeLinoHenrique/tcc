import { Colors } from "@/src/theme/colors";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { PagesLayout } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";

import {
    Fornecedor,
    SupplierCard,
    SupplierTableHeader,
} from "@/src/components/SuppliersCard";
import { SupplierDetailsCard } from "@/src/components/SuppliersDetails";
import { EditSupplierCard } from "@/src/components/SuppliersEdit";
import {
    SuppliersFilters,
    TipoPesquisaFornecedor,
} from "@/src/components/SuppliersFilters";

const PAGE_SIZE = 50;

export default function Suppliers() {
    const { isMobile } = useResponsive();

    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [pesquisa, setPesquisa] = useState("");
    const [tipoPesquisa, setTipoPesquisa] =
        useState<TipoPesquisaFornecedor>("NOME");

    const [lastId, setLastId] = useState<number | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [fornecedorSelecionado, setFornecedorSelecionado] =
        useState<Fornecedor | null>(null);
    const [fornecedorEditar, setFornecedorEditar] =
        useState<Fornecedor | null>(null);

    const [detalhesAberto, setDetalhesAberto] = useState(false);
    const [editarAberto, setEditarAberto] = useState(false);

    const [reloadFornecedores, setReloadFornecedores] = useState(0);

    const loadFornecedores = useCallback(
        async (reset = false) => {
            if (loading && !reset) return;

            setLoading(true);

            try {
                const cursor = reset ? null : lastId;

                let query = supabase
                    .from("fornecedores")
                    .select("*")
                    .order("id", { ascending: true })
                    .limit(PAGE_SIZE);

                if (cursor !== null) {
                    query = query.gt("id", cursor);
                }

                const texto = pesquisa.trim();

                if (texto) {
                    if (tipoPesquisa === "ID") {
                        const id = Number(texto);
                        if (!Number.isNaN(id)) {
                            query = query.eq("id", id);
                        } else {
                            setFornecedores(reset ? [] : fornecedores);
                            setHasMore(false);
                            setLoading(false);
                            return;
                        }
                    } else if (tipoPesquisa === "NOME") {
                        query = query.ilike("nome", `%${texto}%`);
                    } else if (tipoPesquisa === "CNPJ") {
                        const limpo = texto.replace(/\D/g, "");
                        query = query.ilike("cnpj", `%${limpo || texto}%`);
                    } else if (tipoPesquisa === "EMAIL") {
                        query = query.ilike("email", `%${texto}%`);
                    }
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Erro ao carregar fornecedores:", error);
                    Alert.alert(
                        "Erro",
                        "Não foi possível carregar os fornecedores."
                    );
                    return;
                }

                const novosFornecedores = (data ?? []) as Fornecedor[];

                if (reset) {
                    setFornecedores(novosFornecedores);
                } else {
                    setFornecedores((prev) => [...prev, ...novosFornecedores]);
                }

                if (novosFornecedores.length < PAGE_SIZE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                if (novosFornecedores.length > 0) {
                    setLastId(
                        novosFornecedores[novosFornecedores.length - 1].id
                    );
                } else if (reset) {
                    setLastId(null);
                }
            } finally {
                setLoading(false);
            }
        },
        [fornecedores, lastId, loading, pesquisa, tipoPesquisa]
    );

    useEffect(() => {
        setLastId(null);
        setHasMore(true);

        const timer = setTimeout(() => {
            loadFornecedores(true);
        }, 300);

        return () => clearTimeout(timer);
    }, [pesquisa, tipoPesquisa, reloadFornecedores]);

    const handlePesquisa = () => {
        setLastId(null);
        setHasMore(true);
        setReloadFornecedores((prev) => prev + 1);
    };

    const limparPesquisa = () => {
        setPesquisa("");
        setTipoPesquisa("NOME");
        setLastId(null);
        setHasMore(true);
        setReloadFornecedores((prev) => prev + 1);
    };

    const carregarMais = () => {
        if (!loading && hasMore) {
            loadFornecedores(false);
        }
    };

    const abrirDetalhes = (fornecedor: Fornecedor) => {
        setFornecedorSelecionado(fornecedor);
        setDetalhesAberto(true);
    };

    const fecharDetalhes = () => {
        setDetalhesAberto(false);
        setFornecedorSelecionado(null);
    };

    const abrirEditar = (fornecedor: Fornecedor) => {
        setFornecedorEditar(fornecedor);
        setEditarAberto(true);
    };

    const fecharEditar = () => {
        setEditarAberto(false);
        setFornecedorEditar(null);

        setLastId(null);
        setHasMore(true);
        setReloadFornecedores((prev) => prev + 1);
    };

    const confirmarExclusao = (fornecedor: Fornecedor) => {
        Alert.alert(
            "Excluir fornecedor",
            `Deseja realmente excluir o fornecedor "${fornecedor.nome}"?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => deleteFornecedor(fornecedor.id),
                },
            ]
        );
    };

    const deleteFornecedor = async (id: number) => {
        const { error } = await supabase
            .from("fornecedores")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir fornecedor:", error);
            Alert.alert(
                "Erro",
                "Não foi possível excluir o fornecedor."
            );
            return;
        }

        setFornecedores((prev) =>
            prev.filter((fornecedor) => fornecedor.id !== id)
        );

        setLastId(null);
        setHasMore(true);
    };

    return (
        <PagesLayout
            scroll={false}
            noScrollContent={{
                paddingVertical: 10,
            }}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <SuppliersFilters
                        pesquisa={pesquisa}
                        setPesquisa={setPesquisa}
                        tipoPesquisa={tipoPesquisa}
                        setTipoPesquisa={setTipoPesquisa}
                        onSearch={handlePesquisa}
                        onClear={limparPesquisa}
                        isMobile={isMobile}
                    />
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tableScroll}
                    contentContainerStyle={styles.tableScrollContent}
                >
                    <View style={styles.tableContainer}>
                        <FlatList
                            data={fornecedores}
                            keyExtractor={(item) => item.id.toString()}
                            ListHeaderComponent={<SupplierTableHeader />}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }) => (
                                <SupplierCard
                                    index={index}
                                    fornecedor={item}
                                    iconDetails={() => abrirDetalhes(item)}
                                    iconEdit={() => abrirEditar(item)}
                                    iconDelete={() => confirmarExclusao(item)}
                                />
                            )}
                            onEndReached={carregarMais}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                loading ? (
                                    <View style={styles.loadingContainer}>
                                        <Text style={styles.loadingText}>Carregando...</Text>
                                    </View>
                                ) : hasMore && fornecedores.length > 0 ? (
                                    <View style={styles.moreContainer}>
                                        <Pressable style={styles.moreButton} onPress={carregarMais}>
                                            <Text style={styles.moreButtonText}>Carregar mais</Text>
                                        </Pressable>
                                    </View>
                                ) : null
                            }
                            ListEmptyComponent={
                                !loading ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Nenhum fornecedor encontrado.</Text>
                                    </View>
                                ) : null
                            }
                        />
                    </View>
                </ScrollView>
            </View>

            {/* Modal de Detalhes */}
            <Modal
                visible={detalhesAberto}
                transparent
                animationType="fade"
                onRequestClose={fecharDetalhes}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: Colors.overlayBlack50,
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
                    {fornecedorSelecionado && (
                        <View
                            style={{
                                width: "100%",
                                maxWidth: 900,
                                maxHeight: isMobile ? "90%" : "100%",
                            }}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ flexGrow: 1 }}
                            >
                                <SupplierDetailsCard
                                    data={[
                                        {
                                            label: "ID do Fornecedor",
                                            value: fornecedorSelecionado.id,
                                        },
                                        {
                                            label: "Nome / Razão Social",
                                            value: fornecedorSelecionado.nome,
                                        },
                                        {
                                            label: "CNPJ",
                                            value: fornecedorSelecionado.cnpj || "Não informado",
                                        },
                                        {
                                            label: "E-mail",
                                            value: fornecedorSelecionado.email || "Não informado",
                                        },
                                        {
                                            label: "Telefone",
                                            value: fornecedorSelecionado.telefone ? String(fornecedorSelecionado.telefone) : "Não informado",
                                        },
                                        {
                                            label: "Pessoa de Contato",
                                            value: fornecedorSelecionado.contato || "Não informado",
                                        },
                                        {
                                            label: "Endereço",
                                            value: fornecedorSelecionado.endereco || "Não informado",
                                            fullWidth: true,
                                        },
                                    ]}
                                />
                            </ScrollView>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Modal de Edição */}
            <Modal
                visible={editarAberto}
                transparent
                animationType="fade"
                onRequestClose={fecharEditar}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: Colors.overlayBlack50,
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
                    {fornecedorEditar && (
                        <View
                            style={{
                                width: "100%",
                                maxWidth: 900,
                                maxHeight: isMobile ? "90%" : "100%",
                            }}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ flexGrow: 1 }}
                            >
                                <EditSupplierCard
                                    idFornecedor={fornecedorEditar.id}
                                    onSaveSuccess={fecharEditar}
                                />
                            </ScrollView>
                        </View>
                    )}
                </View>
            </Modal>
        </PagesLayout>
    );
}

const styles = StyleSheet.create({
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
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.hexDCE7EE,
        overflow: "hidden",
        shadowColor: Colors.hex082F42,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    container: {
        flex: 1,
        width: "100%",
    },

    header: {
        width: "100%",
        paddingHorizontal: 10,
        paddingTop: 10,
    },

    listContent: {
        padding: 10,
        paddingBottom: 30,
    },

    columnWrapper: {
        width: "100%",
    },

    loadingContainer: {
        width: "100%",
        alignItems: "center",
        paddingVertical: 20,
    },

    loadingText: {
        fontSize: 16,
        color: Colors.hex0B4F6C,
    },

    moreContainer: {
        width: "100%",
        alignItems: "center",
        paddingVertical: 20,
    },

    moreButton: {
        backgroundColor: Colors.hex0B4F6C,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
    },

    moreButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "600",
    },

    emptyContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 50,
    },

    emptyText: {
        fontSize: 17,
        color: Colors.hex0B4F6C,
    },
});
