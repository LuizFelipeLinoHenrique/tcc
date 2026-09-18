import { AnimatedButton } from "@/src/components/AnimatedButton";
import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../src/lib/supabase";

export default function SignInPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

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
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <Text style={authStyles.brand}>
        Acesso ao Sistema
      </Text>
      <Text style={authStyles.title}>
        Boas-vindas de volta
      </Text>
      <Text style={authStyles.description}>
        Entre com suas credenciais para acessar o painel.
      </Text>

      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            E-mail
          </Text>
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

        <View style={authStyles.field}>
          <View style={localStyles.passwordHeader}>
            <Text style={authStyles.label}>
              Senha
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/sendResetPassword")}>
              <Text style={authStyles.link}>
                Esqueceu a senha?
              </Text>
            </Pressable>
          </View>
          <View style={localStyles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9C9286" style={localStyles.inputIcon} />
            <TextInput
              autoComplete="current-password"
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              placeholderTextColor="#A79E92"
              secureTextEntry={!showPassword}
              style={[authStyles.input, localStyles.inputWithIcon, localStyles.inputWithRightIcon]}
              value={password}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={localStyles.eyeButton}
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#8D5C3B"
              />
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <View style={authStyles.error}>
            <Ionicons name="alert-circle-outline" size={18} color="#A74E3C" />
            <Text style={authStyles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <AnimatedButton
          title={!loading ? "Entrar no Sistema" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={logIn}
        />
      </View>

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>
          Não tem uma conta cadastrada?
        </Text>
        <Link href="/(auth)/signUp" style={authStyles.link}>
          Criar nova conta
        </Link>
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
  inputWithRightIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    zIndex: 2,
    padding: 4,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
