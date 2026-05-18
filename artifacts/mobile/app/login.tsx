import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

const DEMO_ACCOUNTS = [
  { label: "👤 مستخدم", email: "customer@nqldz.com", password: "Customer@1234", color: "#059669" },
  { label: "🚍 سائق",   email: "driver@nqldz.com",   password: "Driver@1234",   color: "#2C6B7F" },
  { label: "🏪 موزع",   email: "distributor@nqldz.com", password: "Dist@1234",  color: "#D4A24E" },
  { label: "🛡️ أدمن",  email: "admin@nqldz.com",    password: "Admin@1234",    color: "#7C3AED" },
];

export default function LoginScreen() {
  const { t, isRTL } = useLanguage();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t.common.error, "Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert(t.common.error, data.error || t.auth.invalidCredentials);
        return;
      }
      await login(data.token, data.user);
    } catch (e) {
      Alert.alert(t.common.error, t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.light.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>NQL</Text>
            <Text style={styles.logoDZ}>DZ</Text>
          </View>
          <Text style={styles.appName}>NQL DZ</Text>
          <Text style={styles.welcome}>{t.auth.welcome}</Text>
          <Text style={styles.tagline}>{t.auth.signInToContinue}</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.auth.loginTitle}</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.common.email}</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t.common.email}
              placeholderTextColor={colors.light.mutedForeground}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.common.password}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, textAlign: isRTL ? "right" : "left" }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                placeholder={t.common.password}
                placeholderTextColor={colors.light.mutedForeground}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPass ? "🙈" : "👁"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>{t.auth.loginBtn}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/register")} style={styles.registerLink}>
            <Text style={styles.registerLinkText}>
              {t.auth.noAccount} <Text style={styles.registerLinkBold}>{t.auth.registerHere}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo accounts */}
        <View style={styles.demoSection}>
          <TouchableOpacity
            style={styles.demoToggle}
            onPress={() => setShowDemo(!showDemo)}
            activeOpacity={0.8}
          >
            <Text style={styles.demoToggleText}>
              {showDemo ? "▲" : "▼"} الحسابات التجريبية
            </Text>
          </TouchableOpacity>

          {showDemo && (
            <View style={styles.demoGrid}>
              {DEMO_ACCOUNTS.map(acc => (
                <TouchableOpacity
                  key={acc.email}
                  style={[styles.demoCard, { borderColor: acc.color }]}
                  onPress={() => { setEmail(acc.email); setPassword(acc.password); setShowDemo(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.demoLabel}>{acc.label}</Text>
                  <Text style={[styles.demoCred, { color: acc.color }]}>{acc.email}</Text>
                  <Text style={styles.demoPwd}>{acc.password}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: 20 },
  header: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
    marginBottom: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  logoText: { fontFamily: "Changa_700Bold", fontSize: 20, color: "#FFF", letterSpacing: 2 },
  logoDZ: { fontFamily: "Changa_700Bold", fontSize: 10, color: "rgba(255,255,255,0.8)", letterSpacing: 3 },
  appName: { fontFamily: "Changa_700Bold", fontSize: 28, color: C.primary },
  welcome: { fontFamily: "Changa_600SemiBold", fontSize: 18, color: C.foreground, marginTop: 4 },
  tagline: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, marginTop: 2 },
  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 24, width: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, marginBottom: 6 },
  input: {
    backgroundColor: C.input, borderRadius: 12, padding: 14,
    fontFamily: "Changa_400Regular", fontSize: 16, color: C.foreground,
    borderWidth: 1.5, borderColor: C.border,
  },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: { padding: 14, backgroundColor: C.input, borderRadius: 12, borderWidth: 1.5, borderColor: C.border },
  eyeText: { fontSize: 16 },
  loginBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  loginBtnText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
  registerLink: { marginTop: 16, alignItems: "center" },
  registerLinkText: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground },
  registerLinkBold: { fontFamily: "Changa_600SemiBold", color: C.primary },
  demoSection: { width: "100%", marginTop: 16 },
  demoToggle: {
    alignSelf: "center", paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 20, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  demoToggleText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.mutedForeground },
  demoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  demoCard: {
    width: "47%", backgroundColor: C.card, borderRadius: 14,
    padding: 12, borderWidth: 1.5, gap: 3,
  },
  demoLabel: { fontFamily: "Changa_700Bold", fontSize: 14, color: C.foreground },
  demoCred: { fontFamily: "Changa_500Medium", fontSize: 11 },
  demoPwd: { fontFamily: "Changa_400Regular", fontSize: 10, color: C.mutedForeground },
});
