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
import { pagesStyles } from "./ScreensLayout";
import { Fornecedor } from "./SuppliersCard";

type SupplierEditProps = {
    idFornecedor: number;
    onSaveSuccess?: () => void;
};

export function EditSupplierCard({
    idFornecedor,
    onSaveSuccess,
}: SupplierEditProps) {
    const { isMobile, maxCardWidth } = useResponsive();

    const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
    const [nome, setNome] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [contato, setContato] = useState("");
    const [endereco, setEndereco] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

    useEffect(() => {
        carregarFornecedor();
    }, [idFornecedor]);

    function formatarCnpj(valor: string) {
        const digitos = valor.replace(/\D/g, "").slice(0, 14);
        if (digitos.length <= 2) return digitos;
        if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
        if (digitos.length <= 8) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
        if (digitos.length <= 12) {
            return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
        }
        return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
    }

    function formatarTelefone(valor: string) {
        const digitos = valor.replace(/\D/g, "").slice(0, 11);
        if (digitos.length <= 2) return digitos;
        if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
        if (digitos.length <= 10) {
            return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
        }
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    }

    async function carregarFornecedor() {
        setLoading(true);
        setError("");
        setMensagemSucesso(null);

        const { data, error } = await supabase
            .from("fornecedores")
            .select("*")
            .eq("id", idFornecedor)
            .single();

        if (error) {
            console.error("Erro ao carregar fornecedor:", error);
            setError("Não foi possível carregar os dados do fornecedor.");
            setLoading(false);
            return;
        }

        const forn = data as Fornecedor;
        setFornecedor(forn);
        setNome(forn.nome ?? "");
        setCnpj(forn.cnpj ? formatarCnpj(forn.cnpj) : "");
        setEmail(forn.email ?? "");
        setTelefone(forn.telefone ? formatarTelefone(String(forn.telefone)) : "");
        setContato(forn.contato ?? "");
        setEndereco(forn.endereco ?? "");

        setLoading(false);
    }

    async function salvar() {
        if (!fornecedor) return;

        setError("");
        setMensagemSucesso(null);

        if (!nome.trim()) {
            setError("O nome / razão social do fornecedor é obrigatório.");
            return;
        }

        if (email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                setError("Informe um endereço de e-mail válido.");
                return;
            }
        }

        setSaving(true);

        const { error: updateError } = await supabase
            .from("fornecedores")
            .update({
                nome: nome.trim(),
                cnpj: cnpj.trim() || null,
                email: email.trim() ? email.trim().toLowerCase() : null,
                telefone: telefone.trim() || null,
                contato: contato.trim() || null,
                endereco: endereco.trim() || null,
            })
            .eq("id", fornecedor.id);

        setSaving(false);

        if (updateError) {
            console.error("Erro ao atualizar fornecedor:", updateError);
            setError("Não foi possível salvar as alterações.");
            return;
        }

        setMensagemSucesso("Fornecedor atualizado com sucesso!");
        Alert.alert("Sucesso", "Fornecedor atualizado com sucesso.");

        if (onSaveSuccess) {
            onSaveSuccess();
        }
    }

    if (loading) {
        return (
            <View style={[pagesStyles.card, styles.loading]}>
                <ActivityIndicator color="#0B4F6C" />
                <Text style={pagesStyles.text}>Carregando dados do fornecedor...</Text>
            </View>
        );
    }

    if (!fornecedor) {
        return (
            <View style={pagesStyles.card}>
                <Text style={pagesStyles.text}>
                    {error || "Fornecedor não encontrado."}
                </Text>
            </View>
        );
    }

    return (
        <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
            {/* Header */}
            <View
                style={[
                    styles.header,
                    isMobile && styles.headerMobile,
                ]}
            >
                <View style={styles.headerTitle}>
                    <Text style={pagesStyles.brand}>FORNECEDORES</Text>
                    <Text style={pagesStyles.title}>
                        Editar Fornecedor #{fornecedor.id}
                    </Text>
                </View>

                <View
                    style={[
                        styles.idBox,
                        isMobile && styles.idBoxMobile,
                    ]}
                >
                    <Text style={styles.idLabel}>ID do Fornecedor</Text>
                    <Text style={styles.readOnlyValue}>{fornecedor.id}</Text>
                </View>
            </View>

            {/* Formulário */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados cadastrais</Text>

                <View style={styles.fields}>
                    {/* NOME / RAZÃO SOCIAL */}
                    <View style={pagesStyles.field}>
                        <Text style={pagesStyles.textBold}>Razão Social / Nome Fantasia *</Text>
                        <TextInput
                            value={nome}
                            onChangeText={(val) => {
                                setNome(val);
                                setError("");
                            }}
                            placeholder="Ex: Madeireira São Paulo Ltda."
                            placeholderTextColor="#64748B"
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* CNPJ */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.textBold}>CNPJ</Text>
                        <TextInput
                            value={cnpj}
                            onChangeText={(val) => {
                                setCnpj(formatarCnpj(val));
                                setError("");
                            }}
                            placeholder="Ex: 00.000.000/0001-00"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* TELEFONE */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.textBold}>Telefone / WhatsApp</Text>
                        <TextInput
                            value={telefone}
                            onChangeText={(val) => {
                                setTelefone(formatarTelefone(val));
                                setError("");
                            }}
                            placeholder="Ex: (11) 98765-4321"
                            placeholderTextColor="#64748B"
                            keyboardType="phone-pad"
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* E-MAIL */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.textBold}>E-mail Comercial</Text>
                        <TextInput
                            value={email}
                            onChangeText={(val) => {
                                setEmail(val);
                                setError("");
                            }}
                            placeholder="Ex: vendas@fornecedor.com.br"
                            placeholderTextColor="#64748B"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* CONTATO / REPRESENTANTE */}
                    <View style={[styles.field, isMobile && styles.fieldMobile]}>
                        <Text style={pagesStyles.textBold}>Pessoa de Contato / Vendedor</Text>
                        <TextInput
                            value={contato}
                            onChangeText={(val) => {
                                setContato(val);
                                setError("");
                            }}
                            placeholder="Ex: Carlos Oliveira"
                            placeholderTextColor="#64748B"
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* ENDEREÇO */}
                    <View style={[pagesStyles.field, styles.addressField]}>
                        <Text style={pagesStyles.textBold}>Endereço Completo</Text>
                        <TextInput
                            value={endereco}
                            onChangeText={(val) => {
                                setEndereco(val);
                                setError("");
                            }}
                            placeholder="Ex: Rod. Anhangüera, Km 45 - Jundiaí, SP"
                            placeholderTextColor="#64748B"
                            multiline
                            numberOfLines={3}
                            style={[pagesStyles.input, styles.textArea]}
                        />
                    </View>
                </View>
            </View>

            {/* FEEDBACK DE ERRO */}
            {error ? (
                <View style={[pagesStyles.error, styles.error]}>
                    <Text style={pagesStyles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* FEEDBACK DE SUCESSO */}
            {mensagemSucesso ? (
                <View style={styles.successBox}>
                    <Text style={styles.successText}>{mensagemSucesso}</Text>
                </View>
            ) : null}

            {/* BOTÃO SALVAR */}
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
        backgroundColor: "#E0EAF0",
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
        color: "#0B4F6C",
        fontWeight: "600",
    },
    section: {
        width: "100%",
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#CFDDE6",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0B4F6C",
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
    addressField: {
        flexBasis: "100%",
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    loading: {
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 180,
    },
    error: {
        marginTop: 18,
    },
    successBox: {
        marginTop: 18,
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
    },
    successText: {
        fontSize: 14,
        fontFamily: "WorksansMedium",
        color: "#166534",
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
