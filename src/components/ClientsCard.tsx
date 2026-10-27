import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type Cliente = {
    id: number;
    nome: string;
    endereco: string;
    email: string;
    telefone: number;
};

export type ClientCardProps = {
    cliente: Cliente;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    index?: number;
};

export function getInitials(name: string): string {
    if (!name) return "CL";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatPhone(phone: number | string): string {
    const s = String(phone || "").replace(/\D/g, "");
    if (s.length === 11) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 7)}-${s.substring(7)}`;
    }
    if (s.length === 10) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 6)}-${s.substring(6)}`;
    }
    return String(phone || "Não informado");
}

export function ClientTableHeader() {
    return (
        <View style={styles.headerRow}>
            <View style={styles.colId}>
                <Text style={styles.headerText}>ID</Text>
            </View>
            <View style={styles.colName}>
                <Text style={styles.headerText}>CLIENTE</Text>
            </View>
            <View style={styles.colEmail}>
                <Text style={styles.headerText}>E-MAIL</Text>
            </View>
            <View style={styles.colPhone}>
                <Text style={styles.headerText}>TELEFONE</Text>
            </View>
            <View style={styles.colAddress}>
                <Text style={styles.headerText}>ENDEREÇO</Text>
            </View>
            <View style={styles.colActions}>
                <Text style={[styles.headerText, styles.headerTextRight]}>AÇÕES</Text>
            </View>
        </View>
    );
}

export function ClientTableRow({
    cliente,
    iconDetails,
    iconEdit,
    iconDelete,
    index = 0,
}: ClientCardProps) {
    const isEven = index % 2 === 0;

    return (
        <View style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}>
            {/* ID */}
            <View style={styles.colId}>
                <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>#{cliente.id}</Text>
                </View>
            </View>

            {/* Cliente (Avatar + Nome) */}
            <View style={styles.colName}>
                <View style={styles.clientInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(cliente.nome)}
                        </Text>
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={styles.clientName} numberOfLines={1}>
                            {cliente.nome}
                        </Text>
                        <Text style={styles.clientSubtitle}>Cliente cadastrado</Text>
                    </View>
                </View>
            </View>

            {/* E-mail */}
            <View style={styles.colEmail}>
                <View style={styles.iconTextRow}>
                    <Ionicons name="mail-outline" size={13} color="#64748B" />
                    <Text style={styles.cellText} numberOfLines={1}>
                        {cliente.email || "Sem e-mail"}
                    </Text>
                </View>
            </View>

            {/* Telefone */}
            <View style={styles.colPhone}>
                <View style={styles.iconTextRow}>
                    <Ionicons name="call-outline" size={13} color="#64748B" />
                    <Text style={styles.cellText} numberOfLines={1}>
                        {formatPhone(cliente.telefone)}
                    </Text>
                </View>
            </View>

            {/* Endereço */}
            <View style={styles.colAddress}>
                <View style={styles.iconTextRow}>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <Text style={styles.cellText} numberOfLines={1}>
                        {cliente.endereco || "Não informado"}
                    </Text>
                </View>
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
                        <Ionicons name="eye-outline" size={15} color="#0B4F6C" />
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
                        <Ionicons name="pencil-outline" size={15} color="#0E7490" />
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
                            <Ionicons name="trash-outline" size={15} color="#A74E3C" />
                            <Text style={styles.deleteBtnText}>Excluir</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

// Exportamos ClientCard como alias para ClientTableRow para compatibilidade total
export const ClientCard = ClientTableRow;

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F1F5",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1.5,
        borderColor: "#CFDDE6",
        minWidth: 860,
    },
    headerText: {
        fontSize: 11,
        fontFamily: "WorksansBold",
        color: "#0B4F6C",
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    headerTextRight: {
        textAlign: "right",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#E2EBF0",
        minWidth: 860,
    },
    rowEven: {
        backgroundColor: "#FFFFFF",
    },
    rowOdd: {
        backgroundColor: "#F8FAFC",
    },

    // Colunas
    colId: {
        width: 70,
        justifyContent: "center",
    },
    colName: {
        flex: 1.5,
        minWidth: 180,
        justifyContent: "center",
    },
    colEmail: {
        flex: 1.3,
        minWidth: 150,
        justifyContent: "center",
    },
    colPhone: {
        width: 140,
        justifyContent: "center",
    },
    colAddress: {
        flex: 1.5,
        minWidth: 170,
        justifyContent: "center",
    },
    colActions: {
        width: 220,
        alignItems: "flex-end",
        justifyContent: "center",
    },

    // Células e textos
    idBadge: {
        backgroundColor: "#E8F1F5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    idBadgeText: {
        fontSize: 12,
        fontFamily: "WorksansBold",
        color: "#0B4F6C",
    },
    clientInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#E8F1F5",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#CFDDE6",
    },
    avatarText: {
        color: "#0B4F6C",
        fontSize: 12,
        fontFamily: "WorksansBold",
    },
    nameContainer: {
        flex: 1,
    },
    clientName: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: "#0F172A",
    },
    clientSubtitle: {
        fontSize: 10,
        fontFamily: "WorksansRegular",
        color: "#64748B",
    },
    iconTextRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    cellText: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: "#334155",
        flex: 1,
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
        backgroundColor: "#E8F1F5",
        borderColor: "#CFDDE6",
    },
    detailsBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#0B4F6C",
    },
    editBtn: {
        backgroundColor: "#E0F2FE",
        borderColor: "#BAE6FD",
    },
    editBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#0E7490",
    },
    deleteBtn: {
        backgroundColor: "#FEE2E2",
        borderColor: "#FECACA",
    },
    deleteBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#A74E3C",
    },
});
