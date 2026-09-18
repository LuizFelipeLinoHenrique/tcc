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
        <>
            {/* Backdrop quando aberto */}
            {open && (
                <Pressable
                    style={styles.backdrop}
                    onPress={toggleSpeedDial}
                />
            )}

            <View style={styles.container} pointerEvents="box-none">
                {/* Ações */}
                {actions.map((action, index) => {
                    const isDestructive = action.label.toLowerCase().includes("sair");

                    const translateY = animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -(64 * (index + 1))],
                    });

                    const scaleAction = animation.interpolate({
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
                                        { scale: scaleAction },
                                    ],
                                },
                            ]}
                        >
                            <Pressable
                                style={styles.action}
                                onPress={() => {
                                    toggleSpeedDial();
                                    action.onPress();
                                }}
                                onPressIn={pressionar}
                                onPressOut={soltar}
                            >
                                <View
                                    style={[
                                        styles.actionButton,
                                        isDestructive && styles.destructiveActionButton,
                                    ]}
                                >
                                    <Ionicons
                                        name={action.icon}
                                        size={20}
                                        color="#FFFDF9"
                                    />
                                </View>

                                <View style={styles.labelContainer}>
                                    <Text
                                        style={[
                                            styles.label,
                                            isDestructive && styles.destructiveLabel,
                                        ]}
                                    >
                                        {action.label}
                                    </Text>
                                </View>
                            </Pressable>
                        </Animated.View>
                    );
                })}

                {/* Botão principal */}
                <Pressable
                    onPress={toggleSpeedDial}
                    style={({ pressed }) => [
                        styles.mainButton,
                        pressed && styles.mainButtonPressed,
                        open && styles.mainButtonOpen,
                    ]}
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
                            size={28}
                            color="#FFFDF9"
                        />
                    </Animated.View>
                </Pressable>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(35, 27, 20, 0.35)",
        zIndex: 998,
    },

    container: {
        position: "absolute",
        left: 20,
        bottom: 24,
        alignItems: "flex-start",
        justifyContent: "flex-end",
        zIndex: 999,
    },

    actionContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
    },

    action: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    labelContainer: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E8E2D8",
        shadowColor: "#2C2016",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },

    label: {
        fontSize: 13,
        color: "#302B26",
        fontFamily: "WorksansSemiBold",
    },

    destructiveLabel: {
        color: "#A74E3C",
    },

    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#8C684E",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#302016",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
        elevation: 3,
    },

    destructiveActionButton: {
        backgroundColor: "#A74E3C",
    },

    mainButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#79553D",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4E3626",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },

    mainButtonPressed: {
        backgroundColor: "#63422C",
        transform: [{ scale: 0.96 }],
    },

    mainButtonOpen: {
        backgroundColor: "#553823",
    },
});