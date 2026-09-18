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
import { Stack } from "expo-router";
import "../../global.css";

export default function AuthLayout() {

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

    return (
        // <AnimatedBackground>
            <Stack screenOptions={{ headerShown: false }} />
        // </AnimatedBackground>
    )
}