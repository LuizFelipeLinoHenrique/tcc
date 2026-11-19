import { Theme } from "@/src/theme/tokens";
import { Colors } from "@/src/theme/colors";
import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewProps, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PagesLayoutProps = PropsWithChildren<{
    scroll: boolean;
    scrollContent?: StyleProp<ViewStyle>;
    noScrollContent?: StyleProp<ViewStyle>;
    keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
}>;

export function PagesLayout({ children, scroll, scrollContent, noScrollContent, keyboardShouldPersistTaps }: PagesLayoutProps) {
    const compact = useWindowDimensions().width < 760;
    return (
        <SafeAreaView style={pagesStyles.safeArea}>
            <KeyboardAvoidingView
                style={pagesStyles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >

                {scroll ? (
                    <ScrollView
                        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[pagesStyles.scrollContent, compact && { padding: 16 }, scrollContent]}
                    >
                        {children}
                    </ScrollView>
                ) : (
                    <View style={[pagesStyles.container, compact && { padding: 16 }, noScrollContent]}>
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
        padding: Theme.space.xl,
    },
    container: {
        flex: 1,
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: Theme.space.xl,
    },
    card: {
        width: "100%",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.hexDCE7EE,
        borderRadius: Theme.radius.panel,
        padding: 24,
        boxShadow: "none",
        elevation: 0,
    },
    brand: {
        color: Colors.hex0891B2,
        fontSize: 12,
        fontFamily: Theme.font.semibold,
        letterSpacing: 1.4,
        textTransform: "uppercase"
    },
    pageHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 20,
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
        fontFamily: Theme.font.regular
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
        fontFamily: Theme.font.semibold,
        letterSpacing: 0.2,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: Colors.hexCFDDE6,
        borderRadius: Theme.radius.panel,
        backgroundColor: Colors.white,
        paddingHorizontal: 15,
        color: Colors.hex0F172A,
        fontSize: 15,
        fontFamily: Theme.font.regular,
    },
    primaryButton: {
        minHeight: 48,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: Theme.radius.panel,
        backgroundColor: Colors.hex0B4F6C,
        boxShadow: "none",
        elevation: 0,
    },
    primaryButtonPressed: {
        backgroundColor: Colors.hex083A50,
        transform: [{ scale: 0.99 }]
    },
    primaryButtonText: {
        color: Colors.hexFFFDF9,
        fontSize: 15,
        fontFamily: Theme.font.semibold,
        letterSpacing: 0.3,
    },
    link: {
        color: Colors.hex0E7490,
        fontSize: 13,
        fontFamily: Theme.font.semibold
    },
    text: {
        color: Colors.hex1E293B,
        fontSize: 15,
        lineHeight: 21,
        fontFamily: Theme.font.regular
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
        fontFamily: Theme.font.regular
    },
    error: {
        borderWidth: 1,
        borderColor: Colors.hexF0CBC2,
        borderRadius: Theme.radius.panel,
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
        borderRadius: Theme.radius.panel,
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
        borderRadius: Theme.radius.panel,
        borderWidth: 1.5,
        borderColor: Colors.hexCBD8E2,
        backgroundColor: Colors.white,
    },
    secondaryButtonText: {
        color: Colors.hex334155,
        fontSize: 14,
        fontFamily: Theme.font.semibold
    },
    animatedView: {
        flex: 1
    }
});
