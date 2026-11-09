import { createPagination, mergeById } from "@/src/lib/pagination";
import { RecordModal } from "@/src/components/RecordModal";
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

    const pagination = useRef(createPagination()).current;
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
            const request = pagination.begin(reset);
            if (!request) return;

            setLoading(true);

            try {
                const cursor = request.cursor;

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
                    pagination.accept(request, [], PAGE_SIZE);
                    setMateriais((prev) => (reset ? [] : prev));
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

                if (!pagination.isCurrent(request)) return;

                if (error) {
                    console.error("Erro ao carregar materiais:", error);
                    Alert.alert(
                        "Erro",
                        "Não foi possível carregar os materiais.",
                    );
                    return;
                }

                const novosMateriais = (data ?? []) as Material[];

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
        [pagination, pesquisa, tipoPesquisa],
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
        setTipoPesquisa("NOME");
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
                  showsVerticalScrollIndicator={false}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.tableScroll}
                  contentContainerStyle={styles.tableScrollContent}
              >
                  <View style={styles.tableContainer}>
                      <FlatList
                          showsHorizontalScrollIndicator={false}
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
                              ) : hasMore && materiais.length > 0 ? (
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
                                          Nenhum material encontrado.
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
                                  getMaterialPreco(materialSelecionado),
                              ),
                              fullWidth: true,
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
          {deletionDialog}
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
