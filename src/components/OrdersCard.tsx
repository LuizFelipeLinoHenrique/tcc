import { Colors } from "@/src/theme/colors";
import { OrderItem, orderItems, orderQuantity } from "@/src/lib/orderItems";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type Pedido = {
    id: number;
    data_pedido: string;
    id_cliente: number;
    qtde: number;
    id_produto: number;
    status: string;
    financial_user_id?: string | null;
    financeiro?: { status: string } | null;
    itens?: OrderItem[];
};

export type OrderCardProps = {
    pedido: Pedido;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    index?: number;
};

function renderStatusBadge(status: string) {
    const states = {
        P: { icon: "time-outline", label: "Pendente", color: Colors.hex92400E, style: styles.statusPending },
        E: { icon: "checkmark-circle-outline", label: "Entregue", color: Colors.hex166534, style: styles.statusDelivered },
        C: { icon: "close-circle-outline", label: "Cancelado", color: Colors.hex991B1B, style: styles.statusCanceled },
    } as const;
    const state = states[status as keyof typeof states];
    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={state?.label ?? `Status: ${status || "Não informado"}`}
            style={[styles.statusBadge, state?.style]}
        >
            <Ionicons name={state?.icon ?? "help-circle-outline"} size={20} color={state?.color ?? Colors.hex475569} />
        </View>
    );
}

export function OrderTableHeader() {
    return (
        <View style={styles.headerRow}>
            <View style={styles.colId}>
                <Text style={styles.headerText}>ID</Text>
            </View>
            <View style={styles.colDate}>
                <Text style={styles.headerText}>DATA</Text>
            </View>
            <View style={styles.colClient}>
                <Text style={styles.headerText}>CLIENTE</Text>
            </View>
            <View style={styles.colProduct}>
                <Text style={styles.headerText}>PRODUTO</Text>
            </View>
            <View style={styles.colQty}>
                <Text style={styles.headerText}>QUANTIDADE</Text>
            </View>
            <View style={styles.colStatus}>
                <Text style={styles.headerText}>STATUS</Text>
            </View>
            <View style={styles.colActions}>
                <Text style={[styles.headerText, styles.headerTextRight]}>AÇÕES</Text>
            </View>
        </View>
    );
}

export function OrderTableRow({
    pedido,
    iconDetails,
    iconEdit,
    iconDelete,
    index = 0,
}: OrderCardProps) {
    const isEven = index % 2 === 0;

    return (
        <View style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}>
            {/* ID */}
            <View style={styles.colId}>
                <Text style={styles.idBadgeText}>#{pedido.id}</Text>
            </View>

            {/* Data */}
            <View style={styles.colDate}>
                <View style={styles.dateContainer}>
                    <Text style={styles.cellText}>{pedido.data_pedido}</Text>
                </View>
            </View>

            {/* Cliente */}
            <View style={styles.colClient}>
                <View style={styles.labelValueContainer}>
                    <Text style={styles.cellTextBold}>Cliente #{pedido.id_cliente}</Text>
                </View>
            </View>

            {/* Produto */}
            <View style={styles.colProduct}>
                <View style={styles.labelValueContainer}>
                    <Text style={styles.cellText}>{orderItems(pedido).map(item => `#${item.id_produto} (${item.qtde} un.)`).join(", ")}</Text>
                </View>
            </View>

            {/* Quantidade */}
            <View style={styles.colQty}>
                <Text style={styles.qtyBadgeText}>{orderQuantity(pedido)} un.</Text>
            </View>

            {/* Status */}
            <View style={styles.colStatus}>
                {renderStatusBadge(pedido.status)}
            </View>

            {/* Ações */}
            <View style={styles.colActions}>
                <View style={styles.actionsContainer}>
                    <Pressable
                        onPress={iconDetails}
                        accessibilityRole="button"
                        accessibilityLabel="Detalhes"
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.detailsBtn,
                            pressed && styles.actionBtnPressed,
                        ]}
                        hitSlop={4}
                    >
                        <Ionicons name="eye-outline" size={15} color={Colors.hex0B4F6C} />
                    </Pressable>

                    <Pressable
                        onPress={iconEdit}
                        accessibilityRole="button"
                        accessibilityLabel="Editar"
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.editBtn,
                            pressed && styles.actionBtnPressed,
                        ]}
                        hitSlop={4}
                    >
                        <Ionicons name="pencil-outline" size={15} color={Colors.hex0E7490} />
                    </Pressable>

                    {pedido.status === "C" && pedido.financeiro?.status === "paid" && (
                        <View accessible accessibilityRole="image" accessibilityLabel="Recebimento realizado: exclusão bloqueada" style={[styles.actionBtn, styles.detailsBtn]}>
                            <Ionicons name="lock-closed-outline" size={15} color={Colors.hex64748B} />
                        </View>
                    )}
                    {iconDelete && pedido.status === "C" && pedido.financeiro?.status !== "paid"
                        && (!pedido.financial_user_id || !!pedido.financeiro) ? (
                        <Pressable
                            onPress={iconDelete}
                            accessibilityRole="button"
                            accessibilityLabel="Excluir"
                            style={({ pressed }) => [
                                styles.actionBtn,
                                styles.deleteBtn,
                                pressed && styles.actionBtnPressed,
                            ]}
                            hitSlop={4}
                        >
                            <Ionicons name="trash-outline" size={15} color={Colors.hexA74E3C} />
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

// Exportamos OrderCard como alias para OrderTableRow para compatibilidade total
export const OrderCard = OrderTableRow;

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.hexE8F1F5,
        paddingVertical: 12,
        paddingHorizontal: 24,
        columnGap: 24,
        borderBottomWidth: 1.5,
        borderColor: Colors.hexCFDDE6,
        minWidth: 1148,
    },
    headerText: {
        fontSize: 11,
        fontFamily: "WorksansBold",
        color: Colors.hex0B4F6C,
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    headerTextRight: {
        textAlign: "right",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        paddingHorizontal: 24,
        columnGap: 24,
        borderBottomWidth: 1,
        borderColor: Colors.hexE2EBF0,
        minWidth: 1148,
    },
    rowEven: {
        backgroundColor: Colors.white,
    },
    rowOdd: {
        backgroundColor: Colors.hexF8FAFC,
    },

    // Colunas
    colId: {
        width: 80,
        flexShrink: 0,
        justifyContent: "center",
    },
    colDate: {
        width: 140,
        flexShrink: 0,
        justifyContent: "center",
    },
    colClient: {
        width: 180,
        flexShrink: 0,
        flexGrow: 1,
        justifyContent: "center",
    },
    colProduct: {
        width: 220,
        flexShrink: 0,
        flexGrow: 1,
        justifyContent: "center",
    },
    colQty: {
        width: 120,
        flexShrink: 0,
        justifyContent: "center",
    },
    colStatus: {
        width: 84,
        flexShrink: 0,
        justifyContent: "center",
    },
    colActions: {
        width: 132,
        flexShrink: 0,
        alignItems: "flex-end",
        justifyContent: "center",
    },

    // Células e textos
    idBadgeText: {
        fontSize: 12,
        fontFamily: "WorksansBold",
        color: Colors.hex0B4F6C,
    },
    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    cellText: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: Colors.hex334155,
    },
    cellTextBold: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0F172A,
    },
    labelValueContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    qtyBadgeText: {
        fontSize: 12,
        fontFamily: "WorksansMedium",
        color: Colors.hex1E293B,
    },

    // Status
    statusBadge: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    statusPending: {
        backgroundColor: Colors.hexFEF3C7,
        borderWidth: 1,
        borderColor: Colors.hexFDE68A,
    },
    statusDelivered: {
        backgroundColor: Colors.hexDCFCE7,
        borderWidth: 1,
        borderColor: Colors.hexBBF7D0,
    },
    statusCanceled: {
        backgroundColor: Colors.hexFEE2E2,
        borderWidth: 1,
        borderColor: Colors.hexFECACA,
    },

    // Ações
    actionsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    actionBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        borderWidth: 1,
    },
    actionBtnPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.97 }],
    },
    detailsBtn: {
        backgroundColor: Colors.hexE8F1F5,
        borderColor: Colors.hexCFDDE6,
    },
    editBtn: {
        backgroundColor: Colors.hexE0F2FE,
        borderColor: Colors.hexBAE6FD,
    },
    deleteBtn: {
        backgroundColor: Colors.hexFEE2E2,
        borderColor: Colors.hexFECACA,
    },
});
