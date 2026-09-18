import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

export default function AddClients() {
    const { maxCardWidth } = useResponsive();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [endereco, setEndereco] = useState("");

    const [erro, setErro] = useState<string | null>(null);
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function formatarTelefone(valor: string) {
        const digitos = valor.replace(/\D/g, "").slice(0, 11);
        if (digitos.length <= 2) return digitos;
        if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
        if (digitos.length <= 10) {
            return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
        }
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    }

    function handleTelefoneChange(valor: string) {
        setTelefone(formatarTelefone(valor));
        setErro(null);
        setMensagemSucesso(null);
    }

    async function handleCadastrar() {
        setErro(null);
        setMensagemSucesso(null);

        if (!nome.trim() || !email.trim() || !telefone.trim() || !endereco.trim()) {
            setErro("Preencha todos os campos para cadastrar o cliente.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setErro("Informe um endereço de e-mail válido.");
            return;
        }

        const telefoneNumerico = Number(telefone.replace(/\D/g, ""));
        if (isNaN(telefoneNumerico) || telefoneNumerico <= 0) {
            setErro("Informe um número de telefone válido.");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase
            .from("clientes")
            .insert({
                nome: nome.trim(),
                email: email.trim().toLowerCase(),
                telefone: telefoneNumerico,
                endereco: endereco.trim(),
            })
            .select()
            .single();

        setLoading(false);

        if (error) {
            console.error("Erro ao cadastrar cliente:", error);
            setErro("Não foi possível cadastrar o cliente. Tente novamente.");
            return;
        }

        if (data) {
            setMensagemSucesso(`Cliente "${data.nome}" cadastrado com sucesso! (ID: #${data.id})`);
            setNome("");
            setEmail("");
            setTelefone("");
            setEndereco("");
        }
    }

    const formPreenchido =
        nome.trim().length > 0 &&
        email.trim().length > 0 &&
        telefone.trim().length > 0 &&
        endereco.trim().length > 0 &&
        !loading;

    return (
        <PagesLayout scroll={true} scrollContent={{ paddingVertical: 20 }}>
            <View style={styles.container}>
                <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    {/* CABEÇALHO */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="person-add" size={24} color="#79553D" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={pagesStyles.brand}>CADASTRO DE CLIENTES</Text>
                            <Text style={[pagesStyles.title, styles.titleText]}>
                                Novo Cliente
                            </Text>
                            <Text style={pagesStyles.description}>
                                Cadastre um novo cliente para vincular a pedidos e vendas
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.formContainer}>
                        {/* NOME COMPLETO */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>NOME COMPLETO</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="person-outline"
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
                                    placeholder="Ex: João da Silva"
                                    placeholderTextColor="#A59D94"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* E-MAIL */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>E-MAIL</Text>
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
                                    placeholder="Ex: cliente@email.com"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* TELEFONE */}
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
                                    onChangeText={handleTelefoneChange}
                                    placeholder="Ex: (11) 98765-4321"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* ENDEREÇO */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>ENDEREÇO</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="location-outline"
                                    size={18}
                                    color="#8A8178"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={endereco}
                                    onChangeText={(val) => {
                                        setEndereco(val);
                                        setErro(null);
                                        setMensagemSucesso(null);
                                    }}
                                    placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                                    placeholderTextColor="#A59D94"
                                    returnKeyType="done"
                                    editable={!loading}
                                    style={styles.input}
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
                                    "Cadastrar Cliente"
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