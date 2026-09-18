import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { AnimatedButton } from "../../src/components/AnimatedButton";
import { supabase } from "../../src/lib/supabase";

export default function sendResetPassword() {
  const [email, setEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false)
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
      <Text style={authStyles.brand}>Recuperação</Text>
      <Text style={authStyles.title}>Esqueceu a senha?</Text>
      <Text style={authStyles.description}>Informe seu e-mail para receber as instruções de redefinição.</Text>
      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>E-mail</Text>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="voce@exemplo.com" placeholderTextColor="#A79E92" style={authStyles.input} value={email} />
        </View>
        {errorMessage ?
          <View style={authStyles.error}>
            <Text style={authStyles.errorText}>
              {errorMessage}
            </Text>
          </View>
          :
          message ?
            <View style={authStyles.warning}>
              <Text style={authStyles.warningText}>
                {message}
              </Text>
            </View>
            :
            null}
        <AnimatedButton
          title={!loading ? "Enviar instruções" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={resetPassword}
        />
        <AnimatedButton
          title={"Voltar para entrar"}
          stylesPressable={authStyles.secondaryButton}
          stylesText={authStyles.secondaryButtonText}
          onPress={() => router.replace("/(auth)/signIn")}
        />
      </View>
    </AuthPageLayout>
  );
}
