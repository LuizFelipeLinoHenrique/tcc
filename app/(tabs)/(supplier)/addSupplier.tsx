import { router } from "expo-router";
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
import { RegistrationLayout, registrationStyles } from "@/src/components/RegistrationLayout";
import { pagesStyles } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";

export default function AddSupplier() {
    const { isMobile } = useResponsive();

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
        <RegistrationLayout title="Novo fornecedor">
            <View style={styles.formContainer}>
                {/* RAZÃO SOCIAL / NOME */}
                <View style={[pagesStyles.field, { width: isMobile ? "100%" : "48%" }]}>
                    <Text style={pagesStyles.label}>Nome / razão social *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="business-outline"
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
                            placeholder="Ex: Madeireira Central Ltda."
                            placeholderTextColor={Colors.hex94A3B8}
                            returnKeyType="next"
                            editable={!loading}
                            style={styles.input}
                        />
                    </View>
                </View>

                {/* CNPJ */}
                <View style={[pagesStyles.field, { width: isMobile ? "100%" : "48%" }]}>
                    <Text style={pagesStyles.label}>CNPJ</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="card-outline"
                            size={18}
                            color={Colors.hex64748B}
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
                            placeholderTextColor={Colors.hex94A3B8}
                            keyboardType="numeric"
                            returnKeyType="next"
                            editable={!loading}
                            style={styles.input}
                        />
                    </View>
                </View>

                {/* TELEFONE / WHATSAPP */}
                <Text accessibilityRole="header" style={registrationStyles.sectionTitle}>Contato</Text>
                <View style={[pagesStyles.field, { width: isMobile ? "100%" : "48%" }]}>
                    <Text style={pagesStyles.label}>Telefone / WhatsApp</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="call-outline"
                            size={18}
                            color={Colors.hex64748B}
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
                            placeholderTextColor={Colors.hex94A3B8}
                            keyboardType="phone-pad"
                            returnKeyType="next"
                            editable={!loading}
                            style={styles.input}
                        />
                    </View>
                </View>

                {/* E-MAIL */}
                <View style={[pagesStyles.field, { width: isMobile ? "100%" : "48%" }]}>
                    <Text style={pagesStyles.label}>E-mail comercial</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="mail-outline"
                            size={18}
                            color={Colors.hex64748B}
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
                            placeholderTextColor={Colors.hex94A3B8}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            returnKeyType="next"
                            editable={!loading}
                            style={styles.input}
                        />
                    </View>
                </View>

                {/* CONTATO / REPRESENTANTE */}
                <View style={[pagesStyles.field, { width: "100%" }]}>
                    <Text style={pagesStyles.label}>Pessoa de contato / vendedor</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="person-outline"
                            size={18}
                            color={Colors.hex64748B}
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
                            placeholderTextColor={Colors.hex94A3B8}
                            returnKeyType="next"
                            editable={!loading}
                            style={styles.input}
                        />
                    </View>
                </View>

                {/* ENDEREÇO */}
                <View style={[pagesStyles.field, { width: "100%" }]}>
                    <Text style={pagesStyles.label}>Endereço</Text>
                    <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                        <Ionicons
                            name="location-outline"
                            size={18}
                            color={Colors.hex64748B}
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
                            placeholderTextColor={Colors.hex94A3B8}
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
            </View>
            <View style={[registrationStyles.actions, isMobile && registrationStyles.compactActions]}>
                <AnimatedButton title="Cancelar" stylesPressable={pagesStyles.secondaryButton} stylesText={pagesStyles.secondaryButtonText} disabled={loading} onPress={() => router.push("/(tabs)/(supplier)/suppliers")} />
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
                            "Cadastrar Fornecedor"
                        )
                    }
                />
            </View>
        </RegistrationLayout>
    );
}

const styles = StyleSheet.create({
    formContainer: {
        flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between",
        gap: 18,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.hexF8FAFC,
        borderWidth: 1,
        borderColor: Colors.hexCFDDE6,
        borderRadius: 8,
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
        borderRadius: 8,
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
