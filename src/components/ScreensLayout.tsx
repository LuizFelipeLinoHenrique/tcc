import { Colors } from "@/src/theme/colors";
import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PagesLayoutProps = PropsWithChildren<{
    scroll: boolean;
    scrollContent?: StyleProp<ViewStyle>;
    noScrollContent?: StyleProp<ViewStyle>;
}>;

export function PagesLayout({ children, scroll, scrollContent, noScrollContent }: PagesLayoutProps) {
    return (
        <SafeAreaView style={pagesStyles.safeArea}>
            <KeyboardAvoidingView
                style={pagesStyles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >

                {scroll ? (
                    <ScrollView
                        contentContainerStyle={[pagesStyles.scrollContent, scrollContent]}
                    >
                        {children}
                    </ScrollView>
                ) : (
                    <View style={[pagesStyles.container, noScrollContent]}>
                        {children}
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export const pagesStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.hexF4F7F9,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: 20,
    },
    container: {
        flex: 1,
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: 20,
    },
    card: {
        width: "100%",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.hexDCE7EE,
        borderRadius: 20,
        padding: 24,
        shadowColor: Colors.hex082F42,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 2,
    },
    brand: {
        color: Colors.hex0891B2,
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        letterSpacing: 1.4,
        textTransform: "uppercase"
    },
    title: {
        marginVertical: 6,
        color: Colors.hex0F172A,
        fontSize: 26,
        lineHeight: 32,
        fontFamily: "WorksansBold"
    },
    graphTitle: {
        color: Colors.hex0F172A,
        fontSize: 20,
        lineHeight: 26,
        marginBottom: 14,
        fontFamily: "WorksansBold"
    },
    description: {
        marginTop: 6,
        color: Colors.hex475569,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: "WorksansRegular"
    },
    form: {
        marginTop: 20,
        gap: 16
    },
    field: {
        gap: 6
    },
    label: {
        color: Colors.hex1E293B,
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        letterSpacing: 0.2,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: Colors.hexCFDDE6,
        borderRadius: 12,
        backgroundColor: Colors.hexF8FAFC,
        paddingHorizontal: 15,
        color: Colors.hex0F172A,
        fontSize: 15,
        fontFamily: "WorksansRegular",
    },
    primaryButton: {
        minHeight: 48,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: Colors.hex0B4F6C,
        shadowColor: Colors.hex0B4F6C,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 2,
    },
    primaryButtonPressed: {
        backgroundColor: Colors.hex083A50,
        transform: [{ scale: 0.99 }]
    },
    primaryButtonText: {
        color: Colors.hexFFFDF9,
        fontSize: 15,
        fontFamily: "WorksansSemiBold",
        letterSpacing: 0.3,
    },
    link: {
        color: Colors.hex0E7490,
        fontSize: 13,
        fontFamily: "WorksansSemiBold"
    },
    text: {
        color: Colors.hex1E293B,
        fontSize: 15,
        lineHeight: 21,
        fontFamily: "WorksansRegular"
    },
    textBold: {
        color: Colors.hex0F172A,
        fontSize: 15,
        lineHeight: 21,
        fontFamily: "WorksansBold"
    },
    footer: {
        marginTop: 20,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 4
    },
    footerText: {
        color: Colors.hex475569,
        fontSize: 13,
        fontFamily: "WorksansRegular"
    },
    error: {
        borderWidth: 1,
        borderColor: Colors.hexF0CBC2,
        borderRadius: 12,
        backgroundColor: Colors.hexFDF2EF,
        paddingHorizontal: 14,
        paddingVertical: 11
    },
    errorText: {
        color: Colors.hexA74E3C,
        fontSize: 14,
        fontFamily: "WorksansMedium"
    },
    warning: {
        borderWidth: 1,
        borderColor: Colors.hexEADDC6,
        borderRadius: 12,
        backgroundColor: Colors.hexFDF8F0,
        paddingHorizontal: 14,
        paddingVertical: 11
    },
    warningText: {
        color: Colors.hex9A6B24,
        fontSize: 14,
        fontFamily: "WorksansMedium"
    },
    secondaryButton: {
        minHeight: 48,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.hexCBD8E2,
        backgroundColor: Colors.white,
    },
    secondaryButtonText: {
        color: Colors.hex334155,
        fontSize: 14,
        fontFamily: "WorksansSemiBold"
    },
    animatedView: {
        flex: 1
    }
});
