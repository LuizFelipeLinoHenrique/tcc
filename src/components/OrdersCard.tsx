import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import useResponsive from "../hooks/useResponsive";
import { pagesStyles } from "./ScreensLayout";

type Pedido = {
    id: number;
    data_pedido: string;
    id_cliente: number;
    qtde: number;
    id_produto: number;
    status: string;
};

type OrderCardProps = {
    iconDetails: () => void;
    iconEdit: () => void;
    iconDelete?: () => void;
    pedido: Pedido;
};

export function OrderCard({ pedido, iconDetails, iconEdit, iconDelete }: OrderCardProps) {

    const { isMobile } = useResponsive();

    return (
        <View style={[styles.container, isMobile ? { width: "100%" } : { width: "50%" }]}>
            <View style={[pagesStyles.card, styles.containerCard]}>
                <View>
                    <Text style={[pagesStyles.textBold, { fontSize: 20 }]}>Pedido #{pedido.id}</Text>
                    <Text style={pagesStyles.text}>Cliente: {pedido.id_cliente}</Text>
                    <Text style={pagesStyles.text}>Produto: {pedido.id_produto}</Text>
                    <Text style={pagesStyles.text}>Quantidade: {pedido.qtde}</Text>
                    <Text style={pagesStyles.text}>Status: {pedido.status}</Text>
                </View>
                <View>
                    <View style={styles.date}>
                        <Text style={[pagesStyles.textBold, { fontSize: 14 }]}>{pedido.data_pedido}</Text>
                    </View>
                    <View style={styles.icon}>
                        <Pressable onPress={iconDetails}>
                            <Ionicons
                                name={"ellipsis-horizontal-outline"}
                                size={25}
                                color={"#79553D"}
                            />
                        </Pressable>
                    </View>
                    <View style={styles.icon}>
                        <Pressable onPress={iconEdit}>
                            <Ionicons
                                name={"pencil-outline"}
                                size={25}
                                color={"#79553D"}
                            />
                        </Pressable>
                    </View>
                    <View style={styles.icon}>
                        <Pressable onPress={iconDelete}>
                            <Ionicons
                                name={"trash-outline"}
                                size={25}
                                color={"#79553D"}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10
    },
    containerCard: {
        boxShadow: "0px 8px 12px #5A5146",
        flexDirection: "row",
        justifyContent: "space-between",
        height: "auto"
    },
    date: {
        justifyContent: "flex-start"
    },
    icon: {
        width: "100%",
        height: "auto",
        alignItems: "center",
        justifyContent: "center"
    }
})