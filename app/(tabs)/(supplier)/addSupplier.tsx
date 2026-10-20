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

export default function AddSupplier() {
    const { maxCardWidth } = useResponsive();

    const [nome, setNome] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [contato, setContato] = useState("");
    const [endereco, setEndereco] = useState("");

    const [erro, setErro] = useState<string | null>(null);
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

    async function handleCadastrar() {
        setErro(null);
        setMensagemSucesso(null);

        if (!nome.trim()) {
            setErro("Informe o nome ou razão social do fornecedor.");
            return;
        }

        if (email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                setErro("Informe um endereço de e-mail válido.");
                return;
            }
        }

        setLoading(true);

        const { data, error } = await supabase
            .from("fornecedores")
            .insert({
                nome: nome.trim(),
                cnpj: cnpj.trim() || null,
                email: email.trim() ? email.trim().toLowerCase() : null,
                telefone: telefone.trim() || null,
                contato: contato.trim() || null,
                endereco: endereco.trim() || null,
            })
            .select()
            .single();

        setLoading(false);

        if (error) {
            console.error("Erro ao cadastrar fornecedor:", error);
            setErro("Não foi possível cadastrar o fornecedor. Tente novamente.");
            return;
        }

        if (data) {
            setMensagemSucesso(`Fornecedor "${data.nome}" cadastrado com sucesso! (ID: #${data.id})`);
            setNome("");
            setCnpj("");
            setEmail("");
            setTelefone("");
            setContato("");
            setEndereco("");
        }
    }

    const formPreenchido = nome.trim().length > 0 && !loading;

    return (
        <PagesLayout scroll={true} scrollContent={{ paddingVertical: 20 }}>
            <View style={styles.container}>
                <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    {/* CABEÇALHO */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="business" size={24} color="#79553D" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={pagesStyles.brand}>CADASTRO DE FORNECEDORES</Text>
                            <Text style={[pagesStyles.title, styles.titleText]}>
                                Novo Fornecedor
                            </Text>
                            <Text style={pagesStyles.description}>
                                Cadastre um novo fornecedor de materiais, insumos ou serviços
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.formContainer}>
                        {/* RAZÃO SOCIAL / NOME */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>NOME / RAZÃO SOCIAL *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="business-outline"
                                    size={18}
                                    color="#8A8178"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={nome}
                                    onChangeText={(val) => {
                                        setNome(val);
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: Madeireira Central Ltda."
                                    placeholderTextColor="#A59D94"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* CNPJ */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>CNPJ</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="card-outline"
                                    size={18}
                                    color="#8A8178"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={cnpj}
                                    onChangeText={(val) => {
                                        setCnpj(formatarCnpj(val));
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: 00.000.000/0001-00"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="numeric"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* TELEFONE / WHATSAPP */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>TELEFONE / WHATSAPP</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="call-outline"
                                    size={18}
                                    color="#8A8178"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={telefone}
                                    onChangeText={(val) => {
                                        setTelefone(formatarTelefone(val));
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: (11) 98765-4321"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* E-MAIL */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>E-MAIL COMERCIAL</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color="#8A8178"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={email}
                                    onChangeText={(val) => {
                                        setEmail(val);
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: contato@fornecedor.com.br"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* CONTATO / REPRESENTANTE */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>PESSOA DE CONTATO / VENDEDOR</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="person-outline"
                                    size={18}
                                    color="#8A8178"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={contato}
                                    onChangeText={(val) => {
                                        setContato(val);
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: Roberto Alves (Vendas)"
                                    placeholderTextColor="#A59D94"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* ENDEREÇO */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>ENDEREÇO</Text>
                            <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                                <Ionicons
                                    name="location-outline"
                                    size={18}
                                    color="#8A8178"
                                    style={[styles.inputIcon, styles.inputIconMultiline]}
                                />
                                <TextInput
                                    value={endereco}
                                    onChangeText={(val) => {
                                        setEndereco(val);
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: Av. das Indústrias, 500 - Galpão 3 - São Paulo, SP"
                                    placeholderTextColor="#A59D94"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    returnKeyType="done"
                                    editable={!loading}
                                    style={[styles.input, styles.textArea]}
                                />
                            </View>
                        </View>

                        {/* MENSAGEM DE ERRO */}
                        {erro && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                                <Text style={styles.errorBoxText}>{erro}</Text>
                            </View>
                        )}

                        {/* MENSAGEM DE SUCESSO */}
                        {mensagemSucesso && (
                            <View style={styles.successBox}>
                                <Ionicons name="checkmark-circle" size={20} color="#166534" />
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
                                    <ActivityIndicator size="small" color="#FFFDF9" />
                                ) : (
                                    "Cadastrar Fornecedor"
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
        backgroundColor: "#F4EDE6",
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
        backgroundColor: "#EAE4DC",
        marginVertical: 20,
    },
    formContainer: {
        gap: 18,
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
        color: "#2C2520",
    },
    textArea: {
        minHeight: 80,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },
    errorBoxText: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: "#B91C1C",
        flex: 1,
    },
    successBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
    },
    successBoxText: {
        fontSize: 14,
        fontFamily: "WorksansMedium",
        color: "#166534",
        flex: 1,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
