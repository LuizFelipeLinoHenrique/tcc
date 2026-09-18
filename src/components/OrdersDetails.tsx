import { Ionicons } from "@expo/vector-icons";
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
    function getDetail(label: string) {
        return data.find((item) => item.label === label);
    }

    function renderValue(detail?: OrderDetail, highlight = false) {
        if (!detail) return null;

        const value =
            typeof detail.value === "string" || typeof detail.value === "number" ? (
                <Text
                    style={[
                        styles.value,
                        highlight && styles.highlightValue,
                    ]}
                >
                    {detail.value}
                </Text>
            ) : (
                detail.value
            );

        return value;
    }

    function renderDetail(detail?: OrderDetail, fullWidth = false) {
        if (!detail) return null;

        return (
            <View
                style={[
                    styles.detail,
                    fullWidth && styles.detailFullWidth,
                ]}
            >
                <Text style={styles.label}>
                    {detail.label}
                </Text>

                {renderValue(detail)}
            </View>
        );
    }

    const idPedido = getDetail("ID do Pedido");
    const cliente = getDetail("Cliente");
    const telefone = getDetail("Telefone");
    const endereco = getDetail("Endereço");
    const material = getDetail("Material");
    const descricao = getDetail("Descrição do Material");
    const precoUnit = getDetail("Preço Unitário");
    const quantidade = getDetail("Quantidade Pedida");
    const precoTotal = getDetail("Preço Total");
    const dataPedido = getDetail("Data do Pedido");
    const status = getDetail("Status");

    const statusStr = status?.value ? String(status.value) : "";
    const isPendente = statusStr === "P" || statusStr.toLowerCase() === "pendente";
    const isEntregue = statusStr === "E" || statusStr.toLowerCase() === "entregue";
    const isCancelado = statusStr === "C" || statusStr.toLowerCase() === "cancelado";

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
                <View style={styles.iconCircle}>
                    <Ionicons name="cube" size={24} color="#79553D" />
                </View>
                <View style={styles.headerTitle}>
                    <Text style={pagesStyles.brand}>
                        PEDIDO REGISTRADO
                    </Text>
                    <Text style={styles.title}>
                        {title}
                    </Text>
                </View>

                {status && (
                    <View
                        style={[
                            styles.statusBadge,
                            isPendente && styles.statusPending,
                            isEntregue && styles.statusDelivered,
                            isCancelado && styles.statusCanceled,
                        ]}
                    >
                        <Ionicons
                            name={
                                isEntregue
                                    ? "checkmark-circle"
                                    : isCancelado
                                    ? "close-circle"
                                    : "time"
                            }
                            size={14}
                            color={
                                isEntregue
                                    ? "#3D7A42"
                                    : isCancelado
                                    ? "#A74E3C"
                                    : "#9C6E2E"
                            }
                        />
                        <Text
                            style={[
                                styles.statusText,
                                isPendente && styles.statusPendingText,
                                isEntregue && styles.statusDeliveredText,
                                isCancelado && styles.statusCanceledText,
                            ]}
                        >
                            {isPendente
                                ? "Pendente"
                                : isEntregue
                                ? "Entregue"
                                : isCancelado
                                ? "Cancelado"
                                : statusStr}
                        </Text>
                    </View>
                )}
            </View>

            {/* CLIENTE */}
            {(cliente || telefone || endereco) && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-outline" size={17} color="#79553D" />
                        <Text style={styles.sectionTitle}>Cliente</Text>
                    </View>

                    <View style={styles.details}>
                        {renderDetail(cliente)}
                        {renderDetail(telefone)}
                        {renderDetail(endereco, true)}
                    </View>
                </View>
            )}

            {/* PRODUTO */}
            {(material || descricao) && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cube-outline" size={17} color="#79553D" />
                        <Text style={styles.sectionTitle}>Material / Produto</Text>
                    </View>

                    <View style={styles.details}>
                        {renderDetail(material)}
                        {renderDetail(descricao, true)}
                    </View>
                </View>
            )}

            {/* RESUMO */}
            {(quantidade || dataPedido || idPedido) && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar-outline" size={17} color="#79553D" />
                        <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
                    </View>

                    <View style={styles.details}>
                        {renderDetail(idPedido)}
                        {renderDetail(quantidade)}
                        {renderDetail(dataPedido)}
                    </View>
                </View>
            )}

            {/* VALORES */}
            {(precoUnit || precoTotal) && (
                <View style={[styles.section, styles.valuesSection]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cash-outline" size={17} color="#79553D" />
                        <Text style={styles.sectionTitle}>Valores da Venda</Text>
                    </View>

                    <View style={styles.valuesContainer}>
                        {precoUnit && (
                            <View style={styles.valueBox}>
                                <Text style={styles.valueBoxLabel}>
                                    {precoUnit.label}
                                </Text>
                                {renderValue(precoUnit)}
                            </View>
                        )}

                        {precoTotal && (
                            <View style={[styles.valueBox, styles.totalBox]}>
                                <Text style={styles.totalBoxLabel}>
                                    {precoTotal.label}
                                </Text>
                                <Text style={styles.totalValue}>
                                    {precoTotal.value}
                                </Text>
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
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        padding: 24,
    },
    header: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 8,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F4EFEA",
        borderWidth: 1,
        borderColor: "#E3D7CB",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontSize: 20,
        fontFamily: "WorksansBold",
        color: "#2C2520",
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: "#FAF7F2",
        borderWidth: 1,
        borderColor: "#E5DDD1",
    },
    statusPending: {
        backgroundColor: "#FDF7ED",
        borderColor: "#F0DFBC",
    },
    statusPendingText: {
        color: "#9C6E2E",
    },
    statusDelivered: {
        backgroundColor: "#EFF7EF",
        borderColor: "#CBE2CB",
    },
    statusDeliveredText: {
        color: "#3D7A42",
    },
    statusCanceled: {
        backgroundColor: "#FDF2EF",
        borderColor: "#F0CBC2",
    },
    statusCanceledText: {
        color: "#A74E3C",
    },
    statusText: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: "#5C5248",
    },
    section: {
        width: "100%",
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#EFEAE2",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontFamily: "WorksansBold",
        color: "#79553D",
    },
    details: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    detail: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 170,
        backgroundColor: "#FAF8F5",
        borderWidth: 1,
        borderColor: "#EAE3D8",
        borderRadius: 12,
        padding: 12,
        gap: 4,
    },
    detailFullWidth: {
        flexBasis: "100%",
    },
    label: {
        color: "#8C8276",
        fontSize: 12,
        fontFamily: "WorksansMedium",
    },
    value: {
        fontSize: 14,
        lineHeight: 20,
        color: "#2C2520",
        fontFamily: "WorksansRegular",
    },
    highlightValue: {
        fontFamily: "WorksansBold",
        color: "#79553D",
    },
    valuesSection: {
        paddingBottom: 4,
    },
    valuesContainer: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    valueBox: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 170,
        padding: 14,
        borderRadius: 12,
        backgroundColor: "#FAF8F5",
        borderWidth: 1,
        borderColor: "#EAE3D8",
        gap: 4,
    },
    totalBox: {
        backgroundColor: "#F5EEE8",
        borderColor: "#DECBC0",
    },
    valueBoxLabel: {
        fontSize: 12,
        fontFamily: "WorksansMedium",
        color: "#766E64",
    },
    totalBoxLabel: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    totalValue: {
        fontSize: 18,
        fontFamily: "WorksansBold",
        color: "#79553D",
    },
});