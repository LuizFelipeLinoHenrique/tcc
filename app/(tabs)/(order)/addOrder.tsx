import { router } from "expo-router";
import { Colors } from "@/src/theme/colors";
import { useEffect, useRef, useState } from "react";
import { parsePositiveInteger } from "@/src/lib/orderValidation";
import { parseDate } from "@/src/lib/cashFlow";
import { maskDate } from "@/src/lib/dates";
import { recordError } from "@/src/lib/tableActions";
import {
    ActivityIndicator,
    Pressable,
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

export default function OrdersManager() {
    const { maxCardWidth, isMobile } = useResponsive();

    const [idCliente, setIdCliente] = useState("");
    const [idProduto, setIdProduto] = useState("");
    const [qtde, setQtde] = useState("");
    const [vencimento, setVencimento] = useState("");
    const requestKey = useRef<string | null>(null);
    const [itens, setItens] = useState<{ id_produto: number; nome: string; quantidade: string }[]>([]);

    const [nomeCliente, setNomeCliente] = useState<string | null>(null);
    const [nomeProduto, setNomeProduto] = useState<string | null>(null);

    const [clienteStatus, setClienteStatus] = useState<ValidationState>("idle");
    const [produtoStatus, setProdutoStatus] = useState<ValidationState>("idle");

    const [clienteErro, setClienteErro] = useState<string | null>(null);
    const [produtoErro, setProdutoErro] = useState<string | null>(null);
    const [quantidadeErro, setQuantidadeErro] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const clienteRequest = useRef(0);
    const produtoRequest = useRef(0);
    const submitting = useRef(false);

    useEffect(() => () => {
        clienteRequest.current += 1;
        produtoRequest.current += 1;
    }, []);

    function limparMensagemSucesso() {
        if (mensagemSucesso) {
            setMensagemSucesso(null);
        }
    }

    async function verificarCliente(valor?: string) {
        const request = ++clienteRequest.current;
        const id = (valor ?? idCliente).trim();

        setNomeCliente(null);
        setClienteErro(null);
        limparMensagemSucesso();

        if (!id) {
            setClienteStatus("idle");
            return false;
        }

        const idNumerico = parsePositiveInteger(id);

        if (idNumerico === null) {
            setClienteStatus("error");
            setClienteErro("Informe um ID de cliente válido.");
            return false;
        }

        setClienteStatus("loading");

        try {
            const { data, error } = await supabase
                .from("clientes")
                .select("id, nome")
                .eq("id", idNumerico)
                .maybeSingle();
            if (request !== clienteRequest.current) return false;

            if (error) throw error;

            if (!data) {
                setClienteStatus("error");
                setClienteErro("Nenhum cliente encontrado com esse ID.");
                return false;
            }

            setNomeCliente(data.nome);
            setClienteStatus("success");
            return true;
        } catch (cause) {
            if (request === clienteRequest.current) {
                setClienteStatus("error");
                setClienteErro(recordError(cause));
            }
            return false;
        }
    }

    async function verificarProduto(valor?: string) {
        const request = ++produtoRequest.current;
        const id = (valor ?? idProduto).trim();

        setNomeProduto(null);
        setProdutoErro(null);
        limparMensagemSucesso();

        if (!id) {
            setProdutoStatus("idle");
            return false;
        }

        const idNumerico = parsePositiveInteger(id);

        if (idNumerico === null) {
            setProdutoStatus("error");
            setProdutoErro("Informe um ID de produto válido.");
            return false;
        }

        setProdutoStatus("loading");

        try {
            const { data, error } = await supabase
                .from("produtos")
                .select("id, nome")
                .eq("id", idNumerico)
                .maybeSingle();
            if (request !== produtoRequest.current) return false;

            if (error) throw error;

            if (!data) {
                setProdutoStatus("error");
                setProdutoErro("Nenhum produto encontrado com esse ID.");
                return false;
            }

            setNomeProduto(data.nome);
            setProdutoStatus("success");
            return data.nome || `Produto #${id}`;
        } catch (cause) {
            if (request === produtoRequest.current) {
                setProdutoStatus("error");
                setProdutoErro(recordError(cause));
            }
            return false;
        }
    }

    function validarQuantidade() {
        const valor = qtde.trim().replace(",", ".");

        if (!valor) {
            setQuantidadeErro("Informe a quantidade.");
            return false;
        }

        const quantidadeNumerica = Number(valor);

        if (!Number.isSafeInteger(quantidadeNumerica)) {
            setQuantidadeErro("Informe uma quantidade inteira válida.");
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
        if (submitting.current) return;
        submitting.current = true;
        setLoading(true);
        setSubmitError(null);
        setMensagemSucesso(null);
        try {
            const due = parseDate(vencimento);
            if (!due) {
                setSubmitError("Informe o vencimento do recebimento no formato DD/MM/AAAA.");
                return;
            }
            const temRascunho = !!(idProduto.trim() || qtde.trim());
            const [clienteValido, produtoValido] = await Promise.all([
                verificarCliente(), temRascunho ? verificarProduto() : Promise.resolve(true),
            ]);
            const quantidadeValida = !temRascunho || validarQuantidade();

            if (!clienteValido || !produtoValido || !quantidadeValida) {
                return;
            }

            const produtos = itens.map(item => ({ id_produto: item.id_produto, qtde: parsePositiveInteger(item.quantidade) }));
            if (temRascunho) produtos.push({ id_produto: Number(idProduto), qtde: parsePositiveInteger(qtde) });
            if (!produtos.length || produtos.some(item => item.qtde === null)) {
                setSubmitError("Adicione produtos com quantidades inteiras maiores que zero.");
                return;
            }
            if (new Set(produtos.map(item => item.id_produto)).size !== produtos.length) {
                setSubmitError("Esse produto já está no pedido. Altere a quantidade na lista.");
                return;
            }
            // Mantém a chave após erro de rede: repetir a requisição recupera o mesmo pedido.
            requestKey.current ??= globalThis.crypto.randomUUID();
            const { data, error } = await supabase.rpc("save_order_items", {
                p_cliente: Number(idCliente), p_itens: produtos, p_status: "P",
                p_due_date: due, p_request_id: requestKey.current,
            });

            if (error) throw error;
            if (!data) throw new Error("O pedido não foi confirmado. Consulte a lista antes de tentar novamente.");

            if (data) {
                clienteRequest.current += 1;
                produtoRequest.current += 1;
                setMensagemSucesso(`Pedido #${data} cadastrado com sucesso!`);
                setItens([]);
                setVencimento("");
                requestKey.current = null;
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
        } catch (cause) {
            setSubmitError(recordError(cause));
        } finally {
            submitting.current = false;
            setLoading(false);
        }
    }

    function alterarCliente(valor: string) {
        clienteRequest.current += 1;
        const somenteNumeros = valor.replace(/\D/g, "");
        setIdCliente(somenteNumeros);
        setNomeCliente("");
        setClienteErro(null);
        setClienteStatus("idle");
        limparMensagemSucesso();
    }

    function alterarProduto(valor: string) {
        produtoRequest.current += 1;
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

    async function adicionarProduto() {
        if (submitting.current) return;
        submitting.current = true;
        setLoading(true);
        setSubmitError(null);
        try {
            if (!validarQuantidade()) return;
            const produtoValidado = await verificarProduto();
            if (!produtoValidado) return;
            if (itens.some(item => item.id_produto === Number(idProduto))) {
                setSubmitError("Esse produto já está no pedido. Altere a quantidade na lista.");
                return;
            }
            setItens(prev => [...prev, { id_produto: Number(idProduto), nome: produtoValidado, quantidade: qtde }]);
            produtoRequest.current += 1;
            setIdProduto("");
            setQtde("");
            setNomeProduto(null);
            setProdutoStatus("idle");
            setProdutoErro(null);
        } finally {
            submitting.current = false;
            setLoading(false);
        }
    }

    const formularioValido =
        idCliente.trim() !== "" &&
        clienteStatus === "success" &&
        (itens.length > 0 || (produtoStatus === "success" && parsePositiveInteger(qtde) !== null)) &&
        (!(idProduto || qtde) || (produtoStatus === "success" && parsePositiveInteger(qtde) !== null)) &&
        itens.every(item => parsePositiveInteger(item.quantidade) !== null) &&
        !quantidadeErro &&
        !!parseDate(vencimento) &&
        !loading;

    return (
        <PagesLayout scroll={true} scrollContent={{ paddingVertical: 20 }}>
            <View style={styles.container}>
                <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    {/* CABEÇALHO */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="add-circle" size={26} color={Colors.hex0B4F6C} />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={pagesStyles.brand}>NOVO REGISTRO</Text>
                            <Text style={[pagesStyles.title, styles.titleText]}>
                                Adicionar Pedido
                            </Text>
                            <Text style={pagesStyles.description}>
                                Vincule o cliente, produto e quantidade para criar o pedido
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
                                            ? Colors.hex166534
                                            : clienteStatus === "error"
                                            ? Colors.hexB91C1C
                                            : Colors.hex64748B
                                    }
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={idCliente}
                                    onChangeText={alterarCliente}
                                    onBlur={() => verificarCliente()}
                                    placeholder="Ex: 1"
                                    placeholderTextColor={Colors.hex94A3B8}
                                    keyboardType="number-pad"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                                {clienteStatus === "loading" && (
                                    <ActivityIndicator size="small" color={Colors.hex0B4F6C} />
                                )}
                            </View>

                            {clienteStatus === "success" && nomeCliente && (
                                <View style={styles.verifiedBox}>
                                    <Ionicons name="checkmark-circle" size={16} color={Colors.hex166534} />
                                    <Text style={styles.verifiedText}>Cliente: {nomeCliente}</Text>
                                </View>
                            )}

                            {clienteStatus === "error" && clienteErro && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={16} color={Colors.hexB91C1C} />
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
                                            ? Colors.hex166534
                                            : produtoStatus === "error"
                                            ? Colors.hexB91C1C
                                            : Colors.hex64748B
                                    }
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={idProduto}
                                    onChangeText={alterarProduto}
                                    onBlur={() => verificarProduto()}
                                    placeholder="Ex: 10"
                                    placeholderTextColor={Colors.hex94A3B8}
                                    keyboardType="number-pad"
                                    returnKeyType="next"
                                    editable={!loading}
                                    style={styles.input}
                                />
                                {produtoStatus === "loading" && (
                                    <ActivityIndicator size="small" color={Colors.hex0B4F6C} />
                                )}
                            </View>

                            {produtoStatus === "success" && nomeProduto && (
                                <View style={styles.verifiedBox}>
                                    <Ionicons name="checkmark-circle" size={16} color={Colors.hex166534} />
                                    <Text style={styles.verifiedText}>Produto: {nomeProduto}</Text>
                                </View>
                            )}

                            {produtoStatus === "error" && produtoErro && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={16} color={Colors.hexB91C1C} />
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
                                    color={quantidadeErro ? Colors.hexB91C1C : Colors.hex64748B}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    value={qtde}
                                    onChangeText={alterarQuantidade}
                                    onBlur={validarQuantidade}
                                    placeholder="Ex: 10"
                                    placeholderTextColor={Colors.hex94A3B8}
                                    keyboardType="number-pad"
                                    returnKeyType="done"
                                    editable={!loading}
                                    style={styles.input}
                                />
                            </View>

                            {quantidadeErro && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={16} color={Colors.hexB91C1C} />
                                    <Text style={styles.errorBoxText}>{quantidadeErro}</Text>
                                </View>
                            )}
                        </View>

                        <AnimatedButton
                            title="Adicionar produto ao pedido"
                            onPress={adicionarProduto}
                            disabled={loading || !idProduto || parsePositiveInteger(qtde) === null}
                            stylesPressable={pagesStyles.primaryButton}
                            stylesText={pagesStyles.primaryButtonText}
                        />
                        {itens.length > 0 && (
                            <View style={styles.formContainer}>
                                <Text style={pagesStyles.label}>PRODUTOS DO PEDIDO ({itens.length})</Text>
                                {itens.map((item, index) => (
                                    <View key={item.id_produto} style={styles.itemRow}>
                                        <Text style={styles.itemName}>{item.nome} (#{item.id_produto})</Text>
                                        <View style={styles.itemQuantity}>
                                            <Text style={pagesStyles.label}>QUANTIDADE</Text>
                                            <TextInput
                                                accessibilityLabel={`Quantidade do produto ${item.id_produto}`}
                                                value={item.quantidade}
                                                keyboardType="number-pad"
                                                editable={!loading}
                                                style={[styles.inputWrapper, styles.input]}
                                                onChangeText={value => {
                                                    setItens(prev => prev.map((entry, i) => i === index ? { ...entry, quantidade: value } : entry));
                                                    setSubmitError(null);
                                                    limparMensagemSucesso();
                                                }}
                                            />
                                            {parsePositiveInteger(item.quantidade) === null && <Text accessibilityRole="alert" style={styles.errorBoxText}>Informe uma quantidade inteira maior que zero.</Text>}
                                        </View>
                                        <Pressable accessibilityRole="button" accessibilityLabel={`Remover produto ${item.id_produto}`} disabled={loading}
                                            onPress={() => { setItens(prev => prev.filter((_, i) => i !== index)); setSubmitError(null); }}>
                                            <Ionicons name="trash-outline" size={22} color={Colors.hexB91C1C} />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                        <View style={pagesStyles.field}>
                            <Text style={pagesStyles.label}>VENCIMENTO DO RECEBIMENTO *</Text>
                            <TextInput accessibilityLabel="Vencimento do recebimento" value={vencimento}
                                onChangeText={value => setVencimento(maskDate(value))} editable={!loading} placeholder="DD/MM/AAAA"
                                keyboardType="number-pad" maxLength={10} style={[styles.inputWrapper, styles.input]} />
                        </View>

                        {/* STATUS INICIAL INFORMATIVO */}
                        <View style={styles.statusContainer}>
                            <View style={styles.statusIcon}>
                                <Ionicons name="time-outline" size={20} color={Colors.hex92400E} />
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

                        {!!submitError && (
                            <View style={styles.errorBox}>
                                <Text accessibilityRole="alert" style={styles.errorBoxText}>
                                    {submitError} Você pode tentar novamente pelo botão abaixo.
                                </Text>
                            </View>
                        )}
                        {/* MENSAGEM DE SUCESSO */}
                        {mensagemSucesso !== null && (
                            <View style={styles.successMessage}>
                                <Ionicons name="checkmark-circle" size={22} color={Colors.hex166534} />
                                <Text style={styles.successMessageText}>{mensagemSucesso}</Text>
                            </View>
                        )}

                        {/* BOTÃO CADASTRAR */}
                        <View style={{ width: "100%", flexDirection: isMobile ? "column-reverse" : "row", justifyContent: "flex-end", gap: 12, borderTopWidth: 1, borderTopColor: Colors.hexDCE7EE, paddingTop: 20 }}>
                          <AnimatedButton title="Cancelar" stylesPressable={pagesStyles.secondaryButton} stylesText={pagesStyles.secondaryButtonText} disabled={loading} onPress={() => router.push("/(tabs)/(order)/orders")} />
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
                                    <ActivityIndicator size="small" color={Colors.hexFFFDF9} />
                                ) : (
                                    "Adicionar Pedido"
                                )
                            }
                        />
                        </View>
                    </View>
                </View>
            </View>
        </PagesLayout>
    );
}

const styles = StyleSheet.create({
    itemRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderColor: Colors.hexCFDDE6, borderRadius: 8 },
    itemName: { flex: 1, minWidth: 100, fontFamily: "WorksansMedium", color: Colors.hex0F172A },
    itemQuantity: { width: 110 },
    container: {
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 0,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
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
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    inputWrapperError: {
        borderColor: Colors.hexFCA5A5,
        backgroundColor: Colors.hexFEF2F2,
    },
    inputWrapperSuccess: {
        borderColor: Colors.hexBBF7D0,
        backgroundColor: Colors.hexF0FDF4,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        minHeight: 46,
        fontSize: 15,
        fontFamily: "WorksansRegular",
        color: Colors.hex0F172A,
    },
    verifiedBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.hexF0FDF4,
        borderWidth: 1,
        borderColor: Colors.hexBBF7D0,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    verifiedText: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: Colors.hex166534,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.hexFEF2F2,
        borderWidth: 1,
        borderColor: Colors.hexFECACA,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    errorBoxText: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: Colors.hexB91C1C,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.hexFDE68A,
        borderRadius: 8,
        backgroundColor: Colors.hexFEF3C7,
    },
    statusIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.hexFDE68A,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex92400E,
        letterSpacing: 0.5,
    },
    statusDescription: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: Colors.hex78350F,
        marginTop: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: Colors.hex92400E,
    },
    statusBadgeText: {
        color: Colors.hexFFFDF9,
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
    },
    successMessage: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: Colors.hexF0FDF4,
        borderWidth: 1,
        borderColor: Colors.hexBBF7D0,
    },
    successMessageText: {
        fontSize: 14,
        fontFamily: "WorksansMedium",
        color: Colors.hex166534,
        flex: 1,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
