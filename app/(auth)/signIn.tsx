import { AnimatedButton } from "@/src/components/AnimatedButton";
import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function SignInPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false)

  async function logIn() {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Preencha todos os campos.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setErrorMessage(error.message === "Invalid login credentials" ? "Credenciais inválidas." : "Não foi possível entrar. Tente novamente.");
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
      };

    } finally {
      setLoading(false)

    }
  };

  return (
    <AuthPageLayout>
      <Text style={authStyles.brand}>
        Sua conta
      </Text>
      <Text style={authStyles.title}>
        Boas-vindas de volta
      </Text>
      <Text style={authStyles.description}>
        Entre para continuar de onde parou.
      </Text>

      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            E-mail
          </Text>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="voce@exemplo.com" placeholderTextColor="#A79E92" style={authStyles.input} value={email} />
        </View>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            Senha
          </Text>
          <TextInput autoComplete="current-password" onChangeText={setPassword} placeholder="Digite sua senha" placeholderTextColor="#A79E92" secureTextEntry style={authStyles.input} value={password} />
          <Pressable accessibilityRole="button" onPress={() => router.push("/sendResetPassword")}>
            <Text style={authStyles.link}>
              Esqueceu a senha?
            </Text>
          </Pressable>
        </View>
        {errorMessage ?
          <View style={authStyles.error}>
            <Text style={authStyles.errorText}>
              {errorMessage}
            </Text>
          </View>
          :
          null}
        <AnimatedButton
          title={!loading ? "Entrar" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={logIn}
        />
      </View>
      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>
          Primeira vez?
        </Text>
        <Link href="/(auth)/signUp" style={authStyles.link}>
          Criar uma conta
        </Link>
      </View>
    </AuthPageLayout>
  );
}
