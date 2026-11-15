import { Colors } from "@/src/theme/colors";
import { AnimatedButton } from "@/src/components/AnimatedButton";
import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { recoveryTokens } from "@/src/lib/authFlow";
import { createRecoveryClient } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLinkingURL } from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const nativeUrl = useLinkingURL();
  const [webUrl] = useState(() => typeof window === "undefined" ? null : window.location.href);
  const url = Platform.OS === "web" ? webUrl : nativeUrl;
  const [recovery, setRecovery] = useState<{
    url: string;
    client: ReturnType<typeof createRecoveryClient> | null;
  } | null>(null);

  useEffect(() => {
    const tokens = recoveryTokens(url);
    if (!url || !tokens) return;
    let active = true;
    async function openRecoverySession(callbackUrl: string, credentials: NonNullable<ReturnType<typeof recoveryTokens>>) {
      const client = createRecoveryClient();
      try {
        const { data, error } = await client.auth.setSession(credentials);
        if (active) setRecovery({ url: callbackUrl, client: !error && data.session ? client : null });
      } catch {
        if (active) setRecovery({ url: callbackUrl, client: null });
      }
    }
    void Promise.resolve().then(() => {
      if (active) void openRecoverySession(url, tokens);
    });
    return () => { active = false; };
  }, [url]);

  const client = recovery?.url === url ? recovery.client : null;
  const checkingLink = !!recoveryTokens(url) && recovery?.url !== url;

  async function newPassword() {
    if (!client || loading) return;
    if (!password.trim()) {
      setErrorMessage("Informe sua nova senha.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        setErrorMessage(error.code === "weak_password"
          ? "Escolha uma senha mais forte e tente novamente."
          : "Não foi possível redefinir a senha. Confira se o link ainda é válido.");
        return;
      }

      await client.auth.signOut({ scope: "local" });
      router.replace("/");
    } catch {
      setErrorMessage("Não foi possível concluir a redefinição. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!client) {
    return (
      <AuthPageLayout>
        <Text style={authStyles.title}>Redefina sua senha</Text>
        {checkingLink ? <ActivityIndicator /> : <>
          <Text accessibilityRole="alert" style={authStyles.description}>
            Este link é inválido ou expirou. Para tentar novamente, solicite outro link de recuperação.
          </Text>
          <AnimatedButton
            title="Voltar"
            stylesPressable={authStyles.secondaryButton}
            stylesText={authStyles.secondaryButtonText}
            onPress={() => router.replace("/")}
          />
        </>}
      </AuthPageLayout>
    );
  }

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
            <Ionicons name="lock-closed-outline" size={20} color={Colors.hex64748B} style={localStyles.inputIcon} />
            <TextInput
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder="Digite sua nova senha"
              placeholderTextColor={Colors.hex94A3B8}
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
                color={Colors.hex0E7490}
              />
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <View style={authStyles.error}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.hexA74E3C} />
            <Text style={authStyles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <AnimatedButton
          title={!loading ? "Redefinir senha" : <ActivityIndicator color={Colors.hexFFFDF9} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={newPassword}
          disabled={loading}
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
