import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type Material = {
    id: number;
    nome: string;
    descricao?: string;
    descrição?: string;
    preco?: number;
    preço?: number;
};

export type MaterialCardProps = {
    material: Material;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    index?: number;
};

export function getMaterialDescricao(m: Material): string {
    return m.descricao ?? m.descrição ?? "";
}

export function getMaterialPreco(m: Material): number {
    return Number(m.preco ?? m.preço ?? 0);
}

export function formatMoney(value: number): string {
    return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

export function MaterialTableHeader() {
    return (
        <View style={styles.headerRow}>
            <View style={styles.colId}>
                <Text style={styles.headerText}>ID</Text>
            </View>
            <View style={styles.colName}>
                <Text style={styles.headerText}>MATERIAL</Text>
            </View>
            <View style={styles.colPrice}>
                <Text style={styles.headerText}>PREÇO UNITÁRIO</Text>
            </View>
            <View style={styles.colDesc}>
                <Text style={styles.headerText}>DESCRIÇÃO</Text>
            </View>
            <View style={styles.colActions}>
                <Text style={[styles.headerText, styles.headerTextRight]}>AÇÕES</Text>
            </View>
        </View>
    );
}

export function MaterialTableRow({
    material,
    iconDetails,
    iconEdit,
    iconDelete,
    index = 0,
}: MaterialCardProps) {
    const isEven = index % 2 === 0;
    const descricao = getMaterialDescricao(material);
    const preco = getMaterialPreco(material);

    return (
        <View style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}>
            {/* ID */}
            <View style={styles.colId}>
                <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>#{material.id}</Text>
                </View>
            </View>

            {/* Material */}
            <View style={styles.colName}>
                <View style={styles.materialInfo}>
                    <View style={styles.materialIconBox}>
                        <Ionicons name="layers-outline" size={17} color="#0B4F6C" />
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={styles.materialName} numberOfLines={1}>
                            {material.nome}
                        </Text>
                        <Text style={styles.materialSubtitle}>Item de catálogo</Text>
                    </View>
                </View>
            </View>

            {/* Preço */}
            <View style={styles.colPrice}>
                <View style={styles.priceBadge}>
                    <Ionicons name="pricetag-outline" size={12} color="#0E7490" />
                    <Text style={styles.priceText}>{formatMoney(preco)}</Text>
                </View>
            </View>

            {/* Descrição */}
            <View style={styles.colDesc}>
                <Text style={styles.descText} numberOfLines={2}>
                    {descricao ? descricao : "Sem descrição informada"}
                </Text>
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

// Exportamos MaterialCard como alias para MaterialTableRow para compatibilidade total
export const MaterialCard = MaterialTableRow;

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F1F5",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1.5,
        borderColor: "#CFDDE6",
        minWidth: 840,
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
        minWidth: 840,
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
    colPrice: {
        width: 140,
        justifyContent: "center",
    },
    colDesc: {
        flex: 2,
        minWidth: 200,
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
    materialInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    materialIconBox: {
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
    materialName: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: "#0F172A",
    },
    materialSubtitle: {
        fontSize: 10,
        fontFamily: "WorksansRegular",
        color: "#64748B",
    },
    priceBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#E0F2FE",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: "#BAE6FD",
    },
    priceText: {
        fontSize: 12,
        fontFamily: "WorksansBold",
        color: "#0369A1",
    },
    descText: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: "#475569",
        lineHeight: 17,
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
