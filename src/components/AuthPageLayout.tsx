import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AuthPageLayout({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Brand */}
          <View style={styles.brandHeader}>
            <View style={styles.brandIconContainer}>
              <Ionicons name="cube" size={26} color="#FFFDF9" />
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandAppTitle}>PALLETCORE</Text>
              <Text style={styles.brandSubtitle}>SISTEMA INTEGRADO • TCC</Text>
            </View>
          </View>

          <View style={styles.card}>{children}</View>

          <View style={styles.bottomWatermark}>
            <Text style={styles.bottomWatermarkText}>Ambiente Seguro Supabase • v1.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F9"
  },
  flex: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 24,
    gap: 10,
  },
  brandIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#0B4F6C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B4F6C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  brandTextContainer: {
    alignItems: "center",
  },
  brandAppTitle: {
    fontSize: 19,
    fontFamily: "WorksansBold",
    color: "#0F172A",
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontFamily: "WorksansSemiBold",
    color: "#0891B2",
    letterSpacing: 1.8,
    marginTop: 2,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE7EE",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: "#0A3B52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  brand: {
    color: "#0891B2",
    fontSize: 12,
    fontFamily: "WorksansSemiBold",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  title: {
    marginTop: 8,
    color: "#0F172A",
    fontSize: 26,
    lineHeight: 32,
    fontFamily: "WorksansBold"
  },
  description: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "WorksansRegular"
  },
  form: {
    marginTop: 24,
    gap: 18
  },
  field: {
    gap: 7
  },
  label: {
    color: "#1E293B",
    fontSize: 13,
    fontFamily: "WorksansSemiBold"
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#CFDDE6",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    color: "#0F172A",
    fontSize: 15,
    fontFamily: "WorksansRegular",
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#0B4F6C",
    marginTop: 6,
    shadowColor: "#0B4F6C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonPressed: {
    backgroundColor: "#083A50",
    transform: [{ scale: 0.99 }]
  },
  primaryButtonText: {
    color: "#FFFDF9",
    fontSize: 15,
    fontFamily: "WorksansSemiBold",
    letterSpacing: 0.3,
  },
  link: {
    color: "#0E7490",
    fontSize: 13,
    fontFamily: "WorksansSemiBold"
  },
  footer: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#E2EBF0",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5
  },
  footerText: {
    color: "#475569",
    fontSize: 13,
    fontFamily: "WorksansRegular"
  },
  error: {
    borderWidth: 1,
    borderColor: "#F0CBC2",
    borderRadius: 12,
    backgroundColor: "#FDF2EF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#A74E3C",
    fontSize: 13,
    fontFamily: "WorksansMedium",
    flex: 1,
  },
  warning: {
    borderWidth: 1,
    borderColor: "#EADDC6",
    borderRadius: 12,
    backgroundColor: "#FDF8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: {
    color: "#9A6B24",
    fontSize: 13,
    fontFamily: "WorksansMedium",
    flex: 1,
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD8E2",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 14,
    fontFamily: "WorksansSemiBold"
  },
  bottomWatermark: {
    marginTop: 24,
    alignItems: "center",
  },
  bottomWatermarkText: {
    color: "#94A3B8",
    fontSize: 11,
    fontFamily: "WorksansRegular",
    letterSpacing: 0.5,
  },
});

const styles = authStyles;
