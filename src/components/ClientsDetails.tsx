import React from "react";

import {
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";

import useResponsive from "../hooks/useResponsive";
import { pagesStyles } from "./ScreensLayout";

export type ClientDetail = {
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
};

type ClientDetailsCardProps = {
    title?: string;
    data: ClientDetail[];
    style?: StyleProp<ViewStyle>;
};

export function ClientDetailsCard({
    title = "Detalhes do Cliente",
    data,
    style,
}: ClientDetailsCardProps) {

    function getDetail(label: string) {
        return data.find(
            (item) => item.label === label
        );
    }

    function renderValue(
        detail?: ClientDetail,
        highlight = false
    ) {
        if (!detail) {
            return null;
        }

        const value =
            typeof detail.value === "string" ||
                typeof detail.value === "number"
                ? (
                    <Text
                        style={[
                            pagesStyles.text,
                            styles.value,
                            highlight &&
                            styles.highlightValue,
                        ]}
                    >
                        {detail.value}
                    </Text>
                )
                : detail.value;

        return value;
    }

    function renderDetail(
        detail?: ClientDetail,
        fullWidth = false
    ) {
        if (!detail) {
            return null;
        }

        return (
            <View
                style={[
                    styles.detail,
                    fullWidth &&
                    styles.detailFullWidth,
                ]}
            >
                <Text
                    style={[
                        pagesStyles.textBold,
                        styles.label,
                    ]}
                >
                    {detail.label}
                </Text>

                {renderValue(detail)}
            </View>
        );
    }

    const { maxCardWidth } = useResponsive();

    const id = getDetail("ID do Cliente");
    const nome = getDetail("Nome");
    const email = getDetail("E-mail");
    const telefone = getDetail("Telefone");
    const endereco = getDetail("Endereço");

    return (
        <View
            style={[
                pagesStyles.card,
                { maxWidth: maxCardWidth },
                style,
            ]}
        >
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <View style={styles.headerTitle}>
                    <Text
                        style={pagesStyles.brand}
                    >
                        Cliente
                    </Text>

                    <Text
                        style={[
                            pagesStyles.title,
                            styles.title,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            </View>

            {/* IDENTIFICAÇÃO */}
            {(id || nome) && (
                <View style={styles.section}>
                    <Text
                        style={styles.sectionTitle}
                    >
                        Identificação
                    </Text>

                    <View style={styles.details}>
                        {renderDetail(id)}
                        {renderDetail(nome)}
                    </View>
                </View>
            )}

            {/* CONTATO */}
            {(email || telefone) && (
                <View style={styles.section}>
                    <Text
                        style={styles.sectionTitle}
                    >
                        Contato
                    </Text>

                    <View style={styles.details}>
                        {renderDetail(email)}
                        {renderDetail(telefone)}
                    </View>
                </View>
            )}

            {/* ENDEREÇO */}
            {endereco && (
                <View style={styles.section}>
                    <Text
                        style={styles.sectionTitle}
                    >
                        Endereço
                    </Text>

                    <View style={styles.details}>
                        {renderDetail(
                            endereco,
                            true
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({

    header: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 20,
        marginBottom: 8,
    },

    headerTitle: {
        flex: 1,
        minWidth: 0,
    },

    title: {
        marginVertical: 0,
        marginBottom: 0,
    },

    section: {
        width: "100%",
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#DDD5CC",
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#65442F",
        marginBottom: 14,
    },

    details: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },

    detail: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 180,
        gap: 5,
    },

    detailFullWidth: {
        flexBasis: "100%",
    },

    label: {
        opacity: 0.75,
        fontSize: 14,
    },

    value: {
        fontSize: 16,
        lineHeight: 22,
    },

    highlightValue: {
        fontWeight: "700",
        color: "#65442F",
    },
});