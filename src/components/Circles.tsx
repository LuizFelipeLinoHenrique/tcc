import { useEffect, useRef } from "react";
import { Animated, Easing, useWindowDimensions } from "react-native";

export default function AnimatedCircle({ index }: { index: number }) {
    const circlesX = useRef(new Animated.Value(0)).current;
    const circlesY = useRef(new Animated.Value(0)).current;
    const circleSize = useRef(Math.floor(Math.random() * 100) + 25).current;
    const gerarCor = () => {
        return `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`;
    };
    const circleColor = useRef(gerarCor()).current;
    const { width, height } = useWindowDimensions();

    const mover = () => {
        const novoX = Math.random() * (width * 2) - width;
        const novoY = Math.random() * (height * 2) - height;

        Animated.parallel([
            Animated.timing(circlesX, {
                toValue: novoX,
                duration: 3000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            }),

            Animated.timing(circlesY, {
                toValue: novoY,
                duration: 3000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            }),
        ]).start(() => {
            mover();
        });
    };

    useEffect(() => {
        mover();
    }, []);

    return (
        <Animated.View
            style={{
                position: "absolute",
                width: circleSize,
                height: circleSize,
                borderRadius: 130,
                backgroundColor: circleColor,

                transform: [
                    { translateX: circlesX },
                    { translateY: circlesY },
                ],
            }}
        />
    );
};