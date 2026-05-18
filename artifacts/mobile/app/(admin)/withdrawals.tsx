import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useGetWithdrawalRequests, useApproveWithdrawal, useRejectWithdrawal } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

export default function AdminWithdrawals() {
  const { t, isRTL } = useLanguage();
  const { C } = useTheme();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>("pending");
  const { data, isLoading, refetch } = useGetWithdrawalRequests({ status: filter });
  const { mutateAsync: approve } = useApproveWithdrawal();
  const { mutateAsync: reject } = useRejectWithdrawal();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.admin.dashboard, onPress: () => router.replace("/(admin)/dashboard") },
    { key: "users", icon: "👥", label: t.admin.users, onPress: () => router.replace("/(admin)/users") },
    { key: "cards", icon: "💳", label: t.admin.cards, onPress: () => router.replace("/(admin)/cards") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals, onPress: () => {} },
    { key: "profile", icon: "👤", label: t.admin.profile, onPress: () => router.replace("/(admin)/profile") },
  ];

  const filters = [
    { key: "pending" as const, label: t.common.pending },
    { key: "approved" as const, label: t.common.approved },
    { key: "rejected" as const, label: t.common.rejected },
  ];

  async function handleApprove(id: number) {
    try {
      await approve({ id });
      refetch();
      Alert.alert(t.common.success, t.common.approved);
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleReject(id: number) {
    Alert.alert(t.common.reject, `${t.common.reject}?`, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, style: "destructive", onPress: async () => {
        try { await reject({ id }); refetch(); } catch {}
      }},
    ]);
  }

  const statusColor: Record<string, string> = { pending: C.warning, approved: C.success, rejected: C.destructive };
  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title={t.admin.withdrawals} />
      <View style={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} style={[s.filterBtn, filter === f.key && s.filterBtnActive]} onPress={() => setFilter(f.key)}>
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? <ActivityIndicator size="large" color={C.primary} style={s.loader} /> : (
        <ScrollView style={s.scroll} contentContainerStyle={s.list}>
          {(data?.requests ?? []).map(req => (
            <View key={req.id} style={s.card}>
              <View style={s.cardTop}>
                <View>
                  <Text style={s.holderName}>{req.holderName} {req.holderLastName}</Text>
                  <Text style={s.amount}>{Number(req.amount).toFixed(0)} {t.common.dinar}</Text>
                  <Text style={s.method}>{req.method === "cash" ? t.driver.cash : t.driver.ccp}</Text>
                  {req.phone && <Text style={s.detail}>{t.common.phone}: {req.phone}</Text>}
                  {req.ccpAccount && <Text style={s.detail}>{t.driver.ccpAccount}: {req.ccpAccount}</Text>}
                  <Text style={s.date}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor[req.status] ?? C.muted }]}>
                  <Text style={s.statusText}>{req.status}</Text>
                </View>
              </View>
              {req.status === "pending" && (
                <View style={s.actions}>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.success }]} onPress={() => handleApprove(req.id)}>
                    <Text style={s.actionBtnText}>{t.common.approve}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.destructive }]} onPress={() => handleReject(req.id)}>
                    <Text style={s.actionBtnText}>{t.common.reject}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          {(data?.requests ?? []).length === 0 && <Text style={s.empty}>{t.common.noData}</Text>}
        </ScrollView>
      )}
      <TabBar tabs={tabs} activeKey="withdrawals" />
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.muted },
    filterBtnActive: { backgroundColor: C.primary },
    filterText: { fontFamily: "Changa_500Medium", fontSize: 12, color: C.mutedForeground },
    filterTextActive: { color: "#FFF" },
    loader: { marginTop: 60 },
    scroll: { flex: 1 },
    list: { padding: 12, gap: 10, paddingBottom: 24 },
    card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    holderName: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground },
    amount: { fontFamily: "Changa_700Bold", fontSize: 18, color: C.primary, marginTop: 4 },
    method: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground, marginTop: 2 },
    detail: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    date: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontFamily: "Changa_600SemiBold", fontSize: 11, color: "#FFF" },
    actions: { flexDirection: "row", gap: 8, marginTop: 12 },
    actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: "center" },
    actionBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: "#FFF" },
    empty: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", marginTop: 40 },
  });
}
