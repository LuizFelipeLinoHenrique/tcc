import { Colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type Produto = {
    id: number;
    nome: string;
    descricao?: string;
    descrição?: string;
    preco?: number;
    preço?: number;
    quantidade_pronta_entrega?: number;
};

export type MaterialCardProps = {
    produto: Produto;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    index?: number;
};

export function getMaterialDescricao(m: Produto): string {
    return m.descricao ?? m.descrição ?? "";
}

export function getMaterialPreco(m: Produto): number {
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
            <View style={styles.colStock}>
                <Text style={styles.headerText}>PRONTA ENTREGA</Text>
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
    produto,
    iconDetails,
    iconEdit,
    iconDelete,
    index = 0,
}: MaterialCardProps) {
    const isEven = index % 2 === 0;
    const descricao = getMaterialDescricao(produto);
    const preco = getMaterialPreco(produto);

    return (
        <View style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}>
            {/* ID */}
            <View style={styles.colId}>
                <Text style={styles.idBadgeText}>#{produto.id}</Text>
            </View>

            {/* Produto */}
            <View style={styles.colName}>
                <View style={styles.materialInfo}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.materialName} numberOfLines={1}>
                            {produto.nome}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Preço */}
            <View style={styles.colPrice}>
                <Text style={styles.priceText}>{formatMoney(preco)}</Text>
            </View>

            <View style={styles.colStock}>
                <Text style={styles.descText}>{produto.quantidade_pronta_entrega ?? 0}</Text>
            </View>
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

// Exportamos MaterialCard como alias para MaterialTableRow para compatibilidade total
export const MaterialCard = MaterialTableRow;

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
        minWidth: 1076,
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
        minWidth: 1076,
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
        width: 220,
        flexShrink: 0,
        flexGrow: 1,
        justifyContent: "center",
    },
    colPrice: {
        width: 160,
        flexShrink: 0,
        justifyContent: "center",
    },
    colStock: {
        width: 135,
        flexShrink: 0,
        justifyContent: "center",
    },
    colDesc: {
        width: 181,
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
    materialInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    nameContainer: {
        flex: 1,
    },
    materialName: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0F172A,
    },
    priceText: {
        fontSize: 12,
        fontFamily: "WorksansBold",
        color: Colors.hex0369A1,
    },
    descText: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: Colors.hex475569,
        lineHeight: 17,
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
