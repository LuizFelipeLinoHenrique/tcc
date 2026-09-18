import { Ionicons } from "@expo/vector-icons";
import { Href, router, usePathname } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type Tab = {
    label: string;
    value: string;
    route: Href;
};

type TabsProps = {
    tabs: Tab[];
};

function getTabIcon(value: string, active: boolean): keyof typeof Ionicons.glyphMap {
    if (value === "clients") return active ? "people" : "people-outline";
    if (value === "add" && value.includes("client")) return active ? "person-add" : "person-add-outline";
    if (value === "orders") return active ? "cube" : "cube-outline";
    if (value === "add") return active ? "add-circle" : "add-circle-outline";
    return active ? "layers" : "layers-outline";
}

function AnimatedTab({ tab, active }: {
    tab: Tab;
    active: boolean;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const pressionar = () => {
        Animated.timing(scale, {
            toValue: 0.96,
            duration: 50,
            useNativeDriver: true,
        }).start();
    };

    const soltar = () => {
        Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    const iconName = getTabIcon(tab.value, active);

    return (
        <Animated.View
            style={{
                flex: 1,
                transform: [{ scale }],
            }}
        >
            <Pressable
                style={[
                    styles.tab,
                    active && styles.activeTab,
                ]}
                onPress={() => router.push(tab.route)}
                onPressIn={pressionar}
                onPressOut={soltar}
            >
                <Ionicons
                    name={iconName}
                    size={18}
                    color={active ? "#79553D" : "#766E64"}
                    style={styles.tabIcon}
                />
                <Text
                    style={[
                        styles.tabText,
                        active && styles.activeTabText,
                    ]}
                >
                    {tab.label}
                </Text>
            </Pressable>
        </Animated.View>
    );
};

export default function Tabs({ tabs }: TabsProps) {
    const pathName = usePathname();

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {tabs.map((tab) => {
                    const active = pathName === tab.route.toString();

                    return (
                        <AnimatedTab
                            key={tab.value}
                            tab={tab}
                            active={active}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    container: {
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#EAE3D8",
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 6,
    },
    activeTab: {
        backgroundColor: "#FFFFFF",
        shadowColor: "#30241A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 2,
    },
    tabIcon: {
        marginRight: 2,
    },
    tabText: {
        color: "#6E665E",
        fontSize: 14,
        fontFamily: "WorksansMedium",
    },
    activeTabText: {
        color: "#79553D",
        fontFamily: "WorksansBold",
    },
});