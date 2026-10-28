import { Colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import { AnimatedButton } from "@/src/components/AnimatedButton";
import { PagesLayout, pagesStyles } from "@/src/components/ScreensLayout";
import useResponsive from "@/src/hooks/useResponsive";
import { supabase } from "@/src/lib/supabase";

export default function Configurations() {
    const { maxCardWidth, isMobile } = useResponsive();

    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [createdAt, setCreatedAt] = useState<string | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const [notificacoes, setNotificacoes] = useState(true);
    const [atualizacoesAuto, setAtualizacoesAuto] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        carregarUsuario();
    }, []);

    async function carregarUsuario() {
        setLoadingUser(true);
        try {
            const { data, error } = await supabase.auth.getUser();
            if (data?.user) {
                setUserEmail(data.user.email ?? "Usuário PalletCore");
                setUserId(data.user.id);
                if (data.user.created_at) {
                    const date = new Date(data.user.created_at);
                    setCreatedAt(
                        date.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        })
                    );
                }
            }
        } catch (e) {
            console.log("Erro ao carregar usuário:", e);
        } finally {
            setLoadingUser(false);
        }
    }

    async function handleLogoff() {
        Alert.alert(
            "Encerrar Sessão",
            "Deseja realmente sair da sua conta?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        setLoggingOut(true);
                        const { error } = await supabase.auth.signOut();
                        setLoggingOut(false);
                        if (error) {
                            Alert.alert("Erro", "Não foi possível desconectar.");
                            return;
                        }
                        router.replace("/(auth)/signIn");
                    },
                },
            ]
        );
    }

    function getInitials(email?: string | null) {
        if (!email) return "PC";
        const clean = email.split("@")[0].replace(/[^a-zA-Z]/g, "");
        return (clean.slice(0, 2) || "PC").toUpperCase();
    }

    return (
        <PagesLayout scroll={true} scrollContent={{ paddingVertical: 20 }}>
            <View style={styles.container}>
                <View style={[styles.mainCard, pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    {/* CABEÇALHO */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="settings" size={24} color={Colors.hex0B4F6C} />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={pagesStyles.brand}>SISTEMA E PREFERÊNCIAS</Text>
                            <Text style={[pagesStyles.title, styles.titleText]}>
                                Configurações
                            </Text>
                            <Text style={pagesStyles.description}>
                                Detalhes da conta, ambiente do sistema e especificações do projeto
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* CARTÃO DE PERFIL DO USUÁRIO */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(userEmail)}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <View style={styles.profileNameRow}>
                                <Text style={styles.profileName}>
                                    {loadingUser ? "Carregando..." : userEmail || "Usuário PalletCore"}
                                </Text>
                                <View style={styles.badgeAdmin}>
                                    <Ionicons name="shield-checkmark" size={12} color={Colors.hex166534} />
                                    <Text style={styles.badgeAdminText}>Administrador</Text>
                                </View>
                            </View>

                            <Text style={styles.profileSubtext}>
                                {createdAt ? `Membro desde ${createdAt}` : "Sessão autenticada"}
                            </Text>

                            {userId && (
                                <Text style={styles.profileId} numberOfLines={1}>
                                    ID: {userId}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* PREFERÊNCIAS */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="options-outline" size={17} color={Colors.hex0B4F6C} />
                            <Text style={styles.sectionTitle}>Preferências do Aplicativo</Text>
                        </View>

                        <View style={styles.prefList}>
                            <View style={styles.prefItem}>
                                <View style={styles.prefTextContainer}>
                                    <Text style={styles.prefTitle}>Notificações Operacionais</Text>
                                    <Text style={styles.prefDescription}>
                                        Avisos sobre novos pedidos e alterações de estoque
                                    </Text>
                                </View>
                                <Switch
                                    value={notificacoes}
                                    onValueChange={setNotificacoes}
                                    thumbColor={notificacoes ? Colors.hex0B4F6C : Colors.hexD9E3EA}
                                    trackColor={{ false: Colors.hexD9E3EA, true: Colors.hexBAE6FD }}
                                />
                            </View>

                            <View style={styles.prefDivider} />

                            <View style={styles.prefItem}>
                                <View style={styles.prefTextContainer}>
                                    <Text style={styles.prefTitle}>Sincronização em Tempo Real</Text>
                                    <Text style={styles.prefDescription}>
                                        Atualizar listagens automaticamente com o banco de dados
                                    </Text>
                                </View>
                                <Switch
                                    value={atualizacoesAuto}
                                    onValueChange={setAtualizacoesAuto}
                                    thumbColor={atualizacoesAuto ? Colors.hex0B4F6C : Colors.hexD9E3EA}
                                    trackColor={{ false: Colors.hexD9E3EA, true: Colors.hexBAE6FD }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* DADOS DO PROJETO DE TCC */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="school-outline" size={17} color={Colors.hex0B4F6C} />
                            <Text style={styles.sectionTitle}>Informações do Projeto (TCC)</Text>
                        </View>

                        <View style={styles.tccGrid}>
                            <View style={styles.tccItem}>
                                <Text style={styles.tccLabel}>PROJETO</Text>
                                <Text style={styles.tccValue}>PalletCore - Gestão de Pedidos e Clientes</Text>
                            </View>

                            <View style={styles.tccItem}>
                                <Text style={styles.tccLabel}>FINALIDADE</Text>
                                <Text style={styles.tccValue}>Trabalho de Conclusão de Curso</Text>
                            </View>

                            <View style={styles.tccItem}>
                                <Text style={styles.tccLabel}>STACK TECNOLÓGICA</Text>
                                <Text style={styles.tccValue}>React Native • Expo v54 • TypeScript • NativeWind</Text>
                            </View>

                            <View style={styles.tccItem}>
                                <Text style={styles.tccLabel}>BACKEND & BANCO DE DADOS</Text>
                                <View style={styles.tccRow}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.tccValue}>Supabase PostgreSQL (Ativo & Seguro via RLS)</Text>
                                </View>
                            </View>

                            <View style={styles.tccItem}>
                                <Text style={styles.tccLabel}>VERSÃO</Text>
                                <Text style={styles.tccValue}>1.0.0 (Release Acadêmica)</Text>
                            </View>
                        </View>
                    </View>

                    {/* AÇÕES DE CONTA */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="key-outline" size={17} color={Colors.hex0B4F6C} />
                            <Text style={styles.sectionTitle}>Ações da Conta</Text>
                        </View>

                        <View style={styles.actionsContainer}>
                            <Pressable
                                onPress={() => router.push("/(auth)/sendResetPassword")}
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    pressed && styles.actionButtonPressed,
                                ]}
                            >
                                <View style={styles.actionIconContainer}>
                                    <Ionicons name="lock-closed-outline" size={18} color={Colors.hex0B4F6C} />
                                </View>
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionTitle}>Alterar Senha de Acesso</Text>
                                    <Text style={styles.actionSubtitle}>
                                        Receba um link de redefinição no seu e-mail
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={Colors.hex94A3B8} />
                            </Pressable>

                            <Pressable
                                onPress={handleLogoff}
                                disabled={loggingOut}
                                style={({ pressed }) => [
                                    styles.actionButtonDestructive,
                                    pressed && styles.actionButtonDestructivePressed,
                                ]}
                            >
                                <View style={styles.actionIconContainerDestructive}>
                                    <Ionicons name="log-out-outline" size={18} color={Colors.hexDC2626} />
                                </View>
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionTitleDestructive}>
                                        {loggingOut ? "Encerrando..." : "Desconectar da Conta"}
                                    </Text>
                                    <Text style={styles.actionSubtitleDestructive}>
                                        Sair com segurança deste dispositivo
                                    </Text>
                                </View>
                                {loggingOut ? (
                                    <ActivityIndicator size="small" color={Colors.hexDC2626} />
                                ) : (
                                    <Ionicons name="chevron-forward" size={18} color={Colors.hexF87171} />
                                )}
                            </Pressable>
                        </View>
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
    mainCard: {
        width: "100%",
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
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: 16,
        backgroundColor: Colors.hexF8FAFC,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.hexDDE8EF,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: Colors.hex0B4F6C,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: Colors.hex0B4F6C,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    avatarText: {
        fontSize: 18,
        fontFamily: "WorksansBold",
        color: Colors.hexFFFDF9,
    },
    profileInfo: {
        flex: 1,
        gap: 3,
    },
    profileNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    profileName: {
        fontSize: 16,
        fontFamily: "WorksansBold",
        color: Colors.hex0F172A,
    },
    badgeAdmin: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: Colors.hexDCFCE7,
        borderWidth: 1,
        borderColor: Colors.hexBBF7D0,
    },
    badgeAdminText: {
        fontSize: 11,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex166534,
    },
    profileSubtext: {
        fontSize: 13,
        fontFamily: "WorksansRegular",
        color: Colors.hex475569,
    },
    profileId: {
        fontSize: 11,
        fontFamily: "WorksansRegular",
        color: Colors.hex94A3B8,
    },
    section: {
        marginTop: 22,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0F172A,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    prefList: {
        backgroundColor: Colors.hexF8FAFC,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.hexDDE8EF,
        paddingHorizontal: 16,
    },
    prefItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        gap: 12,
    },
    prefDivider: {
        height: 1,
        backgroundColor: Colors.hexE2ECF2,
    },
    prefTextContainer: {
        flex: 1,
        gap: 2,
    },
    prefTitle: {
        fontSize: 14,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0F172A,
    },
    prefDescription: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: Colors.hex475569,
    },
    tccGrid: {
        backgroundColor: Colors.hexF8FAFC,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.hexDDE8EF,
        padding: 16,
        gap: 12,
    },
    tccItem: {
        gap: 3,
    },
    tccLabel: {
        fontSize: 10,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0891B2,
        letterSpacing: 0.6,
    },
    tccValue: {
        fontSize: 13,
        fontFamily: "WorksansMedium",
        color: Colors.hex0F172A,
    },
    tccRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.hex16A34A,
    },
    actionsContainer: {
        gap: 10,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: Colors.hexF8FAFC,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.hexDDE8EF,
        padding: 14,
    },
    actionButtonPressed: {
        backgroundColor: Colors.hexE5EEF3,
    },
    actionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.hexE8F1F5,
        alignItems: "center",
        justifyContent: "center",
    },
    actionTextContainer: {
        flex: 1,
        gap: 2,
    },
    actionTitle: {
        fontSize: 14,
        fontFamily: "WorksansSemiBold",
        color: Colors.hex0F172A,
    },
    actionSubtitle: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: Colors.hex475569,
    },
    actionButtonDestructive: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: Colors.hexFEF2F2,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.hexFECACA,
        padding: 14,
    },
    actionButtonDestructivePressed: {
        backgroundColor: Colors.hexFEE2E2,
    },
    actionIconContainerDestructive: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.hexFEE2E2,
        alignItems: "center",
        justifyContent: "center",
    },
    actionTitleDestructive: {
        fontSize: 14,
        fontFamily: "WorksansSemiBold",
        color: Colors.hexDC2626,
    },
    actionSubtitleDestructive: {
        fontSize: 12,
        fontFamily: "WorksansRegular",
        color: Colors.hex991B1B,
    },
});
