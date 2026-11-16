import { Colors } from "@/src/theme/colors";
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
                <Text style={styles.idBadgeText}>#{cliente.id}</Text>
            </View>

            {/* Cliente */}
            <View style={styles.colName}>
                <View style={styles.clientInfo}>
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
                    <Text style={styles.cellText} numberOfLines={1}>
                        {cliente.email || "Sem e-mail"}
                    </Text>
                </View>
            </View>

            {/* Telefone */}
            <View style={styles.colPhone}>
                <View style={styles.iconTextRow}>
                    <Text style={styles.cellText} numberOfLines={1}>
                        {formatPhone(cliente.telefone)}
                    </Text>
                </View>
            </View>

            {/* Endereço */}
            <View style={styles.colAddress}>
                <View style={styles.iconTextRow}>
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

                    {iconDelete ? (
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

// Exportamos ClientCard como alias para ClientTableRow para compatibilidade total
export const ClientCard = ClientTableRow;

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.hexF8FAFC,
        paddingVertical: 12,
        paddingHorizontal: 24,
        columnGap: 24,
        borderBottomWidth: 1,
        borderColor: Colors.hexCFDDE6,
        minWidth: 1180,
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
        paddingVertical: 10,
        paddingHorizontal: 24,
        columnGap: 24,
        borderBottomWidth: 1,
        borderColor: Colors.hexE2EBF0,
        minWidth: 1180,
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
    colName: {
        width: 200,
        flexShrink: 0,
        flexGrow: 1,
        justifyContent: "center",
    },
    colEmail: {
        width: 220,
        flexShrink: 0,
        flexGrow: 1,
        justifyContent: "center",
    },
    colPhone: {
        width: 160,
        flexShrink: 0,
        justifyContent: "center",
    },
    colAddress: {
        width: 220,
        flexShrink: 0,
        flexGrow: 1,
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
    clientInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    nameContainer: {
        flex: 1,
    },
    clientName: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0F172A,
    },
    clientSubtitle: {
        fontSize: 10,
        fontFamily: "WorksansRegular",
        color: Colors.hex64748B,
    },
    iconTextRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    cellText: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: Colors.hex334155,
        flex: 1,
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
        backgroundColor: Colors.hexF8FAFC,
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
