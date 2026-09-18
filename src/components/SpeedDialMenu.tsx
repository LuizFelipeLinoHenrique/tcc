import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type SpeedDialAction = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}

type SpeedDialProps = {
    actions: SpeedDialAction[];
}

export default function SpeedDial({ actions }: SpeedDialProps) {

    const [open, setOpen] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;
    const animation = useRef(new Animated.Value(0)).current;

    function toggleSpeedDial() {
        const toValue = open ? 0 : 1;

        setOpen(!open);

        Animated.spring(animation, {
            toValue,
            useNativeDriver: false,
            friction: 7,
            tension: 60, // velocidade de abertura/fechamento do menu
        }).start();
    };

    const pressionar = () => {
        Animated.spring(scale, {
            toValue: 0.88,
            useNativeDriver: false,
        }).start();
    };

    const soltar = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
        }).start();
    };

    return (
        <View style={styles.container}>

            {/* Ações */}
            {actions.map((action, index) => {

                const translateY = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(70 * (index + 1))],
                });

                const scale = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                });

                const opacity = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                });

                return (
                    <Animated.View
                        key={action.label}
                        pointerEvents={open ? "auto" : "none"}
                        style={[
                            styles.actionContainer,
                            {
                                opacity,
                                transform: [
                                    { translateY },
                                    { scale },
                                ],
                            },
                        ]}
                    >
                        <Pressable
                            style={styles.action}
                            onPress={() => {
                                action.onPress();
                                toggleSpeedDial();
                            }}
                            onPressIn={pressionar}
                            onPressOut={soltar}
                        >
                            <Text style={styles.label}>
                                {action.label}
                            </Text>

                            <View style={styles.actionButton}>
                                <Ionicons
                                    name={action.icon}
                                    size={22}
                                    color="white"
                                />
                            </View>
                        </Pressable>
                    </Animated.View>
                );
            })}

            {/* Botão principal */}
            <Pressable
                onPress={toggleSpeedDial}
                style={styles.mainButton}
            >
                <Animated.View
                    style={{
                        transform: [
                            {
                                rotate: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ["0deg", "45deg"],
                                }),
                            },
                        ],
                    }}
                >
                    <Ionicons
                        name="add"
                        size={30}
                        color="white"
                    />
                </Animated.View>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 20,
        bottom: 20,
        alignItems: "flex-start",
        justifyContent: "flex-end",
    },

    actionContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
    },

    action: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    label: {
        backgroundColor: "white",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: "600",

        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
    },

    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#9c775d",
        alignItems: "center",
        justifyContent: "center",

        boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.2)",
    },

    mainButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#79553D",
        alignItems: "center",
        justifyContent: "center",

        boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.25)",
    },
});