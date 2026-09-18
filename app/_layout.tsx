import { isSigningUp } from "@/src/lib/authFlow";
import { supabase } from "@/src/lib/supabase";

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

import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import "../global.css";

export default function MainLayout() {

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [fontsLoaded] = useFonts({
        UbuntuLight: Ubuntu_300Light,
        UbuntuRegular: Ubuntu_400Regular,
        UbuntuBold: Ubuntu_700Bold,

        PromptLight: Prompt_300Light,
        PromptRegular: Prompt_400Regular,
        PromptBold: Prompt_700Bold
    });

    useEffect(() => {

        const verifSession = async () => {
            const { data: sessionData } =
                await supabase.auth.getSession();

            if (!sessionData.session) {
                setSession(null);
                setLoading(false);
                return;
            }

            const { data: userData, error } =
                await supabase.auth.getUser();

            if (error || !userData.user) {
                await supabase.auth.signOut();

                setSession(null);

                router.replace("/(auth)/signIn");

                setLoading(false);
                return;
            }

            setSession(sessionData.session);
            setLoading(false);
        };

        verifSession();

        const { data: listener } =
            supabase.auth.onAuthStateChange(
                (event, session) => {

                    if (
                        event === "SIGNED_IN" &&
                        isSigningUp
                    ) {
                        return;
                    }

                    setSession(session);
                }
            );

        return () => {
            listener.subscription.unsubscribe();
        };

    }, []);

    if (!fontsLoaded || loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View className="flex-1">

            <Stack screenOptions={{ headerShown: false }}>

                <Stack.Protected guard={!session}>
                    <Stack.Screen name="(auth)" />
                </Stack.Protected>

                <Stack.Protected guard={!!session}>
                    <Stack.Screen name="(tabs)" />
                </Stack.Protected>

            </Stack>

        </View>
    );
};