import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://nqldz.onrender.com";
const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);
  const s = makeStyles(C);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleDigit(val: string, idx: number) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
    if (!d && idx > 0) inputs.current[idx - 1]?.focus();
  }

  function handleKeyPress(e: any, idx: number) {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      Alert.alert("خطأ", "أدخل الرمز المكوّن من 6 أرقام كاملاً");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.trim().toLowerCase(), otp }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert("خطأ", data.error ?? "رمز غير صحيح أو منتهي الصلاحية");
        if (data.error?.includes("محاولات")) setDigits(Array(OTP_LENGTH).fill(""));
        return;
      }
      router.push({ pathname: "/new-password", params: { resetToken: data.resetToken, email } });
    } catch {
      Alert.alert("خطأ", "تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setResendLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.trim().toLowerCase() }),
      });
      if (resp.ok) {
        Alert.alert("✅", "تم إرسال رمز جديد إلى بريدك");
        setDigits(Array(OTP_LENGTH).fill(""));
        setCountdown(60);
        inputs.current[0]?.focus();
      } else {
        const d = await resp.json();
        Alert.alert("خطأ", d.error ?? "حاول مرة أخرى لاحقاً");
      }
    } catch {
      Alert.alert("خطأ", "تعذّر الاتصال بالخادم");
    } finally {
      setResendLoading(false);
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
          <Text style={s.iconEmoji}>✉️</Text>
        </View>

        <Text style={s.title}>تحقق من بريدك</Text>
        <Text style={s.subtitle}>
          أرسلنا رمز التحقق المكوّن من <Text style={{ color: C.primary, fontFamily: "Changa_700Bold" }}>6 أرقام</Text> إلى:
        </Text>
        <Text style={s.emailText}>{email}</Text>

        <View style={s.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { inputs.current[i] = r; }}
              style={[s.otpCell, d && s.otpCellFilled]}
              value={d}
              onChangeText={v => handleDigit(v, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        <TouchableOpacity
          style={[s.btn, (loading || digits.join("").length < OTP_LENGTH) && { opacity: 0.5 }]}
          onPress={handleVerify}
          disabled={loading || digits.join("").length < OTP_LENGTH}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>تأكيد الرمز ✓</Text>}
        </TouchableOpacity>

        <View style={s.resendRow}>
          <Text style={s.resendLabel}>لم تستلم الرمز؟</Text>
          {countdown > 0 ? (
            <Text style={s.countdownText}>إعادة الإرسال بعد {countdown}ث</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading
                ? <ActivityIndicator color={C.primary} size="small" />
                : <Text style={s.resendLink}>إعادة إرسال الرمز</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={s.securityNote}>
          <Text style={s.securityText}>🔒 الرمز صالح لمدة 15 دقيقة فقط</Text>
          <Text style={s.securityText}>⚠️ 5 محاولات خاطئة تلغي الرمز تلقائياً</Text>
          <Text style={s.securityText}>🛡️ لا تشارك هذا الرمز مع أحد أبداً</Text>
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
      backgroundColor: `${C.accent}18`, alignItems: "center", justifyContent: "center",
      marginBottom: 20, borderWidth: 2, borderColor: `${C.accent}30`,
    },
    iconEmoji: { fontSize: 40 },
    title: { fontFamily: "Changa_700Bold", fontSize: 26, color: C.foreground, marginBottom: 8, textAlign: "center" },
    subtitle: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", lineHeight: 22 },
    emailText: {
      fontFamily: "Changa_700Bold", fontSize: 15, color: C.primary,
      marginBottom: 32, marginTop: 4, textAlign: "center",
    },
    otpRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
    otpCell: {
      width: 46, height: 58, borderRadius: 12, borderWidth: 2, borderColor: C.border,
      backgroundColor: C.card, textAlign: "center",
      fontFamily: "Changa_700Bold", fontSize: 24, color: C.foreground,
    },
    otpCellFilled: { borderColor: C.primary, backgroundColor: `${C.primary}12` },
    btn: {
      width: "100%", backgroundColor: C.primary, borderRadius: 14, padding: 16,
      alignItems: "center",
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    btnText: { fontFamily: "Changa_700Bold", fontSize: 17, color: "#FFF" },
    resendRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20 },
    resendLabel: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground },
    countdownText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.mutedForeground },
    resendLink: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.primary, textDecorationLine: "underline" },
    securityNote: {
      marginTop: 24, width: "100%", backgroundColor: C.card,
      borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 6,
    },
    securityText: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
  });
}
