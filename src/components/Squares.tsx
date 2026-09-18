import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";

type AnimatedSquaresProps = {
    index: number
}

export default function AnimatedSquares({ index }: AnimatedSquaresProps) {

    const rotate = useRef(new Animated.Value(0)).current;

    const { width, height } = useWindowDimensions();
    const squareWidth = useRef(new Animated.Value(Math.floor(Math.random() * 70) + 1,)).current;
    const squareHeight = useRef(new Animated.Value(Math.floor(Math.random() * 70) + 50,)).current;
    const top = useRef(new Animated.Value(Math.floor(Math.random() * height) + 1,)).current;
    const left = useRef(new Animated.Value(Math.floor(Math.random() * width) + 1,)).current;
    const borderWidth = useRef(new Animated.Value(Math.floor(Math.random() * 3) + 1,)).current;

    useEffect(() => {
        Animated.loop(
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
        ).start();
    })

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
        borderColor: "#FFF"
    }
});