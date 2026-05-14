import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useRequestWithdrawal, useGetDriverWithdrawals, useGetDriverDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

type Method = "cash" | "ccp";

export default function DriverWithdraw() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const C = colors.light;
  const [method, setMethod] = useState<Method>("cash");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [ccp, setCcp] = useState("");
  const { mutateAsync: requestWithdrawal, isPending } = useRequestWithdrawal();
  const { data: dashboard } = useGetDriverDashboard();
  const { data: withdrawals } = useGetDriverWithdrawals();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan", icon: "📷", label: t.driver.scan, onPress: () => router.replace("/(driver)/scan") },
    { key: "trips", icon: "🚍", label: t.driver.trips, onPress: () => router.replace("/(driver)/trips") },
    { key: "withdraw", icon: "💰", label: t.driver.withdraw, onPress: () => {} },
    { key: "profile", icon: "👤", label: t.driver.profile, onPress: () => router.replace("/(driver)/profile") },
  ];

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
      Alert.alert(t.common.success, t.driver.withdrawSubmitted);
      setAmount(""); setPhone(""); setCcp("");
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  const statusColor: Record<string, string> = { pending: C.warning, approved: C.success, rejected: C.destructive };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.screen}>
        <Header title={t.driver.withdrawTitle} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Balance */}
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>{t.common.balance}</Text>
            <Text style={styles.balanceAmount}>{(dashboard?.balance ?? 0).toFixed(0)} {t.common.dinar}</Text>
          </View>
          <Text style={styles.minNote}>{t.driver.minWithdraw}</Text>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.common.amount}</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={C.mutedForeground}
            />
          </View>

          {/* Method */}
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left", marginBottom: 8 }]}>{t.driver.method}</Text>
          <View style={styles.methodRow}>
            {(["cash", "ccp"] as Method[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, method === m && styles.methodBtnActive]}
                onPress={() => setMethod(m)}
              >
                <Text style={styles.methodIcon}>{m === "cash" ? "💵" : "🏦"}</Text>
                <Text style={[styles.methodLabel, method === m && styles.methodLabelActive]}>
                  {m === "cash" ? t.driver.cash : t.driver.ccp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {method === "cash" && (
            <View style={styles.field}>
              <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.common.phone}</Text>
              <TextInput style={[styles.input, { textAlign: isRTL ? "right" : "left" }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0XXX XXX XXX" placeholderTextColor={C.mutedForeground} />
            </View>
          )}
          {method === "ccp" && (
            <View style={styles.field}>
              <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.driver.ccpAccount}</Text>
              <TextInput style={[styles.input, { textAlign: isRTL ? "right" : "left" }]} value={ccp} onChangeText={setCcp} placeholder="XXXX XXXX XXXX XX" placeholderTextColor={C.mutedForeground} />
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isPending} activeOpacity={0.85}>
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t.common.submit}</Text>}
          </TouchableOpacity>

          {/* History */}
          {(withdrawals?.requests ?? []).length > 0 && (
            <>
              <Text style={[styles.historyTitle, { textAlign: isRTL ? "right" : "left" }]}>History</Text>
              {withdrawals!.requests.slice(0, 5).map(req => (
                <View key={req.id} style={styles.histCard}>
                  <View>
                    <Text style={styles.histAmount}>{Number(req.amount).toFixed(0)} {t.common.dinar}</Text>
                    <Text style={styles.histMethod}>{req.method === "cash" ? t.driver.cash : t.driver.ccp}</Text>
                    <Text style={styles.histDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor[req.status] }]}>
                    <Text style={styles.statusText}>{req.status}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        <TabBar tabs={tabs} activeKey="withdraw" />
      </View>
    </KeyboardAvoidingView>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  balanceBox: {
    backgroundColor: C.primary, borderRadius: 16, padding: 20, alignItems: "center",
  },
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
  histDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: "Changa_600SemiBold", fontSize: 11, color: "#FFF" },
});
