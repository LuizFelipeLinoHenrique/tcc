import { AnimatedButton } from "@/src/components/AnimatedButton";
import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { setSigningUp } from "../../src/lib/authFlow";
import { supabase } from "../../src/lib/supabase";

export default function SignUpPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function signUp() {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Preencha todos os campos.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return;
    };

    setSigningUp(true);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim()
          }
        }
      });

      if (error) {
        setErrorMessage("Não foi possível criar sua conta. Tente novamente mais tarde.");
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
      };

      if (data.session) {
        await supabase.auth.signOut();
      };

    } finally {
      router.replace("/(auth)/signIn");
      setSigningUp(false);
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <Text style={authStyles.brand}>
        Cadastro de Usuário
      </Text>
      <Text style={authStyles.title}>
        Crie sua conta
      </Text>
      <Text style={authStyles.description}>
        Preencha os dados abaixo para ingressar no sistema.
      </Text>

      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            Nome de usuário
          </Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#9C9286" style={localStyles.inputIcon} />
            <TextInput
              autoComplete="username"
              onChangeText={setDisplayName}
              placeholder="Ex: Luiz Henrique"
              placeholderTextColor="#A79E92"
              style={[authStyles.input, localStyles.inputWithIcon]}
              value={displayName}
            />
          </View>
        </View>

        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            E-mail corporativo
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
          <Text style={authStyles.label}>
            Senha de acesso
          </Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9C9286" style={localStyles.inputIcon} />
            <TextInput
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder="Defina uma senha segura"
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
          title={!loading ? "Criar Minha Conta" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={signUp}
        />

        <AnimatedButton
          title={
            <View style={localStyles.backButtonContent}>
              <Ionicons name="arrow-back-outline" size={16} color="#5C5248" />
              <Text style={authStyles.secondaryButtonText}>Voltar para o login</Text>
            </View>
          }
          stylesPressable={[authStyles.secondaryButton]}
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
  inputWithRightIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    zIndex: 2,
    padding: 4,
  },
  backButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
