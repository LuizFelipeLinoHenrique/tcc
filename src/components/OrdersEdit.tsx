import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import useResponsive from "@/src/hooks/useResponsive";
import { AnimatedButton } from "./AnimatedButton";
import { pagesStyles } from "./ScreensLayout";

type EditOrderCardProps = {
    idPedido: number;
};

type Order = {
    id: number;
    data_pedido: string;
    id_cliente: number;
    qtde: number;
    id_produto: number;
    status: string;
};

const STATUS_OPTIONS = [
    { value: "P", label: "Pendente", icon: "time-outline" as const, color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
    { value: "E", label: "Entregue", icon: "checkmark-circle-outline" as const, color: "#166534", bg: "#DCFCE7", border: "#BBF7D0" },
    { value: "C", label: "Cancelado", icon: "close-circle-outline" as const, color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
];

export function EditOrderCard({
    idPedido,
}: EditOrderCardProps) {
    const { isMobile, maxCardWidth } = useResponsive();

    const [pedido, setPedido] = useState<Order | null>(null);
    const [idCliente, setIdCliente] = useState("");
    const [qtde, setQtde] = useState("");
    const [idProduto, setIdProduto] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        buscarPedido();
    }, [idPedido]);

    async function buscarPedido() {
        setLoading(true);

        const { data, error } = await supabase
            .from("pedidos")
            .select("*")
            .eq("id", idPedido)
            .single();

        if (error) {
            setErrorMessage("Não foi possível carregar os dados do pedido.");
            console.error("Erro ao buscar pedido:", error);
            setLoading(false);
            return;
        }

        setPedido(data);
        setIdCliente(String(data.id_cliente ?? ""));
        setQtde(String(data.qtde ?? ""));
        setIdProduto(String(data.id_produto ?? ""));
        setStatus(data.status ?? "");
        setLoading(false);
    }

    async function salvarAlteracoes() {
        if (!pedido) {
            return;
        }

        if (!idCliente.trim() || !idProduto.trim() || !qtde.trim()) {
            setErrorMessage("Preencha todos os campos obrigatórios.");
            return;
        }

        setSaving(true);
        setErrorMessage("");

        const { error } = await supabase
            .from("pedidos")
            .update({
                id_cliente: Number(idCliente),
                qtde: Number(qtde),
                id_produto: Number(idProduto),
                status: status,
            })
            .eq("id", idPedido);

        setSaving(false);

        if (error) {
            console.error("Erro ao atualizar pedido:", error);
            Alert.alert("Erro", "Não foi possível salvar as alterações.");
            return;
        }

        Alert.alert("Sucesso", "Pedido atualizado com sucesso.");
        buscarPedido();
    }

    if (loading) {
        return (
            <View style={[pagesStyles.card, styles.loadingCard, { maxWidth: maxCardWidth }]}>
                <ActivityIndicator color="#79553D" size="large" />
                <Text style={styles.loadingText}>Carregando pedido...</Text>
            </View>
        );
    }

    if (!pedido) {
        return (
            <View style={[pagesStyles.card, styles.emptyCard, { maxWidth: maxCardWidth }]}>
                <Ionicons name="alert-circle-outline" size={36} color="#DC2626" />
                <Text style={styles.emptyTitle}>Pedido não encontrado</Text>
                <Text style={pagesStyles.description}>
                    O pedido #{idPedido} não existe ou foi excluído.
                </Text>
            </View>
        );
    }

    return (
        <View style={[pagesStyles.card, styles.card, { maxWidth: maxCardWidth }]}>
            {/* CABEÇALHO */}
            <View style={[styles.header, isMobile && styles.headerMobile]}>
                <View style={styles.headerTitle}>
                    <Text style={pagesStyles.brand}>GESTÃO DE PEDIDOS</Text>
                    <Text style={[pagesStyles.title, styles.title]}>
                        Editar Pedido #{pedido.id}
                    </Text>
                    <Text style={pagesStyles.description}>
                        Atualize os dados e o status do pedido selecionado
                    </Text>
                </View>

                <View style={styles.headerBadges}>
                    <View style={styles.idBadge}>
                        <Ionicons name="receipt-outline" size={14} color="#9A6540" />
                        <Text style={styles.idBadgeText}>#{pedido.id}</Text>
                    </View>

                    <View style={styles.dateBox}>
                        <Ionicons name="calendar-outline" size={13} color="#6E655B" />
                        <Text style={styles.dateText}>{pedido.data_pedido}</Text>
                    </View>
                </View>
            </View>

            {/* SELEÇÃO DE STATUS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="flag-outline" size={16} color="#79553D" />
                    <Text style={styles.sectionTitle}>Status do Pedido</Text>
                </View>

                <View style={styles.statusChipsContainer}>
                    {STATUS_OPTIONS.map((opt) => {
                        const isSelected = status.toUpperCase() === opt.value;
                        return (
                            <Pressable
                                key={opt.value}
                                onPress={() => setStatus(opt.value)}
                                style={[
                                    styles.statusChip,
                                    isSelected && {
                                        backgroundColor: opt.bg,
                                        borderColor: opt.border,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={opt.icon}
                                    size={16}
                                    color={isSelected ? opt.color : "#6E655B"}
                                />
                                <Text
                                    style={[
                                        styles.statusChipText,
                                        isSelected && { color: opt.color, fontWeight: "700" },
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* CAMPOS DO PEDIDO */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="cube-outline" size={16} color="#79553D" />
                    <Text style={styles.sectionTitle}>Dados do Pedido</Text>
                </View>

                <View style={styles.fields}>
                    {/* ID CLIENTE */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.label}>ID DO CLIENTE</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color="#8A8178" style={styles.inputIcon} />
                            <TextInput
                                value={idCliente}
                                onChangeText={setIdCliente}
                                keyboardType="numeric"
                                style={styles.input}
                                placeholder="Ex: 1"
                                placeholderTextColor="#A59D94"
                            />
                        </View>
                    </View>

                    {/* ID PRODUTO */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.label}>ID DO PRODUTO</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="pricetag-outline" size={18} color="#8A8178" style={styles.inputIcon} />
                            <TextInput
                                value={idProduto}
                                onChangeText={setIdProduto}
                                keyboardType="numeric"
                                style={styles.input}
                                placeholder="Ex: 10"
                                placeholderTextColor="#A59D94"
                            />
                        </View>
                    </View>

                    {/* QUANTIDADE */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.label}>QUANTIDADE</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="layers-outline" size={18} color="#8A8178" style={styles.inputIcon} />
                            <TextInput
                                value={qtde}
                                onChangeText={setQtde}
                                keyboardType="numeric"
                                style={styles.input}
                                placeholder="Ex: 5"
                                placeholderTextColor="#A59D94"
                            />
                        </View>
                    </View>

                    {/* VALOR MANUAL DO STATUS (SE NÃO FOR P/E/C) */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.label}>CÓDIGO DO STATUS</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="key-outline" size={18} color="#8A8178" style={styles.inputIcon} />
                            <TextInput
                                value={status}
                                onChangeText={setStatus}
                                style={styles.input}
                                placeholder="P, E ou C"
                                placeholderTextColor="#A59D94"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* ERRO */}
            {errorMessage ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ) : null}

            {/* BOTÃO */}
            <View style={[styles.buttonContainer, isMobile && styles.buttonContainerMobile]}>
                <AnimatedButton
                    title={
                        saving ? (
                            <ActivityIndicator color="#FFFDF9" size="small" />
                        ) : (
                            "Salvar Alterações"
                        )
                    }
                    stylesPressable={pagesStyles.primaryButton}
                    stylesText={pagesStyles.primaryButtonText}
                    onPress={salvarAlteracoes}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
        alignSelf: "center",
    },
    header: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#EAE4DC",
    },
    headerMobile: {
        flexDirection: "column",
        alignItems: "stretch",
        gap: 12,
    },
    headerTitle: {
        flex: 1,
    },
    title: {
        marginVertical: 4,
        marginBottom: 2,
    },
    headerBadges: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    idBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#F4EDE6",
        borderWidth: 1,
        borderColor: "#E3D5C8",
    },
    idBadgeText: {
        fontSize: 13,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    dateBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#F7F5F0",
        borderWidth: 1,
        borderColor: "#E8E3DA",
    },
    dateText: {
        fontSize: 12,
        fontFamily: "WorksansMedium",
        color: "#6E655B",
    },
    section: {
        width: "100%",
        marginTop: 22,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "WorksansSemiBold",
        color: "#2C2520",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statusChipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    statusChip: {
        flex: 1,
        minWidth: 100,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#DDD5CC",
        backgroundColor: "#FAF8F5",
    },
    statusChipText: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: "#6E655B",
    },
    fields: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    field: {
        flexGrow: 1,
        flexBasis: "47%",
        minWidth: 180,
        gap: 6,
    },
    fieldMobile: {
        flexBasis: "100%",
        minWidth: 0,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FAF8F5",
        borderWidth: 1,
        borderColor: "#DCD4C7",
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        minHeight: 46,
        fontSize: 15,
        fontFamily: "WorksansRegular",
        color: "#2C2520",
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: "#FEF2F2",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    errorText: {
        flex: 1,
        color: "#B91C1C",
        fontSize: 13,
        fontFamily: "WorksansMedium",
    },
    buttonContainer: {
        marginTop: 26,
        alignItems: "flex-end",
    },
    buttonContainerMobile: {
        alignItems: "stretch",
    },
    loadingCard: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 50,
        gap: 12,
        alignSelf: "center",
    },
    loadingText: {
        fontSize: 14,
        fontFamily: "WorksansMedium",
        color: "#6E655B",
    },
    emptyCard: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        alignSelf: "center",
    },
    emptyTitle: {
        fontSize: 17,
        fontFamily: "WorksansBold",
        color: "#2C2520",
        marginTop: 10,
        marginBottom: 4,
    },
});