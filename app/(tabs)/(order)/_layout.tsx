import { Stack } from "expo-router";

import { pagesStyles } from "@/src/components/ScreensLayout";
import TopMenu from "@/src/components/TopMenu";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrdersLayout() {
    return (
        <SafeAreaView style={pagesStyles.safeArea}>
            <TopMenu
                tabs={[
                    {
                        label: "Pedidos",
                        value: "orders",
                        route: "/orders",
                    },
                    {
                        label: "Adicionar pedidos",
                        value: "add",
                        route: "/addOrder",
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