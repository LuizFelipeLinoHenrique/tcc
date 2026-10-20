import { Stack } from "expo-router";

import { pagesStyles } from "@/src/components/ScreensLayout";
import TopMenu from "@/src/components/TopMenu";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MaterialsLayout() {
    return (
        <SafeAreaView style={pagesStyles.safeArea}>
            <TopMenu
                tabs={[
                    {
                        label: "Materiais",
                        value: "materials",
                        route: "/materials",
                    },
                    {
                        label: "Adicionar material",
                        value: "add",
                        route: "/addMaterial",
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
