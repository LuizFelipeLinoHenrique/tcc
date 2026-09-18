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

    const [clienteStatus, setClienteStatus] = useState<ValidationState>("idle");
    const [produtoStatus, setProdutoStatus] = useState<ValidationState>("idle");

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
            setClienteErro("Não foi possível consultar o cliente.");
            return false;
        }

        if (!data) {
            setClienteStatus("error");
            setClienteErro("Nenhum cliente encontrado com esse ID.");
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
            setProdutoErro("Não foi possível consultar o material.");
            return false;
        }

        if (!data) {
            setProdutoStatus("error");
            setProdutoErro("Nenhum material encontrado com esse ID.");
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
            setQuantidadeErro("Informe uma quantidade válida.");
            return false;
        }

        if (quantidadeNumerica <= 0) {
            setQuantidadeErro("A quantidade deve ser maior que zero.");
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

        if (!clienteValido || !produtoValido || !quantidadeValida) {
            return;
        }

        const idClienteNumerico = Number(idCliente);
        const idProdutoNumerico = Number(idProduto);
        const quantidadeNumerica = Number(qtde.trim().replace(",", "."));

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
            setMensagemSucesso(`Pedido #${data.id} cadastrado com sucesso!`);
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
        <PagesLayout scroll={true} scrollContent={{ paddingVertical: 20 }}>
            <View style={styles.container}>
                <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    {/* CABEÇALHO */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="add-circle" size={26} color="#79553D" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={pagesStyles.brand}>NOVO REGISTRO</Text>
                            <Text style={[pagesStyles.title, styles.titleText]}>
                                Adicionar Pedido
                            </Text>
                            <Text style={pagesStyles.description}>
                                Vincule o cliente, material e quantidade para criar o pedido
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.formContainer}>
                        {/* CLIENTE */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>ID DO CLIENTE</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    clienteStatus === "error" && styles.inputWrapperError,
                                    clienteStatus === "success" && styles.inputWrapperSuccess,
                                ]}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={18}
                                    color={
                                        clienteStatus === "success"
                                            ? "#166534"
                                            : clienteStatus === "error"
                                            ? "#B91C1C"
                                            : "#8A8178"
                                    }
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={idCliente}
                                    onChangeText={alterarCliente}
                                    onBlur={() => verificarCliente()}
                                    placeholder="Ex: 1"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="number-pad"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                                {clienteStatus === "loading" && (
                                    <ActivityIndicator size="small" color="#79553D" />
                                )}
                            </View>

                            {clienteStatus === "success" && nomeCliente && (
                                <View style={styles.verifiedBox}>
                                    <Ionicons name="checkmark-circle" size={16} color="#166534" />
                                    <Text style={styles.verifiedText}>Cliente: {nomeCliente}</Text>
                                </View>
                            )}

                            {clienteStatus === "error" && clienteErro && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                                    <Text style={styles.errorBoxText}>{clienteErro}</Text>
                                </View>
                            )}
                        </View>

                        {/* MATERIAL */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>ID DO MATERIAL</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    produtoStatus === "error" && styles.inputWrapperError,
                                    produtoStatus === "success" && styles.inputWrapperSuccess,
                                ]}
                            >
                                <Ionicons
                                    name="cube-outline"
                                    size={18}
                                    color={
                                        produtoStatus === "success"
                                            ? "#166534"
                                            : produtoStatus === "error"
                                            ? "#B91C1C"
                                            : "#8A8178"
                                    }
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={idProduto}
                                    onChangeText={alterarProduto}
                                    onBlur={() => verificarProduto()}
                                    placeholder="Ex: 10"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="number-pad"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                                {produtoStatus === "loading" && (
                                    <ActivityIndicator size="small" color="#79553D" />
                                )}
                            </View>

                            {produtoStatus === "success" && nomeProduto && (
                                <View style={styles.verifiedBox}>
                                    <Ionicons name="checkmark-circle" size={16} color="#166534" />
                                    <Text style={styles.verifiedText}>Material: {nomeProduto}</Text>
                                </View>
                            )}

                            {produtoStatus === "error" && produtoErro && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                                    <Text style={styles.errorBoxText}>{produtoErro}</Text>
                                </View>
                            )}
                        </View>

                        {/* QUANTIDADE */}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>QUANTIDADE</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    quantidadeErro ? styles.inputWrapperError : null,
                                ]}
                            >
                                <Ionicons
                                    name="layers-outline"
                                    size={18}
                                    color={quantidadeErro ? "#B91C1C" : "#8A8178"}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={qtde}
                                    onChangeText={alterarQuantidade}
                                    onBlur={validarQuantidade}
                                    placeholder="Ex: 10"
                                    placeholderTextColor="#A59D94"
                                    keyboardType="decimal-pad"
                                    returnKeyType="done"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>

                            {quantidadeErro && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                                    <Text style={styles.errorBoxText}>{quantidadeErro}</Text>
                                </View>
                            )}
                        </View>

                        {/* STATUS INICIAL INFORMATIVO */}
                        <View style={styles.statusContainer}>
                            <View style={styles.statusIcon}>
                                <Ionicons name="time-outline" size={20} color="#92400E" />
                            </View>

                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusTitle}>STATUS PADRÃO</Text>
                                <Text style={styles.statusDescription}>
                                    O pedido será registrado com status inicial como Pendente.
                                </Text>
                            </View>

                            <View style={styles.statusBadge}>
                                <Text style={styles.statusBadgeText}>Pendente</Text>
                            </View>
                        </View>

                        {/* MENSAGEM DE SUCESSO */}
                        {mensagemSucesso !== null && (
                            <View style={styles.successMessage}>
                                <Ionicons name="checkmark-circle" size={22} color="#166534" />
                                <Text style={styles.successMessageText}>{mensagemSucesso}</Text>
                            </View>
                        )}

                        {/* BOTÃO CADASTRAR */}
                        <AnimatedButton
                            stylesPressable={[
                                pagesStyles.primaryButton,
                                !formularioValido && styles.buttonDisabled,
                            ]}
                            stylesText={pagesStyles.primaryButtonText}
                            onPress={addOrders}
                            disabled={!formularioValido}
                            title={
                                loading ? (
                                    <ActivityIndicator size="small" color="#FFFDF9" />
                                ) : (
                                    "Adicionar Pedido"
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
    inputWrapperError: {
        borderColor: "#FCA5A5",
        backgroundColor: "#FEF2F2",
    },
    inputWrapperSuccess: {
        borderColor: "#BBF7D0",
        backgroundColor: "#F0FDF4",
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
    verifiedBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    verifiedText: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: "#166534",
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    errorBoxText: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: "#B91C1C",
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 12,
        backgroundColor: "#FEF3C7",
    },
    statusIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FDE68A",
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: "#92400E",
        letterSpacing: 0.5,
    },
    statusDescription: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: "#78350F",
        marginTop: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: "#92400E",
    },
    statusBadgeText: {
        color: "#FFFDF9",
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
    },
    successMessage: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
    },
    successMessageText: {
        fontSize: 14,
        fontFamily: "WorksansMedium",
        color: "#166534",
        flex: 1,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});