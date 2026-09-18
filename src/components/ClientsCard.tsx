import { Ionicons } from "@expo/vector-icons";

import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import useResponsive from "../hooks/useResponsive";

import { pagesStyles } from "./ScreensLayout";

export type Cliente = {
    id: number;
    nome: string;
    endereco: string;
    email: string;
    telefone: number;
};

type ClientCardProps = {
    cliente: Cliente;
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
};

export function ClientCard({
    cliente,
    iconDetails,
    iconEdit,
    iconDelete,
}: ClientCardProps) {
    const { isMobile } = useResponsive();

    return (
        <View
            style={[
                styles.container,
                isMobile
                    ? { width: "100%" }
                    : { width: "50%" },
            ]}
        >
            <View
                style={[
                    pagesStyles.card,
                    styles.containerCard,
                ]}
            >
                <View style={styles.info}>
                    <Text
                        style={[
                            pagesStyles.textBold,
                            { fontSize: 20 },
                        ]}
                        numberOfLines={1}
                    >
                        Cliente #{cliente.id}
                    </Text>

                    <Text
                        style={pagesStyles.text}
                        numberOfLines={1}
                    >
                        Nome: {cliente.nome}
                    </Text>

                    <Text
                        style={pagesStyles.text}
                        numberOfLines={1}
                    >
                        E-mail: {cliente.email}
                    </Text>

                    <Text
                        style={pagesStyles.text}
                        numberOfLines={1}
                    >
                        Telefone: {cliente.telefone}
                    </Text>

                    <Text
                        style={pagesStyles.text}
                        numberOfLines={2}
                    >
                        Endereço: {cliente.endereco}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <View style={styles.icon}>
                        <Pressable onPress={iconDetails}>
                            <Ionicons
                                name="ellipsis-horizontal-outline"
                                size={25}
                                color="#79553D"
                            />
                        </Pressable>
                    </View>

                    <View style={styles.icon}>
                        <Pressable onPress={iconEdit}>
                            <Ionicons
                                name="pencil-outline"
                                size={25}
                                color="#79553D"
                            />
                        </Pressable>
                    </View>

                    {iconDelete ? (
                        <View style={styles.icon}>
                            <Pressable onPress={iconDelete}>
                                <Ionicons
                                    name="trash-outline"
                                    size={25}
                                    color="#79553D"
                                />
                            </Pressable>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },

    containerCard: {
        boxShadow: "0px 8px 12px #5A5146",
        flexDirection: "row",
        justifyContent: "space-between",
        height: "auto",
    },

    info: {
        flex: 1,
        minWidth: 0,
    },

    actions: {
        marginLeft: 10,
    },

    icon: {
        width: "100%",
        height: "auto",
        alignItems: "center",
        justifyContent: "center",
    },
});