import { Colors } from "@/src/theme/colors";
import { ReactNode, useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import AnimatedSquares from "./Squares";

type AnimatedBackgroundProps = {
    children: ReactNode;
}

export function AnimatedBackground({ children }: AnimatedBackgroundProps) {
    const [animation] = useState(() => new Animated.Value(0));


    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(animation, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: false,
                }),

                Animated.timing(animation, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: false,
                }),

                Animated.timing(animation, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: false,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [animation]);

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.hex4F39F6, Colors.hex211E5A],
    });

    return (
        <Animated.View
            style={[
                StyleSheet.absoluteFill,
                { backgroundColor },
                {
                    alignItems: "center",
                    justifyContent: "center"
                }
            ]}
        >

            {Array.from({ length: 30 }).map((_, index) => (
                <AnimatedSquares key={index} index={index} />
            ))}



            {children}
        </Animated.View>
    );
}
