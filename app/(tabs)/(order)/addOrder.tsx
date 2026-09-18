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

type ValidationState = "idle" | "loading" | "success" | "error";

export default function ordersManager() {
    const { maxCardWidth } = useResponsive();

    const [idCliente, setIdCliente] = useState("");
    const [idProduto, setIdProduto] = useState("");
    const [qtde, setQtde] = useState("");

    const [nomeCliente, setNomeCliente] = useState<string | null>(null);
    const [nomeProduto, setNomeProduto] = useState<string | null>(null);

    const [clienteStatus, setClienteStatus] =
        useState<ValidationState>("idle");

    const [produtoStatus, setProdutoStatus] =
        useState<ValidationState>("idle");

    const [clienteErro, setClienteErro] = useState<string | null>(null);
    const [produtoErro, setProdutoErro] = useState<string | null>(null);
    const [quantidadeErro, setQuantidadeErro] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

    function obterDataAtual() {
        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function limparMensagemSucesso() {
        if (mensagemSucesso) {
            setMensagemSucesso(null);
        }
    }

    async function verificarCliente(valor?: string) {
        const id = (valor ?? idCliente).trim();

        setNomeCliente(null);
        setClienteErro(null);
        limparMensagemSucesso();

        if (!id) {
            setClienteStatus("idle");
            return false;
        }

        const idNumerico = Number(id);

        if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
            setClienteStatus("error");
            setClienteErro("Informe um ID de cliente válido.");
            return false;
        }

        setClienteStatus("loading");

        const { data, error } = await supabase
            .from("clientes")
            .select("id, nome")
            .eq("id", idNumerico)
            .maybeSingle();

        if (error) {
            console.log("Erro ao consultar cliente:", error);

            setClienteStatus("error");
            setClienteErro(
                "Não foi possível consultar o cliente."
            );

            return false;
        }

        if (!data) {
            setClienteStatus("error");
            setClienteErro(
                "Nenhum cliente encontrado com esse ID."
            );

            return false;
        }

        setNomeCliente(data.nome);
        setClienteStatus("success");

        return true;
    }

    async function verificarProduto(valor?: string) {
        const id = (valor ?? idProduto).trim();

        setNomeProduto(null);
        setProdutoErro(null);
        limparMensagemSucesso();

        if (!id) {
            setProdutoStatus("idle");
            return false;
        }

        const idNumerico = Number(id);

        if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
            setProdutoStatus("error");
            setProdutoErro("Informe um ID de material válido.");
            return false;
        }

        setProdutoStatus("loading");

        const { data, error } = await supabase
            .from("materiais")
            .select("id, nome")
            .eq("id", idNumerico)
            .maybeSingle();

        if (error) {
            console.log("Erro ao consultar material:", error);

            setProdutoStatus("error");
            setProdutoErro(
                "Não foi possível consultar o material."
            );

            return false;
        }

        if (!data) {
            setProdutoStatus("error");
            setProdutoErro(
                "Nenhum material encontrado com esse ID."
            );

            return false;
        }

        setNomeProduto(data.nome);
        setProdutoStatus("success");

        return true;
    }

    function validarQuantidade() {
        const valor = qtde.trim().replace(",", ".");

        if (!valor) {
            setQuantidadeErro("Informe a quantidade.");
            return false;
        }

        const quantidadeNumerica = Number(valor);

        if (!Number.isFinite(quantidadeNumerica)) {
            setQuantidadeErro(
                "Informe uma quantidade válida."
            );
            return false;
        }

        if (quantidadeNumerica <= 0) {
            setQuantidadeErro(
                "A quantidade deve ser maior que zero."
            );
            return false;
        }

        setQuantidadeErro(null);

        return true;
    }

    async function addOrders() {
        setMensagemSucesso(null);

        const clienteValido = await verificarCliente();
        const produtoValido = await verificarProduto();
        const quantidadeValida = validarQuantidade();

        if (
            !clienteValido ||
            !produtoValido ||
            !quantidadeValida
        ) {
            return;
        }

        const idClienteNumerico = Number(idCliente);
        const idProdutoNumerico = Number(idProduto);
        const quantidadeNumerica = Number(
            qtde.trim().replace(",", ".")
        );

        setLoading(true);

        const { data, error } = await supabase
            .from("pedidos")
            .insert({
                data_pedido: obterDataAtual(),
                id_cliente: idClienteNumerico,
                qtde: quantidadeNumerica,
                id_produto: idProdutoNumerico,
                status: "P",
            })
            .select()
            .single();

        setLoading(false);

        if (error) {
            console.log("Erro ao adicionar pedido:", error);

            setMensagemSucesso(null);

            return;
        }

        if (data) {
            setMensagemSucesso(
                `Pedido #${data.id} adicionado com sucesso.`
            );

            setIdCliente("");
            setIdProduto("");
            setQtde("");

            setNomeCliente("");
            setNomeProduto("");

            setClienteStatus("idle");
            setProdutoStatus("idle");

            setClienteErro(null);
            setProdutoErro(null);
            setQuantidadeErro(null);
        }
    }

    function alterarCliente(valor: string) {
        const somenteNumeros = valor.replace(/\D/g, "");

        setIdCliente(somenteNumeros);
        setNomeCliente("");
        setClienteErro(null);
        setClienteStatus("idle");
        limparMensagemSucesso();
    }

    function alterarProduto(valor: string) {
        const somenteNumeros = valor.replace(/\D/g, "");

        setIdProduto(somenteNumeros);
        setNomeProduto("");
        setProdutoErro(null);
        setProdutoStatus("idle");
        limparMensagemSucesso();
    }

    function alterarQuantidade(valor: string) {
        const valorFormatado = valor.replace(/[^0-9.,]/g, "");

        setQtde(valorFormatado);
        setQuantidadeErro(null);
        limparMensagemSucesso();
    }

    const formularioValido =
        idCliente.trim() !== "" &&
        idProduto.trim() !== "" &&
        qtde.trim() !== "" &&
        clienteStatus === "success" &&
        produtoStatus === "success" &&
        !quantidadeErro &&
        !loading;

    return (
        <PagesLayout
            scroll={true}
            scrollContent={{ paddingVertical: 20 }}
        >
            <View style={styles.container}>
                <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons
                                name="add-circle-outline"
                                size={30}
                                color="#79553D"
                            />
                        </View>

                        <View style={pagesStyles.title}>
                            <Text style={pagesStyles.brand}>
                                Cadastre um novo pedido.
                            </Text>
                            <Text style={pagesStyles.title}>
                                Adicionar pedido
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={{ gap: 20 }}>
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>
                                Cliente
                            </Text>

                            <TextInput
                                value={idCliente}
                                onChangeText={alterarCliente}
                                onBlur={() =>
                                    verificarCliente()
                                }
                                placeholder="Digite o ID do cliente..."
                                placeholderTextColor="#A69D92"
                                keyboardType="number-pad"
                                returnKeyType="next"
                                editable={!loading}
                                style={[
                                    pagesStyles.input,
                                    clienteStatus === "error" &&
                                    styles.inputError,
                                    clienteStatus === "success" &&
                                    styles.inputSuccess,
                                ]}
                            />

                            {clienteStatus === "loading" && (
                                <View style={styles.feedback}>
                                    <ActivityIndicator
                                        size="small"
                                        color="#79553D"
                                    />

                                    <Text
                                        style={pagesStyles.text}
                                    >
                                        Consultando cliente...
                                    </Text>
                                </View>
                            )}

                            {clienteStatus === "success" && (
                                <View
                                    style={[
                                        styles.feedback,
                                        styles.successFeedback,
                                    ]}
                                >
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={18}
                                        color="#547A55"
                                    />

                                    <Text
                                        style={
                                            pagesStyles.text
                                        }
                                    >
                                        {nomeCliente}
                                    </Text>
                                </View>
                            )}

                            {clienteStatus === "error" && (
                                <View style={styles.feedback}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={18}
                                        color="#A34E42"
                                    />

                                    <Text
                                        style={pagesStyles.errorText}
                                    >
                                        {clienteErro}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>
                                Material
                            </Text>

                            <TextInput
                                value={idProduto}
                                onChangeText={alterarProduto}
                                onBlur={() =>
                                    verificarProduto()
                                }
                                placeholder="Digite o ID do material..."
                                placeholderTextColor="#A69D92"
                                keyboardType="number-pad"
                                returnKeyType="next"
                                editable={!loading}
                                style={[
                                    pagesStyles.input,
                                    produtoStatus === "error" &&
                                    styles.inputError,
                                    produtoStatus === "success" &&
                                    styles.inputSuccess,
                                ]}
                            />

                            {produtoStatus === "loading" && (
                                <View style={styles.feedback}>
                                    <ActivityIndicator
                                        size="small"
                                        color="#79553D"
                                    />

                                    <Text
                                        style={pagesStyles.text}
                                    >
                                        Consultando material...
                                    </Text>
                                </View>
                            )}

                            {produtoStatus === "success" && (
                                <View
                                    style={[
                                        styles.feedback,
                                        styles.successFeedback,
                                    ]}
                                >
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={18}
                                        color="#547A55"
                                    />

                                    <Text
                                        style={
                                            pagesStyles.text
                                        }
                                    >
                                        {nomeProduto}
                                    </Text>
                                </View>
                            )}

                            {produtoStatus === "error" && (
                                <View style={styles.feedback}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={18}
                                        color="#A34E42"
                                    />

                                    <Text
                                        style={pagesStyles.errorText}
                                    >
                                        {produtoErro}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>
                                Quantidade
                            </Text>

                            <TextInput
                                value={qtde}
                                onChangeText={alterarQuantidade}
                                onBlur={validarQuantidade}
                                placeholder="Digite a quantidade..."
                                placeholderTextColor="#A69D92"
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                                editable={!loading}
                                style={[
                                    pagesStyles.input,
                                    quantidadeErro &&
                                    styles.inputError,
                                ]}
                            />

                            {quantidadeErro && (
                                <View style={styles.feedback}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={18}
                                        color="#A34E42"
                                    />

                                    <Text
                                        style={pagesStyles.errorText}
                                    >
                                        {quantidadeErro}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.statusContainer}>
                            <View style={styles.statusIcon}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={19}
                                    color="#79553D"
                                />
                            </View>

                            <View style={styles.statusTextContainer}>
                                <Text
                                    style={pagesStyles.brand}
                                >
                                    Status inicial
                                </Text>

                                <Text
                                    style={[pagesStyles.text, { fontSize: 14 }]}
                                >
                                    O pedido será criado com
                                    status "Pendente".
                                </Text>
                            </View>

                            <View style={styles.statusBadge}>
                                <Text
                                    style={[pagesStyles.textBold, { color: "#F7F4EE" }]}
                                >
                                    P
                                </Text>
                            </View>
                        </View>

                        {mensagemSucesso !== null && (
                            <View
                                style={[
                                    styles.message,
                                    styles.successMessage,
                                ]}
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={21}
                                    color="#547A55"
                                />

                                <Text
                                    style={
                                        pagesStyles.text
                                    }
                                >
                                    {mensagemSucesso}
                                </Text>
                            </View>
                        )}

                        <AnimatedButton
                            stylesPressable={[
                                pagesStyles.primaryButton,
                                !formularioValido &&
                                styles.buttonDisabled,
                            ]}
                            stylesText={
                                pagesStyles.primaryButtonText
                            }
                            onPress={addOrders}
                            disabled={!formularioValido}
                            title={
                                loading
                                    ? <ActivityIndicator
                                        size="small"
                                        color="#F7F4EE"
                                    />
                                    :
                                    "Adicionar pedido"
                            }
                        />
                    </View>
                </View>
            </View>
        </PagesLayout >
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
        alignItems: "center",
        gap: 13,
    },
    headerIcon: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#F7F4EE",
        alignItems: "center",
        justifyContent: "center",
    },
    divider: {
        height: 1,
        backgroundColor: "#9A6540",
        marginVertical: 22,
    },
    inputError: {
        borderColor: "#E9C6BD",
    },
    inputSuccess: {
        borderColor: "#789B78",
    },
    feedback: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        minHeight: 20,
    },
    successFeedback: {
        alignItems: "center",
    },
    statusContainer: {
        minHeight: 65,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: "#9A6540",
        borderRadius: 12,
        backgroundColor: "#E9E2D7",
    },
    statusIcon: {
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E9E2D7",
    },
    statusTextContainer: {
        flex: 1,
        gap: 2,
    },
    statusBadge: {
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#79553D",
    },
    message: {
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 10,
    },
    successMessage: {
        backgroundColor: "#EEF5EE",
        borderWidth: 1,
        borderColor: "#C8DCC8",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});