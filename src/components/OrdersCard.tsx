import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import useResponsive from "../hooks/useResponsive";

type Pedido = {
    id: number;
    data_pedido: string;
    id_cliente: number;
    qtde: number;
    id_produto: number;
    status: string;
};

type OrderCardProps = {
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    pedido: Pedido;
};

function renderStatusBadge(status: string) {
    if (status === "P") {
        return (
            <View style={[styles.statusBadge, styles.statusPending]}>
                <Ionicons name="time-outline" size={13} color="#9C6E2E" />
                <Text style={styles.statusPendingText}>Pendente</Text>
            </View>
        );
    }
    if (status === "E") {
        return (
            <View style={[styles.statusBadge, styles.statusDelivered]}>
                <Ionicons name="checkmark-circle-outline" size={13} color="#3D7A42" />
                <Text style={styles.statusDeliveredText}>Entregue</Text>
            </View>
        );
    }
    if (status === "C") {
        return (
            <View style={[styles.statusBadge, styles.statusCanceled]}>
                <Ionicons name="close-circle-outline" size={13} color="#A74E3C" />
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

export function OrderCard({ pedido, iconDetails, iconEdit, iconDelete }: OrderCardProps) {
    const { isMobile } = useResponsive();

    return (
        <View style={[styles.container, isMobile ? { width: "100%" } : { width: "50%" }]}>
            <View style={styles.card}>
                {/* Header do Pedido */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.orderIconBox}>
                            <Ionicons name="cube" size={20} color="#79553D" />
                        </View>
                        <View>
                            <Text style={styles.orderTitle}>Pedido #{pedido.id}</Text>
                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={12} color="#8C8276" />
                                <Text style={styles.dateText}>{pedido.data_pedido}</Text>
                            </View>
                        </View>
                    </View>

                    {renderStatusBadge(pedido.status)}
                </View>

                {/* Linha Divisória */}
                <View style={styles.divider} />

                {/* Grid de Metadados */}
                <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                        <View style={styles.metaLabelRow}>
                            <Ionicons name="person-outline" size={14} color="#8C8276" />
                            <Text style={styles.metaLabel}>Cliente</Text>
                        </View>
                        <Text style={styles.metaValue}>ID #{pedido.id_cliente}</Text>
                    </View>

                    <View style={styles.metaItem}>
                        <View style={styles.metaLabelRow}>
                            <Ionicons name="cube-outline" size={14} color="#8C8276" />
                            <Text style={styles.metaLabel}>Produto</Text>
                        </View>
                        <Text style={styles.metaValue}>ID #{pedido.id_produto}</Text>
                    </View>

                    <View style={styles.metaItem}>
                        <View style={styles.metaLabelRow}>
                            <Ionicons name="layers-outline" size={14} color="#8C8276" />
                            <Text style={styles.metaLabel}>Quantidade</Text>
                        </View>
                        <Text style={styles.metaValue}>{pedido.qtde} un.</Text>
                    </View>
                </View>

                {/* Barra de Ações */}
                <View style={styles.actionsBar}>
                    <Pressable
                        onPress={iconDetails}
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.detailsBtn,
                            pressed && styles.actionBtnPressed,
                        ]}
                        hitSlop={4}
                    >
                        <Ionicons name="eye-outline" size={16} color="#79553D" />
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
                        <Ionicons name="pencil-outline" size={16} color="#79553D" />
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
                            <Ionicons name="trash-outline" size={16} color="#A74E3C" />
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E8E2D8",
        padding: 18,
        shadowColor: "#30241A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    orderIconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#F5EEE8",
        borderWidth: 1,
        borderColor: "#EAE0D4",
        alignItems: "center",
        justifyContent: "center",
    },
    orderTitle: {
        fontSize: 16,
        fontFamily: "WorksansBold",
        color: "#2C2520",
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    dateText: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: "#8C8276",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: "#FAF7F2",
        borderWidth: 1,
        borderColor: "#E5DDD1",
    },
    statusPending: {
        backgroundColor: "#FDF7ED",
        borderColor: "#F0DFBC",
    },
    statusPendingText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#9C6E2E",
    },
    statusDelivered: {
        backgroundColor: "#EFF7EF",
        borderColor: "#CBE2CB",
    },
    statusDeliveredText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#3D7A42",
    },
    statusCanceled: {
        backgroundColor: "#FDF2EF",
        borderColor: "#F0CBC2",
    },
    statusCanceledText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#A74E3C",
    },
    statusDefaultText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#5C5248",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0EBE2",
        marginVertical: 14,
    },
    metaGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 16,
    },
    metaItem: {
        flex: 1,
        minWidth: 90,
        backgroundColor: "#FAF8F5",
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: "#ECE5DC",
    },
    metaLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 3,
    },
    metaLabel: {
        fontSize: 11,
        fontFamily: "WorksansRegular",
        color: "#8C8276",
    },
    metaValue: {
        fontSize: 13,
        fontFamily: "WorksansBold",
        color: "#2C2520",
    },
    actionsBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F4EFEA",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 9,
        gap: 6,
    },
    actionBtnPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.98 }],
    },
    detailsBtn: {
        flex: 1,
        backgroundColor: "#F7F3EE",
    },
    detailsBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    editBtn: {
        flex: 1,
        backgroundColor: "#F0EBE3",
    },
    editBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    deleteBtn: {
        backgroundColor: "#FDF2EF",
        paddingHorizontal: 10,
    },
});