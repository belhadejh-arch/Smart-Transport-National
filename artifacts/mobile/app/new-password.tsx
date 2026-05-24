import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://nqldz.onrender.com";

function getStrength(p: string): { score: number; label: string; color: string } {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length >= 12) s++;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: "ضعيفة جداً", color: "#EF4444" },
    1: { label: "ضعيفة", color: "#F97316" },
    2: { label: "متوسطة", color: "#EAB308" },
    3: { label: "جيدة", color: "#22C55E" },
    4: { label: "قوية", color: "#16A34A" },
    5: { label: "ممتازة 💪", color: "#15803D" },
  };
  return { score: s, ...map[Math.min(s, 5)] };
}

export default function NewPasswordScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { resetToken, email } = useLocalSearchParams<{ resetToken: string; email: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const s = makeStyles(C);
  const strength = getStrength(password);

  async function handleReset() {
    if (password.length < 8) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      Alert.alert("خطأ", "كلمتا المرور غير متطابقتين");
      return;
    }
    if (strength.score < 2) {
      Alert.alert("كلمة المرور ضعيفة", "استخدم مزيجاً من الأحرف والأرقام");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/reset-password-with-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword: password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert("خطأ", data.error ?? "انتهت صلاحية الجلسة، أعد المحاولة");
        if (data.error?.includes("انتهت")) router.replace("/forgot-password");
        return;
      }
      Alert.alert(
        "✅ تم بنجاح",
        "تم تعيين كلمة المرور الجديدة بنجاح. يمكنك الآن تسجيل الدخول.",
        [{ text: "تسجيل الدخول", onPress: () => router.replace("/login") }]
      );
    } catch {
      Alert.alert("خطأ", "تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  const bars = [0, 1, 2, 3, 4];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={[s.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.iconWrap}>
          <Text style={s.iconEmoji}>🔑</Text>
        </View>

        <Text style={s.title}>كلمة مرور جديدة</Text>
        <Text style={s.subtitle}>
          أنشئ كلمة مرور قوية لحماية حسابك على <Text style={{ color: C.primary }}>NQL DZ</Text>
        </Text>
        {email && <Text style={s.emailText}>{email}</Text>}

        <View style={s.card}>
          {/* Password */}
          <Text style={s.label}>كلمة المرور الجديدة</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="8 أحرف على الأقل"
              placeholderTextColor={C.mutedForeground}
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
              <Text>{showPass ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>

          {/* Strength bar */}
          {password.length > 0 && (
            <View style={s.strengthRow}>
              <View style={s.barsRow}>
                {bars.map(b => (
                  <View key={b} style={[s.bar, { backgroundColor: b < strength.score ? strength.color : C.muted }]} />
                ))}
              </View>
              <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          {/* Confirm */}
          <Text style={[s.label, { marginTop: 12 }]}>تأكيد كلمة المرور</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1 }, confirm && password !== confirm && { borderColor: "#EF4444" }]}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
              placeholder="أعد كتابة كلمة المرور"
              placeholderTextColor={C.mutedForeground}
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
              <Text>{showConfirm ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>
          {confirm.length > 0 && password !== confirm && (
            <Text style={s.mismatch}>⚠️ كلمتا المرور غير متطابقتين</Text>
          )}
          {confirm.length > 0 && password === confirm && (
            <Text style={s.match}>✓ كلمتا المرور متطابقتان</Text>
          )}

          {/* Requirements */}
          <View style={s.reqs}>
            {[
              { ok: password.length >= 8, label: "8 أحرف على الأقل" },
              { ok: /[A-Z]/.test(password), label: "حرف كبير واحد على الأقل" },
              { ok: /[0-9]/.test(password), label: "رقم واحد على الأقل" },
            ].map(r => (
              <Text key={r.label} style={[s.req, { color: r.ok ? C.success : C.mutedForeground }]}>
                {r.ok ? "✓" : "○"} {r.label}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={[s.btn, (loading || password.length < 8 || password !== confirm) && { opacity: 0.5 }]}
            onPress={handleReset}
            disabled={loading || password.length < 8 || password !== confirm}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>تعيين كلمة المرور 🔐</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { alignItems: "center", paddingHorizontal: 24 },
    iconWrap: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center",
      marginBottom: 20, borderWidth: 2, borderColor: `${C.primary}30`,
    },
    iconEmoji: { fontSize: 40 },
    title: { fontFamily: "Changa_700Bold", fontSize: 26, color: C.foreground, marginBottom: 8, textAlign: "center" },
    subtitle: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", lineHeight: 22 },
    emailText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.primary, marginTop: 4, marginBottom: 24 },
    card: {
      width: "100%", backgroundColor: C.card, borderRadius: 20, padding: 24,
      shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
      borderWidth: 1, borderColor: C.border, marginTop: 8,
    },
    label: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, marginBottom: 8 },
    passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    input: {
      backgroundColor: C.input, borderRadius: 12, padding: 14,
      fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground,
      borderWidth: 1.5, borderColor: C.border,
    },
    eyeBtn: { padding: 14, backgroundColor: C.input, borderRadius: 12, borderWidth: 1.5, borderColor: C.border },
    strengthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 4 },
    barsRow: { flexDirection: "row", gap: 4, flex: 1 },
    bar: { flex: 1, height: 5, borderRadius: 3 },
    strengthLabel: { fontFamily: "Changa_600SemiBold", fontSize: 12, minWidth: 60, textAlign: "right" },
    mismatch: { fontFamily: "Changa_400Regular", fontSize: 12, color: "#EF4444", marginTop: 6 },
    match: { fontFamily: "Changa_400Regular", fontSize: 12, color: "#22C55E", marginTop: 6 },
    reqs: { marginTop: 14, marginBottom: 18, gap: 6 },
    req: { fontFamily: "Changa_400Regular", fontSize: 13 },
    btn: {
      backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center",
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    btnText: { fontFamily: "Changa_700Bold", fontSize: 17, color: "#FFF" },
  });
}
