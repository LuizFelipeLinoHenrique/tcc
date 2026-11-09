import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RecordModal } from "@/src/components/RecordModal";
import { deleteRecord, recordError } from "@/src/lib/tableActions";
import { pagesStyles } from "@/src/components/ScreensLayout";

export function useRecordDeletion(
    table: Parameters<typeof deleteRecord>[0],
    onDeleted: (id: number) => void,
) {
    const [record, setRecord] = useState<{ id: number; name: string } | null>(
        null,
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const pending = useRef(false);
    const requestDelete = (id: number, name: string) => {
        if (pending.current) return;
        setError("");
        setRecord({ id, name });
    };
    const confirm = async () => {
        if (!record || pending.current) return;
        pending.current = true;
        setBusy(true);
        setError("");
        try {
            await deleteRecord(table, record.id);
            onDeleted(record.id);
            setRecord(null);
        } catch (cause) {
            setError(recordError(cause));
        } finally {
            pending.current = false;
            setBusy(false);
        }
    };
    const deletionDialog = (
        <RecordModal
            visible={record !== null}
            title="Excluir registro"
            onClose={() => setRecord(null)}
            busy={busy}
        >
            <View style={{ width: "100%", padding: 16, gap: 16 }}>
                <Text style={pagesStyles.text}>
                    Deseja realmente excluir "{record?.name}"? Esta ação não
                    pode ser desfeita.
                </Text>
                {!!error && <Text accessibilityRole="alert">{error}</Text>}
                <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={confirm}
                    style={pagesStyles.primaryButton}
                >
                    <Text style={pagesStyles.primaryButtonText}>
                        {busy ? "Excluindo..." : "Excluir"}
                    </Text>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => setRecord(null)}
                    style={pagesStyles.secondaryButton}
                >
                    <Text style={pagesStyles.secondaryButtonText}>
                        Cancelar
                    </Text>
                </Pressable>
            </View>
        </RecordModal>
    );
    return { requestDelete, deletionDialog };
}
