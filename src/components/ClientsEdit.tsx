import { Colors } from "@/src/theme/colors";
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

type ClientEditProps = {
    idCliente: number;
};

type Cliente = {
    id: number;
    nome: string;
    endereco: string;
    email: string;
    telefone: number;
};

export function EditClientCard({
    idCliente,
}: ClientEditProps) {
    const { isMobile, maxCardWidth } = useResponsive();

    const [cliente, setCliente] =
        useState<Cliente | null>(null);

    const [nome, setNome] = useState("");
    const [endereco, setEndereco] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        carregarCliente();
    }, [idCliente]);

    async function carregarCliente() {
        setLoading(true);
        setError("");

        const {
            data,
            error,
        } = await supabase
            .from("clientes")
            .select("*")
            .eq("id", idCliente)
            .single();

        if (error) {
            console.error(
                "Erro ao carregar cliente:",
                error
            );

            setError(
                "Não foi possível carregar o cliente."
            );

            setLoading(false);
            return;
        }

        setCliente(data);

        setNome(data.nome ?? "");
        setEndereco(data.endereco ?? "");
        setEmail(data.email ?? "");

        setTelefone(
            data.telefone != null
                ? String(data.telefone)
                : ""
        );

        setLoading(false);
    }

    async function salvar() {
        if (!cliente) {
            return;
        }

        if (
            !nome.trim() ||
            !endereco.trim() ||
            !email.trim() ||
            !telefone.trim()
        ) {
            setError(
                "Preencha todos os campos."
            );

            return;
        }

        setSaving(true);
        setError("");

        const telefoneNumero = Number(
            telefone.replace(/\D/g, "")
        );

        if (isNaN(telefoneNumero)) {
            setError("Telefone inválido.");
            setSaving(false);

            return;
        }

        const {
            error,
        } = await supabase
            .from("clientes")
            .update({
                nome: nome.trim(),
                endereco: endereco.trim(),
                email: email.trim(),
                telefone: telefoneNumero,
            })
            .eq("id", cliente.id);

        if (error) {
            console.error(
                "Erro ao atualizar cliente:",
                error
            );

            setError(
                "Não foi possível salvar as alterações."
            );

            setSaving(false);

            return;
        }

        setCliente({
            ...cliente,
            nome: nome.trim(),
            endereco: endereco.trim(),
            email: email.trim(),
            telefone: telefoneNumero,
        });

        setSaving(false);

        Alert.alert(
            "Sucesso",
            "Cliente atualizado com sucesso."
        );
    }

    if (loading) {
        return (
            <View
                style={[
                    pagesStyles.card,
                    styles.loading,
                ]}
            >
                <ActivityIndicator />

                <Text
                    style={pagesStyles.text}
                >
                    Carregando cliente...
                </Text>
            </View>
        );
    }

    if (!cliente) {
        return (
            <View
                style={pagesStyles.card}
            >
                <Text
                    style={pagesStyles.text}
                >
                    {error ||
                        "Cliente não encontrado."}
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[
                pagesStyles.card,
                { maxWidth: maxCardWidth }
            ]}
        >

            <View
                style={[
                    styles.header,
                    isMobile &&
                    styles.headerMobile,
                ]}
            >
                <View
                    style={styles.headerTitle}
                >
                    <Text
                        style={
                            pagesStyles.brand
                        }
                    >
                        Clientes
                    </Text>

                    <Text
                        style={[
                            pagesStyles.title,
                        ]}
                    >
                        Editar Cliente #
                        {cliente.id}
                    </Text>
                </View>

                <View
                    style={[
                        styles.idBox,
                        isMobile &&
                        styles.idBoxMobile,
                    ]}
                >
                    <Text
                        style={styles.idLabel}
                    >
                        ID do cliente
                    </Text>

                    <Text
                        style={
                            styles.readOnlyValue
                        }
                    >
                        {cliente.id}
                    </Text>
                </View>
            </View>

            {/* CAMPOS */}

            <View
                style={styles.section}
            >
                <Text
                    style={styles.sectionTitle}
                >
                    Dados do cliente
                </Text>

                <View
                    style={styles.fields}
                >
                    {/* NOME */}

                    <View
                        style={[
                            pagesStyles.field,
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            Nome
                        </Text>

                        <TextInput
                            value={nome}
                            onChangeText={setNome}
                            placeholder="Nome do cliente"
                            placeholderTextColor={Colors.hex64748B}
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* E-MAIL */}

                    <View
                        style={[
                            styles.field,
                            isMobile &&
                            styles.fieldMobile,
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            E-mail
                        </Text>

                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="E-mail do cliente"
                            placeholderTextColor={Colors.hex64748B}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* TELEFONE */}

                    <View
                        style={[
                            pagesStyles.field
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            Telefone
                        </Text>

                        <TextInput
                            value={telefone}
                            onChangeText={setTelefone}
                            placeholder="Telefone do cliente"
                            placeholderTextColor={Colors.hex64748B}
                            keyboardType="numeric"
                            style={pagesStyles.input}
                        />
                    </View>

                    {/* ENDEREÇO */}

                    <View
                        style={[
                            pagesStyles.field,
                            styles.addressField,
                        ]}
                    >
                        <Text
                            style={
                                pagesStyles.textBold
                            }
                        >
                            Endereço
                        </Text>

                        <TextInput
                            value={endereco}
                            onChangeText={setEndereco}
                            placeholder="Endereço do cliente"
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
                <View
                    style={[
                        pagesStyles.error,
                        styles.error,
                    ]}
                >
                    <Text
                        style={
                            pagesStyles.errorText
                        }
                    >
                        {error}
                    </Text>
                </View>
            ) : null}

            {/* BOTÃO */}

            <View
                style={[
                    styles.buttonContainer,
                    isMobile &&
                    styles.buttonContainerMobile,
                ]}
            >
                <AnimatedButton
                    title={
                        saving ? (
                            <ActivityIndicator
                                color={Colors.hexFFFDF9}
                            />
                        ) : (
                            "Salvar Alterações"
                        )
                    }
                    stylesPressable={[
                        pagesStyles.primaryButton,
                        styles.saveButton,
                    ]}
                    stylesPressablePressed={pagesStyles.primaryButtonPressed}
                    stylesText={
                        pagesStyles.primaryButtonText
                    }
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

    title: {
        marginVertical: 0,
        marginBottom: 0,
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
        paddingVertical: 2,
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

    addressField: {
        flexBasis: "100%",
    },

    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: Colors.hexB8C9D5,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 16,
        backgroundColor: Colors.hexF8FAFC,
        color: Colors.hex0F172A,
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
