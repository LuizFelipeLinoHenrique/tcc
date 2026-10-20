import { Ionicons } from "@expo/vector-icons";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import useResponsive from "../hooks/useResponsive";

export type Fornecedor = {
    id: number;
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string | number;
    endereco?: string;
    contato?: string;
};

type SupplierCardProps = {
    fornecedor: Fornecedor;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
};

function formatPhone(phone: number | string | undefined): string {
    if (!phone) return "Não informado";
    const s = String(phone).replace(/\D/g, "");
    if (s.length === 11) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 7)}-${s.substring(7)}`;
    }
    if (s.length === 10) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 6)}-${s.substring(6)}`;
    }
    return String(phone);
}

function formatCnpj(cnpj: string | undefined): string {
    if (!cnpj) return "Não informado";
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length === 14) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    return cnpj;
}

export function SupplierCard({
    fornecedor,
    iconDetails,
    iconEdit,
    iconDelete,
}: SupplierCardProps) {
    const { isMobile } = useResponsive();

    return (
        <View
            style={[
                styles.container,
                isMobile ? { width: "100%" } : { width: "50%" },
            ]}
        >
            <View style={styles.card}>
                {/* Header do Card */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Ionicons name="business-outline" size={22} color="#79553D" />
                    </View>

                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>
                                {fornecedor.nome}
                            </Text>
                            <View style={styles.idBadge}>
                                <Text style={styles.idBadgeText}>#{fornecedor.id}</Text>
                            </View>
                        </View>
                        <Text style={styles.subtext}>
                            {fornecedor.contato ? `Contato: ${fornecedor.contato}` : "Fornecedor cadastrado"}
                        </Text>
                    </View>
                </View>

                {/* Linha Divisória */}
                <View style={styles.divider} />

                {/* Detalhes do Fornecedor */}
                <View style={styles.detailsList}>
                    {fornecedor.cnpj ? (
                        <View style={styles.detailRow}>
                            <Ionicons name="card-outline" size={15} color="#8C8276" style={styles.detailIcon} />
                            <Text style={styles.detailText} numberOfLines={1}>
                                {formatCnpj(fornecedor.cnpj)}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={15} color="#8C8276" style={styles.detailIcon} />
                        <Text style={styles.detailText} numberOfLines={1}>
                            {fornecedor.email || "E-mail não informado"}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={15} color="#8C8276" style={styles.detailIcon} />
                        <Text style={styles.detailText} numberOfLines={1}>
                            {formatPhone(fornecedor.telefone)}
                        </Text>
                    </View>

                    {fornecedor.endereco ? (
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={15} color="#8C8276" style={styles.detailIcon} />
                            <Text style={styles.detailText} numberOfLines={2}>
                                {fornecedor.endereco}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Barra de Ações Inferior */}
                <View style={styles.actionsBar}>
                    <Pressable
                        onPress={iconDetails}
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.detailsBtn,
                            pressed && styles.actionBtnPressed,
                        ]}
                        hitSlop={4}
                    >
                        <Ionicons name="eye-outline" size={16} color="#79553D" />
                        <Text style={styles.detailsBtnText}>Detalhes</Text>
                    </Pressable>

                    <Pressable
                        onPress={iconEdit}
                        style={({ pressed }) => [
                            styles.actionBtn,
                            styles.editBtn,
                            pressed && styles.actionBtnPressed,
                        ]}
                        hitSlop={4}
                    >
                        <Ionicons name="pencil-outline" size={16} color="#79553D" />
                        <Text style={styles.editBtnText}>Editar</Text>
                    </Pressable>

                    {iconDelete ? (
                        <Pressable
                            onPress={iconDelete}
                            style={({ pressed }) => [
                                styles.actionBtn,
                                styles.deleteBtn,
                                pressed && styles.actionBtnPressed,
                            ]}
                            hitSlop={4}
                        >
                            <Ionicons name="trash-outline" size={16} color="#A74E3C" />
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E8E2D8",
        padding: 18,
        shadowColor: "#30241A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#F4EFEA",
        borderWidth: 1.5,
        borderColor: "#E3D7CB",
        alignItems: "center",
        justifyContent: "center",
    },
    headerInfo: {
        flex: 1,
        minWidth: 0,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    name: {
        fontSize: 16,
        fontFamily: "WorksansBold",
        color: "#2C2520",
        flex: 1,
    },
    idBadge: {
        backgroundColor: "#F5EEE8",
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    idBadgeText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    subtext: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: "#8C8276",
        marginTop: 1,
    },
    divider: {
        height: 1,
        backgroundColor: "#F0EBE2",
        marginVertical: 14,
    },
    detailsList: {
        gap: 8,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    detailIcon: {
        marginTop: 2,
    },
    detailText: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: "#463E36",
        flex: 1,
        lineHeight: 18,
    },
    actionsBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F4EFEA",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 9,
        gap: 6,
    },
    actionBtnPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.98 }],
    },
    detailsBtn: {
        flex: 1,
        backgroundColor: "#F7F3EE",
    },
    detailsBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    editBtn: {
        flex: 1,
        backgroundColor: "#F0EBE3",
    },
    editBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#79553D",
    },
    deleteBtn: {
        backgroundColor: "#FDF2EF",
        paddingHorizontal: 10,
    },
});
