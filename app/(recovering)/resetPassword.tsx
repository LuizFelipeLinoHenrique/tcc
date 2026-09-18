import { AnimatedButton } from "@/src/components/AnimatedButton";
import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function newPassword() {
    if (!password.trim()) {
      setErrorMessage("Informe sua nova senha.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    };

    setLoading(true);

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
      console.log("Erro ao recuperar senha");

    } finally {
      setLoading(false);
    }

    await supabase.auth.signOut();
    router.replace("/(auth)/signIn");
  };

  return (
    <AuthPageLayout>
      <Text style={authStyles.brand}>
        Segurança da Conta
      </Text>
      <Text style={authStyles.title}>
        Redefina sua senha
      </Text>
      <Text style={authStyles.description}>
        Escolha uma nova senha forte para proteger seu acesso.
      </Text>

      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            Nova senha
          </Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9C9286" style={localStyles.inputIcon} />
            <TextInput
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder="Digite sua nova senha"
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
          title={!loading ? "Redefinir e Entrar" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={newPassword}
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
  inputWithRightIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    zIndex: 2,
    padding: 4,
  },
});
