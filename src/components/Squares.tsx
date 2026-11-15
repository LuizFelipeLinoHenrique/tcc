import { Colors } from "@/src/theme/colors";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";

type AnimatedSquaresProps = {
    index: number
}

export default function AnimatedSquares({ index }: AnimatedSquaresProps) {

    const [rotate] = useState(() => new Animated.Value(0));

    const { width, height } = useWindowDimensions();
    const [squareWidth] = useState(() => Math.floor(Math.random() * 70) + 1);
    const [squareHeight] = useState(() => Math.floor(Math.random() * 70) + 50);
    const [top] = useState(() => Math.floor(Math.random() * height) + 1);
    const [left] = useState(() => Math.floor(Math.random() * width) + 1);
    const [borderWidth] = useState(() => Math.floor(Math.random() * 3) + 1);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(rotate, {
                    toValue: 0,
                    duration: 500,
                    delay: index * 150,
                    useNativeDriver: false
                }),
                Animated.timing(rotate, {
                    toValue: 1,
                    duration: 250,
                    delay: index * 150,
                    useNativeDriver: false
                }),
                Animated.timing(rotate, {
                    toValue: 2,
                    duration: 250,
                    delay: index * 150,
                    useNativeDriver: false
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [index, rotate]);

    const squareRotate = rotate.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ["20deg", "200deg", "352deg"]
    })

    return (
        <Animated.View
            style={[
                styles.squareLeftTop,
                {
                    width: squareWidth,
                    height: squareHeight,
                    top: top,
                    left: left,
                    borderWidth: borderWidth,
                    transform: [
                        { rotate: squareRotate }
                    ]
                }
            ]}
        >
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    squareLeftTop: {
        position: "absolute",
        borderColor: Colors.white
    }
});
