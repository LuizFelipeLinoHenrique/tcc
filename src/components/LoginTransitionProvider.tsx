import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LoginTruckAnimation } from "@/src/components/LoginTruckAnimation";

type LoginTransition = {
  start: () => void;
  succeed: () => void;
  cancel: () => void;
};

const LoginTransitionContext = createContext<LoginTransition | null>(null);

// Lives above the navigator so signing in cannot unmount the animation mid-trip.
export function LoginTransitionProvider({ children }: PropsWithChildren) {
  const [phase, setPhase] = useState<"loading" | "success" | null>(null);
  const start = useCallback(() => setPhase("loading"), []);
  const succeed = useCallback(() => setPhase(current => current === "loading" ? "success" : current), []);
  const cancel = useCallback(() => setPhase(null), []);
  const value = useMemo(() => ({ start, succeed, cancel }), [start, succeed, cancel]);
  const active = phase !== null;

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
        {active && <LoginTruckAnimation ready={phase === "success"} onComplete={cancel} />}
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
