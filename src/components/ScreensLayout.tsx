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
        backgroundColor: "#F6F3ED",
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
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E8E2D8",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#30241A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 2,
    },
    brand: {
        color: "#9A6540",
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        letterSpacing: 1.4,
        textTransform: "uppercase"
    },
    title: {
        marginVertical: 6,
        color: "#2C2520",
        fontSize: 26,
        lineHeight: 32,
        fontFamily: "WorksansBold"
    },
    graphTitle: {
        color: "#2C2520",
        fontSize: 20,
        lineHeight: 26,
        marginBottom: 14,
        fontFamily: "WorksansBold"
    },
    description: {
        marginTop: 6,
        color: "#6E655B",
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
        color: "#463E36",
        fontSize: 12,
        fontFamily: "WorksansSemiBold",
        letterSpacing: 0.2,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: "#DCD4C7",
        borderRadius: 12,
        backgroundColor: "#FAF8F5",
        paddingHorizontal: 15,
        color: "#2C2520",
        fontSize: 15,
        fontFamily: "WorksansRegular",
    },
    primaryButton: {
        minHeight: 48,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: "#79553D",
        shadowColor: "#79553D",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 2,
    },
    primaryButtonPressed: {
        backgroundColor: "#63422C",
        transform: [{ scale: 0.99 }]
    },
    primaryButtonText: {
        color: "#FFFDF9",
        fontSize: 15,
        fontFamily: "WorksansSemiBold",
        letterSpacing: 0.3,
    },
    link: {
        color: "#8D5C3B",
        fontSize: 13,
        fontFamily: "WorksansSemiBold"
    },
    text: {
        color: "#38312B",
        fontSize: 15,
        lineHeight: 21,
        fontFamily: "WorksansRegular"
    },
    textBold: {
        color: "#2C2520",
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
        color: "#766E64",
        fontSize: 13,
        fontFamily: "WorksansRegular"
    },
    error: {
        borderWidth: 1,
        borderColor: "#F0CBC2",
        borderRadius: 12,
        backgroundColor: "#FDF2EF",
        paddingHorizontal: 14,
        paddingVertical: 11
    },
    errorText: {
        color: "#A74E3C",
        fontSize: 14,
        fontFamily: "WorksansMedium"
    },
    warning: {
        borderWidth: 1,
        borderColor: "#EADDC6",
        borderRadius: 12,
        backgroundColor: "#FDF8F0",
        paddingHorizontal: 14,
        paddingVertical: 11
    },
    warningText: {
        color: "#9A6B24",
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
        borderColor: "#D8CFC3",
        backgroundColor: "#FFFFFF",
    },
    secondaryButtonText: {
        color: "#5C5248",
        fontSize: 14,
        fontFamily: "WorksansSemiBold"
    },
    animatedView: {
        flex: 1
    }
});