import { router } from "expo-router";
import { AnimatedButton } from "@/src/components/AnimatedButton";
import { createPagination, mergeById } from "@/src/lib/pagination";
import { RecordModal } from "@/src/components/RecordModal";
import { ProductStockAdjustment } from "@/src/components/ProductStockAdjustment";
import { useRecordDeletion } from "@/src/hooks/useRecordDeletion";
import { Colors } from "@/src/theme/colors";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { PagesLayout, pagesStyles } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";

import {
    Produto,
    MaterialCard,
    MaterialTableHeader,
    getMaterialDescricao,
    getMaterialPreco,
} from "@/src/components/MaterialsCard";
import { MaterialDetailsCard } from "@/src/components/MaterialsDetails";
import { EditMaterialCard } from "@/src/components/MaterialsEdit";
import { MaterialsFilters } from "@/src/components/MaterialsFilters";

const PAGE_SIZE = 50;

function formatMoney(value: number): string {
    return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

export default function Materials() {
    const { isMobile } = useResponsive();

    const [produtos, setMateriais] = useState<Produto[]>([]);
    const [pesquisa, setPesquisa] = useState("");

    const pagination = useRef(createPagination()).current;
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [materialSelecionado, setMaterialSelecionado] =
        useState<Produto | null>(null);
    const [materialEditar, setMaterialEditar] = useState<Produto | null>(null);

    const [detalhesAberto, setDetalhesAberto] = useState(false);
    const [editarAberto, setEditarAberto] = useState(false);
    const [estoqueAberto, setEstoqueAberto] = useState(false);

    const [reloadMateriais, setReloadMateriais] = useState(0);

    const loadMateriais = useCallback(
        async (reset = false) => {
            const request = pagination.begin(reset);
            if (!request) return;

            setLoading(true);

            try {
                const texto = pesquisa.trim();
                let query = supabase
                    .from("produtos")
                    .select("*")
                    .order("id", { ascending: true })
                    .limit(PAGE_SIZE);

                if (request.cursor !== null) {
                    query = query.gt("id", request.cursor);
                }

                if (texto) {
                    const id = Number(texto);
                    const nome = `%${texto}%`;
                    // Only integer text can be interpolated into the raw OR filter.
                    query = /^-?\d+$/.test(texto) && Number.isSafeInteger(id)
                        ? query.or(`id.eq.${id},nome.ilike.${nome}`)
                        : query.ilike("nome", nome);
                }

                const { data, error } = await query;

                if (!pagination.isCurrent(request)) return;

                if (error) {
                    console.error("Erro ao carregar produtos:", error);
                    Alert.alert(
                        "Erro",
                        "Não foi possível carregar os produtos.",
                    );
                    return;
                }

                const novosMateriais = (data ?? []) as Produto[];

                if (reset) {
                    setMateriais(mergeById([], novosMateriais));
                } else {
                    setMateriais((prev) => mergeById(prev, novosMateriais));
                }

                if (novosMateriais.length < PAGE_SIZE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                pagination.accept(request, novosMateriais, PAGE_SIZE);
            } finally {
                if (pagination.isCurrent(request)) {
                    pagination.finish(request);
                    setLoading(false);
                }
            }
        },
        [pagination, pesquisa],
    );

    useEffect(() => {
        pagination.invalidate();
        setLoading(false);
        setHasMore(true);

        const timer = setTimeout(() => {
            loadMateriais(true);
        }, 300);

        return () => {
            clearTimeout(timer);
            pagination.invalidate();
        };
    }, [loadMateriais, pagination, reloadMateriais]);

    const handlePesquisa = () => {
        setHasMore(true);
        setReloadMateriais((prev) => prev + 1);
    };

    const limparPesquisa = () => {
        setPesquisa("");
        setHasMore(true);
        setReloadMateriais((prev) => prev + 1);
    };

    const carregarMais = () => {
        if (!loading && hasMore) {
            loadMateriais(false);
        }
    };

    const abrirDetalhes = (produto: Produto) => {
        setMaterialSelecionado(produto);
        setDetalhesAberto(true);
    };

    const fecharDetalhes = () => {
        setDetalhesAberto(false);
        setMaterialSelecionado(null);
    };

    const abrirEditar = (produto: Produto) => {
        setMaterialEditar(produto);
        setEditarAberto(true);
    };

    const fecharEditar = () => {
        setEditarAberto(false);
        setMaterialEditar(null);

        setHasMore(true);
        setReloadMateriais((prev) => prev + 1);
    };

    const { requestDelete, deletionDialog } = useRecordDeletion("produtos", (id) => {
        setMateriais(prev => prev.filter(record => record.id !== id));
    });

  return (
      <PagesLayout
          scroll={false}
          noScrollContent={{
              paddingVertical: 10,
          }}
      >
          <View style={styles.container}>
              <View style={[pagesStyles.pageHeader, isMobile && { flexDirection: "column", alignItems: "stretch" }]}>
                  <View>
                      <Text accessibilityRole="header" style={pagesStyles.title}>Produtos</Text>
                      <Text style={pagesStyles.description}>Consulte e gerencie os registros de produtos.</Text>
                  </View>
                  <View style={styles.headerActions}>
                      <AnimatedButton
                          title="Lançar estoque"
                          stylesPressable={pagesStyles.secondaryButton}
                          stylesText={pagesStyles.secondaryButtonText}
                          onPress={() => setEstoqueAberto(true)}
                      />
                      <AnimatedButton
                          title="Novo produto"
                          stylesPressable={pagesStyles.primaryButton}
                          stylesText={pagesStyles.primaryButtonText}
                          onPress={() => router.push("/(tabs)/(material)/addMaterial")}
                      />
                  </View>
              </View>
              <View style={styles.header}>
                  <MaterialsFilters
                      pesquisa={pesquisa}
                      setPesquisa={setPesquisa}
                      onSearch={handlePesquisa}
                      onClear={limparPesquisa}
                      isMobile={isMobile}
                  />
              </View>

              <ScrollView
                  showsVerticalScrollIndicator={false}
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.tableScroll}
                  contentContainerStyle={styles.tableScrollContent}
              >
                  <View style={styles.tableContainer}>
                      <FlatList
                          showsHorizontalScrollIndicator={true}
                          data={produtos}
                          keyExtractor={(item) => item.id.toString()}
                          ListHeaderComponent={<MaterialTableHeader />}
                          showsVerticalScrollIndicator={false}
                          renderItem={({ item, index }) => (
                              <MaterialCard
                                  index={index}
                                  produto={item}
                                  iconDetails={() => abrirDetalhes(item)}
                                  iconEdit={() => abrirEditar(item)}
                                  iconDelete={() =>
                                      requestDelete(item.id, item.nome)
                                  }
                              />
                          )}
                          onEndReached={carregarMais}
                          onEndReachedThreshold={0.5}
                          ListFooterComponent={
                              loading ? (
                                  <View style={styles.loadingContainer}>
                                      <Text style={styles.loadingText}>
                                          Carregando...
                                      </Text>
                                  </View>
                              ) : hasMore && produtos.length > 0 ? (
                                  <View style={styles.moreContainer}>
                                      <Pressable
                                          style={styles.moreButton}
                                          onPress={carregarMais}
                                      >
                                          <Text style={styles.moreButtonText}>
                                              Carregar mais
                                          </Text>
                                      </Pressable>
                                  </View>
                              ) : null
                          }
                          ListEmptyComponent={
                              !loading ? (
                                  <View style={styles.emptyContainer}>
                                      <Text style={styles.emptyText}>
                                          Nenhum produto encontrado.
                                      </Text>
                                  </View>
                              ) : null
                          }
                      />
                  </View>
              </ScrollView>
          </View>

          {/* Modal de Detalhes */}
          <RecordModal
              visible={detalhesAberto}
              onClose={fecharDetalhes}
              title="Detalhes"
          >
              {materialSelecionado && (
                  <MaterialDetailsCard
                      data={[
                          {
                              label: "ID do Produto",
                              value: materialSelecionado.id,
                          },
                          {
                              label: "Nome",
                              value: materialSelecionado.nome,
                          },
                          {
                              label: "Preço",
                              value: formatMoney(
                                  getMaterialPreco(materialSelecionado),
                              ),
                              fullWidth: true,
                          },
                          {
                              label: "Quantidade para pronta entrega",
                              value: materialSelecionado.quantidade_pronta_entrega ?? 0,
                          },
                          {
                              label: "Quantidade a produzir",
                              value: materialSelecionado.quantidade_a_produzir ?? 0,
                          },
                          {
                              label: "Descrição",
                              value:
                                  getMaterialDescricao(materialSelecionado) ||
                                  "Sem descrição cadastrada.",
                              fullWidth: true,
                          },
                      ]}
                  />
              )}
          </RecordModal>

          {/* Modal de Edição */}
          <RecordModal
              visible={editarAberto}
              onClose={fecharEditar}
              title="Editar registro"
          >
              {materialEditar && (
                  <EditMaterialCard
                      idMaterial={materialEditar.id}
                      onSaveSuccess={fecharEditar}
                  />
              )}
          </RecordModal>
          {estoqueAberto && (
              <ProductStockAdjustment
                  onClose={() => setEstoqueAberto(false)}
                  onSaved={handlePesquisa}
              />
          )}
          {deletionDialog}
      </PagesLayout>
  );
}

const styles = StyleSheet.create({
    headerActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
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
        boxShadow: "none",
        elevation: 0,
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
