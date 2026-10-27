import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type Fornecedor = {
    id: number;
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string | number;
    endereco?: string;
    contato?: string;
};

export type SupplierCardProps = {
    fornecedor: Fornecedor;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    index?: number;
};

export function formatPhone(phone: number | string | undefined): string {
    if (!phone) return "Não informado";
    const s = String(phone).replace(/\D/g, "");
    if (s.length === 11) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 7)}-${s.substring(7)}`;
    }
    if (s.length === 10) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 6)}-${s.substring(6)}`;
    }
    return String(phone);
}

export function formatCnpj(cnpj: string | undefined): string {
    if (!cnpj) return "Não informado";
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length === 14) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    return cnpj;
}

export function SupplierTableHeader() {
    return (
        <View style={styles.headerRow}>
            <View style={styles.colId}>
                <Text style={styles.headerText}>ID</Text>
            </View>
            <View style={styles.colName}>
                <Text style={styles.headerText}>FORNECEDOR</Text>
            </View>
            <View style={styles.colCnpj}>
                <Text style={styles.headerText}>CNPJ</Text>
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

export function SupplierTableRow({
    fornecedor,
    iconDetails,
    iconEdit,
    iconDelete,
    index = 0,
}: SupplierCardProps) {
    const isEven = index % 2 === 0;

    return (
        <View style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}>
            {/* ID */}
            <View style={styles.colId}>
                <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>#{fornecedor.id}</Text>
                </View>
            </View>

            {/* Fornecedor (Ícone + Nome + Contato) */}
            <View style={styles.colName}>
                <View style={styles.supplierInfo}>
                    <View style={styles.supplierIconBox}>
                        <Ionicons name="business-outline" size={17} color="#0B4F6C" />
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={styles.supplierName} numberOfLines={1}>
                            {fornecedor.nome}
                        </Text>
                        <Text style={styles.supplierSubtitle}>
                            {fornecedor.contato ? `Contato: ${fornecedor.contato}` : "Fornecedor parceiro"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* CNPJ */}
            <View style={styles.colCnpj}>
                <View style={styles.iconTextRow}>
                    <Ionicons name="card-outline" size={13} color="#64748B" />
                    <Text style={styles.cellText} numberOfLines={1}>
                        {formatCnpj(fornecedor.cnpj)}
                    </Text>
                </View>
            </View>

            {/* E-mail */}
            <View style={styles.colEmail}>
                <View style={styles.iconTextRow}>
                    <Ionicons name="mail-outline" size={13} color="#64748B" />
                    <Text style={styles.cellText} numberOfLines={1}>
                        {fornecedor.email || "Não informado"}
                    </Text>
                </View>
            </View>

            {/* Telefone */}
            <View style={styles.colPhone}>
                <View style={styles.iconTextRow}>
                    <Ionicons name="call-outline" size={13} color="#64748B" />
                    <Text style={styles.cellText} numberOfLines={1}>
                        {formatPhone(fornecedor.telefone)}
                    </Text>
                </View>
            </View>

            {/* Endereço */}
            <View style={styles.colAddress}>
                <View style={styles.iconTextRow}>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <Text style={styles.cellText} numberOfLines={1}>
                        {fornecedor.endereco || "Não informado"}
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

// Exportamos SupplierCard como alias para SupplierTableRow para compatibilidade total
export const SupplierCard = SupplierTableRow;

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F1F5",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1.5,
        borderColor: "#CFDDE6",
        minWidth: 920,
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
        minWidth: 920,
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
    colCnpj: {
        width: 145,
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
    supplierInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    supplierIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#E8F1F5",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#CFDDE6",
    },
    nameContainer: {
        flex: 1,
    },
    supplierName: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: "#0F172A",
    },
    supplierSubtitle: {
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
