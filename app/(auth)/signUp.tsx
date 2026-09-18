import { AnimatedButton } from "@/src/components/AnimatedButton";
import { AuthPageLayout, authStyles } from "@/src/components/AuthPageLayout";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { setSigningUp } from "../../src/lib/authFlow";
import { supabase } from "../../src/lib/supabase";

export default function SignUpPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
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
        Comece por aqui
      </Text>
      <Text style={authStyles.title}>
        Crie sua conta
      </Text>
      <Text style={authStyles.description}>
        Leva só um instante para preparar seu espaço.
      </Text>
      <View style={authStyles.form}>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            Nome de usuário
          </Text>
          <TextInput
            autoComplete="username"
            onChangeText={setDisplayName}
            placeholder="Como quer ser chamado?"
            placeholderTextColor="#A79E92"
            style={authStyles.input}
            value={displayName}
          />
        </View>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            E-mail
          </Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="voce@exemplo.com"
            placeholderTextColor="#A79E92"
            style={authStyles.input}
            value={email}
          />
        </View>
        <View style={authStyles.field}>
          <Text style={authStyles.label}>
            Senha
          </Text>
          <TextInput
            autoComplete="new-password"
            onChangeText={setPassword}
            placeholder="Defina uma senha"
            placeholderTextColor="#A79E92"
            secureTextEntry
            style={authStyles.input}
            value={password}
          />
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
          title={!loading ? "Criar conta" : <ActivityIndicator color={"#FFFDF9"} />}
          stylesPressable={authStyles.primaryButton}
          stylesPressablePressed={authStyles.primaryButtonPressed}
          stylesText={authStyles.primaryButtonText}
          onPress={signUp}
        />
        <AnimatedButton
          title={"Voltar para entrar"}
          stylesPressable={[authStyles.secondaryButton]}
          stylesText={authStyles.secondaryButtonText}
          onPress={() => router.replace("/(auth)/signIn")}
        />
      </View>
    </AuthPageLayout>
  );
};
