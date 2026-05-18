import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useRequestWithdrawal, useGetDriverWithdrawals, useGetDriverDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { Sounds } from "@/utils/sounds";

type Method = "cash" | "ccp";

const WITHDRAW_PIN = "200211ha";

export default function DriverWithdraw() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { C } = useTheme();

  const [unlocked, setUnlocked]   = useState(false);
  const [pin, setPin]             = useState("");
  const [showPin, setShowPin]     = useState(false);
  const [pinError, setPinError]   = useState(false);

  const [method, setMethod] = useState<Method>("cash");
  const [amount, setAmount] = useState("");
  const [phone,  setPhone]  = useState("");
  const [ccp,    setCcp]    = useState("");

  const { mutateAsync: requestWithdrawal, isPending } = useRequestWithdrawal();
  const { data: dashboard }   = useGetDriverDashboard();
  const { data: withdrawals } = useGetDriverWithdrawals();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan",      icon: "📷", label: t.driver.scan,      onPress: () => router.replace("/(driver)/scan") },
    { key: "trips",     icon: "🚍", label: t.driver.trips,     onPress: () => router.replace("/(driver)/trips") },
    { key: "withdraw",  icon: "💰", label: t.driver.withdraw,  onPress: () => {} },
    { key: "profile",   icon: "👤", label: t.driver.profile,   onPress: () => router.replace("/(driver)/profile") },
  ];

  function handleUnlock() {
    if (pin === WITHDRAW_PIN) {
      Sounds.success();
      setPinError(false);
      setUnlocked(true);
    } else {
      Sounds.error();
      setPinError(true);
      setPin("");
    }
  }

  async function handleSubmit() {
    const numAmount = Number(amount);
    if (!amount || numAmount < 5000) {
      Alert.alert(t.common.error, t.driver.minWithdraw);
      return;
    }
    if (method === "cash" && !phone.trim()) {
      Alert.alert(t.common.error, `${t.common.phone} ${t.common.error}`);
      return;
    }
    if (method === "ccp" && !ccp.trim()) {
      Alert.alert(t.common.error, `${t.driver.ccpAccount} ${t.common.error}`);
      return;
    }
    try {
      await requestWithdrawal({ data: {
        amount: numAmount, method,
        phone: method === "cash" ? phone : undefined,
        ccpAccount: method === "ccp" ? ccp : undefined,
        holderName: user?.name ?? "",
        holderLastName: user?.lastName ?? "",
      }});
      Sounds.success();
      Alert.alert(t.common.success, t.driver.withdrawSubmitted);
      setAmount(""); setPhone(""); setCcp("");
    } catch (e: any) {
      Sounds.error();
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  const statusColor: Record<string, string> = {
    pending: C.warning,
    approved: C.success,
    rejected: C.destructive,
  };

  const s = makeStyles(C);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.screen}>
        <Header title={t.driver.withdrawTitle} />

        {!unlocked ? (
          <View style={s.gateContainer}>
            <View style={s.gateCard}>
              <Text style={s.gateLockIcon}>🔐</Text>
              <Text style={s.gateTitle}>هذا القسم محمي</Text>
              <Text style={s.gateSub}>أدخل كلمة السر للمتابعة</Text>

              <View style={s.gatePinRow}>
                <TextInput
                  style={[s.gatePinInput, pinError && s.gatePinInputError]}
                  value={pin}
                  onChangeText={txt => { setPin(txt); setPinError(false); }}
                  secureTextEntry={!showPin}
                  placeholder="••••••••"
                  placeholderTextColor={C.mutedForeground}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleUnlock}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={s.gateEye}>
                  <Text style={{ fontSize: 18 }}>{showPin ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              {pinError && (
                <Text style={s.gateError}>❌ كلمة السر غير صحيحة</Text>
              )}

              <TouchableOpacity style={s.gateBtn} onPress={handleUnlock} activeOpacity={0.85}>
                <Text style={s.gateBtnText}>تأكيد</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.gateBack} onPress={() => router.replace("/(driver)/dashboard")}>
                <Text style={s.gateBackText}>رجوع</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <View style={s.balanceBox}>
              <Text style={s.balanceLabel}>{t.common.balance}</Text>
              <Text style={s.balanceAmount}>{(dashboard?.balance ?? 0).toFixed(0)} {t.common.dinar}</Text>
            </View>
            <Text style={s.minNote}>{t.driver.minWithdraw}</Text>

            <View style={s.field}>
              <Text style={[s.label, { textAlign: isRTL ? "right" : "left" }]}>{t.common.amount}</Text>
              <TextInput
                style={[s.input, { textAlign: isRTL ? "right" : "left" }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor={C.mutedForeground}
              />
            </View>

            <Text style={[s.label, { textAlign: isRTL ? "right" : "left", marginBottom: 8 }]}>{t.driver.method}</Text>
            <View style={s.methodRow}>
              {(["cash", "ccp"] as Method[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.methodBtn, method === m && s.methodBtnActive]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={s.methodIcon}>{m === "cash" ? "💵" : "🏦"}</Text>
                  <Text style={[s.methodLabel, method === m && s.methodLabelActive]}>
                    {m === "cash" ? t.driver.cash : t.driver.ccp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {method === "cash" && (
              <View style={s.field}>
                <Text style={[s.label, { textAlign: isRTL ? "right" : "left" }]}>{t.common.phone}</Text>
                <TextInput style={[s.input, { textAlign: isRTL ? "right" : "left" }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0XXX XXX XXX" placeholderTextColor={C.mutedForeground} />
              </View>
            )}
            {method === "ccp" && (
              <View style={s.field}>
                <Text style={[s.label, { textAlign: isRTL ? "right" : "left" }]}>{t.driver.ccpAccount}</Text>
                <TextInput style={[s.input, { textAlign: isRTL ? "right" : "left" }]} value={ccp} onChangeText={setCcp} placeholder="XXXX XXXX XXXX XX" placeholderTextColor={C.mutedForeground} />
              </View>
            )}

            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={isPending} activeOpacity={0.85}>
              {isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>{t.common.submit}</Text>}
            </TouchableOpacity>

            {(withdrawals?.requests ?? []).length > 0 && (
              <>
                <Text style={[s.historyTitle, { textAlign: isRTL ? "right" : "left" }]}>السجل</Text>
                {withdrawals!.requests.slice(0, 5).map(req => (
                  <View key={req.id} style={s.histCard}>
                    <View>
                      <Text style={s.histAmount}>{Number(req.amount).toFixed(0)} {t.common.dinar}</Text>
                      <Text style={s.histMethod}>{req.method === "cash" ? t.driver.cash : t.driver.ccp}</Text>
                      <Text style={s.histDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: statusColor[req.status] }]}>
                      <Text style={s.statusText}>{req.status}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}

        <TabBar tabs={tabs} activeKey="withdraw" />
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    gateContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    gateCard: {
      width: "100%", backgroundColor: C.card, borderRadius: 24,
      padding: 28, alignItems: "center", gap: 12,
      shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.10, shadowRadius: 16, elevation: 6,
      borderWidth: 1, borderColor: C.border,
    },
    gateLockIcon: { fontSize: 52, marginBottom: 4 },
    gateTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground },
    gateSub:   { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground },
    gatePinRow: { flexDirection: "row", width: "100%", gap: 8, marginTop: 4 },
    gatePinInput: {
      flex: 1, backgroundColor: C.input, borderRadius: 12, padding: 14,
      fontFamily: "Changa_400Regular", fontSize: 18, color: C.foreground,
      borderWidth: 2, borderColor: C.border, textAlign: "center", letterSpacing: 4,
    },
    gatePinInputError: { borderColor: C.destructive },
    gateEye: {
      padding: 14, backgroundColor: C.input, borderRadius: 12,
      borderWidth: 2, borderColor: C.border, justifyContent: "center",
    },
    gateError: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.destructive },
    gateBtn: {
      width: "100%", backgroundColor: C.primary, borderRadius: 14,
      padding: 16, alignItems: "center", marginTop: 4,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    gateBtnText: { fontFamily: "Changa_700Bold", fontSize: 17, color: "#FFF" },
    gateBack: { paddingVertical: 8 },
    gateBackText: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
    content: { padding: 16, paddingBottom: 40, gap: 10 },
    balanceBox: { backgroundColor: C.primary, borderRadius: 16, padding: 20, alignItems: "center" },
    balanceLabel: { fontFamily: "Changa_500Medium", fontSize: 13, color: "rgba(255,255,255,0.75)" },
    balanceAmount: { fontFamily: "Changa_700Bold", fontSize: 32, color: "#FFF", marginTop: 4 },
    minNote: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: "center" },
    field: { gap: 6 },
    label: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
    input: {
      backgroundColor: C.card, borderRadius: 12, padding: 14,
      fontFamily: "Changa_400Regular", fontSize: 16, color: C.foreground,
      borderWidth: 1.5, borderColor: C.border,
    },
    methodRow: { flexDirection: "row", gap: 12 },
    methodBtn: {
      flex: 1, backgroundColor: C.muted, borderRadius: 14, padding: 16,
      alignItems: "center", borderWidth: 2, borderColor: "transparent", gap: 6,
    },
    methodBtnActive: { borderColor: C.primary, backgroundColor: C.secondary },
    methodIcon: { fontSize: 28 },
    methodLabel: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.mutedForeground },
    methodLabelActive: { color: C.primary },
    submitBtn: {
      backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    submitBtnText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
    historyTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground, marginTop: 8 },
    histCard: {
      backgroundColor: C.card, borderRadius: 12, padding: 12,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      borderWidth: 1, borderColor: C.border,
    },
    histAmount: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.primary },
    histMethod: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    histDate:   { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontFamily: "Changa_600SemiBold", fontSize: 11, color: "#FFF" },
  });
}
