import { supabase } from "@/src/lib/supabase";
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
import { Material, getMaterialDescricao, getMaterialPreco } from "./MaterialsCard";
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

    const [material, setMaterial] = useState<Material | null>(null);
    const [nome, setNome] = useState("");
    const [preco, setPreco] = useState("");
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
            console.error("Erro ao carregar material:", error);
            setError("Não foi possível carregar o material.");
            setLoading(false);
            return;
        }

        const mat = data as Material;
        setMaterial(mat);
        setNome(mat.nome ?? "");
        setPreco(String(getMaterialPreco(mat)));
        setDescricao(getMaterialDescricao(mat));

        setLoading(false);
    }

    async function salvar() {
        if (!material) {
            return;
        }

        if (!nome.trim() || !preco.trim()) {
            setError("Preencha o nome e o preço do material.");
            return;
        }

        const precoNumero = Number(preco.trim().replace(",", "."));
        if (isNaN(precoNumero) || precoNumero < 0) {
            setError("Informe um preço válido.");
            return;
        }

        setSaving(true);
        setError("");

        // Tentar atualizar com "descrição" e "preco"
        let updateResult = await supabase
            .from("produtos")
            .update({
                nome: nome.trim(),
                "descrição": descricao.trim(),
                preco: precoNumero,
            })
            .eq("id", material.id);

        if (updateResult.error) {
            // Tentar com "descricao" sem acento
            updateResult = await supabase
                .from("produtos")
                .update({
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                    preco: precoNumero,
                })
                .eq("id", material.id);
        }

        if (updateResult.error) {
            // Tentar com "preço" com cedilha
            updateResult = await supabase
                .from("produtos")
                .update({
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                    "preço": precoNumero,
                })
                .eq("id", material.id);
        }

        if (updateResult.error) {
            console.error("Erro ao atualizar material:", updateResult.error);
            setError("Não foi possível salvar as alterações.");
            setSaving(false);
            return;
        }

        setMaterial({
            ...material,
            nome: nome.trim(),
            descricao: descricao.trim(),
            preco: precoNumero,
        });

        setSaving(false);
        Alert.alert("Sucesso", "Material atualizado com sucesso.");
        if (onSaveSuccess) {
            onSaveSuccess();
        }
    }

    if (loading) {
        return (
            <View style={[pagesStyles.card, styles.loading]}>
                <ActivityIndicator color="#79553D" />
                <Text style={pagesStyles.text}>Carregando material...</Text>
            </View>
        );
    }

    if (!material) {
        return (
            <View style={pagesStyles.card}>
                <Text style={pagesStyles.text}>
                    {error || "Material não encontrado."}
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
                    <Text style={pagesStyles.brand}>Materiais</Text>
                    <Text style={pagesStyles.title}>
                        Editar Material #{material.id}
                    </Text>
                </View>

                <View
                    style={[
                        styles.idBox,
                        isMobile && styles.idBoxMobile,
                    ]}
                >
                    <Text style={styles.idLabel}>ID do material</Text>
                    <Text style={styles.readOnlyValue}>{material.id}</Text>
                </View>
            </View>

            {/* CAMPOS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados do material</Text>

                <View style={styles.fields}>
                    {/* NOME */}
                    <View style={pagesStyles.field}>
                        <Text style={pagesStyles.textBold}>Nome do Material</Text>
                        <TextInput
                            value={nome}
                            onChangeText={setNome}
                            placeholder="Ex: Madeira Maciça"
                            placeholderTextColor="#8A8178"
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
                            placeholderTextColor="#8A8178"
                            keyboardType="decimal-pad"
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
                            placeholder="Descrição detalhada do material..."
                            placeholderTextColor="#8A8178"
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
                            <ActivityIndicator color="#FFFDF9" />
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
        backgroundColor: "#EFE9E2",
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
        paddingVertical: 2,
        fontSize: 16,
        color: "#65442F",
        fontWeight: "600",
    },
    section: {
        width: "100%",
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#DDD5CC",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#65442F",
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
