import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Colors } from "@/src/theme/colors";

type Props = PropsWithChildren<{
    visible: boolean;
    title: string;
    onClose: () => void;
    busy?: boolean;
}>;

export function RecordModal({
    visible,
    title,
    onClose,
    busy,
    children,
}: Props) {
    const close = () => {
        if (!busy) onClose();
    };
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={close}
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={close}
                    accessibilityLabel="Fechar janela"
                />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <Pressable
                            onPress={close}
                            disabled={busy}
                            accessibilityRole="button"
                            accessibilityLabel="Fechar"
                            style={styles.close}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color={Colors.hex0B4F6C}
                            />
                        </Pressable>
                    </View>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.body}
                    >
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.overlayBlack50,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        width: "100%",
        maxWidth: 900,
        maxHeight: "90%",
        backgroundColor: Colors.white,
        borderRadius: 12,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
    },
    title: {
        color: Colors.hex0B4F6C,
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
    },
    close: { padding: 8 },
    body: { alignItems: "center", padding: 8 },
});
