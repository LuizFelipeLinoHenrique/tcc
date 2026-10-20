import { Stack } from "expo-router";

import { pagesStyles } from "@/src/components/ScreensLayout";
import TopMenu from "@/src/components/TopMenu";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SuppliersLayout() {
    return (
        <SafeAreaView style={pagesStyles.safeArea}>
            <TopMenu
                tabs={[
                    {
                        label: "Fornecedores",
                        value: "suppliers",
                        route: "/suppliers",
                    },
                    {
                        label: "Adicionar",
                        value: "add",
                        route: "/addSupplier",
                    },
                    // {
                    //     label: "Editar",
                    //     value: "edit",
                    //     route: "/editSupplier",
                    // }
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
