import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export default function ForgotPasswordScreen() {
  const { C } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const s = makeStyles(C);

  async function handleSend() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) {
      Alert.alert("خطأ", "أدخل بريدك الإلكتروني بشكل صحيح");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert("خطأ", data.error ?? "حدث خطأ، حاول مرة أخرى");
        return;
      }
      router.push({ pathname: "/verify-otp", params: { email: e } });
    } catch {
      Alert.alert("خطأ", "تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={[s.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>→ رجوع</Text>
        </TouchableOpacity>

        <View style={s.iconWrap}>
          <Text style={s.iconEmoji}>🔐</Text>
        </View>

        <Text style={s.title}>نسيت كلمة المرور؟</Text>
        <Text style={s.subtitle}>
          أدخل بريدك الإلكتروني المسجّل وسنرسل إليك رمز التحقق لإعادة تعيين كلمة المرور.
        </Text>

        <View style={s.card}>
          <Text style={[s.label, { textAlign: isRTL ? "right" : "left" }]}>البريد الإلكتروني</Text>
          <TextInput
            style={[s.input, { textAlign: isRTL ? "right" : "left" }]}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            placeholderTextColor={C.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={s.btnText}>إرسال رمز التحقق ✉️</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.securityNote}>
          <Text style={s.securityTitle}>🛡️ حمايتك أولويتنا</Text>
          <Text style={s.securityText}>• الرمز صالح لمدة 15 دقيقة فقط</Text>
          <Text style={s.securityText}>• محمي بتشفير كامل</Text>
          <Text style={s.securityText}>• لا تشارك الرمز مع أحد</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { alignItems: "center", paddingHorizontal: 24 },
    backBtn: { alignSelf: "flex-start", marginBottom: 24, padding: 4 },
    backText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.primary },
    iconWrap: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: `${C.primary}18`, alignItems: "center", justifyContent: "center",
      marginBottom: 20, borderWidth: 2, borderColor: `${C.primary}30`,
    },
    iconEmoji: { fontSize: 40 },
    title: { fontFamily: "Changa_700Bold", fontSize: 26, color: C.foreground, marginBottom: 10, textAlign: "center" },
    subtitle: {
      fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground,
      textAlign: "center", lineHeight: 22, marginBottom: 28, paddingHorizontal: 8,
    },
    card: {
      width: "100%", backgroundColor: C.card, borderRadius: 20,
      padding: 24, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
      borderWidth: 1, borderColor: C.border,
    },
    label: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, marginBottom: 8 },
    input: {
      backgroundColor: C.input, borderRadius: 12, padding: 14,
      fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground,
      borderWidth: 1.5, borderColor: C.border, marginBottom: 16,
    },
    btn: {
      backgroundColor: C.primary, borderRadius: 14, padding: 16,
      alignItems: "center",
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    btnText: { fontFamily: "Changa_700Bold", fontSize: 17, color: "#FFF" },
    securityNote: {
      marginTop: 28, width: "100%", backgroundColor: `${C.success}15`,
      borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${C.success}30`, gap: 6,
    },
    securityTitle: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.success, marginBottom: 4 },
    securityText: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground },
  });
}
