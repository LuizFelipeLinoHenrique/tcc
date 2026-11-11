import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LoginTruckAnimation } from "@/src/components/LoginTruckAnimation";

type LoginTransition = {
  start: () => boolean;
  slow: boolean;
  succeed: () => void;
  cancel: () => void;
};

const LoginTransitionContext = createContext<LoginTransition | null>(null);

// Lives above the navigator so signing in cannot unmount the animation mid-trip.
export function LoginTransitionProvider({ children }: PropsWithChildren) {
  const [phase, setPhase] = useState<"loading" | "slow" | "success" | null>(null);
  const pending = useRef(false);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearWaitTimer = useCallback(() => {
    if (waitTimer.current !== null) clearTimeout(waitTimer.current);
    waitTimer.current = null;
  }, []);
  useEffect(() => clearWaitTimer, [clearWaitTimer]);

  const start = useCallback(() => {
    if (pending.current) return false;
    pending.current = true;
    setPhase("loading");
    waitTimer.current = setTimeout(() => setPhase("slow"), 6000);
    return true;
  }, []);
  const dismiss = useCallback(() => setPhase(null), []);
  const cancel = useCallback(() => {
    pending.current = false;
    clearWaitTimer();
    dismiss();
  }, [clearWaitTimer, dismiss]);
  const succeed = useCallback(() => {
    pending.current = false;
    clearWaitTimer();
    setPhase(current => current === "loading" ? "success" : null);
  }, [clearWaitTimer]);
  const slow = phase === "slow";
  const value = useMemo(() => ({ start, succeed, cancel, slow }), [start, succeed, cancel, slow]);
  const active = phase === "loading" || phase === "success";

  return (
    <LoginTransitionContext.Provider value={value}>
      <View style={styles.container}>
        <View
          style={styles.container}
          pointerEvents={active ? "none" : "auto"}
          accessibilityElementsHidden={active}
          importantForAccessibility={active ? "no-hide-descendants" : "auto"}
        >
          {children}
        </View>
        {active && <LoginTruckAnimation ready={phase === "success"} onComplete={dismiss} />}
      </View>
    </LoginTransitionContext.Provider>
  );
}

export function useLoginTransition() {
  const context = useContext(LoginTransitionContext);
  if (!context) throw new Error("useLoginTransition requires LoginTransitionProvider");
  return context;
}

const styles = StyleSheet.create({ container: { flex: 1 } });
