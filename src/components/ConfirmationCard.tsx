import React from "react";
import { StyleSheet, Text, View } from "react-native";
import useResponsive from "../hooks/useResponsive";
import { AnimatedButton } from "./AnimatedButton";
import { PagesLayout, pagesStyles } from "./ScreensLayout";

type ConfirmationCardProps = {
    setCardConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
    action: () => void
}

export default function ConfirmationCard({ action, setCardConfirmation }: ConfirmationCardProps) {

    const { maxCardWidth } = useResponsive();

    return (
        <PagesLayout scroll={false}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={[pagesStyles.card, { maxWidth: maxCardWidth }]}>
                    <View>
                        <Text style={[pagesStyles.textBold, { fontSize: 18 }]}>
                            Realmente deseja sair?
                        </Text>
                    </View>
                    <View style={styles.containerButtons}>
                        <AnimatedButton
                            title={"Confirmar"}
                            stylesPressable={[styles.confirmButton, { paddingHorizontal: 10 }]}
                            stylesPressablePressed={pagesStyles.primaryButtonPressed}
                            stylesText={pagesStyles.primaryButtonText}
                            onPress={action}
                        />
                        <AnimatedButton
                            title={"Cancelar"}
                            stylesPressable={[styles.cancelButton, { paddingHorizontal: 10 }]}
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
    text: {
        marginBottom: 20
    },
    containerButtons: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        gap: 8,
        marginTop: 6
    },
    confirmButton: {
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: "#79553D",
    },
    cancelButton: {
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D8CFC3",
    }
})