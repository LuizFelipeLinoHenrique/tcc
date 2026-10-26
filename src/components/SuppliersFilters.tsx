import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AnimatedButton } from "./AnimatedButton";
import { pagesStyles } from "./ScreensLayout";

export type TipoPesquisaFornecedor = "ID" | "NOME" | "CNPJ" | "EMAIL";

type SuppliersFiltersProps = {
    pesquisa: string;
    setPesquisa: (value: string) => void;
    tipoPesquisa: TipoPesquisaFornecedor;
    setTipoPesquisa: (value: TipoPesquisaFornecedor) => void;
    onSearch: () => void;
    onClear: () => void;
    isMobile: boolean;
};

export function SuppliersFilters({
    pesquisa,
    setPesquisa,
    tipoPesquisa,
    setTipoPesquisa,
    onSearch,
    onClear,
    isMobile,
}: SuppliersFiltersProps) {
    const animation = useRef(new Animated.Value(0)).current;

    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);

    // Animação de abertura / fechamento
    useEffect(() => {
        Animated.timing(animation, {
            toValue: filtrosAbertos ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [filtrosAbertos, animation]);

    const alturaAnimada = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, contentHeight],
    });

    const opacidadeAnimada = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const rotacaoSeta = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    function selecionarTipo(tipo: TipoPesquisaFornecedor) {
        setTipoPesquisa(tipo);
        setPesquisa("");
    }

    const placeholder = {
        ID: "Digite o ID do fornecedor...",
        NOME: "Digite o nome ou razão social...",
        CNPJ: "Digite o CNPJ...",
        EMAIL: "Digite o e-mail...",
    }[tipoPesquisa];

    return (
        <View
            style={[
                pagesStyles.card,
                styles.container,
            ]}
        >
            {/* Cabeçalho */}
            <Pressable
                style={({ pressed }) => [
                    styles.header,
                    pressed && styles.headerPressed,
                ]}
                onPress={() =>
                    setFiltrosAbertos((prev) => !prev)
                }
            >
                <View style={styles.headerConteudoGroup}>
                    <View style={styles.headerConteudo}>
                        <Ionicons
                            name="options-outline"
                            size={20}
                            color="#0B4F6C"
                        />

                        <Text style={pagesStyles.textBold}>
                            Filtros
                        </Text>
                    </View>

                    <Animated.View
                        style={{
                            transform: [
                                {
                                    rotate: rotacaoSeta,
                                },
                            ],
                        }}
                    >
                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color="#0B4F6C"
                        />
                    </Animated.View>
                </View>
            </Pressable>

            {/* Conteúdo animado */}
            <Animated.View
                style={[
                    styles.conteudoAnimado,
                    {
                        height: alturaAnimada,
                        opacity: opacidadeAnimada,
                    },
                ]}
            >
                <View
                    style={styles.conteudo}
                    onLayout={(event) => {
                        const height =
                            event.nativeEvent.layout.height;

                        if (height !== contentHeight) {
                            setContentHeight(height);
                        }
                    }}
                >
                    {/* Pesquisar por */}
                    <View style={styles.filtroGrupo}>
                        <Text style={pagesStyles.label}>
                            Pesquisar por
                        </Text>

                        <View style={styles.opcoesContainer}>
                            {/* ID */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "ID" &&
                                    styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={
                                    styles.filtroBotaoPressed
                                }
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "ID" &&
                                    styles.filtroTextoSelecionado,
                                ]}
                                onPress={() =>
                                    selecionarTipo("ID")
                                }
                                title="ID"
                            />

                            {/* Nome */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "NOME" &&
                                    styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={
                                    styles.filtroBotaoPressed
                                }
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "NOME" &&
                                    styles.filtroTextoSelecionado,
                                ]}
                                onPress={() =>
                                    selecionarTipo("NOME")
                                }
                                title="Nome / Razão Social"
                            />

                            {/* CNPJ */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "CNPJ" &&
                                    styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={
                                    styles.filtroBotaoPressed
                                }
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "CNPJ" &&
                                    styles.filtroTextoSelecionado,
                                ]}
                                onPress={() =>
                                    selecionarTipo("CNPJ")
                                }
                                title="CNPJ"
                            />

                            {/* E-mail */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "EMAIL" &&
                                    styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={
                                    styles.filtroBotaoPressed
                                }
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "EMAIL" &&
                                    styles.filtroTextoSelecionado,
                                ]}
                                onPress={() =>
                                    selecionarTipo("EMAIL")
                                }
                                title="E-mail"
                            />
                        </View>
                    </View>

                    {/* Campo de pesquisa */}
                    <View
                        style={[
                            styles.pesquisaContainer,
                            {
                                width: isMobile
                                    ? "100%"
                                    : "60%",
                            },
                        ]}
                    >
                        <TextInput
                            value={pesquisa}
                            onChangeText={setPesquisa}
                            placeholder={placeholder}
                            placeholderTextColor="#94A3B8"
                            style={[
                                pagesStyles.input,
                                styles.input,
                            ]}
                            keyboardType={
                                tipoPesquisa === "ID" || tipoPesquisa === "CNPJ"
                                    ? "numeric"
                                    : "default"
                            }
                            onSubmitEditing={onSearch}
                        />

                        {/* Botão pesquisar */}
                        <AnimatedButton
                            stylesPressable={[
                                pagesStyles.primaryButton,
                                styles.botaoPesquisar,
                            ]}
                            stylesPressablePressed={
                                styles.botaoPesquisarPressed
                            }
                            onPress={onSearch}
                            title={
                                <>
                                    <Ionicons
                                        name="search"
                                        size={18}
                                        color="#FFFDF9"
                                    />

                                    <Text
                                        style={
                                            pagesStyles.primaryButtonText
                                        }
                                    >
                                        Pesquisar
                                    </Text>
                                </>
                            }
                        />
                    </View>

                    {/* Limpar filtros */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.botaoLimpar,
                            pressed &&
                            styles.botaoLimparPressed,
                        ]}
                        onPress={onClear}
                    >
                        <View style={styles.fecharFiltros}>
                            <Ionicons
                                name="close-circle-outline"
                                size={17}
                                color="#0E7490"
                            />

                            <Text style={pagesStyles.link}>
                                Limpar filtros
                            </Text>
                        </View>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 14,
        padding: 6,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DCE7EE",
        borderRadius: 18,
        shadowColor: "#082F42",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    header: {
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        borderRadius: 12,
    },

    headerPressed: {
        backgroundColor: "#F0F5F8",
    },

    headerConteudoGroup: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    headerConteudo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    conteudoAnimado: {
        overflow: "hidden",
    },

    conteudo: {
        gap: 16,
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5EEF3",
    },

    filtroGrupo: {
        gap: 8,
    },

    opcoesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    filtroBotao: {
        minHeight: 36,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#CFDDE6",
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
    },

    filtroSelecionado: {
        backgroundColor: "#0B4F6C",
        borderColor: "#0B4F6C",
        shadowColor: "#0B4F6C",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },

    filtroBotaoPressed: {
        opacity: 0.88,
    },

    filtroTexto: {
        fontSize: 13,
        color: "#475569",
        fontFamily: "WorksansMedium",
    },

    filtroTextoSelecionado: {
        color: "#FFFDF9",
        fontFamily: "WorksansSemiBold",
    },

    pesquisaContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    input: {
        minHeight: 44,
        flex: 1,
        fontSize: 14,
    },

    botaoPesquisar: {
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#0B4F6C",
    },

    botaoPesquisarPressed: {
        opacity: 0.88,
    },

    botaoLimpar: {
        alignSelf: "flex-start",
        paddingVertical: 4,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    botaoLimparPressed: {
        opacity: 0.75,
    },

    fecharFiltros: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
});
