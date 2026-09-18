import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import useResponsive from "../hooks/useResponsive";
import { AnimatedButton } from "./AnimatedButton";
import { pagesStyles } from "./ScreensLayout";

type StatusFiltro = "TODOS" | "P" | "E" | "C";
type PeriodoFiltro = "TODOS" | "HOJE" | "7_DIAS" | "30_DIAS";
type TipoPesquisa = "PEDIDO" | "CLIENTE" | "MATERIAL";

type OrdersFiltersProps = {
    pesquisa: string;
    setPesquisa: React.Dispatch<React.SetStateAction<string>>;

    tipoPesquisa: TipoPesquisa;
    setTipoPesquisa: React.Dispatch<React.SetStateAction<TipoPesquisa>>;

    statusFiltro: StatusFiltro;
    setStatusFiltro: React.Dispatch<React.SetStateAction<StatusFiltro>>;

    periodoFiltro: PeriodoFiltro;
    setPeriodoFiltro: React.Dispatch<React.SetStateAction<PeriodoFiltro>>;

    onSearch: () => void;
    onClear: () => void;
    isMobile: boolean;
};

export function OrdersFilters({
    pesquisa,
    setPesquisa,
    tipoPesquisa,
    setTipoPesquisa,
    statusFiltro,
    setStatusFiltro,
    periodoFiltro,
    setPeriodoFiltro,
    onSearch,
    onClear,
}: OrdersFiltersProps) {

    const animation = useRef(new Animated.Value(0)).current;

    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);

    const { isMobile } = useResponsive();

    // Animação de abertura / fechamento
    useEffect(() => {
        Animated.timing(animation, {
            toValue: filtrosAbertos ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();

    }, [filtrosAbertos, animation]);

    const alturaAnimada =
        animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, contentHeight],
        });

    const opacidadeAnimada =
        animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

    const rotacaoSeta =
        animation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "180deg"],
        });

    // Altera placeholder de pesquisa
    const getPlaceholder = () => {
        if (tipoPesquisa === "PEDIDO") {
            return "Digite o ID do pedido...";
        };

        if (tipoPesquisa === "CLIENTE") {
            return "Digite o ID do cliente...";
        };

        return (
            "Digite o ID do material..."
        );
    };

    return (
        <View style={[
            pagesStyles.card,
            styles.container
        ]}>

            <Pressable
                style={({ pressed }) => [
                    styles.header,
                    pressed && styles.headerPressed,
                ]}
                onPress={() => setFiltrosAbertos(prev => !prev)}
            >

                <View
                    style={styles.headerConteudoGroup}
                >

                    <View
                        style={styles.headerConteudo}
                    >

                        <Ionicons
                            name="options-outline"
                            size={20}
                            color="#79553D"
                        />

                        <Text
                            style={pagesStyles.textBold}
                        >
                            Filtros
                        </Text>
                    </View>

                    <Animated.View
                        style={{ transform: [{ rotate: rotacaoSeta }] }}
                    >

                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color="#79553D"
                        />
                    </Animated.View>
                </View>
            </Pressable >

            {/* Menu animado */}
            < Animated.View
                style={
                    [
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
                            event.nativeEvent
                                .layout
                                .height;
                        if (height !== contentHeight) {
                            setContentHeight(
                                height
                            );
                        };
                    }}
                >

                    {/* Pesquisar por */}
                    <View
                        style={styles.filtroGrupo}
                    >

                        <Text
                            style={pagesStyles.label}
                        >
                            Pesquisar por
                        </Text>

                        <View
                            style={styles.opcoesContainer}
                        >

                            {/* Pedido */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "PEDIDO" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "PEDIDO" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setTipoPesquisa("PEDIDO")}
                                title="Pedido"
                            />

                            {/* Cliente */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "CLIENTE" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "CLIENTE" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setTipoPesquisa("CLIENTE")}
                                title="Cliente"
                            />

                            {/* Material */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    tipoPesquisa === "MATERIAL" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    tipoPesquisa === "MATERIAL" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setTipoPesquisa("MATERIAL")}
                                title="Material"
                            />
                        </View>
                    </View>

                    {/* Campo de pesquisa */}
                    <View
                        style={[
                            styles.pesquisaContainer,
                            { width: isMobile ? "100%" : "60%" }
                        ]}
                    >

                        <TextInput
                            value={pesquisa}
                            onChangeText={setPesquisa}
                            placeholder={getPlaceholder()}
                            placeholderTextColor="#A69D92"
                            style={[
                                pagesStyles.input,
                                styles.input
                            ]}
                            keyboardType="numeric"
                            onSubmitEditing={onSearch}
                        />


                        {/* Botão pesquisar */}
                        {/* <AnimatedButton
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
                                        style={pagesStyles.primaryButtonText}
                                    >
                                        Pesquisar
                                    </Text>
                                </>
                            }
                        /> */}
                    </View>


                    {/* Situação */}
                    <View
                        style={styles.filtroGrupo}
                    >

                        <Text
                            style={pagesStyles.label}
                        >
                            Situação
                        </Text>

                        <View
                            style={styles.opcoesContainer}
                        >

                            {/* Todos */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    statusFiltro === "TODOS" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    statusFiltro === "TODOS" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setStatusFiltro("TODOS")}
                                title="Todos"
                            />

                            {/* Situação: P */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    statusFiltro === "P" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    statusFiltro === "P" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setStatusFiltro("P")}
                                title="P"
                            />

                            {/* Situação: E */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    statusFiltro === "E" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    statusFiltro === "E" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setStatusFiltro("E")}
                                title="E"
                            />

                            {/* Situação: C */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    statusFiltro === "C" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    statusFiltro === "C" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setStatusFiltro("C")}
                                title="C"
                            />
                        </View>
                    </View>

                    {/* Período */}
                    <View
                        style={styles.filtroGrupo}
                    >

                        <Text
                            style={pagesStyles.label}
                        >
                            Período
                        </Text>

                        <View
                            style={styles.opcoesContainer}
                        >

                            {/* Todos */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    periodoFiltro === "TODOS" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    periodoFiltro === "TODOS" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setPeriodoFiltro("TODOS")}
                                title="Todos"
                            />

                            {/* Hoje */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    periodoFiltro === "HOJE" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    periodoFiltro === "HOJE" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setPeriodoFiltro("HOJE")}
                                title="Hoje"
                            />

                            {/* 7 Dias */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    periodoFiltro === "7_DIAS" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    periodoFiltro === "7_DIAS" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setPeriodoFiltro("7_DIAS")}
                                title="7 dias"
                            />

                            {/* 30 Dias */}
                            <AnimatedButton
                                stylesPressable={[
                                    styles.filtroBotao,
                                    periodoFiltro === "30_DIAS" && styles.filtroSelecionado,
                                ]}
                                stylesPressablePressed={styles.filtroBotaoPressed}
                                stylesText={[
                                    pagesStyles.text,
                                    styles.filtroTexto,
                                    periodoFiltro === "30_DIAS" && styles.filtroTextoSelecionado,
                                ]}
                                onPress={() => setPeriodoFiltro("30_DIAS")}
                                title="30 dias"
                            />
                        </View>
                    </View>

                    {/* Limpar filtros */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.botaoLimpar,
                            pressed && styles.botaoLimparPressed,
                        ]}
                        onPress={onClear}
                    >

                        <View style={styles.fecharFiltros}>

                            <Ionicons
                                name="close-circle-outline"
                                size={17}
                                color="#8D5C3B"
                            />

                            <Text
                                style={pagesStyles.link}
                            >
                                Limpar filtros
                            </Text>
                        </View>
                    </Pressable>
                </View>
            </Animated.View >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 14,
        padding: 6,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E8E2D8",
        borderRadius: 18,
        shadowColor: "#30241A",
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
        backgroundColor: "#F7F3EE",
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
        borderTopColor: "#F2ECE3",
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
        borderColor: "#DCD4C7",
        backgroundColor: "#FAF8F5",
        alignItems: "center",
        justifyContent: "center",
    },
    filtroSelecionado: {
        backgroundColor: "#79553D",
        borderColor: "#79553D",
        shadowColor: "#79553D",
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
        color: "#6E665E",
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
        backgroundColor: "#79553D",
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