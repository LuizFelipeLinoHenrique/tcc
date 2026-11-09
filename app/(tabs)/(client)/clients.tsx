import { createPagination, mergeById } from "@/src/lib/pagination";
import { RecordModal } from "@/src/components/RecordModal";
import { useRecordDeletion } from "@/src/hooks/useRecordDeletion";
import { Colors } from "@/src/theme/colors";
// app/(tabs)/clients/Clients.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { supabase } from "@/src//lib/supabase";
import { ClientCard, Cliente, ClientTableHeader } from "@/src/components/ClientsCard";
import { ClientDetailsCard } from "@/src/components/ClientsDetails";
import { EditClientCard } from "@/src/components/ClientsEdit";
import {
  ClientsFilters,
  TipoPesquisaCliente,
} from "@/src/components/ClientsFilters";
import { PagesLayout } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";

const PAGE_SIZE = 50;

export default function Clients() {
  const { isMobile, maxCardWidth } = useResponsive();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [tipoPesquisa, setTipoPesquisa] =
    useState<TipoPesquisaCliente>("NOME");

    const pagination = useRef(createPagination()).current;
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [clienteSelecionado, setClienteSelecionado] =
      useState<Cliente | null>(null);
    const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);

    const [detalhesAberto, setDetalhesAberto] = useState(false);
    const [editarAberto, setEditarAberto] = useState(false);

    const [reloadClientes, setReloadClientes] = useState(0);

    const loadClientes = useCallback(
      async (reset = false) => {
        const request = pagination.begin(reset);
        if (!request) return;

        setLoading(true);

        try {
          const cursor = request.cursor;

          let query = supabase
            .from("clientes")
            .select("id, nome, endereco, email, telefone")
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
                setClientes((prev) => (reset ? [] : prev));
                setHasMore(false);
                setLoading(false);
                return;
              }
            }

            if (tipoPesquisa === "NOME") {
              query = query.ilike("nome", `%${texto}%`);
            }

            if (tipoPesquisa === "EMAIL") {
              query = query.ilike("email", `%${texto}%`);
            }

            if (tipoPesquisa === "TELEFONE") {
              const telefone = Number(texto.replace(/\D/g, ""));

              if (!Number.isNaN(telefone)) {
                query = query.eq("telefone", telefone);
              } else {
                pagination.accept(request, [], PAGE_SIZE);
                setClientes((prev) => (reset ? [] : prev));
                setHasMore(false);
                setLoading(false);
                return;
              }
            }
          }

          const { data, error } = await query;

          if (!pagination.isCurrent(request)) return;

          if (error) {
            console.error("Erro ao carregar clientes:", error);

            Alert.alert("Erro", "Não foi possível carregar os clientes.");

            return;
          }

          const novosClientes = (data ?? []) as Cliente[];

          if (reset) {
            setClientes(mergeById([], novosClientes));
          } else {
            setClientes((prev) => mergeById(prev, novosClientes));
          }

          if (novosClientes.length < PAGE_SIZE) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          pagination.accept(request, novosClientes, PAGE_SIZE);
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
        loadClientes(true);
      }, 300);

      return () => {
        clearTimeout(timer);
        pagination.invalidate();
      };
    }, [loadClientes, pagination, reloadClientes]);

    const handlePesquisa = () => {
      setHasMore(true);
      setReloadClientes((prev) => prev + 1);
    };

    const limparPesquisa = () => {
      setPesquisa("");
      setTipoPesquisa("NOME");
      setHasMore(true);
      setReloadClientes((prev) => prev + 1);
    };

    const carregarMais = () => {
      if (!loading && hasMore) {
        loadClientes(false);
      }
    };

  const abrirDetalhes = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setDetalhesAberto(true);
  };

  const fecharDetalhes = () => {
    setDetalhesAberto(false);
    setClienteSelecionado(null);
  };

  const abrirEditar = (cliente: Cliente) => {
    setClienteEditar(cliente);
    setEditarAberto(true);
  };

  const fecharEditar = () => {
    setEditarAberto(false);
    setClienteEditar(null);

    setHasMore(true);
    setReloadClientes((prev) => prev + 1);
  };

    const { requestDelete, deletionDialog } = useRecordDeletion("clientes", (id) => {
        setClientes(prev => prev.filter(record => record.id !== id));
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
          <ClientsFilters
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
              data={clientes}
              keyExtractor={(item) => item.id.toString()}
              ListHeaderComponent={<ClientTableHeader />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <ClientCard
                  index={index}
                  cliente={item}
                  iconDetails={() => abrirDetalhes(item)}
                  iconEdit={() => abrirEditar(item)}
                  iconDelete={() => requestDelete(item.id, item.nome)}
                />
              )}
              onEndReached={carregarMais}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando...</Text>
                  </View>
                ) : hasMore && clientes.length > 0 ? (
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
                    <Text style={styles.emptyText}>
                      Nenhum cliente encontrado.
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        </ScrollView>
      </View>

      <RecordModal
        visible={detalhesAberto}
        onClose={fecharDetalhes}
        title="Detalhes"
      >
        {clienteSelecionado && (
          <ClientDetailsCard
            data={[
              {
                label: "ID do Cliente",
                value: clienteSelecionado.id,
              },
              {
                label: "Nome",
                value: clienteSelecionado.nome,
              },
              {
                label: "E-mail",
                value: clienteSelecionado.email,
              },
              {
                label: "Telefone",
                value: clienteSelecionado.telefone,
              },
              {
                label: "Endereço",
                value: clienteSelecionado.endereco,
                fullWidth: true,
              },
            ]}
          />
        )}
      </RecordModal>

      <RecordModal
        visible={editarAberto}
        onClose={fecharEditar}
        title="Editar registro"
      >
        {clienteEditar && (
          <EditClientCard
            idCliente={clienteEditar.id}
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

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.hex0B4F6C,
    marginBottom: 10,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayBlack45,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalMobile: {
    width: "100%",
  },

  modalDesktop: {
    width: 700,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.hex0B4F6C,
  },

  closeText: {
    fontSize: 32,
    lineHeight: 32,
    color: Colors.hex0B4F6C,
  },
});
