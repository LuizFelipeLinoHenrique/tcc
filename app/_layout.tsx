import { isSigningUp } from "@/src/lib/authFlow";
import { supabase } from "@/src/lib/supabase";
import { LoginTransitionProvider } from "@/src/components/LoginTransitionProvider";

import {
    FugazOne_400Regular
} from "@expo-google-fonts/fugaz-one";

import {
    Prompt_300Light,
    Prompt_400Regular,
    Prompt_700Bold
} from "@expo-google-fonts/prompt";

import {
    Ubuntu_300Light,
    Ubuntu_400Regular,
    Ubuntu_700Bold
} from "@expo-google-fonts/ubuntu";

import {
    WorkSans_100Thin,
    WorkSans_200ExtraLight,
    WorkSans_300Light,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    WorkSans_900Black
} from "@expo-google-fonts/work-sans";

import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import "../global.css";

export default function MainLayout() {

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [fontsLoaded, fontError] = useFonts({
        UbuntuLight: Ubuntu_300Light,
        UbuntuRegular: Ubuntu_400Regular,
        UbuntuBold: Ubuntu_700Bold,

        PromptLight: Prompt_300Light,
        PromptRegular: Prompt_400Regular,
        PromptBold: Prompt_700Bold,

        FugazOne: FugazOne_400Regular,

        WorksansThin: WorkSans_100Thin,
        WorksansExtraLight: WorkSans_200ExtraLight,
        WorksansLight: WorkSans_300Light,
        WorksansRegular: WorkSans_400Regular,
        WorksansMedium: WorkSans_500Medium,
        WorksansSemiBold: WorkSans_600SemiBold,
        WorksansBold: WorkSans_700Bold,
        WorksansExtraBold: WorkSans_900Black
    });

    useEffect(() => {

        const { data: listener } = supabase.auth.onAuthStateChange((event, currentSession) => {
            if (event === "SIGNED_IN" && isSigningUp) return;
            setSession(currentSession);
            setLoading(false);
        });

        return () => listener.subscription.unsubscribe();

    }, []);

    if ((!fontsLoaded && !fontError) || loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <LoginTransitionProvider>

            <Stack screenOptions={{ headerShown: false }}>

                <Stack.Protected guard={!session}>
                    <Stack.Screen name="(auth)" />
                </Stack.Protected>

                <Stack.Protected guard={!!session}>
                    <Stack.Screen name="(tabs)" />
                </Stack.Protected>

                <Stack.Screen name="(recovering)" />

            </Stack>

        </LoginTransitionProvider>
    );
};
