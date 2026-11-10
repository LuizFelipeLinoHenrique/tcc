import { useRef, useState } from "react";
import { Modal } from "react-native";
import { supabase } from "@/src/lib/supabase";
import ConfirmationCard from "./ConfirmationCard";

export default function SignOutConfirmation({ onClose }: { onClose: () => void }) {
    const pending = useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function signOut() {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // The root Stack.Protected switches to the login screen on SIGNED_OUT.
            onClose();
        } catch {
            setError("Não foi possível desconectar. Verifique sua conexão e tente novamente.");
        } finally {
            pending.current = false;
            setBusy(false);
        }
    }

    return (
        <Modal visible animationType="fade" onRequestClose={() => { if (!pending.current) onClose(); }}>
            <ConfirmationCard
                action={signOut}
                busy={busy}
                error={error}
                setCardConfirmation={() => { if (!pending.current) onClose(); }}
            />
        </Modal>
    );
}
