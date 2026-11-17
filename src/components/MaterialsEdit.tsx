import { Colors } from "@/src/theme/colors";
import { materialValues, recordError, updateRecord } from "@/src/lib/tableActions";
import { supabase } from "@/src/lib/supabase";
import { parseReadyStock, readyStockError, readyStockLabel } from "@/src/lib/productStock";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import useResponsive from "@/src/hooks/useResponsive";
import { AnimatedButton } from "./AnimatedButton";
import { Produto, getMaterialDescricao, getMaterialPreco } from "./MaterialsCard";
import { pagesStyles } from "./ScreensLayout";

type MaterialEditProps = {
    idMaterial: number;
    onSaveSuccess?: () => void;
};

export function EditMaterialCard({
    idMaterial,
    onSaveSuccess,
}: MaterialEditProps) {
    const { isMobile, maxCardWidth } = useResponsive();

    const [produto, setMaterial] = useState<Produto | null>(null);
    const [nome, setNome] = useState("");
    const [preco, setPreco] = useState("");
    const [quantidade, setQuantidade] = useState("0");
    const [descricao, setDescricao] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        carregarMaterial();
    }, [idMaterial]);

    async function carregarMaterial() {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
            .from("produtos")
            .select("*")
            .eq("id", idMaterial)
            .single();

        if (error) {
            console.error("Erro ao carregar produto:", error);
            setError("Não foi possível carregar o produto.");
            setLoading(false);
            return;
        }

        const mat = data as Produto;
        setMaterial(mat);
        setNome(mat.nome ?? "");
        setPreco(String(getMaterialPreco(mat)));
        setQuantidade(String(mat.quantidade_pronta_entrega ?? 0));
        setDescricao(getMaterialDescricao(mat));

        setLoading(false);
    }

    async function salvar() {
        if (!produto || saving) {
            return;
        }

        if (!nome.trim() || !preco.trim()) {
            setError("Preencha o nome e o preço do produto.");
            return;
        }

        const precoNumero = Number(preco.trim().replace(",", "."));
        if (!Number.isFinite(precoNumero) || precoNumero < 0) {
            setError("Informe um preço válido.");
            return;
        }

        const quantidadeProntaEntrega = parseReadyStock(quantidade);
        if (quantidadeProntaEntrega === null) {
            setError(readyStockError);
            return;
        }

        const values = {
            ...materialValues(produto, nome.trim(), descricao.trim(), precoNumero),
            quantidade_pronta_entrega: quantidadeProntaEntrega,
        };
        setSaving(true);
        setError("");

        try {
            await updateRecord("produtos", produto.id, values);
        } catch (cause) {
            setError(recordError(cause));
            return;
        } finally {
            setSaving(false);
        }

        setMaterial({ ...produto, ...values });

        setSaving(false);
        Alert.alert("Sucesso", "Produto atualizado com sucesso.");
        if (onSaveSuccess) {
            onSaveSuccess();
        }
    }

    if (loading) {
        return (
            <View style={[pagesStyles.card, styles.loading]}>
                <ActivityIndicator color={Colors.hex0B4F6C} />
                <Text style={pagesStyles.text}>Carregando produto...</Text>
            </View>
        );
    }

    if (!produto) {
        return (
            <View style={pagesStyles.card}>
                <Text style={pagesStyles.text}>
                    {error || "Produto não encontrado."}
                </Text>
            </View>
        );
    }

    return (
        <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
            <View
                style={[
                    styles.header,
                    isMobile && styles.headerMobile,
                ]}
            >
                <View style={styles.headerTitle}>
                    <Text style={pagesStyles.brand}>Produtos</Text>
                    <Text style={pagesStyles.title}>
                        Editar Produto #{produto.id}
                    </Text>
                </View>

                <View
                    style={[
                        styles.idBox,
                        isMobile && styles.idBoxMobile,
                    ]}
                >
                    <Text style={styles.idLabel}>ID do produto</Text>
                    <Text style={styles.readOnlyValue}>{produto.id}</Text>
                </View>
            </View>

            {/* CAMPOS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados do produto</Text>

                <View style={styles.fields}>
                    {/* NOME */}
                    <View style={pagesStyles.field}>
                        <Text style={pagesStyles.textBold}>Nome do Produto</Text>
                        <TextInput
                            value={nome}
                            onChangeText={setNome}
                            placeholder="Ex: Madeira Maciça"
                            placeholderTextColor={Colors.hex64748B}
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* PREÇO */}
                    <View
                        style={[
                            styles.field,
                            isMobile && styles.fieldMobile,
                        ]}
                    >
                        <Text style={pagesStyles.textBold}>Preço Unitário (R$)</Text>
                        <TextInput
                            value={preco}
                            onChangeText={setPreco}
                            placeholder="Ex: 49.90"
                            placeholderTextColor={Colors.hex64748B}
                            keyboardType="decimal-pad"
                            style={pagesStyles.input}
                        />
                    </View>

                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.textBold}>{readyStockLabel}</Text>
                        <TextInput
                            accessibilityLabel={readyStockLabel}
                            value={quantidade}
                            onChangeText={setQuantidade}
                            keyboardType="number-pad"
                            editable={!saving}
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* DESCRIÇÃO */}
                    <View
                        style={[
                            pagesStyles.field,
                            styles.descriptionField,
                        ]}
                    >
                        <Text style={pagesStyles.textBold}>Descrição</Text>
                        <TextInput
                            value={descricao}
                            onChangeText={setDescricao}
                            placeholder="Descrição detalhada do produto..."
                            placeholderTextColor={Colors.hex64748B}
                            multiline
                            numberOfLines={4}
                            style={[
                                pagesStyles.input,
                                { padding: 10 },
                                styles.textArea,
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* ERRO */}
            {error ? (
                <View style={[pagesStyles.error, styles.error]}>
                    <Text style={pagesStyles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* BOTÃO */}
            <View
                style={[
                    styles.buttonContainer,
                    isMobile && styles.buttonContainerMobile,
                ]}
            >
                <AnimatedButton
                    title={
                        saving ? (
                            <ActivityIndicator color={Colors.hexFFFDF9} />
                        ) : (
                            "Salvar Alterações"
                        )
                    }
                    stylesPressable={[
                        pagesStyles.primaryButton,
                        styles.saveButton,
                    ]}
                    stylesPressablePressed={pagesStyles.primaryButtonPressed}
                    stylesText={pagesStyles.primaryButtonText}
                    onPress={salvar}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
    },
    header: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 24,
        marginBottom: 8,
    },
    headerMobile: {
        flexDirection: "column",
        gap: 14,
    },
    headerTitle: {
        flex: 1,
        minWidth: 0,
    },
    idBox: {
        minWidth: 170,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.hexE0EAF0,
    },
    idBoxMobile: {
        width: "100%",
    },
    idLabel: {
        fontSize: 13,
        fontWeight: "600",
        opacity: 0.7,
        marginBottom: 2,
    },
    readOnlyValue: {
        paddingVertical: 6,
        fontSize: 16,
        color: Colors.hex0B4F6C,
        fontWeight: "600",
    },
    section: {
        width: "100%",
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.hexCFDDE6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.hex0B4F6C,
        marginBottom: 14,
    },
    fields: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    field: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 180,
        gap: 6,
    },
    fieldMobile: {
        flexBasis: "100%",
        minWidth: 0,
    },
    descriptionField: {
        flexBasis: "100%",
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    loading: {
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 180,
    },
    error: {
        marginTop: 20,
    },
    buttonContainer: {
        marginTop: 28,
        alignItems: "flex-end",
    },
    buttonContainerMobile: {
        alignItems: "stretch",
    },
    saveButton: {
        minWidth: 190,
    },
});
