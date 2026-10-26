import { Ionicons } from "@expo/vector-icons";
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

export type SupplierDetail = {
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
};

type SupplierDetailsCardProps = {
    title?: string;
    data: SupplierDetail[];
    style?: StyleProp<ViewStyle>;
};

export function SupplierDetailsCard({
    title = "Detalhes do Fornecedor",
    data,
    style,
}: SupplierDetailsCardProps) {
    function getDetail(label: string) {
        return data.find((item) => item.label === label);
    }

    function renderValue(detail?: SupplierDetail, highlight = false) {
        if (!detail) return null;

        const value =
            typeof detail.value === "string" || typeof detail.value === "number" ? (
                <Text
                    style={[
                        styles.value,
                        highlight && styles.highlightValue,
                    ]}
                >
                    {detail.value}
                </Text>
            ) : (
                detail.value
            );

        return value;
    }

    function renderDetail(detail?: SupplierDetail, fullWidth = false, highlight = false) {
        if (!detail) return null;

        return (
            <View
                style={[
                    styles.detail,
                    fullWidth && styles.detailFullWidth,
                ]}
            >
                <Text style={styles.label}>
                    {detail.label}
                </Text>

                {renderValue(detail, highlight)}
            </View>
        );
    }

    const { maxCardWidth } = useResponsive();

    const id = getDetail("ID do Fornecedor");
    const nome = getDetail("Nome / Razão Social");
    const cnpj = getDetail("CNPJ");
    const email = getDetail("E-mail");
    const telefone = getDetail("Telefone");
    const contato = getDetail("Pessoa de Contato");
    const endereco = getDetail("Endereço");

    return (
        <View
            style={[
                pagesStyles.card,
                styles.card,
                { maxWidth: maxCardWidth },
                style,
            ]}
        >
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Ionicons name="business" size={24} color="#0B4F6C" />
                </View>
                <View style={styles.headerTitle}>
                    <Text style={pagesStyles.brand}>
                        DADOS DO FORNECEDOR
                    </Text>
                    <Text style={styles.title}>
                        {nome ? String(nome.value) : title}
                    </Text>
                </View>
                {id && (
                    <View style={styles.idPill}>
                        <Text style={styles.idText}>ID #{String(id.value)}</Text>
                    </View>
                )}
            </View>

            {/* IDENTIFICAÇÃO */}
            {(id || nome || cnpj) && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="finger-print-outline" size={17} color="#0B4F6C" />
                        <Text style={styles.sectionTitle}>Identificação</Text>
                    </View>

                    <View style={styles.details}>
                        {renderDetail(id)}
                        {renderDetail(nome)}
                        {cnpj && renderDetail(cnpj, true)}
                    </View>
                </View>
            )}

            {/* CONTATO */}
            {(email || telefone || contato) && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="call-outline" size={17} color="#0B4F6C" />
                        <Text style={styles.sectionTitle}>Contato e Representante</Text>
                    </View>

                    <View style={styles.details}>
                        {renderDetail(email)}
                        {renderDetail(telefone)}
                        {contato && renderDetail(contato, true)}
                    </View>
                </View>
            )}

            {/* LOCALIZAÇÃO */}
            {endereco && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location-outline" size={17} color="#0B4F6C" />
                        <Text style={styles.sectionTitle}>Localização</Text>
                    </View>

                    <View style={styles.details}>
                        {renderDetail(endereco, true)}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 24,
    },
    header: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 8,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#EDF3F7",
        borderWidth: 1,
        borderColor: "#D4E1E9",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontSize: 20,
        fontFamily: "WorksansBold",
        color: "#0F172A",
        marginTop: 2,
    },
    idPill: {
        backgroundColor: "#E0EDF4",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    idText: {
        fontSize: 12,
        fontFamily: "WorksansBold",
        color: "#0B4F6C",
    },
    section: {
        width: "100%",
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E2EBF0",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "WorksansBold",
        color: "#0B4F6C",
    },
    details: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    detail: {
        flexGrow: 1,
        flexBasis: "45%",
        minWidth: 170,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#D9E5EC",
        borderRadius: 12,
        padding: 12,
        gap: 4,
    },
    detailFullWidth: {
        flexBasis: "100%",
    },
    label: {
        color: "#64748B",
        fontSize: 12,
        fontFamily: "WorksansMedium",
    },
    value: {
        fontSize: 14,
        lineHeight: 20,
        color: "#0F172A",
        fontFamily: "WorksansRegular",
    },
    highlightValue: {
        fontSize: 15,
        fontFamily: "WorksansBold",
        color: "#0B4F6C",
    },
});
