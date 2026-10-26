import { Ionicons } from "@expo/vector-icons";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import useResponsive from "../hooks/useResponsive";

export type Cliente = {
    id: number;
    nome: string;
    endereco: string;
    email: string;
    telefone: number;
};

type ClientCardProps = {
    cliente: Cliente;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
};

function getInitials(name: string): string {
    if (!name) return "CL";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhone(phone: number | string): string {
    const s = String(phone || "").replace(/\D/g, "");
    if (s.length === 11) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 7)}-${s.substring(7)}`;
    }
    if (s.length === 10) {
        return `(${s.substring(0, 2)}) ${s.substring(2, 6)}-${s.substring(6)}`;
    }
    return String(phone);
}

export function ClientCard({
    cliente,
    iconDetails,
    iconEdit,
    iconDelete,
}: ClientCardProps) {
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
                        <Text style={styles.avatarText}>
                            {getInitials(cliente.nome)}
                        </Text>
                    </View>

                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>
                                {cliente.nome}
                            </Text>
                            <View style={styles.idBadge}>
                                <Text style={styles.idBadgeText}>#{cliente.id}</Text>
                            </View>
                        </View>
                        <Text style={styles.subtext}>Cliente cadastrado</Text>
                    </View>
                </View>

                {/* Linha Divisória */}
                <View style={styles.divider} />

                {/* Detalhes de Contato */}
                <View style={styles.detailsList}>
                    <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={15} color="#64748B" style={styles.detailIcon} />
                        <Text style={styles.detailText} numberOfLines={1}>
                            {cliente.email}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={15} color="#64748B" style={styles.detailIcon} />
                        <Text style={styles.detailText} numberOfLines={1}>
                            {formatPhone(cliente.telefone)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={15} color="#64748B" style={styles.detailIcon} />
                        <Text style={styles.detailText} numberOfLines={2}>
                            {cliente.endereco}
                        </Text>
                    </View>
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
                        <Ionicons name="eye-outline" size={16} color="#0B4F6C" />
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
                        <Ionicons name="pencil-outline" size={16} color="#0B4F6C" />
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
        borderColor: "#DCE7EE",
        padding: 18,
        shadowColor: "#082F42",
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
        backgroundColor: "#EDF3F7",
        borderWidth: 1.5,
        borderColor: "#D4E1E9",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 15,
        fontFamily: "WorksansBold",
        color: "#0B4F6C",
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
        color: "#0F172A",
        flex: 1,
    },
    idBadge: {
        backgroundColor: "#E0EDF4",
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    idBadgeText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: "#0B4F6C",
    },
    subtext: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: "#64748B",
        marginTop: 1,
    },
    divider: {
        height: 1,
        backgroundColor: "#E2EBF0",
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
        color: "#1E293B",
        flex: 1,
        lineHeight: 18,
    },
    actionsBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#EDF3F7",
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
        backgroundColor: "#F0F5F8",
    },
    detailsBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#0B4F6C",
    },
    editBtn: {
        flex: 1,
        backgroundColor: "#E2EBF0",
    },
    editBtnText: {
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        color: "#0B4F6C",
    },
    deleteBtn: {
        backgroundColor: "#FDF2EF",
        paddingHorizontal: 10,
    },
});