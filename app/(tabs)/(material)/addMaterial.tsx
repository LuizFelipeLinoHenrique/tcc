import { Colors } from "@/src/theme/colors";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AnimatedButton } from "@/src/components/AnimatedButton";
import { PagesLayout, pagesStyles } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";

export default function AddMaterial() {
    const { maxCardWidth } = useResponsive();

    const [nome, setNome] = useState("");
    const [preco, setPreco] = useState("");
    const [descricao, setDescricao] = useState("");

    const [erro, setErro] = useState<string | null>(null);
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function handlePrecoChange(valor: string) {
        // Permite números, vírgula e ponto
        const formatado = valor.replace(/[^0-9.,]/g, "");
        setPreco(formatado);
        setErro(null);
        setMensagemSucesso(null);
    }

    async function handleCadastrar() {
        setErro(null);
        setMensagemSucesso(null);

        if (!nome.trim()) {
            setErro("Informe o nome do material.");
            return;
        }

        if (!preco.trim()) {
            setErro("Informe o preço do material.");
            return;
        }

        const precoNumerico = Number(preco.trim().replace(",", "."));
        if (isNaN(precoNumerico) || precoNumerico <= 0) {
            setErro("Informe um preço unitário válido maior que zero.");
            return;
        }

        setLoading(true);

        // Tentativa 1: Coluna "descrição" e "preco"
        let { data, error } = await supabase
            .from("produtos")
            .insert({
                nome: nome.trim(),
                "descrição": descricao.trim(),
                preco: precoNumerico,
            })
            .select()
            .single();

        // Tentativa 2: Coluna "descricao" sem acento
        if (error) {
            const retry = await supabase
                .from("produtos")
                .insert({
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                    preco: precoNumerico,
                })
                .select()
                .single();

            data = retry.data;
            error = retry.error;
        }

        // Tentativa 3: Coluna "preço" com cedilha
        if (error) {
            const retry = await supabase
                .from("produtos")
                .insert({
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                    "preço": precoNumerico,
                })
                .select()
                .single();

            data = retry.data;
            error = retry.error;
        }

        setLoading(false);

        if (error) {
            console.error("Erro ao cadastrar material:", error);
            setErro("Não foi possível cadastrar o material. Tente novamente.");
            return;
        }

        if (data) {
            setMensagemSucesso(`Material "${data.nome}" cadastrado com sucesso! (ID: #${data.id})`);
            setNome("");
            setPreco("");
            setDescricao("");
        }
    }

    const formPreenchido =
        nome.trim().length > 0 &&
        preco.trim().length > 0 &&
        !loading;

    return (
        <PagesLayout scroll={true} scrollContent={{ paddingVertical: 20 }}>
            <View style={styles.container}>
                <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    {/* CABEÇALHO */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="layers" size={24} color={Colors.hex0B4F6C} />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={pagesStyles.brand}>CADASTRO DE MATERIAIS</Text>
                            <Text style={[pagesStyles.title, styles.titleText]}>
                                Novo Material
                            </Text>
                            <Text style={pagesStyles.description}>
                                Cadastre um novo produto/material com suas informações e valor
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.formContainer}>
                        {/* NOME DO MATERIAL */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>NOME DO MATERIAL</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="cube-outline"
                                    size={18}
                                    color={Colors.hex64748B}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={nome}
                                    onChangeText={(val) => {
                                        setNome(val);
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: Madeira Maciça de Ipê"
                                    placeholderTextColor={Colors.hex94A3B8}
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* PREÇO UNITÁRIO */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>PREÇO UNITÁRIO (R$)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="pricetag-outline"
                                    size={18}
                                    color={Colors.hex64748B}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={preco}
                                    onChangeText={handlePrecoChange}
                                    placeholder="Ex: 149.90 ou 149,90"
                                    placeholderTextColor={Colors.hex94A3B8}
                                    keyboardType="decimal-pad"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* DESCRIÇÃO */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>DESCRIÇÃO</Text>
                            <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={18}
                                    color={Colors.hex64748B}
                                    style={[styles.inputIcon, styles.inputIconMultiline]}
                                />
                                <TextInput
                                    value={descricao}
                                    onChangeText={(val) => {
                                        setDescricao(val);
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: Peça aparelhada de madeira de alta densidade e resistência..."
                                    placeholderTextColor={Colors.hex94A3B8}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    editable={!loading}
                                    style={[styles.input, styles.textArea]}
                                />
                            </View>
                        </View>

                        {/* MENSAGEM DE ERRO */}
                        {erro && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={18} color={Colors.hexB91C1C} />
                                <Text style={styles.errorBoxText}>{erro}</Text>
                            </View>
                        )}

                        {/* MENSAGEM DE SUCESSO */}
                        {mensagemSucesso && (
                            <View style={styles.successBox}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.hex166534} />
                                <Text style={styles.successBoxText}>{mensagemSucesso}</Text>
                            </View>
                        )}

                        {/* BOTÃO CADASTRAR */}
                        <AnimatedButton
                            stylesPressable={[
                                pagesStyles.primaryButton,
                                !formPreenchido && styles.buttonDisabled,
                            ]}
                            stylesText={pagesStyles.primaryButtonText}
                            onPress={handleCadastrar}
                            disabled={!formPreenchido}
                            title={
                                loading ? (
                                    <ActivityIndicator size="small" color={Colors.hexFFFDF9} />
                                ) : (
                                    "Cadastrar Material"
                                )
                            }
                        />
                    </View>
                </View>
            </View>
        </PagesLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.hexE8F1F5,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    headerTextContainer: {
        flex: 1,
    },
    titleText: {
        marginVertical: 2,
        marginBottom: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.hexDDE8EF,
        marginVertical: 20,
    },
    formContainer: {
        gap: 18,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.hexF8FAFC,
        borderWidth: 1,
        borderColor: Colors.hexCFDDE6,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputWrapperMultiline: {
        alignItems: "flex-start",
        paddingVertical: 10,
    },
    inputIcon: {
        marginRight: 8,
    },
    inputIconMultiline: {
        marginTop: 2,
    },
    input: {
        flex: 1,
        minHeight: 46,
        fontSize: 15,
        fontFamily: "WorksansRegular",
        color: Colors.hex0F172A,
    },
    textArea: {
        minHeight: 80,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.hexFEF2F2,
        borderWidth: 1,
        borderColor: Colors.hexFECACA,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },
    errorBoxText: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: Colors.hexB91C1C,
        flex: 1,
    },
    successBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: Colors.hexF0FDF4,
        borderWidth: 1,
        borderColor: Colors.hexBBF7D0,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
    },
    successBoxText: {
        fontSize: 14,
        fontFamily: "WorksansMedium",
        color: Colors.hex166534,
        flex: 1,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
