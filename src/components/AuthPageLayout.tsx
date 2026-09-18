import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
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
          <View style={styles.card}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F4EE"
  },
  flex: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFDF9",
    borderWidth: 1,
    borderColor: "#E9E2D7",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0px 12px 22px #5A5146",
    elevation: 3,
  },
  brand: {
    color: "#9A6540",
    fontSize: 13,
    fontFamily: "WorksansSemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  title: {
    marginTop: 10,
    color: "#302B26",
    fontSize: 30,
    lineHeight: 36,
    fontFamily: "WorksansBold"
  },
  description: {
    marginTop: 10,
    color: "#766E64",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "WorksansRegular"
  },
  form: {
    marginTop: 28,
    gap: 18
  },
  field: {
    gap: 8
  },
  label: {
    color: "#4D463E",
    fontSize: 14,
    fontFamily: "WorksansSemiBold"
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#DED6CA",
    borderRadius: 12,
    backgroundColor: "#FFFEFC",
    paddingHorizontal: 15,
    color: "#302B26",
    fontSize: 16,
    fontFamily: "WorksansRegular",
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#79553D",
    marginTop: 6
  },
  primaryButtonPressed: {
    backgroundColor: "#65442F"
  },
  primaryButtonText: {
    color: "#FFFDF9",
    fontSize: 16,
    fontFamily: "WorksansSemiBold"
  },
  link: {
    color: "#8D5C3B",
    fontSize: 14,
    fontFamily: "WorksansSemiBold"
  },
  footer: {
    marginTop: 22,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4
  },
  footerText: {
    color: "#766E64",
    fontSize: 14,
    fontFamily: "WorksansRegular"
  },
  error: {
    borderWidth: 1,
    borderColor: "#E9C6BD",
    borderRadius: 12,
    backgroundColor: "#FDF0EC",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  errorText: {
    color: "#A74E3C",
    fontSize: 14,
    fontFamily: "WorksansMedium"
  },
  warning: {
    borderWidth: 1,
    borderColor: "#e9d6bd",
    borderRadius: 12,
    backgroundColor: "#fdf5ec",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  warningText: {
    color: "#a57834",
    fontSize: 14,
    fontFamily: "WorksansMedium"
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8CFC3"
  },
  secondaryButtonText: {
    color: "#5C5248",
    fontSize: 14,
    fontFamily: "WorksansSemiBold"
  },
});

const styles = authStyles;
