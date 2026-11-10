import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { Colors } from "@/src/theme/colors";

const useNativeDriver = Platform.OS !== "web";
const ink = Colors.hex1E293B;

function Scenery() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 480 280">
      <Ellipse cx="249" cy="155" rx="180" ry="106" fill={Colors.hexE0F2FE} />
      <Circle cx="373" cy="65" r="23" fill={Colors.hexFDE68A} />
      <G fill={Colors.white}>
        <Path d="M82 87a13 13 0 0 1 22-10 18 18 0 0 1 34 7 11 11 0 0 1 0 22H83a10 10 0 0 1-1-19Z" />
        <Path d="M268 54a10 10 0 0 1 18-6 14 14 0 0 1 26 5 9 9 0 0 1 0 18h-43a9 9 0 0 1-1-17Z" />
      </G>
      <G fill="none" stroke={Colors.hexBAE6FD} strokeWidth="3" strokeLinecap="round">
        <Path d="M151 102h45m-31 10h19M328 94h25" />
        <Path d="M88 143v-10m-5 5h10M307 119v-10m-5 5h10" />
      </G>
      <Ellipse cx="248" cy="239" rx="191" ry="10" fill={Colors.hexDCE7EE} />
      <Path d="M24 239h432" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <Path d="M51 254h38m28 0h64m28 0h38m29 0h63m28 0h47" stroke={Colors.hexCBD8E2} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

function Truck() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 480 280">
      <G stroke={ink} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
        <Path d="M185 197h221v17H185z" fill={Colors.hex334155} />
        <Rect x="175" y="184" width="172" height="16" rx="5" fill={Colors.hex38BDF8} />
        <Path d="M183 186h154" stroke={Colors.hexBAE6FD} strokeWidth="3" />
        <Path d="M343 132q0-9 10-9h28q8 0 13 8l24 33q5 7 5 17v31h-80Z" fill={Colors.hex0891B2} />
        <Path d="M353 137h26q3 0 5 4l16 23h-47Z" fill={Colors.hexBAE6FD} />
        <Path d="m360 141 11 17" stroke={Colors.white} strokeWidth="4" />
        <Path d="M407 175h16v15h-12q-4 0-4-4Z" fill={Colors.hexFDE68A} />
        <Path d="M353 179h11" stroke={Colors.hexE0F2FE} />
        <Path d="M394 195q7 6 14 0" fill="none" stroke={Colors.hexE0F2FE} />
        <Rect x="413" y="205" width="16" height="10" rx="4" fill={Colors.hexCBD8E2} />
        <Path d="M183 204v9" stroke={Colors.hexF87171} strokeWidth="5" />
        <Path d="M346 135v-10m-4 0h8" stroke={Colors.hexFDE68A} strokeWidth="5" />
        <Path d="M365 166v37" stroke={Colors.hex0E7490} strokeWidth="2" />
      </G>
      {/* A friendly driver peeking through the window. */}
      <Circle cx="385" cy="155" r="4" fill={ink} />
      <Circle cx="386" cy="154" r="1.2" fill={Colors.white} />
      <Path d="m396 155 3 4" stroke={Colors.hexE0F2FE} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function Pallet() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 480 280">
      <G stroke={Colors.hex78350F} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <Rect x="54" y="166" width="36" height="34" rx="4" fill={Colors.hexFDE68A} />
        <Rect x="91" y="166" width="37" height="34" rx="4" fill={Colors.hexF0DFBC} />
        <Rect x="71" y="139" width="40" height="28" rx="4" fill={Colors.hexFDE68A} />
        <Path d="M87 141v10l4-2 4 2v-10m-25 27v10m39-10v10" fill="none" stroke={Colors.hexB45309} strokeWidth="3" />
        <Rect x="48" y="199" width="87" height="9" rx="2" fill={Colors.hexD97706} />
        <Path d="M53 209v10h13v-10m19 0v10h13v-10m19 0v10h13v-10" fill={Colors.hex9C6E2E} />
        <Rect x="48" y="218" width="87" height="6" rx="2" fill={Colors.hexD97706} />
        <Path d="M57 203h14m8 0h16m9 0h20" stroke={Colors.hexFDE68A} strokeWidth="2" />
      </G>
      <Rect x="101" y="184" width="16" height="10" rx="2" fill={Colors.hexFFFDF9} />
      <Path d="m106 189 2 2 4-4" fill="none" stroke={Colors.hex15803D} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Wheel() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="17.5" fill={Colors.hex334155} stroke={ink} strokeWidth="3" />
      <Circle cx="20" cy="20" r="9" fill={Colors.hexCBD8E2} stroke={ink} strokeWidth="2.5" />
      <Path d="M20 12v5m0 6v5m-8-8h5m6 0h5" stroke={Colors.white} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="20" cy="20" r="3" fill={ink} />
    </Svg>
  );
}

export function LoginTruckAnimation({ ready, onComplete }: { ready: boolean; onComplete: () => void }) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(Math.max(width - 24, 240), 540);
  const scale = sceneWidth / 480;
  const [{ load, drive, bounce, opacity }] = useState(() => ({
    load: new Animated.Value(0),
    drive: new Animated.Value(0),
    bounce: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }));
  const [loadFinished, setLoadFinished] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const loaded = loadFinished || reduceMotion === true;
  const departing = ready && loaded && reduceMotion === false;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      value => { if (mounted) setReduceMotion(value); },
      () => { if (mounted) setReduceMotion(false); },
    );
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      load.setValue(1);
      return;
    }
    const animation = Animated.timing(load, {
      toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver,
    });
    animation.start(({ finished }) => { if (finished) setLoadFinished(true); });
    return () => animation.stop();
  }, [load, reduceMotion]);

  useEffect(() => {
    if (!ready || !loaded || reduceMotion === null) return;
    if (reduceMotion) {
      const timeout = setTimeout(onComplete, 200);
      return () => clearTimeout(timeout);
    }
    const jiggle = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 100, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      Animated.timing(bounce, { toValue: 0, duration: 100, easing: Easing.inOut(Easing.sin), useNativeDriver }),
    ]));
    const departure = Animated.sequence([
      Animated.delay(300),
      Animated.timing(drive, { toValue: 1, duration: 1250, easing: Easing.in(Easing.quad), useNativeDriver }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver }),
    ]);
    jiggle.start();
    departure.start(({ finished }) => { if (finished) onComplete(); });
    return () => { departure.stop(); jiggle.stop(); };
  }, [ready, loaded, reduceMotion, bounce, drive, opacity, onComplete]);

  const title = departing ? "Tudo pronto. Vamos nessa!" : loaded ? "Conferindo seu acesso" : "Preparando sua entrada";
  const description = departing ? "Seu painel está logo ali." : loaded ? "Só mais um instante para seguir viagem." : "Um pallet a bordo e tudo no lugar.";
  const truckTransform = [
    { translateX: drive.interpolate({ inputRange: [0, 0.15, 0.25, 1], outputRange: [0, -7 * scale, 0, width] }) },
    { translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -2 * scale] }) },
  ];
  const rotation = drive.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "1080deg"] });

  return (
    <Animated.View style={[styles.overlay, { opacity }]} accessibilityViewIsModal testID="login-transition">
      <View style={styles.content}>
        <View style={styles.brand}><View style={styles.brandDot} /><Text style={styles.brandText}>PALLETCORE</Text></View>
        <View style={{ width: sceneWidth, height: 280 * scale }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Scenery />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
            opacity: drive.interpolate({ inputRange: [0, 0.2, 0.4, 1], outputRange: [0, 0, 0.8, 0] }),
            transform: [{ translateX: drive.interpolate({ inputRange: [0, 1], outputRange: [0, 60 * scale] }) }],
          }]}>
            <Svg width="100%" height="100%" viewBox="0 0 480 280">
              <G fill={Colors.hexCBD8E2}><Circle cx="174" cy="226" r="11" /><Circle cx="153" cy="230" r="8" /><Circle cx="137" cy="233" r="5" /></G>
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: truckTransform }]} testID="login-truck">
            <Truck />
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [
              { translateX: load.interpolate({ inputRange: [0, 0.35, 0.75, 1], outputRange: [0, 0, 157 * scale, 157 * scale] }) },
              { translateY: load.interpolate({ inputRange: [0, 0.15, 0.35, 0.75, 0.92, 1], outputRange: [0, 0, -72 * scale, -72 * scale, -37 * scale, -40 * scale] }) },
            ] }]} testID="login-pallet"><Pallet /></Animated.View>
            {[225, 388].map(x => (
              <Animated.View key={x} style={{ position: "absolute", left: (x - 20) * scale, top: 200 * scale, width: 40 * scale, height: 40 * scale, transform: [{ rotate: rotation }] }}><Wheel /></Animated.View>
            ))}
          </Animated.View>
        </View>
        <View style={styles.copy} accessibilityLiveRegion="polite" accessibilityRole="text">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.steps}>
          {["Carregando", "Acesso", "Partiu!"].map((label, index) => {
            const active = index === 0 || (index === 1 && loaded) || (index === 2 && departing);
            return <View key={label} style={styles.step}>
              <View style={[styles.stepLine, active && styles.stepLineActive]} />
              <Text style={[styles.stepText, active && styles.stepTextActive]}>{label}</Text>
            </View>;
          })}
        </View>
      </View>
      <Text style={styles.footer}>Uma boa gestão move tudo.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, elevation: 20, backgroundColor: Colors.hexF8FAFC, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  content: { width: "100%", alignItems: "center", paddingVertical: 32 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  brandDot: { width: 10, height: 10, borderRadius: 3, backgroundColor: Colors.hex0891B2, transform: [{ rotate: "-12deg" }] },
  brandText: { fontFamily: "WorksansBold", fontSize: 13, letterSpacing: 2.6, color: Colors.hex0B4F6C },
  copy: { alignItems: "center", paddingHorizontal: 24, gap: 8, marginTop: 16 },
  title: { fontFamily: "WorksansBold", fontSize: 23, lineHeight: 30, color: ink, textAlign: "center" },
  description: { fontFamily: "WorksansRegular", fontSize: 14, lineHeight: 21, color: Colors.hex64748B, textAlign: "center" },
  steps: { flexDirection: "row", gap: 10, marginTop: 30, width: "70%", maxWidth: 280 },
  step: { flex: 1, gap: 8, alignItems: "center" },
  stepLine: { height: 4, width: "100%", borderRadius: 2, backgroundColor: Colors.hexE2EBF0 },
  stepLineActive: { backgroundColor: Colors.hex0891B2 },
  stepText: { fontFamily: "WorksansMedium", fontSize: 10, color: Colors.hex94A3B8 },
  stepTextActive: { color: Colors.hex0B4F6C },
  footer: { position: "absolute", bottom: 28, color: Colors.hex94A3B8, fontFamily: "WorksansRegular", fontSize: 11, letterSpacing: 0.4 },
});
