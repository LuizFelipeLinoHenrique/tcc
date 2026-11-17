import { Stack } from "expo-router";

import { pagesStyles } from "@/src/components/ScreensLayout";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MaterialsLayout() {
    return (
        <SafeAreaView style={pagesStyles.safeArea}>
            <Stack
                screenOptions={{
                    headerShown: false
                }}
            />
        </SafeAreaView>
    );
}
