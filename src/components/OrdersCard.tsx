import { Colors } from "@/src/theme/colors";
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
};

export type OrderCardProps = {
    pedido: Pedido;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    index?: number;
};

function renderStatusBadge(status: string) {
    if (status === "P") {
        return (
            <View style={[styles.statusBadge, styles.statusPending]}>
                <Ionicons name="time-outline" size={12} color={Colors.hex92400E} />
                <Text style={styles.statusPendingText}>Pendente</Text>
            </View>
        );
    }
    if (status === "E") {
        return (
            <View style={[styles.statusBadge, styles.statusDelivered]}>
                <Ionicons name="checkmark-circle-outline" size={12} color={Colors.hex166534} />
                <Text style={styles.statusDeliveredText}>Entregue</Text>
            </View>
        );
    }
    if (status === "C") {
        return (
            <View style={[styles.statusBadge, styles.statusCanceled]}>
                <Ionicons name="close-circle-outline" size={12} color={Colors.hex991B1B} />
                <Text style={styles.statusCanceledText}>Cancelado</Text>
            </View>
        );
    }
    return (
        <View style={styles.statusBadge}>
            <Text style={styles.statusDefaultText}>{status}</Text>
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
                <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>#{pedido.id}</Text>
                </View>
            </View>

            {/* Data */}
            <View style={styles.colDate}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.hex64748B} />
                    <Text style={styles.cellText}>{pedido.data_pedido}</Text>
                </View>
            </View>

            {/* Cliente */}
            <View style={styles.colClient}>
                <View style={styles.labelValueContainer}>
                    <Ionicons name="person-outline" size={13} color={Colors.hex0B4F6C} />
                    <Text style={styles.cellTextBold}>Cliente #{pedido.id_cliente}</Text>
                </View>
            </View>

            {/* Produto */}
            <View style={styles.colProduct}>
                <View style={styles.labelValueContainer}>
                    <Ionicons name="cube-outline" size={13} color={Colors.hex0E7490} />
                    <Text style={styles.cellText}>Item #{pedido.id_produto}</Text>
                </View>
            </View>

            {/* Quantidade */}
            <View style={styles.colQty}>
                <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>{pedido.qtde} un.</Text>
                </View>
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
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.detailsBtn,
                            pressed && styles.actionBtnPressed,
                        ]}
                        hitSlop={4}
                    >
                        <Ionicons name="eye-outline" size={15} color={Colors.hex0B4F6C} />
                        <Text style={styles.detailsBtnText}>Detalhes</Text>
                    </Pressable>

                    <Pressable
                        onPress={iconEdit}
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.editBtn,
                            pressed && styles.actionBtnPressed,
                        ]}
                        hitSlop={4}
                    >
                        <Ionicons name="pencil-outline" size={15} color={Colors.hex0E7490} />
                        <Text style={styles.editBtnText}>Editar</Text>
                    </Pressable>

                    {iconDelete ? (
                        <Pressable
                            onPress={iconDelete}
                            style={({ pressed }) => [
                                styles.actionBtn,
                                styles.deleteBtn,
                                pressed && styles.actionBtnPressed,
                            ]}
                            hitSlop={4}
                        >
                            <Ionicons name="trash-outline" size={15} color={Colors.hexA74E3C} />
                            <Text style={styles.deleteBtnText}>Excluir</Text>
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
        paddingHorizontal: 16,
        borderBottomWidth: 1.5,
        borderColor: Colors.hexCFDDE6,
        minWidth: 860,
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
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: Colors.hexE2EBF0,
        minWidth: 860,
    },
    rowEven: {
        backgroundColor: Colors.white,
    },
    rowOdd: {
        backgroundColor: Colors.hexF8FAFC,
    },

    // Colunas
    colId: {
        width: 75,
        justifyContent: "center",
    },
    colDate: {
        width: 125,
        justifyContent: "center",
    },
    colClient: {
        flex: 1.1,
        minWidth: 130,
        justifyContent: "center",
    },
    colProduct: {
        flex: 1.1,
        minWidth: 130,
        justifyContent: "center",
    },
    colQty: {
        width: 115,
        justifyContent: "center",
    },
    colStatus: {
        width: 130,
        justifyContent: "center",
    },
    colActions: {
        width: 220,
        alignItems: "flex-end",
        justifyContent: "center",
    },

    // Células e textos
    idBadge: {
        backgroundColor: Colors.hexE8F1F5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
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
    qtyBadge: {
        backgroundColor: Colors.hexEDF3F7,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    qtyBadgeText: {
        fontSize: 12,
        fontFamily: "WorksansMedium",
        color: Colors.hex1E293B,
    },

    // Status
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
        alignSelf: "flex-start",
    },
    statusPending: {
        backgroundColor: Colors.hexFEF3C7,
        borderWidth: 1,
        borderColor: Colors.hexFDE68A,
    },
    statusPendingText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex92400E,
    },
    statusDelivered: {
        backgroundColor: Colors.hexDCFCE7,
        borderWidth: 1,
        borderColor: Colors.hexBBF7D0,
    },
    statusDeliveredText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex166534,
    },
    statusCanceled: {
        backgroundColor: Colors.hexFEE2E2,
        borderWidth: 1,
        borderColor: Colors.hexFECACA,
    },
    statusCanceledText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex991B1B,
    },
    statusDefaultText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex475569,
    },

    // Ações
    actionsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 9,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
    },
    actionBtnPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.97 }],
    },
    detailsBtn: {
        backgroundColor: Colors.hexE8F1F5,
        borderColor: Colors.hexCFDDE6,
    },
    detailsBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0B4F6C,
    },
    editBtn: {
        backgroundColor: Colors.hexE0F2FE,
        borderColor: Colors.hexBAE6FD,
    },
    editBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0E7490,
    },
    deleteBtn: {
        backgroundColor: Colors.hexFEE2E2,
        borderColor: Colors.hexFECACA,
    },
    deleteBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: Colors.hexA74E3C,
    },
});
