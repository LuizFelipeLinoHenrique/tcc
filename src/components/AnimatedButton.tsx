import React, { useRef, useState } from "react";

import {
    Animated,
    Pressable,
    StyleProp,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";

type AnimatedButtonProps = {
    title: React.ReactNode;
    children?: React.ReactNode;
    stylesPressable?: StyleProp<ViewStyle>;
    stylesPressablePressed?: StyleProp<ViewStyle>;
    stylesText?: StyleProp<TextStyle>;
    onPress: () => void;
    stylesAnimatedView?: StyleProp<ViewStyle>;
    disabled?: boolean;
};

export function AnimatedButton({
    title,
    children,
    stylesPressable,
    stylesPressablePressed,
    stylesText,
    onPress,
    stylesAnimatedView,
    disabled,
}: AnimatedButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const [pressed, setPressed] = useState(false);

    const pressionar = () => {
        setPressed(true);

        Animated.spring(scale, {
            toValue: 0.88,
            useNativeDriver: false,
        }).start();
    };

    const soltar = () => {
        setPressed(false);

        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
        }).start();
    };

    return (
        <Animated.View
            style={[{
                transform: [{ scale }]
            },
                stylesAnimatedView
            ]}
        >
            <Pressable
                onPressIn={disabled ? undefined : pressionar}
                onPressOut={disabled ? undefined : soltar}
                onPress={disabled ? undefined : onPress}
                disabled={disabled}
                style={[
                    stylesPressable,
                    pressed ? stylesPressablePressed : undefined,
                ]}
            >
                {children}
                {typeof title == "string" ?
                    <Text style={stylesText}>
                        {title}
                    </Text>
                    :
                    <>
                        {title}
                    </>
                }
            </Pressable>
        </Animated.View>
    );
}