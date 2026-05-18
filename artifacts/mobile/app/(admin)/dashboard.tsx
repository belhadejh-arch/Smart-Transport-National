import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useGetAdminStats, useGetAdminDriverEarnings, useGetAdminDistributorBalances } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { TabBar } from "@/components/TabBar";
import { generateAndSharePDF } from "@/utils/pdfReport";

export default function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const { logout, switchAccount, user } = useAuth();
  const { C } = useTheme();
  const isMainAdmin = user?.role === "admin";

  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: stats, isLoading }        = useGetAdminStats();
  const { data: earnings }                = useGetAdminDriverEarnings();
  const { data: distData, isLoading: distLoading } = useGetAdminDistributorBalances();

  const tabs = [
    { key: "dashboard",   icon: "📊", label: t.admin.dashboard,   onPress: () => {} },
    { key: "users",       icon: "👥", label: t.admin.users,        onPress: () => router.push("/(admin)/users") },
    { key: "cards",       icon: "💳", label: t.admin.cards,        onPress: () => isMainAdmin ? router.push("/(admin)/cards") : Alert.alert("", "غير مصرح للأدمن الفرعي") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals,  onPress: () => isMainAdmin ? router.push("/(admin)/withdrawals") : Alert.alert("", "غير مصرح للأدمن الفرعي") },
    { key: "profile",     icon: "👤", label: t.admin.profile,      onPress: () => router.push("/(admin)/profile") },
  ];

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  async function handleDriversPDF() {
    const drivers = earnings?.drivers ?? [];
    if (!drivers.length) { Alert.alert("", "لا توجد بيانات"); return; }
    setPdfLoading(true);
    try {
      await generateAndSharePDF({
        title: "تقرير أرباح السائقين",
        subtitle: "ملخص مكاسب وإحصاءات السائقين",
        userName: `${user?.name ?? ""} ${user?.lastName ?? ""} — أدمن`,
        generatedAt: new Date().toLocaleString("ar-DZ"),
        summary: [
          { label: "إجمالي السائقين",        value: `${drivers.length}` },
          { label: "إجمالي الرحلات",         value: `${drivers.reduce((s, d) => s + d.totalTrips, 0)}` },
          { label: "إجمالي المكاسب الكلية",  value: `${drivers.reduce((s, d) => s + d.totalEarnings, 0).toFixed(0)} دج` },
          { label: "إجمالي رسوم المنصة",     value: `${drivers.reduce((s, d) => s + d.totalFees, 0).toFixed(0)} دج` },
          { label: "إجمالي المسحوبات",       value: `${drivers.reduce((s, d) => s + d.totalWithdrawn, 0).toFixed(0)} دج` },
        ],
        rows: drivers.map(d => ({
          date: "-",
          description: `${d.name} ${d.lastName} (ID: #${d.id}) • ${d.totalTrips} رحلة`,
          amount: `مكاسب: ${d.totalEarnings.toFixed(0)} دج | رصيد: ${d.balance.toFixed(0)} دج`,
          type: "neutral" as const,
        })),
      });
    } catch { Alert.alert(t.common.error, "فشل إنشاء التقرير"); }
    finally { setPdfLoading(false); }
  }

  async function handleDistributorsPDF() {
    const dists = distData?.distributors ?? [];
    if (!dists.length) { Alert.alert("", "لا توجد بيانات"); return; }
    setPdfLoading(true);
    try {
      await generateAndSharePDF({
        title: "تقرير أرصدة الموزعين",
        subtitle: "ملخص أرصدة وعمليات الموزعين",
        userName: `${user?.name ?? ""} ${user?.lastName ?? ""} — أدمن`,
        generatedAt: new Date().toLocaleString("ar-DZ"),
        summary: [
          { label: "إجمالي الموزعين",        value: `${dists.length}` },
          { label: "إجمالي الأرصدة المتاحة", value: `${dists.reduce((s: number, d: any) => s + Number(d.balance), 0).toFixed(0)} دج` },
          { label: "إجمالي عمليات الشحن",    value: `${dists.reduce((s: number, d: any) => s + d.totalTopups, 0)}` },
          { label: "إجمالي المُشحون",         value: `${dists.reduce((s: number, d: any) => s + d.totalSent, 0).toFixed(0)} دج` },
        ],
        rows: (dists as any[]).map((d: any) => ({
          date: "-",
          description: `${d.name} ${d.lastName} (ID: #${d.id}) • ${d.totalTopups} عملية`,
          amount: `رصيد: ${Number(d.balance).toLocaleString()} دج | ربح: ${Number(d.totalProfit).toFixed(0)} دج`,
          type: "neutral" as const,
        })),
      });
    } catch { Alert.alert(t.common.error, "فشل إنشاء التقرير"); }
    finally { setPdfLoading(false); }
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header
        title={`${t.admin.dashboard}${!isMainAdmin ? " (فرعي)" : ""}`}
        showLogout={false}
        right={
          <View style={s.headerActions}>
            <TouchableOpacity onPress={switchAccount} style={s.actionBtn}><Text style={s.actionBtnText}>↔</Text></TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={s.actionBtn}><Text style={s.actionBtnText}>⏻</Text></TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

        {!isMainAdmin && (
          <View style={s.subAdminBadge}>
            <Text style={s.subAdminBadgeText}>🛡️ أنت تعمل كأدمن فرعي — بعض الميزات مقيدة</Text>
          </View>
        )}

        {isMainAdmin && (
          <>
            {isLoading ? (
              <ActivityIndicator size="large" color={C.primary} style={s.loader} />
            ) : stats ? (
              <>
                <View style={s.section}>
                  <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
                    {t.admin.todayEarnings}: {stats.todayEarnings?.toFixed(0)} {t.common.dinar}
                  </Text>
                  <View style={s.row}>
                    <StatCard label={t.admin.todayTransactions}  value={stats.todayTransactions ?? 0}  icon="🔄" />
                    <StatCard label={t.admin.platformEarnings}   value={`${stats.totalPlatformEarnings?.toFixed(0)} ${t.common.dinar}`} icon="💹" color={C.success} />
                  </View>
                </View>

                <View style={s.section}>
                  <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.admin.users}</Text>
                  <View style={s.row}>
                    <StatCard label={t.admin.totalDrivers}      value={stats.totalDrivers ?? 0}      icon="🚍" small />
                    <StatCard label={t.admin.totalCustomers}    value={stats.totalCustomers ?? 0}    icon="👤" small />
                    <StatCard label={t.admin.totalDistributors} value={stats.totalDistributors ?? 0} icon="🏪" small />
                  </View>
                </View>

                <View style={s.section}>
                  <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.common.pending}</Text>
                  <View style={s.row}>
                    <StatCard label={t.admin.pendingCards}       value={stats.pendingCards ?? 0}       icon="⏳" color={C.warning} />
                    <StatCard label={t.admin.pendingWithdrawals} value={stats.pendingWithdrawals ?? 0} icon="💸" color={C.warning} />
                  </View>
                </View>
              </>
            ) : null}

            <View style={s.section}>
              <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>📊 تقارير السائقين</Text>
              <TouchableOpacity style={s.reportBtn} onPress={handleDriversPDF} disabled={pdfLoading} activeOpacity={0.85}>
                {pdfLoading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Text style={s.reportBtnIcon}>📄</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.reportBtnTitle}>تقرير أرباح ومكاسب السائقين</Text>
                      <Text style={s.reportBtnSub}>رحلات • مكاسب • مسحوبات • أرصدة</Text>
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}>›</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={s.section}>
          <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>🏪 أرصدة الموزعين</Text>

          {distLoading ? (
            <ActivityIndicator color={C.accent} />
          ) : (
            <>
              {(distData?.distributors ?? []).map((d: any) => (
                <View key={d.id} style={s.distRow}>
                  <View style={s.distInfo}>
                    <Text style={s.distName}>{d.name} {d.lastName}</Text>
                    <Text style={s.distId}>ID: #{d.id} • {d.totalTopups} عملية شحن</Text>
                  </View>
                  <View style={s.distRight}>
                    <Text style={s.distBalance}>{Number(d.balance).toLocaleString()}</Text>
                    <Text style={s.distCurrency}>دج</Text>
                  </View>
                </View>
              ))}
              {!(distData?.distributors?.length) && <Text style={s.emptyTxt}>لا يوجد موزعون</Text>}
            </>
          )}

          <TouchableOpacity style={[s.reportBtn, { backgroundColor: C.accent, marginTop: 10 }]} onPress={handleDistributorsPDF} disabled={pdfLoading} activeOpacity={0.85}>
            {pdfLoading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Text style={s.reportBtnIcon}>📄</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.reportBtnTitle}>تقرير أرصدة وعمليات الموزعين</Text>
                  <Text style={s.reportBtnSub}>رصيد متاح • عمليات شحن • أرباح</Text>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}>›</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {isMainAdmin && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>🔧 إدارة المنصة</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.actionCard, { backgroundColor: "#1a4d5e", flex: 1 }]} onPress={() => router.push("/(admin)/balance-requests")} activeOpacity={0.8}>
                <Text style={s.actionCardIcon}>🏪</Text>
                <Text style={s.actionCardLabel}>طلبات رصيد الموزعين</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionCard, { backgroundColor: "#4a3728", flex: 1 }]} onPress={() => router.push("/(admin)/backup")} activeOpacity={0.8}>
                <Text style={s.actionCardIcon}>🗄️</Text>
                <Text style={s.actionCardLabel}>النسخ الاحتياطية</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={s.section}>
          <Text style={[s.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.common.create}</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.actionCard} onPress={() => router.push("/(admin)/create-user")} activeOpacity={0.8}>
              <Text style={s.actionCardIcon}>🚍</Text>
              <Text style={s.actionCardLabel}>{t.admin.createDriver}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionCard, { backgroundColor: C.accent }]} onPress={() => router.push("/(admin)/create-user")} activeOpacity={0.8}>
              <Text style={s.actionCardIcon}>🏪</Text>
              <Text style={s.actionCardLabel}>{t.admin.createDistributor}</Text>
            </TouchableOpacity>
            {isMainAdmin && (
              <TouchableOpacity style={[s.actionCard, { backgroundColor: "#6366F1" }]} onPress={() => router.push("/(admin)/create-user")} activeOpacity={0.8}>
                <Text style={s.actionCardIcon}>🛡️</Text>
                <Text style={s.actionCardLabel}>أدمن فرعي</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <TabBar tabs={tabs} activeKey="dashboard" />
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 24, gap: 4 },
    loader: { marginTop: 40 },
    section: { marginBottom: 18 },
    sectionTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground, marginBottom: 10 },
    row: { flexDirection: "row", gap: 10 },
    subAdminBadge: { backgroundColor: "#EEF2FF", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#C7D2FE", marginBottom: 12 },
    subAdminBadgeText: { fontFamily: "Changa_500Medium", fontSize: 13, color: "#4338CA", textAlign: "center" },
    reportBtn: {
      backgroundColor: C.primary, borderRadius: 14, padding: 16,
      flexDirection: "row", alignItems: "center", gap: 12,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
    },
    reportBtnIcon: { fontSize: 28 },
    reportBtnTitle: { fontFamily: "Changa_700Bold", fontSize: 14, color: "#FFF" },
    reportBtnSub: { fontFamily: "Changa_400Regular", fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    distRow: {
      backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8,
      flexDirection: "row", alignItems: "center", gap: 10,
      borderWidth: 1, borderColor: C.border,
    },
    distInfo: { flex: 1 },
    distName: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    distId: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
    distRight: { alignItems: "flex-end" },
    distBalance: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.accent },
    distCurrency: { fontFamily: "Changa_500Medium", fontSize: 12, color: C.mutedForeground },
    emptyTxt: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center", paddingVertical: 16 },
    actionCard: { flex: 1, backgroundColor: C.primary, borderRadius: 16, padding: 16, alignItems: "center", justifyContent: "center", gap: 6, minHeight: 80 },
    actionCardIcon: { fontSize: 28 },
    actionCardLabel: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: "#FFF", textAlign: "center" },
    headerActions: { flexDirection: "row", gap: 6 },
    actionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
    actionBtnText: { fontSize: 16, color: "#FFF" },
  });
}
