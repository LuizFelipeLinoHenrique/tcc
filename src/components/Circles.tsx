import { useEffect, useState } from "react";
import { Animated, Easing, useWindowDimensions } from "react-native";

export default function AnimatedCircle({ index }: { index: number }) {
    const [circlesX] = useState(() => new Animated.Value(0));
    const [circlesY] = useState(() => new Animated.Value(0));
    const [circleSize] = useState(() => Math.floor(Math.random() * 100) + 25);
    const [circleColor] = useState(() => {
        return `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`;
    });
    const { width, height } = useWindowDimensions();

    useEffect(() => {
        let animation: Animated.CompositeAnimation;
        const mover = () => {
            const novoX = Math.random() * (width * 2) - width;
            const novoY = Math.random() * (height * 2) - height;

            animation = Animated.parallel([
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
            ]);
            animation.start(({ finished }) => {
                if (finished) mover();
            });
        };
        mover();
        return () => animation.stop();
    }, [circlesX, circlesY, height, width]);

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