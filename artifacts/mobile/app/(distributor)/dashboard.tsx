import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useGetDistributorDashboard, useGetDistributorTransactions } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { WelcomeModal } from "@/components/WelcomeModal";
import { TabBar } from "@/components/TabBar";
import { generateAndSharePDF } from "@/utils/pdfReport";

export default function DistributorDashboard() {
  const { t, isRTL } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const { C } = useTheme();
  const { data, isLoading, refetch } = useGetDistributorDashboard();
  const { data: txData } = useGetDistributorTransactions();
  const [pdfLoading, setPdfLoading] = useState(false);

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.distributor.dashboard, onPress: () => {} },
    { key: "scan",      icon: "📷", label: t.distributor.scan,      onPress: () => router.push("/(distributor)/scan") },
    { key: "profile",   icon: "👤", label: t.distributor.profile,   onPress: () => router.push("/(distributor)/profile") },
  ];

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  async function handlePDF() {
    const txs = txData?.transactions ?? [];
    if (!txs.length) { Alert.alert("", "لا توجد عمليات لتصديرها"); return; }
    setPdfLoading(true);
    try {
      await generateAndSharePDF({
        title: "كشف حساب الموزع",
        subtitle: "سجل عمليات الشحن والأرباح",
        userName: `${user?.name ?? ""} ${user?.lastName ?? ""}`,
        generatedAt: new Date().toLocaleString("ar-DZ"),
        summary: [
          { label: "الرصيد المتاح للشحن",  value: `${(data?.balance ?? 0).toLocaleString()} دج` },
          { label: "إجمالي عمليات الشحن",  value: `${data?.totalTopups ?? 0} عملية` },
          { label: "إجمالي المُشحون",       value: `${txs.reduce((s, tx) => s + Number(tx.amount), 0).toFixed(0)} دج` },
          { label: "إجمالي الأرباح",        value: `${(data?.totalEarnings ?? 0).toFixed(0)} دج` },
          { label: "أرباح اليوم",           value: `${(data?.todayEarnings ?? 0).toFixed(0)} دج` },
          { label: "شحن اليوم",             value: `${data?.todayTopups ?? 0} عملية` },
        ],
        rows: txs.map((tx: any) => ({
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleString("ar-DZ") : "",
          description: `شحن بطاقة • ${tx.cardType ?? "-"}`,
          amount: `${Number(tx.amount).toFixed(0)} دج (ربح: +${Number(tx.profit ?? tx.driverEarning ?? 0).toFixed(0)} دج)`,
          type: "neutral" as const,
        })),
      });
    } catch {
      Alert.alert(t.common.error, "فشل إنشاء التقرير");
    } finally {
      setPdfLoading(false);
    }
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header
        title={t.distributor.dashboard}
        right={
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity onPress={handlePDF} style={[s.hBtn, { paddingHorizontal: 8 }]} disabled={pdfLoading}>
              {pdfLoading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={[s.hBtnText, { fontSize: 11 }]}>📄</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={switchAccount} style={s.hBtn}><Text style={s.hBtnText}>↔</Text></TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={s.hBtn}><Text style={s.hBtnText}>⏻</Text></TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.accent} />}
      >
        {/* Balance hero */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>رصيد الشحن المتاح</Text>
          <Text style={s.balanceAmount}>{(data?.balance ?? 0).toLocaleString()}</Text>
          <Text style={s.balanceCurrency}>{t.common.dinar}</Text>
          <Text style={s.distName}>{user?.name} {user?.lastName}</Text>
        </View>

        {/* Earnings card */}
        <View style={s.earningsCard}>
          <View style={s.earningsRow}>
            <View style={s.earningItem}>
              <Text style={s.earningIcon}>💰</Text>
              <Text style={s.earningValue}>{(data?.todayEarnings ?? 0).toFixed(0)}</Text>
              <Text style={s.earningLabel}>أرباح اليوم (دج)</Text>
            </View>
            <View style={s.earningDivider} />
            <View style={s.earningItem}>
              <Text style={s.earningIcon}>💎</Text>
              <Text style={s.earningValue}>{(data?.totalEarnings ?? 0).toFixed(0)}</Text>
              <Text style={s.earningLabel}>إجمالي الأرباح (دج)</Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={C.accent} size="large" />
        ) : (
          <>
            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statIcon}>📅</Text>
                <Text style={s.statValue}>{data?.todayTopups ?? 0}</Text>
                <Text style={s.statLabel}>{t.distributor.todayTopups}</Text>
              </View>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statIcon}>📊</Text>
                <Text style={[s.statValue, { color: C.success }]}>{data?.totalTopups ?? 0}</Text>
                <Text style={s.statLabel}>{t.distributor.totalTopups}</Text>
              </View>
            </View>

            {/* Scan CTA */}
            <TouchableOpacity style={s.scanCTA} onPress={() => router.push("/(distributor)/scan")} activeOpacity={0.85}>
              <Text style={{ fontSize: 36 }}>📷</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.scanCTATitle}>شحن بطاقة مستخدم</Text>
                <Text style={s.scanCTASub}>امسح رمز QR لشحن رصيد البطاقة</Text>
              </View>
              <Text style={{ fontSize: 22, color: "rgba(255,255,255,0.7)" }}>›</Text>
            </TouchableOpacity>

            {/* Recent topups */}
            {(data?.recentTransactions ?? []).length > 0 && (
              <>
                <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
                  آخر عمليات الشحن
                </Text>
                {data!.recentTransactions.slice(0, 8).map((tx, i) => (
                  <View key={(tx as any).id ?? i} style={s.txRow}>
                    <View style={s.txIconBg}>
                      <Text style={{ fontSize: 18 }}>💳</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.txType}>شحن بطاقة • {(tx as any).cardType ?? "-"}</Text>
                      <Text style={s.txDate}>{(tx as any).createdAt ? new Date((tx as any).createdAt).toLocaleString("ar-DZ") : ""}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 2 }}>
                      <Text style={s.txAmount}>+{Number(tx.amount).toFixed(0)} دج</Text>
                      <Text style={s.txProfit}>ربح: +{Number((tx as any).driverEarning).toFixed(0)} دج</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {(data?.recentTransactions ?? []).length === 0 && (
              <View style={s.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
                <Text style={s.emptyText}>لا توجد عمليات شحن بعد</Text>
                <Text style={s.emptySub}>اضغط على "شحن بطاقة مستخدم" لتبدأ</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TabBar tabs={tabs} activeKey="dashboard" />
      {user && <WelcomeModal userId={user.id} userName={user.name} role={user.role} />}
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    content: { padding: 16, gap: 14, paddingBottom: 100 },
    hBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
    hBtnText: { fontSize: 14, color: "#FFF" },
    balanceCard: {
      backgroundColor: C.accent, borderRadius: 20, padding: 24, alignItems: "center",
      shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    balanceLabel: { fontFamily: "Changa_500Medium", fontSize: 13, color: "rgba(255,255,255,0.75)" },
    balanceAmount: { fontFamily: "Changa_700Bold", fontSize: 48, color: "#FFF", lineHeight: 56 },
    balanceCurrency: { fontFamily: "Changa_600SemiBold", fontSize: 18, color: "rgba(255,255,255,0.85)", marginTop: -4 },
    distName: { fontFamily: "Changa_500Medium", fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 },
    earningsCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: C.border,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    earningsRow: { flexDirection: "row", alignItems: "center" },
    earningItem: { flex: 1, alignItems: "center", gap: 4 },
    earningIcon: { fontSize: 24 },
    earningValue: { fontFamily: "Changa_700Bold", fontSize: 24, color: C.success },
    earningLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, textAlign: "center" },
    earningDivider: { width: 1, height: 50, backgroundColor: C.border, marginHorizontal: 16 },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: {
      backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: "center", gap: 4,
      borderWidth: 1, borderColor: C.border,
    },
    statIcon: { fontSize: 22 },
    statValue: { fontFamily: "Changa_700Bold", fontSize: 24, color: C.foreground },
    statLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, textAlign: "center" },
    scanCTA: {
      backgroundColor: C.primary, borderRadius: 16, padding: 20,
      flexDirection: "row", alignItems: "center", gap: 16,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    scanCTATitle: { fontFamily: "Changa_700Bold", fontSize: 17, color: "#FFF" },
    scanCTASub: { fontFamily: "Changa_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)" },
    sectionTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
    txRow: {
      backgroundColor: C.card, borderRadius: 12, padding: 12,
      flexDirection: "row", alignItems: "center", gap: 10,
      borderWidth: 1, borderColor: C.border,
    },
    txIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${C.accent}18`, alignItems: "center", justifyContent: "center" },
    txType: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.foreground },
    txDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
    txAmount: { fontFamily: "Changa_700Bold", fontSize: 14, color: C.success },
    txProfit: { fontFamily: "Changa_500Medium", fontSize: 11, color: C.accent },
    emptyBox: { alignItems: "center", padding: 32, gap: 6 },
    emptyText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.foreground },
    emptySub: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center" },
  });
}
