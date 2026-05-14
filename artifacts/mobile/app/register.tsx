import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

export default function RegisterScreen() {
  const { t, isRTL } = useLanguage();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ name: "", lastName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  const update = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleRegister() {
    if (!form.name || !form.lastName || !form.email || !form.phone || !form.password) {
      Alert.alert(t.common.error, "All fields are required");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert(t.common.error, data.error || "Registration failed");
        return;
      }
      await login(data.token, data.user);
    } catch {
      Alert.alert(t.common.error, t.common.error);
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof typeof form; label: string; keyboard?: "email-address" | "phone-pad"; secure?: boolean }[] = [
    { key: "name", label: t.common.name },
    { key: "lastName", label: t.common.lastName },
    { key: "email", label: t.common.email, keyboard: "email-address" },
    { key: "phone", label: t.common.phone, keyboard: "phone-pad" },
    { key: "password", label: t.common.password, secure: true },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.light.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>NQL</Text>
            <Text style={styles.logoDZ}>DZ</Text>
          </View>
          <Text style={styles.appName}>NQL DZ</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.auth.registerTitle}</Text>
          {fields.map(f => (
            <View key={f.key} style={styles.field}>
              <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{f.label}</Text>
              <TextInput
                style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
                value={form[f.key]}
                onChangeText={update(f.key)}
                keyboardType={f.keyboard ?? "default"}
                secureTextEntry={f.secure}
                autoCapitalize="none"
                placeholder={f.label}
                placeholderTextColor={colors.light.mutedForeground}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.auth.registerBtn}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/login")} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              {t.auth.hasAccount} <Text style={styles.loginLinkBold}>{t.auth.loginHere}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: 20 },
  header: { alignItems: "center", marginBottom: 24 },
  logoCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  logoText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF", letterSpacing: 2 },
  logoDZ: { fontFamily: "Changa_700Bold", fontSize: 9, color: "rgba(255,255,255,0.8)", letterSpacing: 3 },
  appName: { fontFamily: "Changa_700Bold", fontSize: 26, color: C.primary },
  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 24, width: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground, marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, marginBottom: 6 },
  input: {
    backgroundColor: C.input, borderRadius: 12, padding: 14,
    fontFamily: "Changa_400Regular", fontSize: 16, color: C.foreground,
    borderWidth: 1.5, borderColor: C.border,
  },
  btn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  btnText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
  loginLink: { marginTop: 16, alignItems: "center" },
  loginLinkText: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground },
  loginLinkBold: { fontFamily: "Changa_600SemiBold", color: C.primary },
});
