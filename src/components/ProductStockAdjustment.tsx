import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedButton } from "@/src/components/AnimatedButton";
import type { Produto } from "@/src/components/MaterialsCard";
import { RecordModal } from "@/src/components/RecordModal";
import { pagesStyles } from "@/src/components/ScreensLayout";
import { parseReadyStock } from "@/src/lib/productStock";
import { supabase } from "@/src/lib/supabase";
import { recordError } from "@/src/lib/tableActions";
import { Colors } from "@/src/theme/colors";

type StockProduct = Pick<Produto, "id" | "nome" | "quantidade_pronta_entrega">;

export function ProductStockAdjustment({
    onClose,
    onSaved,
}: {
    onClose: () => void;
    onSaved: () => void;
}) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<StockProduct[]>([]);
    const [product, setProduct] = useState<StockProduct | null>(null);
    const [direction, setDirection] = useState<"entrada" | "saida">("entrada");
    const [quantity, setQuantity] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const searchInput = useRef<TextInput>(null);
    const submitting = useRef(false);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const request = useRef<{ productId: number; delta: number; key: string } | null>(null);

    useEffect(() => () => clearTimeout(blurTimer.current), []);

    const searchTerm = product ? "" : search;
    useEffect(() => {
        if (!dropdownOpen) return;
        let active = true;
        const timer = setTimeout(async () => {
            try {
                const term = searchTerm.trim();
                let query = supabase.from("produtos")
                    .select("id,nome,quantidade_pronta_entrega")
                    .order("nome")
                    .limit(2);
                if (/^\d+$/.test(term)) query = query.eq("id", term);
                else if (term) query = query.ilike("nome", `%${term}%`);
                const { data, error: queryError } = await query;
                if (queryError) throw queryError;
                if (active) setResults(data ?? []);
            } catch (cause) {
                if (active) setError(recordError(cause));
            } finally {
                if (active) setSearching(false);
            }
        }, 250);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [dropdownOpen, searchTerm]);

    function openDropdown() {
        clearTimeout(blurTimer.current);
        if (dropdownOpen) return;
        setSearching(true);
        setResults([]);
        setError("");
        setDropdownOpen(true);
    }

    function closeOnBlur() {
        clearTimeout(blurTimer.current);
        blurTimer.current = setTimeout(() => setDropdownOpen(false), 200);
    }

    async function save() {
        if (submitting.current || !product) return;
        const amount = parseReadyStock(quantity);
        setSuccess("");
        if (!amount) {
            setError("Informe uma quantidade inteira entre 1 e 2.147.483.647.");
            return;
        }

        const delta = direction === "entrada" ? amount : -amount;
        if (request.current?.productId !== product.id || request.current.delta !== delta) {
            request.current = {
                productId: product.id,
                delta,
                key: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
            };
        }
        submitting.current = true;
        setBusy(true);
        setError("");
        try {
            const { data, error: saveError } = await supabase.rpc("adjust_product_ready_stock", {
                p_product_id: product.id,
                p_delta: delta,
                p_request_key: request.current.key,
            });
            if (saveError) throw saveError;
            if (typeof data !== "number") throw new Error("Não foi possível confirmar o lançamento.");
            request.current = null;
            setProduct({ ...product, quantidade_pronta_entrega: data });
            setQuantity("");
            setSuccess("Lançamento registrado.");
            onSaved();
        } catch (cause) {
            setError(recordError(cause));
        } finally {
            submitting.current = false;
            setBusy(false);
        }
    }

    return (
        <RecordModal visible title="Lançar estoque" onClose={onClose} busy={busy}>
            <View style={styles.form}>
                <View style={pagesStyles.field}>
                    <Text style={pagesStyles.label}>Produto</Text>
                    <TextInput
                        ref={searchInput}
                        accessibilityLabel="Buscar produto por nome ou ID"
                        accessibilityState={{ expanded: dropdownOpen && !busy }}
                        style={pagesStyles.input}
                        placeholder="Buscar produto por nome ou ID"
                        value={product?.nome ?? search}
                        editable={!busy}
                        onFocus={openDropdown}
                        onBlur={closeOnBlur}
                        onChangeText={(value) => {
                            clearTimeout(blurTimer.current);
                            setProduct(null);
                            setSearch(value);
                            setSearching(true);
                            setResults([]);
                            setError("");
                            setSuccess("");
                            setDropdownOpen(true);
                        }}
                    />
                    {dropdownOpen && !busy && (
                        <View
                            style={styles.dropdown}
                            onPointerDown={Platform.OS === "web" ? (event) => {
                                if (event.nativeEvent.pointerType === "mouse") event.preventDefault();
                            } : undefined}
                        >
                            {searching && <Text style={styles.dropdownMessage}>Buscando produtos...</Text>}
                            {!searching && results.length === 0 && !error && (
                                <Text style={styles.dropdownMessage}>Nenhum produto encontrado.</Text>
                            )}
                            {results.map((item) => (
                                <Pressable
                                    key={item.id}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: product?.id === item.id }}
                                    style={styles.dropdownOption}
                                    onFocus={() => clearTimeout(blurTimer.current)}
                                    onBlur={closeOnBlur}
                                    onPress={() => {
                                        searchInput.current?.blur();
                                        clearTimeout(blurTimer.current);
                                        setDropdownOpen(false);
                                        setError("");
                                        setSuccess("");
                                        setProduct(item);
                                    }}
                                >
                                    <Text style={pagesStyles.secondaryButtonText}>{item.nome} (#{item.id})</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                    {product && <Text>Saldo de pronta entrega: {product.quantidade_pronta_entrega ?? 0}</Text>}
                </View>
                <View style={pagesStyles.field}>
                    <Text style={pagesStyles.label}>Tipo de lançamento</Text>
                    <View style={styles.options}>
                        {(["entrada", "saida"] as const).map((option) => (
                            <Pressable key={option} accessibilityRole="radio"
                                accessibilityState={{ checked: direction === option, disabled: busy }}
                                disabled={busy}
                                onPress={() => setDirection(option)}
                                style={direction === option ? pagesStyles.primaryButton : pagesStyles.secondaryButton}
                            >
                                <Text style={direction === option ? pagesStyles.primaryButtonText : pagesStyles.secondaryButtonText}>
                                    {option === "entrada" ? "Entrada" : "Saída"}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
                <View style={pagesStyles.field}>
                    <Text style={pagesStyles.label}>Quantidade</Text>
                    <TextInput accessibilityLabel="Quantidade" style={pagesStyles.input}
                        keyboardType="number-pad" value={quantity} onChangeText={setQuantity} editable={!busy}
                    />
                </View>
                <AnimatedButton title={busy ? "Salvando..." : "Registrar lançamento"} disabled={busy || !product}
                    stylesPressable={[pagesStyles.primaryButton, !product && styles.disabled]}
                    stylesText={pagesStyles.primaryButtonText}
                    onPress={save}
                />
                {!!error && <Text accessibilityRole="alert" style={pagesStyles.errorText}>{error}</Text>}
                {!!success && <Text accessibilityLiveRegion="polite">{success}</Text>}
            </View>
        </RecordModal>
    );
}

const styles = StyleSheet.create({
    form: { width: "100%", maxWidth: 480, gap: 10, padding: 16 },
    options: { flexDirection: "row", gap: 8 },
    dropdown: { borderWidth: 1, borderColor: Colors.hexCFDDE6, borderRadius: 8, backgroundColor: Colors.hexF8FAFC },
    dropdownOption: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center" },
    dropdownMessage: { padding: 12, color: Colors.hex64748B },
    disabled: { opacity: 0.5 },
});
