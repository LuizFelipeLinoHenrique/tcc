import ConfirmationCard from "@/src/components/ConfirmationCard";
import { ErpShell } from "@/src/components/ErpShell";
import { supabase } from "@/src/lib/supabase";
import {
    FugazOne_400Regular
} from "@expo-google-fonts/fugaz-one";
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
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import "../../global.css";

export default function clients() {

    const [confirmationCard, setConfirmationCard] = useState<boolean>(false)
    const [fontsLoaded] = useFonts({

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

    if (!fontsLoaded) {
        return null;
    }

    async function logOff() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.log("Erro", error);
            return;
        };

        router.replace("/(auth)/signIn")

    };

    return (

        <View style={styles.container}>
            {!confirmationCard ?
                <ErpShell onSignOut={() => setConfirmationCard(true)}>
                    <Stack
                        screenOptions={{
                            headerShown: false
                        }}
                    />

                </ErpShell>
                :
                <ConfirmationCard
                    action={logOff}
                    setCardConfirmation={setConfirmationCard}
                />
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})