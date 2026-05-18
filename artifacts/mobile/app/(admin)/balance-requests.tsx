import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useGetAdminBalanceRequests, useApproveBalanceRequest, useRejectBalanceRequest } from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

type FilterKey = "all" | "pending" | "approved" | "rejected";

export default function AdminBalanceRequests() {
  const { C } = useTheme();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterKey>("pending");

  const { data, isLoading, refetch } = useGetAdminBalanceRequests(
    filter !== "all" ? { status: filter } : {}
  );
  const { mutateAsync: approve } = useApproveBalanceRequest();
  const { mutateAsync: reject }  = useRejectBalanceRequest();

  const tabs = [
    { key: "dashboard",   icon: "📊", label: t.admin.dashboard,   onPress: () => router.replace("/(admin)/dashboard") },
    { key: "users",       icon: "👥", label: t.admin.users,        onPress: () => router.replace("/(admin)/users") },
    { key: "cards",       icon: "💳", label: t.admin.cards,        onPress: () => router.replace("/(admin)/cards") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals,  onPress: () => router.replace("/(admin)/withdrawals") },
    { key: "profile",     icon: "👤", label: t.admin.profile,      onPress: () => router.replace("/(admin)/profile") },
  ];

  const filters: { key: FilterKey; label: string }[] = [
    { key: "pending",  label: "⏳ قيد الانتظار" },
    { key: "all",      label: "الكل" },
    { key: "approved", label: "✅ معتمدة" },
    { key: "rejected", label: "❌ مرفوضة" },
  ];

  function handleApprove(id: number, dist: string, amount: number) {
    Alert.alert(
      "تأكيد التحويل",
      `تحويل ${amount.toLocaleString()} دج إلى\n${dist}؟`,
      [
        { text: t.common.cancel, style: "cancel" },
        { text: "✅ تحويل الرصيد", onPress: async () => {
          try {
            const res = await approve({ id });
            refetch();
            Alert.alert("✅ تم التحويل", (res as any).message ?? `تم تحويل ${amount.toLocaleString()} دج`);
          } catch (e: any) {
            Alert.alert("خطأ", e?.message ?? "فشل التحويل");
          }
        }},
      ]
    );
  }

  function handleReject(id: number) {
    Alert.alert(
      "رفض الطلب",
      "هل تريد رفض طلب الرصيد هذا؟",
      [
        { text: t.common.cancel, style: "cancel" },
        { text: "رفض", style: "destructive", onPress: async () => {
          try {
            await reject({ id, data: {} });
            refetch();
          } catch (e: any) {
            Alert.alert("خطأ", e?.message ?? "فشل الرفض");
          }
        }},
      ]
    );
  }

  const requests = data?.requests ?? [];
  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title="🏪 طلبات رصيد الموزعين" />

      {/* Stats */}
      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: C.warning }]}>{data?.pendingCount ?? 0}</Text>
          <Text style={s.statLabel}>قيد الانتظار</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: C.success }]}>
            {requests.filter(r => r.status === "approved").reduce((s, r) => s + r.amount, 0).toLocaleString()}
          </Text>
          <Text style={s.statLabel}>إجمالي المحوّل (دج)</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.primary} />}
        >
          {requests.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyText}>لا توجد طلبات في هذه الفئة</Text>
            </View>
          )}
          {requests.map(req => (
            <View key={req.id} style={s.card}>
              <View style={s.cardHeader}>
                <View>
                  <Text style={s.distName}>{req.distributorName} {req.distributorLastName}</Text>
                  <Text style={s.distEmail}>{req.distributorEmail ?? `#ID ${req.distributorId}`}</Text>
                  <Text style={s.reqDate}>{new Date(req.createdAt).toLocaleDateString("ar-DZ")} • {new Date(req.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}</Text>
                </View>
                <View style={[s.statusBadge, {
                  backgroundColor: req.status === "pending" ? C.warning : req.status === "approved" ? C.success : C.destructive,
                }]}>
                  <Text style={s.statusText}>
                    {req.status === "pending" ? "⏳ قيد الانتظار" : req.status === "approved" ? "✅ معتمد" : "❌ مرفوض"}
                  </Text>
                </View>
              </View>

              <View style={s.amountRow}>
                <View style={s.amountBox}>
                  <Text style={s.amountLabel}>المبلغ المطلوب</Text>
                  <Text style={s.amountValue}>{req.amount.toLocaleString()} <Text style={s.amountCurrency}>دج</Text></Text>
                </View>
                <View style={s.phoneBox}>
                  <Text style={s.amountLabel}>رقم الهاتف</Text>
                  <Text style={s.phoneValue}>📞 {req.phone}</Text>
                </View>
              </View>

              {req.status === "pending" && (
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: C.success }]}
                    onPress={() => handleApprove(req.id, `${req.distributorName} ${req.distributorLastName}`, req.amount)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.actionBtnText}>✅ تحويل الرصيد</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: C.destructive }]}
                    onPress={() => handleReject(req.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.actionBtnText}>❌ رفض</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 12 }} />
        </ScrollView>
      )}

      <TabBar tabs={tabs} activeKey="withdrawals" />
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    statsBar: {
      flexDirection: "row", backgroundColor: C.card, marginHorizontal: 12,
      marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border,
    },
    statItem: { flex: 1, alignItems: "center" },
    statDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 8 },
    statValue: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.primary },
    statLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2, textAlign: "center" },
    filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10, gap: 6 },
    filterBtn: { flex: 1, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 20, backgroundColor: C.muted, alignItems: "center" },
    filterBtnActive: { backgroundColor: C.primary },
    filterText: { fontFamily: "Changa_500Medium", fontSize: 11, color: C.mutedForeground, textAlign: "center" },
    filterTextActive: { color: "#FFF" },
    scroll: { flex: 1 },
    list: { padding: 12, gap: 10, paddingBottom: 24 },
    emptyBox: { alignItems: "center", paddingVertical: 50, gap: 10 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.mutedForeground },
    card: {
      backgroundColor: C.card, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: C.border, gap: 12,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    distName: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground },
    distEmail: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, marginTop: 2 },
    reqDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 3 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontFamily: "Changa_600SemiBold", fontSize: 11, color: "#FFF" },
    amountRow: { flexDirection: "row", gap: 10 },
    amountBox: {
      flex: 1, backgroundColor: `${C.primary}10`, borderRadius: 12,
      padding: 12, borderWidth: 1, borderColor: `${C.primary}25`,
    },
    phoneBox: {
      flex: 1, backgroundColor: C.muted, borderRadius: 12,
      padding: 12, borderWidth: 1, borderColor: C.border,
    },
    amountLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginBottom: 4 },
    amountValue: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.primary },
    amountCurrency: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground },
    phoneValue: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    actions: { flexDirection: "row", gap: 8 },
    actionBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center" },
    actionBtnText: { fontFamily: "Changa_700Bold", fontSize: 13, color: "#FFF" },
  });
}
