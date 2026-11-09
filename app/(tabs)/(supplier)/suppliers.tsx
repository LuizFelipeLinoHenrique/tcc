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

    const pagination = useRef(createPagination()).current;
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [fornecedorSelecionado, setFornecedorSelecionado] =
        useState<Fornecedor | null>(null);
    const [fornecedorEditar, setFornecedorEditar] = useState<Fornecedor | null>(
        null,
    );

    const [detalhesAberto, setDetalhesAberto] = useState(false);
    const [editarAberto, setEditarAberto] = useState(false);

    const [reloadFornecedores, setReloadFornecedores] = useState(0);

    const loadFornecedores = useCallback(
        async (reset = false) => {
            const request = pagination.begin(reset);
            if (!request) return;

            setLoading(true);

            try {
                const cursor = request.cursor;

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
                            pagination.accept(request, [], PAGE_SIZE);
                            setFornecedores((prev) => (reset ? [] : prev));
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

                if (!pagination.isCurrent(request)) return;

                if (error) {
                    console.error("Erro ao carregar fornecedores:", error);
                    Alert.alert(
                        "Erro",
                        "Não foi possível carregar os fornecedores.",
                    );
                    return;
                }

                const novosFornecedores = (data ?? []) as Fornecedor[];

                if (reset) {
                    setFornecedores(mergeById([], novosFornecedores));
                } else {
                    setFornecedores((prev) =>
                        mergeById(prev, novosFornecedores),
                    );
                }

                if (novosFornecedores.length < PAGE_SIZE) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                pagination.accept(request, novosFornecedores, PAGE_SIZE);
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
            loadFornecedores(true);
        }, 300);

        return () => {
            clearTimeout(timer);
            pagination.invalidate();
        };
    }, [loadFornecedores, pagination, reloadFornecedores]);

    const handlePesquisa = () => {
        setHasMore(true);
        setReloadFornecedores((prev) => prev + 1);
    };

    const limparPesquisa = () => {
        setPesquisa("");
        setTipoPesquisa("NOME");
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

        setHasMore(true);
        setReloadFornecedores((prev) => prev + 1);
    };

    const { requestDelete, deletionDialog } = useRecordDeletion("fornecedores", (id) => {
        setFornecedores(prev => prev.filter(record => record.id !== id));
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
                  showsVerticalScrollIndicator={false}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.tableScroll}
                  contentContainerStyle={styles.tableScrollContent}
              >
                  <View style={styles.tableContainer}>
                      <FlatList
                          showsHorizontalScrollIndicator={false}
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
                              ) : hasMore && fornecedores.length > 0 ? (
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
                                          Nenhum fornecedor encontrado.
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
              {fornecedorSelecionado && (
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
                              value:
                                  fornecedorSelecionado.cnpj || "Não informado",
                          },
                          {
                              label: "E-mail",
                              value:
                                  fornecedorSelecionado.email ||
                                  "Não informado",
                          },
                          {
                              label: "Telefone",
                              value: fornecedorSelecionado.telefone
                                  ? String(fornecedorSelecionado.telefone)
                                  : "Não informado",
                          },
                          {
                              label: "Pessoa de Contato",
                              value:
                                  fornecedorSelecionado.contato ||
                                  "Não informado",
                          },
                          {
                              label: "Endereço",
                              value:
                                  fornecedorSelecionado.endereco ||
                                  "Não informado",
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
              {fornecedorEditar && (
                  <EditSupplierCard
                      idFornecedor={fornecedorEditar.id}
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
