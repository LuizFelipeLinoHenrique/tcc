import { Theme } from "@/src/theme/tokens";
import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import useResponsive from "@/src/hooks/useResponsive";
import { PagesLayout, pagesStyles } from "./ScreensLayout";

type RegistrationLayoutProps = PropsWithChildren<{
    title: string;
    keepKeyboardTaps?: boolean;
}>;

export function RegistrationLayout({ title, keepKeyboardTaps, children }: RegistrationLayoutProps) {
    const { isMobile } = useResponsive();

    return (
        <PagesLayout scroll keyboardShouldPersistTaps={keepKeyboardTaps ? "handled" : undefined}>
            <View style={registrationStyles.content}>
                <View style={pagesStyles.pageHeader}>
                    <Text accessibilityRole="header" style={pagesStyles.title}>{title}</Text>
                </View>
                <View style={[pagesStyles.card, registrationStyles.panel, isMobile && registrationStyles.compactPanel]}>
                    {children}
                </View>
            </View>
        </PagesLayout>
    );
}

export const registrationStyles = StyleSheet.create({
    content: {
        width: "100%",
        flexGrow: 1,
    },
    panel: {
        flexGrow: 1,
        justifyContent: "space-between",
        gap: Theme.space.xl,
    },
    compactPanel: {
        padding: Theme.space.lg,
    },
    sectionTitle: {
        width: "100%",
        fontFamily: Theme.font.semibold,
        fontSize: 16,
        color: Theme.color.ink,
    },
    actions: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: Theme.space.md,
        borderTopWidth: 1,
        borderTopColor: Theme.color.border,
        paddingTop: Theme.space.lg,
    },
    compactActions: {
        flexDirection: "column-reverse",
    },
});
