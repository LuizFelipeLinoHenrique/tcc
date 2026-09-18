import { Stack } from "expo-router";

import { pagesStyles } from "@/src/components/ScreensLayout";
import TopMenu from "@/src/components/TopMenu";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClientsLayout() {
    return (
        <SafeAreaView style={pagesStyles.safeArea}>
            <TopMenu
                tabs={[
                    {
                        label: "Clientes",
                        value: "clients",
                        route: "/clients",
                    },
                    {
                        label: "Adicionar clientes",
                        value: "add",
                        route: "/addClients",
                    }
                ]}
            />
            <Stack
                screenOptions={{
                    headerShown: false
                }}
            />
        </SafeAreaView>
    );
}