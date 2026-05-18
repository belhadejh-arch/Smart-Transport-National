import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useGetAdminBackup } from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { generateAndSharePDF } from "@/utils/pdfReport";

export default function AdminBackup() {
  const { C } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loadingSection, setLoadingSection] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetAdminBackup();

  const tabs = [
    { key: "dashboard",   icon: "📊", label: t.admin.dashboard,   onPress: () => router.replace("/(admin)/dashboard") },
    { key: "users",       icon: "👥", label: t.admin.users,        onPress: () => router.replace("/(admin)/users") },
    { key: "cards",       icon: "💳", label: t.admin.cards,        onPress: () => router.replace("/(admin)/cards") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals,  onPress: () => router.replace("/(admin)/withdrawals") },
    { key: "profile",     icon: "👤", label: t.admin.profile,      onPress: () => router.replace("/(admin)/profile") },
  ];

  const adminInfo = `${user?.name ?? ""} ${user?.lastName ?? ""} — مدير النظام`;
  const generatedAt = data?.generatedAt ? new Date(data.generatedAt).toLocaleString("ar-DZ") : new Date().toLocaleString("ar-DZ");

  async function downloadSection(key: string, title: string, subtitle: string, summary: any[], rows: any[]) {
    if (!data) { Alert.alert("", "البيانات غير محمّلة بعد، أعد المحاولة"); return; }
    setLoadingSection(key);
    try {
      await generateAndSharePDF({ title, subtitle, userName: adminInfo, generatedAt, summary, rows });
    } catch {
      Alert.alert(t.common.error, "فشل إنشاء ملف PDF");
    } finally {
      setLoadingSection(null);
    }
  }

  async function handleDrivers() {
    const drivers = data?.users.drivers ?? [];
    await downloadSection("drivers", "نسخة احتياطية — السائقون", `إجمالي: ${drivers.length} سائق`,
      [
        { label: "عدد السائقين",       value: `${drivers.length}` },
        { label: "إجمالي الأرصدة",     value: `${drivers.reduce((s: number, d: any) => s + Number(d.balance ?? 0), 0).toFixed(0)} دج` },
      ],
      drivers.map((d: any) => ({
        date: d.createdAt ? new Date(d.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${d.name} ${d.lastName} | ${d.email} | ت: ${d.phone ?? "-"} | رخصة: ${d.licenseNumber ?? "-"}`,
        amount: `رصيد: ${Number(d.balance ?? 0).toLocaleString()} دج | #ID ${d.id}`,
        type: "neutral" as const,
      }))
    );
  }

  async function handleCustomers() {
    const customers = data?.users.customers ?? [];
    await downloadSection("customers", "نسخة احتياطية — المستخدمون", `إجمالي: ${customers.length} مستخدم`,
      [
        { label: "عدد المستخدمين",  value: `${customers.length}` },
      ],
      customers.map((c: any) => ({
        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${c.name} ${c.lastName} | ${c.email} | ت: ${c.phone ?? "-"}`,
        amount: `#ID ${c.id}`,
        type: "neutral" as const,
      }))
    );
  }

  async function handleDistributors() {
    const dists = data?.users.distributors ?? [];
    await downloadSection("distributors", "نسخة احتياطية — الموزعون", `إجمالي: ${dists.length} موزع`,
      [
        { label: "عدد الموزعين",       value: `${dists.length}` },
        { label: "إجمالي الأرصدة",     value: `${dists.reduce((s: number, d: any) => s + Number(d.balance ?? 0), 0).toFixed(0)} دج` },
      ],
      dists.map((d: any) => ({
        date: d.createdAt ? new Date(d.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${d.name} ${d.lastName} | ${d.email} | ت: ${d.phone ?? "-"}`,
        amount: `رصيد: ${Number(d.balance ?? 0).toLocaleString()} دج | #ID ${d.id}`,
        type: "neutral" as const,
      }))
    );
  }

  async function handleCards() {
    const cards = data?.cards ?? [];
    await downloadSection("cards", "نسخة احتياطية — البطاقات", `إجمالي: ${cards.length} بطاقة`,
      [
        { label: "إجمالي البطاقات",    value: `${cards.length}` },
        { label: "بطاقات نشطة",        value: `${cards.filter((c: any) => c.status === "active").length}` },
        { label: "إجمالي الأرصدة",     value: `${cards.reduce((s: number, c: any) => s + Number(c.balance ?? 0), 0).toFixed(0)} دج` },
      ],
      cards.map((c: any) => ({
        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${c.cardNumber} | نوع: ${c.type} | حالة: ${c.status}`,
        amount: `رصيد: ${Number(c.balance ?? 0).toLocaleString()} دج`,
        type: c.status === "active" ? "credit" as const : "neutral" as const,
      }))
    );
  }

  async function handleTransactions() {
    const txs = data?.transactions ?? [];
    await downloadSection("transactions", "نسخة احتياطية — المعاملات", `إجمالي: ${txs.length} معاملة`,
      [
        { label: "إجمالي المعاملات",    value: `${txs.length}` },
        { label: "إجمالي الإيرادات",    value: `${txs.reduce((s: number, t: any) => s + Number(t.platformFee ?? 0), 0).toFixed(0)} دج` },
        { label: "مكاسب السائقين",      value: `${txs.reduce((s: number, t: any) => s + Number(t.driverEarning ?? 0), 0).toFixed(0)} دج` },
      ],
      txs.map((tx: any) => ({
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${tx.type} | بطاقة: #${tx.cardId ?? "-"}`,
        amount: `${Number(tx.amount ?? 0).toFixed(0)} دج | رسوم: ${Number(tx.platformFee ?? 0).toFixed(0)} دج | سائق: +${Number(tx.driverEarning ?? 0).toFixed(0)} دج`,
        type: "credit" as const,
      }))
    );
  }

  async function handleWithdrawals() {
    const ws = data?.withdrawals ?? [];
    await downloadSection("withdrawals", "نسخة احتياطية — طلبات السحب", `إجمالي: ${ws.length} طلب`,
      [
        { label: "إجمالي الطلبات",  value: `${ws.length}` },
        { label: "قيد الانتظار",    value: `${ws.filter((w: any) => w.status === "pending").length}` },
        { label: "معتمدة",          value: `${ws.filter((w: any) => w.status === "approved").length}` },
        { label: "إجمالي المسحوب",  value: `${ws.filter((w: any) => w.status === "approved").reduce((s: number, w: any) => s + Number(w.amount ?? 0), 0).toFixed(0)} دج` },
      ],
      ws.map((w: any) => ({
        date: w.createdAt ? new Date(w.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${w.holderName ?? ""} ${w.holderLastName ?? ""} | ${w.method} | ت: ${w.phone ?? w.ccpAccount ?? "-"}`,
        amount: `${Number(w.amount ?? 0).toFixed(0)} دج | ${w.status}`,
        type: w.status === "approved" ? "debit" as const : "neutral" as const,
      }))
    );
  }

  async function handleDriverPayments() {
    const ps = data?.driverPayments ?? [];
    await downloadSection("driver-payments", "نسخة احتياطية — دفعات السائقين", `إجمالي: ${ps.length} دفعة`,
      [
        { label: "إجمالي الدفعات",       value: `${ps.length}` },
        { label: "إجمالي المدفوعات",     value: `${ps.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0).toFixed(0)} دج` },
      ],
      ps.map((p: any) => ({
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${p.driverName ?? ""} ${p.driverLastName ?? ""} | وصل: ${p.receiptNumber} ${p.note ? `| ${p.note}` : ""}`,
        amount: `${Number(p.amount ?? 0).toFixed(0)} دج`,
        type: "debit" as const,
      }))
    );
  }

  async function handleBalanceRequests() {
    const bs = data?.balanceRequests ?? [];
    await downloadSection("balance-requests", "نسخة احتياطية — طلبات رصيد الموزعين", `إجمالي: ${bs.length} طلب`,
      [
        { label: "إجمالي الطلبات",   value: `${bs.length}` },
        { label: "معتمدة",           value: `${bs.filter((b: any) => b.status === "approved").length}` },
        { label: "إجمالي المحوّل",   value: `${bs.filter((b: any) => b.status === "approved").reduce((s: number, b: any) => s + Number(b.amount ?? 0), 0).toFixed(0)} دج` },
      ],
      bs.map((b: any) => ({
        date: b.createdAt ? new Date(b.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${b.distributorName ?? ""} ${b.distributorLastName ?? ""} | ت: ${b.phone ?? "-"}`,
        amount: `${Number(b.amount ?? 0).toFixed(0)} دج | ${b.status}`,
        type: b.status === "approved" ? "credit" as const : "neutral" as const,
      }))
    );
  }

  async function handleAdmins() {
    const admins = data?.users.admins ?? [];
    await downloadSection("admins", "نسخة احتياطية — المدراء", `إجمالي: ${admins.length} مدير`,
      [{ label: "عدد المدراء", value: `${admins.length}` }],
      admins.map((a: any) => ({
        date: a.createdAt ? new Date(a.createdAt).toLocaleDateString("ar-DZ") : "-",
        description: `${a.name} ${a.lastName} | ${a.email} | دور: ${a.role}`,
        amount: `#ID ${a.id}`,
        type: "neutral" as const,
      }))
    );
  }

  const stats = data?.stats;
  const s = makeStyles(C);

  const sections = [
    { key: "drivers",          icon: "🚍", title: "السائقون",                 count: data?.users?.drivers?.length ?? 0,          onPress: handleDrivers },
    { key: "customers",        icon: "👤", title: "المستخدمون (زبائن)",       count: data?.users?.customers?.length ?? 0,        onPress: handleCustomers },
    { key: "distributors",     icon: "🏪", title: "الموزعون",                  count: data?.users?.distributors?.length ?? 0,     onPress: handleDistributors },
    { key: "admins",           icon: "🛡️", title: "المدراء",                   count: data?.users?.admins?.length ?? 0,           onPress: handleAdmins },
    { key: "cards",            icon: "💳", title: "البطاقات",                  count: data?.cards?.length ?? 0,                   onPress: handleCards },
    { key: "transactions",     icon: "🔄", title: "المعاملات",                 count: data?.transactions?.length ?? 0,            onPress: handleTransactions },
    { key: "withdrawals",      icon: "💸", title: "طلبات السحب (سائقون)",     count: data?.withdrawals?.length ?? 0,             onPress: handleWithdrawals },
    { key: "driver-payments",  icon: "🧾", title: "دفعات السائقين",            count: data?.driverPayments?.length ?? 0,          onPress: handleDriverPayments },
    { key: "balance-requests", icon: "📋", title: "طلبات رصيد الموزعين",       count: data?.balanceRequests?.length ?? 0,         onPress: handleBalanceRequests },
  ];

  return (
    <View style={s.screen}>
      <Header title="🗄️ النسخ الاحتياطية" />

      <ScrollView contentContainerStyle={s.content}>
        {/* Generated at */}
        {data && (
          <View style={s.infoBanner}>
            <Text style={s.infoBannerText}>
              🕐 آخر تحديث: {new Date(data.generatedAt).toLocaleString("ar-DZ")}
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={s.refreshBtn}>
              <Text style={s.refreshBtnText}>🔄 تحديث</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats overview */}
        {stats && (
          <View style={s.statsGrid}>
            <View style={s.statsCard}>
              <Text style={s.statsTitle}>📊 إحصائيات النظام</Text>
              {[
                { label: "إجمالي المستخدمين",     value: `${stats.totalUsers}` },
                { label: "إجمالي البطاقات",        value: `${stats.totalCards}` },
                { label: "إجمالي المعاملات",       value: `${stats.totalTransactions}` },
                { label: "إجمالي إيرادات المنصة", value: `${(stats.totalPlatformEarnings ?? 0).toFixed(0)} دج` },
                { label: "إجمالي مكاسب السائقين", value: `${(stats.totalDriverEarnings ?? 0).toFixed(0)} دج` },
                { label: "طلبات السحب",            value: `${stats.totalWithdrawals}` },
                { label: "دفعات السائقين",         value: `${stats.totalDriverPayments}` },
                { label: "طلبات رصيد الموزعين",   value: `${stats.totalBalanceRequests}` },
              ].map(item => (
                <View key={item.label} style={s.statsRow}>
                  <Text style={s.statsLabel}>{item.label}</Text>
                  <Text style={s.statsValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {isLoading && (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        )}

        {/* Section cards */}
        <Text style={s.sectionTitle}>تحميل PDF لكل قسم</Text>
        <View style={s.sectionsGrid}>
          {sections.map(sec => (
            <TouchableOpacity
              key={sec.key}
              style={[s.secCard, loadingSection === sec.key && { opacity: 0.6 }]}
              onPress={sec.onPress}
              disabled={loadingSection !== null || isLoading}
              activeOpacity={0.8}
            >
              {loadingSection === sec.key ? (
                <ActivityIndicator color={C.primary} size="small" style={{ marginBottom: 8 }} />
              ) : (
                <Text style={s.secIcon}>{sec.icon}</Text>
              )}
              <Text style={s.secTitle}>{sec.title}</Text>
              <View style={s.secCountBadge}>
                <Text style={s.secCount}>{sec.count}</Text>
              </View>
              <Text style={s.secDownload}>📄 تحميل PDF</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <TabBar tabs={tabs} activeKey="dashboard" />
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    content: { padding: 16, gap: 14, paddingBottom: 100 },
    infoBanner: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: C.card, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: C.border,
    },
    infoBannerText: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, flex: 1 },
    refreshBtn: { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    refreshBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: "#FFF" },
    statsGrid: {},
    statsCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: C.border,
    },
    statsTitle: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground, marginBottom: 10 },
    statsRow: {
      flexDirection: "row", justifyContent: "space-between",
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    statsLabel: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground },
    statsValue: { fontFamily: "Changa_700Bold", fontSize: 13, color: C.primary },
    loadingBox: { alignItems: "center", paddingVertical: 24, gap: 10 },
    loadingText: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground },
    sectionTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground, marginTop: 4 },
    sectionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    secCard: {
      width: "47%", backgroundColor: C.card, borderRadius: 16, padding: 16,
      alignItems: "center", gap: 6, borderWidth: 1, borderColor: C.border,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    secIcon: { fontSize: 32 },
    secTitle: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.foreground, textAlign: "center", lineHeight: 18 },
    secCountBadge: {
      backgroundColor: `${C.primary}18`, borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 3,
    },
    secCount: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.primary },
    secDownload: { fontFamily: "Changa_500Medium", fontSize: 11, color: C.mutedForeground },
  });
}
