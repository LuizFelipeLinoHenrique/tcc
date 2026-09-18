import React from "react";

import {
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";

import { pagesStyles } from "./ScreensLayout";

export type OrderDetail = {
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
};

type OrderDetailsCardProps = {
    title?: string;
    data: OrderDetail[];
    style?: StyleProp<ViewStyle>;
};

export function OrderDetailsCard({
    title = "Detalhes do Pedido",
    data,
    style,
}: OrderDetailsCardProps) {
    /*
     * Localiza um campo pelo label.
     *
     * Mantemos a API original do componente:
     * o componente continua recebendo apenas "data".
     */
    function getDetail(label: string) {
        return data.find(
            (item) => item.label === label
        );
    }

    /*
     * Retorna o conteúdo de um detalhe.
     */
    function renderValue(
        detail?: OrderDetail,
        highlight = false
    ) {
        if (!detail) {
            return null;
        }

        const value =
            typeof detail.value === "string" ||
                typeof detail.value === "number"
                ? (
                    <Text
                        style={[
                            pagesStyles.text,
                            styles.value,
                            highlight &&
                            styles.highlightValue,
                        ]}
                    >
                        {detail.value}
                    </Text>
                )
                : detail.value;

        return value;
    }

    /*
     * Campo de informação padrão.
     */
    function renderDetail(
        detail?: OrderDetail,
        fullWidth = false
    ) {
        if (!detail) {
            return null;
        }

        return (
            <View
                style={[
                    styles.detail,
                    fullWidth &&
                    styles.detailFullWidth,
                ]}
            >
                <Text
                    style={[
                        pagesStyles.textBold,
                        styles.label,
                    ]}
                >
                    {detail.label}
                </Text>

                {renderValue(detail)}
            </View>
        );
    }

    const idPedido =
        getDetail("ID do Pedido");

    const cliente =
        getDetail("Cliente");

    const telefone =
        getDetail("Telefone");

    const endereco =
        getDetail("Endereço");

    const material =
        getDetail("Material");

    const descricao =
        getDetail("Descrição do Material");

    const precoUnit =
        getDetail("Preço Unitário");

    const quantidade =
        getDetail("Quantidade Pedida");

    const precoTotal =
        getDetail("Preço Total");

    const dataPedido =
        getDetail("Data do Pedido");

    const status =
        getDetail("Status");

    return (
        <View
            style={[
                pagesStyles.card,
                styles.card,
                style,
            ]}
        >
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <View
                    style={styles.headerTitle}
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
                        {title}
                    </Text>
                </View>

                {status && (
                    <View
                        style={styles.status}
                    >
                        <Text
                            style={
                                styles.statusLabel
                            }
                        >
                            Status
                        </Text>

                        {renderValue(
                            status,
                            true
                        )}
                    </View>
                )}
            </View>

            {/* CLIENTE */}
            {(cliente ||
                telefone ||
                endereco) && (
                    <View
                        style={styles.section}
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Cliente
                        </Text>

                        <View
                            style={
                                styles.details
                            }
                        >
                            {renderDetail(
                                cliente
                            )}

                            {renderDetail(
                                telefone
                            )}

                            {renderDetail(
                                endereco,
                                true
                            )}
                        </View>
                    </View>
                )}

            {/* PRODUTO */}
            {(material ||
                descricao) && (
                    <View
                        style={styles.section}
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Produto
                        </Text>

                        <View
                            style={
                                styles.details
                            }
                        >
                            {renderDetail(
                                material
                            )}

                            {renderDetail(
                                descricao,
                                true
                            )}
                        </View>
                    </View>
                )}

            {/* RESUMO */}
            {(quantidade ||
                dataPedido ||
                idPedido) && (
                    <View
                        style={styles.section}
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Resumo do pedido
                        </Text>

                        <View
                            style={
                                styles.details
                            }
                        >
                            {renderDetail(
                                idPedido
                            )}

                            {renderDetail(
                                quantidade
                            )}

                            {renderDetail(
                                dataPedido
                            )}
                        </View>
                    </View>
                )}

            {/* VALORES */}
            {(precoUnit ||
                precoTotal) && (
                    <View
                        style={[
                            styles.section,
                            styles.valuesSection,
                        ]}
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Valores
                        </Text>

                        <View
                            style={
                                styles.valuesContainer
                            }
                        >
                            {precoUnit && (
                                <View
                                    style={
                                        styles.valueBox
                                    }
                                >
                                    <Text
                                        style={
                                            styles.valueBoxLabel
                                        }
                                    >
                                        {precoUnit.label}
                                    </Text>

                                    {renderValue(
                                        precoUnit
                                    )}
                                </View>
                            )}

                            {precoTotal && (
                                <View
                                    style={[
                                        styles.valueBox,
                                        styles.totalBox,
                                    ]}
                                >
                                    <Text
                                        style={
                                            styles.valueBoxLabel
                                        }
                                    >
                                        {precoTotal.label}
                                    </Text>

                                    {renderValue(
                                        precoTotal,
                                        true
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}
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
        gap: 20,
        marginBottom: 8,
    },

    headerTitle: {
        flex: 1,
        minWidth: 0,
    },

    title: {
        marginVertical: 0,
        marginBottom: 0,
    },

    status: {
        minWidth: 120,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#E8E0D7",
        alignItems: "center",
        justifyContent: "center",
    },

    statusLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 2,
        opacity: 0.7,
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

    details: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },

    detail: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 180,
        gap: 5,
    },

    detailFullWidth: {
        flexBasis: "100%",
    },

    label: {
        opacity: 0.75,
        fontSize: 14,
    },

    value: {
        fontSize: 16,
        lineHeight: 22,
    },

    highlightValue: {
        fontWeight: "700",
        color: "#65442F",
    },

    valuesSection: {
        paddingBottom: 4,
    },

    valuesContainer: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },

    valueBox: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 180,
        padding: 16,
        borderRadius: 10,
        backgroundColor: "#EFE9E2",
        gap: 5,
    },

    totalBox: {
        backgroundColor: "#E5D8CB",
    },

    valueBoxLabel: {
        fontSize: 14,
        fontWeight: "600",
        opacity: 0.75,
    },
});