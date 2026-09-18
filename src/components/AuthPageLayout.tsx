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
              <Text style={styles.brandAppTitle}>NEXUS GESTÃO</Text>
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
    backgroundColor: "#F6F3ED"
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
    backgroundColor: "#79553D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#79553D",
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
    color: "#302B26",
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontFamily: "WorksansSemiBold",
    color: "#9A6540",
    letterSpacing: 1.8,
    marginTop: 2,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E1D5",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: "#3A2A1D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  brand: {
    color: "#9A6540",
    fontSize: 12,
    fontFamily: "WorksansSemiBold",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  title: {
    marginTop: 8,
    color: "#2C2520",
    fontSize: 26,
    lineHeight: 32,
    fontFamily: "WorksansBold"
  },
  description: {
    marginTop: 8,
    color: "#6E655B",
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
    color: "#463E36",
    fontSize: 13,
    fontFamily: "WorksansSemiBold"
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#DCD4C7",
    borderRadius: 12,
    backgroundColor: "#FAF8F5",
    paddingHorizontal: 16,
    color: "#2C2520",
    fontSize: 15,
    fontFamily: "WorksansRegular",
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#79553D",
    marginTop: 6,
    shadowColor: "#79553D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonPressed: {
    backgroundColor: "#63422C",
    transform: [{ scale: 0.99 }]
  },
  primaryButtonText: {
    color: "#FFFDF9",
    fontSize: 15,
    fontFamily: "WorksansSemiBold",
    letterSpacing: 0.3,
  },
  link: {
    color: "#8D5C3B",
    fontSize: 13,
    fontFamily: "WorksansSemiBold"
  },
  footer: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#F0EBE1",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5
  },
  footerText: {
    color: "#766E64",
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
    borderColor: "#D8CFC3",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#5C5248",
    fontSize: 14,
    fontFamily: "WorksansSemiBold"
  },
  bottomWatermark: {
    marginTop: 24,
    alignItems: "center",
  },
  bottomWatermarkText: {
    color: "#A8A095",
    fontSize: 11,
    fontFamily: "WorksansRegular",
    letterSpacing: 0.5,
  },
});

const styles = authStyles;
