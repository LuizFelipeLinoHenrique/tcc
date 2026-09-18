import { ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import AnimatedSquares from "./Squares";

type AnimatedBackgroundProps = {
    children: ReactNode;
}

export function AnimatedBackground({ children }: AnimatedBackgroundProps) {
    const animation = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        Animated.loop(
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
        ).start();

    }, []);

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ["#4f39f6", "#211e5a"],
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

