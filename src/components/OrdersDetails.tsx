import { Colors } from "@/src/theme/colors";
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
                    <Ionicons name="cube" size={24} color={Colors.hex0B4F6C} />
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
                                    ? Colors.hex3D7A42
                                    : isCancelado
                                    ? Colors.hexA74E3C
                                    : Colors.hex9C6E2E
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
                        <Ionicons name="person-outline" size={17} color={Colors.hex0B4F6C} />
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
                        <Ionicons name="cube-outline" size={17} color={Colors.hex0B4F6C} />
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
                        <Ionicons name="calendar-outline" size={17} color={Colors.hex0B4F6C} />
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
                        <Ionicons name="cash-outline" size={17} color={Colors.hex0B4F6C} />
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
        backgroundColor: Colors.white,
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
        backgroundColor: Colors.hexEDF3F7,
        borderWidth: 1,
        borderColor: Colors.hexD4E1E9,
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
        color: Colors.hex0F172A,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: Colors.hexF8FAFC,
        borderWidth: 1,
        borderColor: Colors.hexD4E1E9,
    },
    statusPending: {
        backgroundColor: Colors.hexFDF7ED,
        borderColor: Colors.hexF0DFBC,
    },
    statusPendingText: {
        color: Colors.hex9C6E2E,
    },
    statusDelivered: {
        backgroundColor: Colors.hexEFF7EF,
        borderColor: Colors.hexCBE2CB,
    },
    statusDeliveredText: {
        color: Colors.hex3D7A42,
    },
    statusCanceled: {
        backgroundColor: Colors.hexFDF2EF,
        borderColor: Colors.hexF0CBC2,
    },
    statusCanceledText: {
        color: Colors.hexA74E3C,
    },
    statusText: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex334155,
    },
    section: {
        width: "100%",
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.hexE2EBF0,
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
        color: Colors.hex0B4F6C,
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
        backgroundColor: Colors.hexF8FAFC,
        borderWidth: 1,
        borderColor: Colors.hexD9E5EC,
        borderRadius: 12,
        padding: 12,
        gap: 4,
    },
    detailFullWidth: {
        flexBasis: "100%",
    },
    label: {
        color: Colors.hex64748B,
        fontSize: 12,
        fontFamily: "WorksansMedium",
    },
    value: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.hex0F172A,
        fontFamily: "WorksansRegular",
    },
    highlightValue: {
        fontFamily: "WorksansBold",
        color: Colors.hex0B4F6C,
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
        backgroundColor: Colors.hexF8FAFC,
        borderWidth: 1,
        borderColor: Colors.hexD9E5EC,
        gap: 4,
    },
    totalBox: {
        backgroundColor: Colors.hexE0EDF4,
        borderColor: Colors.hexCBD8E2,
    },
    valueBoxLabel: {
        fontSize: 12,
        fontFamily: "WorksansMedium",
        color: Colors.hex475569,
    },
    totalBoxLabel: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0B4F6C,
    },
    totalValue: {
        fontSize: 18,
        fontFamily: "WorksansBold",
        color: Colors.hex0B4F6C,
    },
});
