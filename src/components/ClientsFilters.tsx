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

export type TipoPesquisaCliente = "ID" | "NOME" | "EMAIL" | "TELEFONE";

type ClientsFiltersProps = {
    pesquisa: string;
    setPesquisa: (value: string) => void;
    tipoPesquisa: TipoPesquisaCliente;
    setTipoPesquisa: (value: TipoPesquisaCliente) => void;
    onSearch: () => void;
    onClear: () => void;
    isMobile: boolean;
};

export function ClientsFilters({
    pesquisa,
    setPesquisa,
    tipoPesquisa,
    setTipoPesquisa,
    onSearch,
    onClear,
    isMobile,
}: ClientsFiltersProps) {
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

    function selecionarTipo(tipo: TipoPesquisaCliente) {
        setTipoPesquisa(tipo);
        setPesquisa("");
    }

    const placeholder = {
        ID: "Digite o ID do cliente...",
        NOME: "Digite o nome do cliente...",
        EMAIL: "Digite o e-mail do cliente...",
        TELEFONE: "Digite o telefone do cliente...",
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
                            color="#79553D"
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
                            color="#79553D"
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
                                title="Nome"
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

                            {/* Telefone */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "TELEFONE" &&
                                    styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={
                                    styles.filtroBotaoPressed
                                }
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "TELEFONE" &&
                                    styles.filtroTextoSelecionado,
                                ]}
                                onPress={() =>
                                    selecionarTipo("TELEFONE")
                                }
                                title="Telefone"
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
                            placeholderTextColor="#A69D92"
                            style={[
                                pagesStyles.input,
                                styles.input,
                            ]}
                            keyboardType={
                                tipoPesquisa === "ID"
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
                                color="#8D5C3B"
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
        marginBottom: 16,
        padding: 10,
        backgroundColor: "#FFFDF9",
        borderWidth: 1,
        borderColor: "#E9E2D7",
        borderRadius: 16,
    },

    header: {
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
    },

    headerPressed: {
        backgroundColor: "#F7F1E9",
    },

    headerConteudoGroup: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
    },

    headerConteudo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
    },

    conteudoAnimado: {
        overflow: "hidden",
    },

    conteudo: {
        gap: 18,
        paddingHorizontal: 18,
        paddingTop: 4,
        paddingBottom: 18,
    },

    filtroGrupo: {
        gap: 9,
    },

    opcoesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    filtroBotao: {
        minHeight: 40,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#D8CFC3",
        backgroundColor: "#FFFEFC",
        alignItems: "center",
        justifyContent: "center",
    },

    filtroSelecionado: {
        backgroundColor: "#79553D",
        borderColor: "#79553D",
    },

    filtroBotaoPressed: {
        opacity: 0.88,
    },

    filtroTexto: {
        fontSize: 14,
    },

    filtroTextoSelecionado: {
        color: "#FFFDF9",
        fontFamily: "WorksansSemiBold",
    },

    pesquisaContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    input: {
        minHeight: 45,
    },

    botaoPesquisar: {
        minHeight: 45,
        paddingHorizontal: 17,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    botaoPesquisarPressed: {
        opacity: 0.92,
    },

    botaoLimpar: {
        alignSelf: "flex-start",
        paddingHorizontal: 3,
        paddingVertical: 5,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    botaoLimparPressed: {
        opacity: 0.75,
    },

    fecharFiltros: {
        height: 20,
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 6,
    },
});