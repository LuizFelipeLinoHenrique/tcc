import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import { Colors } from "@/src/theme/colors";

type RecordOption = { id: number; nome: string | null };
type Props = {
    table: "clientes" | "produtos";
    search: string;
    value: string;
    onSelect: (id: string) => void;
};

const pageSize = 20;

export function OrderRecordDropdown({ table, search, value, onSelect }: Props) {
    const [options, setOptions] = useState<RecordOption[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const pending = useRef(false);

    const load = useCallback(async (cursor?: number) => {
        if (pending.current) return;
        pending.current = true;
        setLoading(true);
        setFailed(false);
        try {
            const query = supabase.from(table).select("id, nome").order("id").limit(pageSize);
            const term = search.trim();
            if (/^\d+$/.test(term) && Number.isSafeInteger(Number(term))) {
                query.eq("id", Number(term));
            } else if (term) {
                query.ilike("nome", `%${term.replace(/[\\%_]/g, "\\$&")}%`);
            }
            const { data, error } = await (cursor === undefined ? query : query.gt("id", cursor));
            if (error) throw error;
            const rows = data ?? [];
            setOptions(previous => cursor === undefined ? rows : [...previous, ...rows]);
            setHasMore(rows.length === pageSize);
        } catch {
            setFailed(true);
        } finally {
            pending.current = false;
            setLoading(false);
        }
    }, [search, table]);

    useEffect(() => {
        const timer = setTimeout(() => void load(), search ? 220 : 0);
        return () => clearTimeout(timer);
    }, [load, search]);

    return (
        <View
            style={styles.list}
            onPointerDown={Platform.OS === "web" ? event => {
                if (event.nativeEvent.pointerType === "mouse") event.preventDefault();
            } : undefined}
        >
            <ScrollView style={styles.scroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {options.map(option => (
                    <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: value === String(option.id) }}
                        style={styles.row}
                        onPress={() => onSelect(String(option.id))}
                    >
                        <Text style={styles.text}>{option.nome || "Sem nome"} (#{option.id})</Text>
                        {value === String(option.id) && <Ionicons name="checkmark" size={16} color={Colors.hex0B4F6C} />}
                    </Pressable>
                ))}
                {loading && <Text style={styles.message} accessibilityLiveRegion="polite">Carregando…</Text>}
                {!loading && failed && (
                    <Text style={styles.message} accessibilityRole="alert">Não foi possível carregar a lista.</Text>
                )}
                {!loading && (failed || hasMore) && (
                    <Pressable accessibilityRole="button" style={styles.row}
                        onPress={() => void load(options[options.length - 1]?.id)}>
                        <Text style={styles.text}>{failed ? "Tentar novamente" : "Carregar mais"}</Text>
                    </Pressable>
                )}
                {!loading && !failed && options.length === 0 && (
                    <Text style={styles.message}>Nenhum resultado encontrado.</Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 },
    text: { flex: 1, color: Colors.hex0B4F6C, fontFamily: "WorksansMedium", fontSize: 14 },
    list: { borderWidth: 1, borderColor: Colors.hexCFDDE6, borderRadius: 8, backgroundColor: Colors.hexF8FAFC },
    scroll: { maxHeight: 88 },
    message: { padding: 12, color: Colors.hex64748B, fontFamily: "WorksansRegular" },
});
