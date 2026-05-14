import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useGetDistributorDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function DistributorDashboard() {
  const { t, isRTL } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const C = colors.light;
  const { data, isLoading, refetch } = useGetDistributorDashboard();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.distributor.dashboard, onPress: () => {} },
    { key: "scan", icon: "📷", label: t.distributor.scan, onPress: () => router.push("/(distributor)/scan") },
    { key: "profile", icon: "👤", label: t.distributor.profile, onPress: () => router.push("/(distributor)/profile") },
  ];

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Header
        title={t.distributor.dashboard}
        right={
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity onPress={switchAccount} style={styles.hBtn}><Text style={styles.hBtnText}>↔</Text></TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={styles.hBtn}><Text style={styles.hBtnText}>⏻</Text></TouchableOpacity>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.light.primary} />}>
        {/* Balance hero */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.common.balance}</Text>
          <Text style={styles.balanceAmount}>{(data?.balance ?? 0).toFixed(0)}</Text>
          <Text style={styles.balanceCurrency}>{t.common.dinar}</Text>
          <Text style={styles.distName}>{user?.name} {user?.lastName}</Text>
        </View>

        {isLoading ? <ActivityIndicator color={C.primary} /> : (
          <>
            <View style={styles.statsRow}>
              <StatCard label={t.distributor.todayTopups} value={data?.todayTopups ?? 0} icon="📅" />
              <StatCard label={t.distributor.totalTopups} value={data?.totalTopups ?? 0} icon="📊" color={C.success} />
            </View>

            {/* Scan CTA */}
            <TouchableOpacity style={styles.scanCTA} onPress={() => router.push("/(distributor)/scan")} activeOpacity={0.85}>
              <Text style={styles.scanCTAIcon}>📷</Text>
              <View>
                <Text style={styles.scanCTATitle}>{t.distributor.scan}</Text>
                <Text style={styles.scanCTASub}>{t.distributor.scanTitle}</Text>
              </View>
            </TouchableOpacity>

            {/* Recent topups */}
            {(data?.recentTransactions ?? []).length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>Recent</Text>
                {data!.recentTransactions.slice(0, 5).map((tx, i) => (
                  <View key={tx.id ?? i} style={styles.txRow}>
                    <Text style={styles.txIcon}>💰</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txType}>Top Up • {tx.cardType ?? "-"}</Text>
                      <Text style={styles.txDate}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ""}</Text>
                    </View>
                    <Text style={styles.txAmount}>+{Number(tx.amount).toFixed(0)} {t.common.dinar}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
      <TabBar tabs={tabs} activeKey="dashboard" />
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  balanceCard: {
    backgroundColor: C.accent, borderRadius: 20, padding: 24, alignItems: "center",
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  balanceLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: "rgba(255,255,255,0.75)" },
  balanceAmount: { fontFamily: "Changa_700Bold", fontSize: 48, color: "#FFF", lineHeight: 56 },
  balanceCurrency: { fontFamily: "Changa_600SemiBold", fontSize: 18, color: "rgba(255,255,255,0.85)", marginTop: -4 },
  distName: { fontFamily: "Changa_500Medium", fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 10 },
  scanCTA: {
    backgroundColor: C.primary, borderRadius: 16, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 16,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  scanCTAIcon: { fontSize: 36 },
  scanCTATitle: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
  scanCTASub: { fontFamily: "Changa_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  sectionTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
  txRow: {
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: C.border,
  },
  txIcon: { fontSize: 22 },
  txType: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.foreground },
  txDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
  txAmount: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.success },
  hBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  hBtnText: { fontSize: 14, color: "#FFF" },
});
