// app/(tabs)/clients/Clients.tsx

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { supabase } from "@/src//lib/supabase";
import { ClientCard, Cliente } from "@/src/components/ClientsCard";
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

  const [lastId, setLastId] = useState<number | null>(null);
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
      if (loading && !reset) return;

      setLoading(true);

      try {
        const cursor = reset ? null : lastId;

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
              setClientes(reset ? [] : clientes);
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
            const telefone = Number(
              texto.replace(/\D/g, "")
            );

            if (!Number.isNaN(telefone)) {
              query = query.eq("telefone", telefone);
            } else {
              setClientes(reset ? [] : clientes);
              setHasMore(false);
              setLoading(false);
              return;
            }
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error("Erro ao carregar clientes:", error);

          Alert.alert(
            "Erro",
            "Não foi possível carregar os clientes."
          );

          return;
        }

        const novosClientes = (data ?? []) as Cliente[];

        if (reset) {
          setClientes(novosClientes);
        } else {
          setClientes((prev) => [...prev, ...novosClientes]);
        }

        if (novosClientes.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (novosClientes.length > 0) {
          setLastId(
            novosClientes[novosClientes.length - 1].id
          );
        } else if (reset) {
          setLastId(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [clientes, lastId, loading, pesquisa, tipoPesquisa]
  );

  useEffect(() => {
    setLastId(null);
    setHasMore(true);

    const timer = setTimeout(() => {
      loadClientes(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [pesquisa, tipoPesquisa, reloadClientes]);

  const handlePesquisa = () => {
    setLastId(null);
    setHasMore(true);
    setReloadClientes((prev) => prev + 1);
  };

  const limparPesquisa = () => {
    setPesquisa("");
    setTipoPesquisa("NOME");
    setLastId(null);
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

    setLastId(null);
    setHasMore(true);
    setReloadClientes((prev) => prev + 1);
  };

  // const confirmarExclusao = (cliente: Cliente) => {
  //   Alert.alert(
  //     "Excluir cliente",
  //     `Deseja realmente excluir o cliente "${cliente.nome}"?`,
  //     [
  //       {
  //         text: "Cancelar",
  //         style: "cancel",
  //       },
  //       {
  //         text: "Excluir",
  //         style: "destructive",
  //         onPress: () => deleteCliente(cliente.id),
  //       },
  //     ]
  //   );
  // };

  const deleteCliente = async (id: number) => {
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      return;
    }

    setClientes((prev) =>
      prev.filter((cliente) => cliente.id !== id)
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

        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          numColumns={isMobile ? 1 : 2}
          key={isMobile ? "mobile" : "desktop"}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={
            !isMobile
              ? styles.columnWrapper
              : undefined
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ClientCard
              cliente={item}
              iconDetails={() =>
                abrirDetalhes(item)
              }
              iconEdit={() =>
                abrirEditar(item)
              }
              iconDelete={() =>
                deleteCliente(item.id)
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
            ) : hasMore && clientes.length > 0 ? (
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
                  Nenhum cliente encontrado.
                </Text>
              </View>
            ) : null
          }
        />
      </View>

      <Modal
        visible={detalhesAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharDetalhes}
      >
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor:
            "rgba(0, 0, 0, 0.5)",
        }}>
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
          {clienteSelecionado && (
            <View
              style={{
                width: "100%",
                maxWidth: 900,
                maxHeight: isMobile
                  ? "90%"
                  : "100%",
              }}
            >
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
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={editarAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharEditar}
      >
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor:
            "rgba(0, 0, 0, 0.5)",
        }}>
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
          {clienteEditar && (
            <EditClientCard
              idCliente={clienteEditar.id}
            />
          )}
        </View>
      </Modal>
    </PagesLayout>
  );
}

const styles = StyleSheet.create({
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
    color: "#79553D",
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
    color: "#79553D",
  },

  moreContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
  },

  moreButton: {
    backgroundColor: "#79553D",
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
    color: "#79553D",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
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
    color: "#79553D",
  },

  closeText: {
    fontSize: 32,
    lineHeight: 32,
    color: "#79553D",
  },
});