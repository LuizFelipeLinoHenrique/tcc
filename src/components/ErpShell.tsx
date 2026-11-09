import { Colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { Href, router, usePathname } from "expo-router";
import { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const modules: { label: string; path: string; route: Href; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Visão geral", path: "homeScreen", route: "/(tabs)/(home)/homeScreen", icon: "grid-outline" },
  { label: "Pedidos", path: "order", route: "/(tabs)/(order)/orders", icon: "receipt-outline" },
  { label: "Fluxo de caixa", path: "cashFlow", route: "/(tabs)/cashFlow", icon: "wallet-outline" },
  { label: "Clientes", path: "client", route: "/(tabs)/(client)/clients", icon: "people-outline" },
  { label: "Fornecedores", path: "supplier", route: "/(tabs)/(supplier)/suppliers", icon: "business-outline" },
  { label: "Materiais", path: "material", route: "/(tabs)/(material)/materials", icon: "layers-outline" },
  { label: "Configurações", path: "configurations", route: "/(tabs)/(configs)/configurations", icon: "settings-outline" },
];

export function ErpShell({ children, onSignOut }: PropsWithChildren<{ onSignOut: () => void }>) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const pathname = usePathname().toLowerCase();
  const active = modules.find(item => pathname.includes(item.path.toLowerCase()));
  const navigation = modules.map(item => {
    const selected = item === active;
    return <Pressable key={item.path} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={item.label}
      onPress={() => router.replace(item.route)}
      style={({ pressed, hovered }) => [styles.navItem, !desktop && styles.mobileItem, selected && styles.selected, (pressed || hovered) && styles.hover]}>
      <Ionicons name={item.icon} size={19} color={selected ? Colors.white : desktop ? Colors.hexCBD8E2 : Colors.hex475569} />
      <Text style={[styles.navText, !desktop && styles.mobileText, selected && styles.selectedText]}>{item.label}</Text>
    </Pressable>;
  });
  return <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
    <View style={styles.shell}>
      {desktop && <View style={styles.sidebar}>
        <View style={styles.brand}><View style={styles.brandIcon}><Ionicons name="cube" size={23} color={Colors.white} /></View><View><Text style={styles.brandName}>PalletCore</Text><Text style={styles.brandCaption}>GESTÃO EMPRESARIAL</Text></View></View>
        <Text style={styles.section}>ÁREA DE TRABALHO</Text>
        <View style={styles.nav}>{navigation}</View>
        <View style={styles.sidebarFooter}><Text style={styles.footerTitle}>Gestão integrada</Text><Text style={styles.footerText}>Sua operação em um só lugar.</Text></View>
      </View>}
      <View style={styles.main}>
        <View style={[styles.header, !desktop && styles.mobileHeader]}>
          <View><Text style={styles.breadcrumb}>{desktop ? "PalletCore / Workspace" : "PALLETCORE"}</Text><Text style={styles.headerTitle}>{active?.label ?? "Área de trabalho"}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={onSignOut} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.6 }]}><Ionicons name="log-out-outline" size={19} color={Colors.hex475569} /><Text style={styles.signOutText}>Sair</Text></Pressable>
        </View>
        {!desktop && <View style={styles.mobileNav}><ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNavContent}>{navigation}</ScrollView></View>}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.hexF4F7F9 },
  shell: { flex: 1, flexDirection: "row" },
  sidebar: { width: 236, backgroundColor: Colors.hex0F172A, padding: 16 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 18, paddingHorizontal: 8, marginBottom: 26 },
  brandIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.hex0B4F6C, alignItems: "center", justifyContent: "center" },
  brandName: { color: Colors.white, fontSize: 20, fontFamily: "WorksansBold" },
  brandCaption: { color: Colors.hex94A3B8, fontSize: 9, letterSpacing: 1.2, marginTop: 3, fontFamily: "WorksansMedium" },
  section: { color: Colors.hex94A3B8, fontSize: 10, letterSpacing: 1.3, paddingHorizontal: 12, marginBottom: 14, fontFamily: "WorksansSemiBold" },
  nav: { gap: 6 },
  navItem: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: 6 },
  navText: { color: Colors.hexCBD8E2, fontSize: 14, fontFamily: "WorksansMedium" },
  selected: { backgroundColor: Colors.hex0B4F6C },
  selectedText: { color: Colors.white, fontFamily: "WorksansSemiBold" },
  hover: { opacity: 0.8 },
  sidebarFooter: { marginTop: "auto", borderTopWidth: 1, borderTopColor: Colors.hex334155, paddingTop: 20, paddingHorizontal: 10, paddingBottom: 8 },
  footerTitle: { color: Colors.hexCBD8E2, fontSize: 12, fontFamily: "WorksansSemiBold" },
  footerText: { color: Colors.hex94A3B8, fontSize: 11, marginTop: 5, fontFamily: "WorksansRegular" },
  main: { flex: 1, minWidth: 0 },
  header: { minHeight: 80, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.hexDCE7EE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28, paddingVertical: 12 },
  mobileHeader: { paddingHorizontal: 18, minHeight: 70 },
  breadcrumb: { fontSize: 11, color: Colors.hex64748B, fontFamily: "WorksansRegular", marginBottom: 5 },
  headerTitle: { fontSize: 18, color: Colors.hex0F172A, fontFamily: "WorksansSemiBold" },
  signOut: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: Colors.hexDCE7EE },
  signOutText: { fontSize: 12, color: Colors.hex475569, fontFamily: "WorksansMedium" },
  mobileNav: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.hexDCE7EE },
  mobileNavContent: { padding: 10, gap: 6 },
  mobileItem: { minHeight: 42, gap: 7 },
  mobileText: { color: Colors.hex475569, fontSize: 12 },
  content: { flex: 1, minHeight: 0 },
});
