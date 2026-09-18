import { supabase } from "@/src/lib/supabase";

import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import useResponsive from "@/src/hooks/useResponsive";

import { AnimatedButton } from "./AnimatedButton";
import { pagesStyles } from "./ScreensLayout";

type EditOrderCardProps = {
    idPedido: number;
};

type Order = {
    id: number;
    data_pedido: string;
    id_cliente: number;
    qtde: number;
    id_produto: number;
    status: string;
};

export function EditOrderCard({
    idPedido,
}: EditOrderCardProps) {
    const { isMobile } = useResponsive();

    const [pedido, setPedido] =
        useState<Order | null>(null);

    const [idCliente, setIdCliente] =
        useState("");

    const [qtde, setQtde] =
        useState("");

    const [idProduto, setIdProduto] =
        useState("");

    const [status, setStatus] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState<string>("");

    useEffect(() => {
        buscarPedido();
    }, [idPedido]);

    async function buscarPedido() {
        setLoading(true);

        const {
            data,
            error,
        } = await supabase
            .from("pedidos")
            .select("*")
            .eq("id", idPedido)
            .single();

        if (error) {
            setErrorMessage(
                "Não foi possível salvar as alterações."
            );

            console.error(
                "Erro ao buscar pedido:",
                error
            );

            setLoading(false);

            return;
        }

        setPedido(data);

        setIdCliente(
            String(data.id_cliente)
        );

        setQtde(
            String(data.qtde)
        );

        setIdProduto(
            String(data.id_produto)
        );

        setStatus(data.status);

        setLoading(false);
    }

    async function salvarAlteracoes() {
        if (!pedido) {
            return;
        }

        setSaving(true);
        setErrorMessage("");

        const { error } =
            await supabase
                .from("pedidos")
                .update({
                    id_cliente:
                        Number(idCliente),
                    qtde:
                        Number(qtde),
                    id_produto:
                        Number(idProduto),
                    status: status,
                })
                .eq("id", idPedido);

        setSaving(false);

        if (error) {
            console.error(
                "Erro ao atualizar pedido:",
                error
            );

            Alert.alert(
                "Erro",
                "Não foi possível salvar as alterações."
            );

            return;
        }

        Alert.alert(
            "Sucesso",
            "Pedido atualizado com sucesso."
        );

        buscarPedido();
    }

    if (loading) {
        return (
            <View
                style={[
                    pagesStyles.card,
                    styles.loading,
                ]}
            >
                <ActivityIndicator />

                <Text
                    style={
                        pagesStyles.text
                    }
                >
                    Carregando pedido...
                </Text>
            </View>
        );
    }

    if (!pedido) {
        return (
            <View
                style={
                    pagesStyles.card
                }
            >
                <Text
                    style={
                        pagesStyles.text
                    }
                >
                    Pedido não encontrado.
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[
                pagesStyles.card,
                styles.card,
            ]}
        >
            {/* CABEÇALHO */}
            <View
                style={[
                    styles.header,
                    isMobile &&
                    styles.headerMobile,
                ]}
            >
                <View
                    style={
                        styles.headerTitle
                    }
                >
                    <Text
                        style={
                            pagesStyles.brand
                        }
                    >
                        Pedido
                    </Text>

                    <Text
                        style={[
                            pagesStyles.title,
                            styles.title,
                        ]}
                    >
                        Editar Pedido #
                        {pedido.id}
                    </Text>
                </View>

                <View
                    style={[
                        styles.dateBox,
                        isMobile &&
                        styles.dateBoxMobile,
                    ]}
                >
                    <Text
                        style={
                            styles.dateLabel
                        }
                    >
                        Data do pedido
                    </Text>

                    <Text
                        style={
                            styles.readOnlyValue
                        }
                    >
                        {pedido.data_pedido}
                    </Text>
                </View>
            </View>

            {/* CAMPOS */}
            <View
                style={styles.section}
            >
                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Dados do pedido
                </Text>

                <View
                    style={styles.fields}
                >
                    {/* ID CLIENTE */}
                    <View
                        style={[
                            styles.field,
                            isMobile &&
                            styles.fieldMobile,
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            ID do Cliente
                        </Text>

                        <TextInput
                            value={
                                idCliente
                            }
                            onChangeText={
                                setIdCliente
                            }
                            keyboardType="numeric"
                            style={
                                styles.input
                            }
                            placeholder="Digite o ID do cliente"
                            placeholderTextColor="#8A8178"
                        />
                    </View>

                    {/* ID PRODUTO */}
                    <View
                        style={[
                            styles.field,
                            isMobile &&
                            styles.fieldMobile,
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            ID do Produto
                        </Text>

                        <TextInput
                            value={
                                idProduto
                            }
                            onChangeText={
                                setIdProduto
                            }
                            keyboardType="numeric"
                            style={
                                styles.input
                            }
                            placeholder="Digite o ID do produto"
                            placeholderTextColor="#8A8178"
                        />
                    </View>

                    {/* QUANTIDADE */}
                    <View
                        style={[
                            styles.field,
                            isMobile &&
                            styles.fieldMobile,
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            Quantidade
                        </Text>

                        <TextInput
                            value={
                                qtde
                            }
                            onChangeText={
                                setQtde
                            }
                            keyboardType="numeric"
                            style={
                                styles.input
                            }
                            placeholder="Digite a quantidade"
                            placeholderTextColor="#8A8178"
                        />
                    </View>

                    {/* STATUS */}
                    <View
                        style={[
                            styles.field,
                            isMobile &&
                            styles.fieldMobile,
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            Status
                        </Text>

                        <TextInput
                            value={
                                status
                            }
                            onChangeText={
                                setStatus
                            }
                            style={
                                styles.input
                            }
                            placeholder="Digite o status"
                            placeholderTextColor="#8A8178"
                        />
                    </View>
                </View>
            </View>

            {/* ERRO */}
            {errorMessage ? (
                <View
                    style={[
                        pagesStyles.error,
                        styles.error,
                    ]}
                >
                    <Text
                        style={
                            pagesStyles.errorText
                        }
                    >
                        {errorMessage}
                    </Text>
                </View>
            ) : null}

            {/* BOTÃO */}
            <View
                style={[
                    styles.buttonContainer,
                    isMobile &&
                    styles.buttonContainerMobile,
                ]}
            >
                <AnimatedButton
                    title={
                        saving ? (
                            <ActivityIndicator
                                color="#65442F"
                            />
                        ) : (
                            "Salvar Alterações"
                        )
                    }
                    stylesPressable={[
                        pagesStyles.secondaryButton,
                        styles.saveButton,
                    ]}
                    stylesText={
                        pagesStyles.secondaryButtonText
                    }
                    onPress={
                        salvarAlteracoes
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
    },

    header: {
        width: "100%",
        flexDirection: "row",
        justifyContent:
            "space-between",
        alignItems: "flex-start",
        gap: 24,
        marginBottom: 8,
    },

    headerMobile: {
        flexDirection: "column",
        gap: 14,
    },

    headerTitle: {
        flex: 1,
        minWidth: 0,
    },

    title: {
        marginVertical: 0,
        marginBottom: 0,
    },

    dateBox: {
        minWidth: 170,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#EFE9E2",
    },

    dateBoxMobile: {
        width: "100%",
    },

    dateLabel: {
        fontSize: 13,
        fontWeight: "600",
        opacity: 0.7,
        marginBottom: 2,
    },

    readOnlyValue: {
        paddingVertical: 2,
        fontSize: 16,
        color: "#65442F",
        fontWeight: "600",
    },

    section: {
        width: "100%",
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#DDD5CC",
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#65442F",
        marginBottom: 14,
    },

    fields: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },

    field: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 180,
        gap: 6,
    },

    fieldMobile: {
        flexBasis: "100%",
        minWidth: 0,
    },

    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#CFC6BC",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 16,
        backgroundColor: "#FAF8F5",
        color: "#2F2924",
    },

    loading: {
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 180,
    },

    error: {
        marginTop: 20,
    },

    buttonContainer: {
        marginTop: 28,
        alignItems: "flex-end",
    },

    buttonContainerMobile: {
        alignItems: "stretch",
    },

    saveButton: {
        minWidth: 190,
    },
});