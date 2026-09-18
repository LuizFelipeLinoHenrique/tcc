import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedButton } from "./AnimatedButton";
import { PagesLayout, pagesStyles } from "./ScreensLayout";

type ConfirmationCardProps = {
    setCardConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
    action: () => void;
}

export default function ConfirmationCard({ action, setCardConfirmation }: ConfirmationCardProps) {
    return (
        <PagesLayout scroll={false}>
            <View style={styles.overlay}>
                <View style={[pagesStyles.card, styles.card]}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="log-out-outline" size={28} color="#A74E3C" />
                    </View>

                    <Text style={styles.title}>
                        Encerrar Sessão
                    </Text>

                    <Text style={styles.description}>
                        Tem certeza de que deseja sair do sistema? Seus dados sincronizados foram salvos.
                    </Text>

                    <View style={styles.containerButtons}>
                        <AnimatedButton
                            title="Sim, sair do sistema"
                            stylesPressable={[styles.confirmButton]}
                            stylesPressablePressed={styles.confirmButtonPressed}
                            stylesText={styles.confirmButtonText}
                            onPress={action}
                        />
                        <AnimatedButton
                            title="Continuar conectado"
                            stylesPressable={[pagesStyles.secondaryButton, styles.cancelButton]}
                            stylesText={pagesStyles.secondaryButtonText}
                            onPress={() => setCardConfirmation(false)}
                        />
                    </View>
                </View>
            </View>
        </PagesLayout>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        maxWidth: 420,
        alignItems: "center",
        textAlign: "center",
        paddingVertical: 32,
        paddingHorizontal: 26,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#FDF2EF",
        borderWidth: 1,
        borderColor: "#F0CBC2",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontFamily: "WorksansBold",
        color: "#2C2520",
        marginBottom: 8,
        textAlign: "center",
    },
    description: {
        fontSize: 14,
        fontFamily: "WorksansRegular",
        color: "#6E655B",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    containerButtons: {
        width: "100%",
        gap: 10,
    },
    confirmButton: {
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: "#A74E3C",
        shadowColor: "#A74E3C",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
        elevation: 2,
    },
    confirmButtonPressed: {
        backgroundColor: "#8E3D2D",
        transform: [{ scale: 0.99 }],
    },
    confirmButtonText: {
        color: "#FFFDF9",
        fontSize: 15,
        fontFamily: "WorksansSemiBold",
    },
    cancelButton: {
        width: "100%",
    },
});