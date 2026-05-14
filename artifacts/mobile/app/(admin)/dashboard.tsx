import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetAdminStats } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

type Tab = "dashboard" | "users" | "cards" | "withdrawals";

export default function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const { logout, switchAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const insets = useSafeAreaInsets();
  const C = colors.light;

  const { data: stats, isLoading } = useGetAdminStats();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.admin.dashboard, onPress: () => setActiveTab("dashboard") },
    { key: "users", icon: "👥", label: t.admin.users, onPress: () => router.push("/(admin)/users") },
    { key: "cards", icon: "💳", label: t.admin.cards, onPress: () => router.push("/(admin)/cards") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals, onPress: () => router.push("/(admin)/withdrawals") },
  ];

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  function confirmSwitch() {
    Alert.alert(t.common.switchAccount, t.auth.switchConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: switchAccount },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Header
        title={t.admin.dashboard}
        showLogout={false}
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={confirmSwitch} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>↔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>⏻</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={C.primary} style={styles.loader} />
        ) : stats ? (
          <>
            {/* Today's summary */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
                {t.admin.todayEarnings}: {stats.todayEarnings?.toFixed(0)} {t.common.dinar}
              </Text>
              <View style={styles.row}>
                <StatCard label={t.admin.todayTransactions} value={stats.todayTransactions ?? 0} icon="🔄" />
                <StatCard label={t.admin.platformEarnings} value={`${stats.totalPlatformEarnings?.toFixed(0)} ${t.common.dinar}`} icon="💹" color={C.success} />
              </View>
            </View>

            {/* Users stats */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.admin.users}</Text>
              <View style={styles.row}>
                <StatCard label={t.admin.totalDrivers} value={stats.totalDrivers ?? 0} icon="🚍" small />
                <StatCard label={t.admin.totalCustomers} value={stats.totalCustomers ?? 0} icon="👤" small />
                <StatCard label={t.admin.totalDistributors} value={stats.totalDistributors ?? 0} icon="🏪" small />
              </View>
            </View>

            {/* Pending items */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
                {t.common.pending}
              </Text>
              <View style={styles.row}>
                <StatCard label={t.admin.pendingCards} value={stats.pendingCards ?? 0} icon="⏳" color={C.warning} />
                <StatCard label={t.admin.pendingWithdrawals} value={stats.pendingWithdrawals ?? 0} icon="💸" color={C.warning} />
              </View>
            </View>

            {/* Quick actions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.common.create}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(admin)/create-user")} activeOpacity={0.8}>
                  <Text style={styles.actionCardIcon}>🚍</Text>
                  <Text style={styles.actionCardLabel}>{t.admin.createDriver}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: C.accent }]} onPress={() => router.push("/(admin)/create-user")} activeOpacity={0.8}>
                  <Text style={styles.actionCardIcon}>🏪</Text>
                  <Text style={styles.actionCardLabel}>{t.admin.createDistributor}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <TabBar tabs={tabs} activeKey="dashboard" />
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  loader: { marginTop: 60 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: "Changa_700Bold",
    fontSize: 16,
    color: C.foreground,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 80,
  },
  actionCardIcon: { fontSize: 28 },
  actionCardLabel: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: "#FFF", textAlign: "center" },
  headerActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  actionBtnText: { fontSize: 16, color: "#FFF" },
});
