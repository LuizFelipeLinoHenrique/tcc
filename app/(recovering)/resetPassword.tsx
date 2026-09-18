import { AnimatedButton } from "@/src/components/AnimatedButton";
import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { supabase } from "@/src/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false)

  async function newPassword() {
    if (!password.trim()) {
      setErrorMessage("Informe sua nova senha.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    };

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        setErrorMessage("Não foi possível redefinir a senha.");
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
        throw error;
      };

    }
    catch {
      console.log("Erro ao recupar senha")

    } finally {
      setLoading(false)

    }

    await supabase.auth.signOut();
    router.replace("/(auth)/signIn");
  };

  return (
    <AuthPageLayout>
      <Text style={authStyles.brand}>
        Segurança
      </Text>
      <Text style={authStyles.title}>
        Redefina sua senha
      </Text>
      <Text style={authStyles.description}>
        Escolha uma senha nova para proteger sua conta.
      </Text>
      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            Nova senha
          </Text>
          <TextInput
            autoComplete="new-password"
            onChangeText={setPassword}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#A79E92"
            secureTextEntry style={authStyles.input}
            value={password} />
        </View>
        {errorMessage
          ?
          <View style={authStyles.error}>
            <Text style={authStyles.errorText}>
              {errorMessage}
            </Text>
          </View>
          :
          null}
        <AnimatedButton
          title={!loading ? "Redefinir senha" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={newPassword}
        />
      </View>
    </AuthPageLayout>
  );
}
