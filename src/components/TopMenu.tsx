import { Href, router, usePathname } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { pagesStyles } from "./ScreensLayout";

type Tab = {
    label: string;
    value: string;
    route: Href;
};

type TabsProps = {
    tabs: Tab[];
};

function AnimatedTab({ tab, active }: {
    tab: Tab;
    active: boolean;
}) {

    const scale = useRef(new Animated.Value(1)).current;

    const pressionar = () => {
        Animated.timing(scale, {
            toValue: 0.90,
            duration: 30,
            useNativeDriver: false,
        }).start();
    };

    const soltar = () => {
        Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
        }).start();
    };

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
                <Text
                    style={[
                        pagesStyles.text,
                        active && pagesStyles.textBold,
                    ]}
                >
                    {tab.label}
                </Text>
            </Pressable>
        </Animated.View >
    );
};

export default function Tabs({ tabs }: TabsProps) {

    const pathName = usePathname();

    return (
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
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        width: "100%",
        minHeight: 52,
        marginBottom: 10,
        backgroundColor: "#FFFDF9",
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 52,
        borderBottomWidth: 1,
        borderBottomColor: "#D8CFC3",
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: "#79553D",
        boxShadow: "0px 1px 8px #5A5146"
    },
});