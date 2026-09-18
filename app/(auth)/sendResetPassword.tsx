import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedButton } from "../../src/components/AnimatedButton";
import { supabase } from "../../src/lib/supabase";

export default function sendResetPassword() {
  const [email, setEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  async function resetPassword() {
    if (!email.trim()) {
      setErrorMessage("Informe seu endereço de e-mail.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    };

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(), {
        redirectTo: "http://localhost:8081/resetPassword", // trocar pelo endereço de recuperação
      });

      if (error) {
        setErrorMessage("Não foi possível enviar o e-mail. Tente novamente.");
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
      };

      if (!error) {
        setMessage("Se o e-mail estiver cadastrado, enviaremos as instruções em instantes."); // não é um erro, apenas um aviso
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
      };

    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <Text style={authStyles.brand}>Recuperação de Acesso</Text>
      <Text style={authStyles.title}>Esqueceu a senha?</Text>
      <Text style={authStyles.description}>Informe seu e-mail cadastrado para receber o link de redefinição.</Text>

      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>E-mail</Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#9C9286" style={localStyles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="voce@exemplo.com"
              placeholderTextColor="#A79E92"
              style={[authStyles.input, localStyles.inputWithIcon]}
              value={email}
            />
          </View>
        </View>

        {errorMessage ? (
          <View style={authStyles.error}>
            <Ionicons name="alert-circle-outline" size={18} color="#A74E3C" />
            <Text style={authStyles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : message ? (
          <View style={authStyles.warning}>
            <Ionicons name="information-circle-outline" size={18} color="#9A6B24" />
            <Text style={authStyles.warningText}>
              {message}
            </Text>
          </View>
        ) : null}

        <AnimatedButton
          title={!loading ? "Enviar Instruções" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={resetPassword}
        />

        <AnimatedButton
          title={
            <View style={localStyles.backButtonContent}>
              <Ionicons name="arrow-back-outline" size={16} color="#5C5248" />
              <Text style={authStyles.secondaryButtonText}>Voltar para o login</Text>
            </View>
          }
          stylesPressable={authStyles.secondaryButton}
          onPress={() => router.replace("/(auth)/signIn")}
        />
      </View>
    </AuthPageLayout>
  );
}

const localStyles = StyleSheet.create({
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    zIndex: 2,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  backButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
