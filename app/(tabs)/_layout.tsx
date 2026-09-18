import ConfirmationCard from "@/src/components/ConfirmationCard";
import SpeedDial from "@/src/components/SpeedDialMenu";
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
                <View style={styles.container}>
                    <Stack
                        screenOptions={{
                            headerShown: false
                        }}
                    />
                    <SpeedDial
                        actions={[
                            {
                                icon: "home-outline",
                                label: "Início",
                                onPress: () => router.replace("/(tabs)/(home)/homeScreen"),
                            },
                            {
                                icon: "settings-outline",
                                label: "Configurações",
                                onPress: () => router.replace("/(tabs)/(configs)/configurations"),
                            },
                            {
                                icon: "cube-outline",
                                label: "Pedidos",
                                onPress: () => router.replace("/(tabs)/(order)/orders"),
                            },
                            {
                                icon: "person-outline",
                                label: "Clientes",
                                onPress: () => router.replace("/(tabs)/(client)/clients"),
                            },
                            {
                                icon: "exit-outline",
                                label: "Sair",
                                onPress: () => setConfirmationCard(true),
                            },
                        ]}
                    />
                </View>
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