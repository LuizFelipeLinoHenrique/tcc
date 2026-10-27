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
    Material,
    MaterialCard,
    MaterialTableHeader,
    getMaterialDescricao,
    getMaterialPreco,
} from "@/src/components/MaterialsCard";
import { MaterialDetailsCard } from "@/src/components/MaterialsDetails";
import { EditMaterialCard } from "@/src/components/MaterialsEdit";
import {
    MaterialsFilters,
    TipoPesquisaMaterial,
} from "@/src/components/MaterialsFilters";

const PAGE_SIZE = 50;

function formatMoney(value: number): string {
    return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

export default function Materials() {
    const { isMobile } = useResponsive();

    const [materiais, setMateriais] = useState<Material[]>([]);
    const [pesquisa, setPesquisa] = useState("");
    const [tipoPesquisa, setTipoPesquisa] =
        useState<TipoPesquisaMaterial>("NOME");

    const [lastId, setLastId] = useState<number | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [materialSelecionado, setMaterialSelecionado] =
        useState<Material | null>(null);
    const [materialEditar, setMaterialEditar] = useState<Material | null>(null);

    const [detalhesAberto, setDetalhesAberto] = useState(false);
    const [editarAberto, setEditarAberto] = useState(false);

    const [reloadMateriais, setReloadMateriais] = useState(0);

    const loadMateriais = useCallback(
        async (reset = false) => {
            if (loading && !reset) return;

            setLoading(true);

            try {
                const cursor = reset ? null : lastId;

                const buildQuery = (colDesc: "descricao" | "descrição") => {
                    let q = supabase
                        .from("produtos")
                        .select("*")
                        .order("id", { ascending: true })
                        .limit(PAGE_SIZE);

                    if (cursor !== null) {
                        q = q.gt("id", cursor);
                    }

                    const texto = pesquisa.trim();

                    if (texto) {
                        if (tipoPesquisa === "ID") {
                            const id = Number(texto);
                            if (!Number.isNaN(id)) {
                                q = q.eq("id", id);
                            } else {
                                return null;
                            }
                        } else if (tipoPesquisa === "NOME") {
                            q = q.ilike("nome", `%${texto}%`);
                        } else if (tipoPesquisa === "DESCRICAO") {
                            q = q.ilike(colDesc, `%${texto}%`);
                        }
                    }

                    return q;
                };

                const initialQuery = buildQuery("descricao");
                if (initialQuery === null) {
                    setMateriais(reset ? [] : materiais);
                    setHasMore(false);
                    setLoading(false);
                    return;
                }

                let { data, error } = await initialQuery;

                // Se houver erro de coluna no filtro de descrição, tentar com "descrição"
                if (error && tipoPesquisa === "DESCRICAO") {
                    const fallbackQuery = buildQuery("descrição");
                    if (fallbackQuery) {
                        const fallbackResult = await fallbackQuery;
                        data = fallbackResult.data;
                        error = fallbackResult.error;
                    }
                }

                if (error) {
                    console.error("Erro ao carregar materiais:", error);
                    Alert.alert(
                        "Erro",
                        "Não foi possível carregar os materiais."
                    );
                    return;
                }

                const novosMateriais = (data ?? []) as Material[];

                if (reset) {
                    setMateriais(novosMateriais);
                } else {
                    setMateriais((prev) => [...prev, ...novosMateriais]);
                }

                if (novosMateriais.length < PAGE_SIZE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                if (novosMateriais.length > 0) {
                    setLastId(
                        novosMateriais[novosMateriais.length - 1].id
                    );
                } else if (reset) {
                    setLastId(null);
                }
            } finally {
                setLoading(false);
            }
        },
        [materiais, lastId, loading, pesquisa, tipoPesquisa]
    );

    useEffect(() => {
        setLastId(null);
        setHasMore(true);

        const timer = setTimeout(() => {
            loadMateriais(true);
        }, 300);

        return () => clearTimeout(timer);
    }, [pesquisa, tipoPesquisa, reloadMateriais]);

    const handlePesquisa = () => {
        setLastId(null);
        setHasMore(true);
        setReloadMateriais((prev) => prev + 1);
    };

    const limparPesquisa = () => {
        setPesquisa("");
        setTipoPesquisa("NOME");
        setLastId(null);
        setHasMore(true);
        setReloadMateriais((prev) => prev + 1);
    };

    const carregarMais = () => {
        if (!loading && hasMore) {
            loadMateriais(false);
        }
    };

    const abrirDetalhes = (material: Material) => {
        setMaterialSelecionado(material);
        setDetalhesAberto(true);
    };

    const fecharDetalhes = () => {
        setDetalhesAberto(false);
        setMaterialSelecionado(null);
    };

    const abrirEditar = (material: Material) => {
        setMaterialEditar(material);
        setEditarAberto(true);
    };

    const fecharEditar = () => {
        setEditarAberto(false);
        setMaterialEditar(null);

        setLastId(null);
        setHasMore(true);
        setReloadMateriais((prev) => prev + 1);
    };

    const confirmarExclusao = (material: Material) => {
        Alert.alert(
            "Excluir material",
            `Deseja realmente excluir o material "${material.nome}"?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => deleteMaterial(material.id),
                },
            ]
        );
    };

    const deleteMaterial = async (id: number) => {
        const { error } = await supabase
            .from("produtos")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Erro ao excluir material:", error);
            Alert.alert(
                "Erro",
                "Não foi possível excluir o material. Verifique se ele não está vinculado a pedidos existentes."
            );
            return;
        }

        setMateriais((prev) =>
            prev.filter((material) => material.id !== id)
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
                    <MaterialsFilters
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
                            data={materiais}
                            keyExtractor={(item) => item.id.toString()}
                            ListHeaderComponent={<MaterialTableHeader />}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }) => (
                                <MaterialCard
                                    index={index}
                                    material={item}
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
                                ) : hasMore && materiais.length > 0 ? (
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
                                        <Text style={styles.emptyText}>Nenhum material encontrado.</Text>
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
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
                    {materialSelecionado && (
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
                                <MaterialDetailsCard
                                    data={[
                                        {
                                            label: "ID do Material",
                                            value: materialSelecionado.id,
                                        },
                                        {
                                            label: "Nome",
                                            value: materialSelecionado.nome,
                                        },
                                        {
                                            label: "Preço",
                                            value: formatMoney(
                                                getMaterialPreco(
                                                    materialSelecionado
                                                )
                                            ),
                                            fullWidth: true,
                                        },
                                        {
                                            label: "Descrição",
                                            value:
                                                getMaterialDescricao(
                                                    materialSelecionado
                                                ) ||
                                                "Sem descrição cadastrada.",
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
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
                    {materialEditar && (
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
                                <EditMaterialCard
                                    idMaterial={materialEditar.id}
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
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#DCE7EE",
        overflow: "hidden",
        shadowColor: "#082F42",
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
        color: "#0B4F6C",
    },

    moreContainer: {
        width: "100%",
        alignItems: "center",
        paddingVertical: 20,
    },

    moreButton: {
        backgroundColor: "#0B4F6C",
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
    },

    moreButtonText: {
        color: "#FFFFFF",
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
        color: "#0B4F6C",
    },
});
