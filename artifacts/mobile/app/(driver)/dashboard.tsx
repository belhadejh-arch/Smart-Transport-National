import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useGetDriverDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function DriverDashboard() {
  const { t, isRTL } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const C = colors.light;

  const { data, isLoading, refetch } = useGetDriverDashboard();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => {} },
    { key: "scan", icon: "📷", label: t.driver.scan, onPress: () => router.push("/(driver)/scan") },
    { key: "trips", icon: "🚍", label: t.driver.trips, onPress: () => router.push("/(driver)/trips") },
    { key: "withdraw", icon: "💰", label: t.driver.withdraw, onPress: () => router.push("/(driver)/withdraw") },
    { key: "profile", icon: "👤", label: t.driver.profile, onPress: () => router.push("/(driver)/profile") },
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
        title={t.driver.dashboard}
        right={
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity onPress={switchAccount} style={styles.hBtn}>
              <Text style={styles.hBtnText}>↔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={styles.hBtn}>
              <Text style={styles.hBtnText}>⏻</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshing={isLoading} onRefresh={refetch}>
        {/* Balance hero */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.common.balance}</Text>
          <Text style={styles.balanceAmount}>{(data?.balance ?? 0).toFixed(0)}</Text>
          <Text style={styles.balanceCurrency}>{t.common.dinar}</Text>
          <Text style={styles.driverName}>{user?.name} {user?.lastName}</Text>
        </View>

        {/* Today stats */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
          {t.driver.todayEarnings}
        </Text>
        {isLoading ? (
          <ActivityIndicator color={C.primary} />
        ) : (
          <View style={styles.row}>
            <StatCard label={t.driver.todayPassengers} value={data?.todayPassengers ?? 0} icon="👥" />
            <StatCard label={t.driver.todayEarnings} value={`${(data?.todayEarnings ?? 0).toFixed(0)} ${t.common.dinar}`} icon="💵" color={C.success} />
          </View>
        )}

        <View style={styles.row2}>
          <StatCard label={t.driver.platformFee} value={`${(data?.platformFeeToday ?? 0).toFixed(0)} ${t.common.dinar}`} icon="🏦" small />
          <StatCard label={t.driver.totalTrips} value={data?.totalTrips ?? 0} icon="🛣" small />
        </View>

        {/* Scan CTA */}
        <TouchableOpacity style={styles.scanCTA} onPress={() => router.push("/(driver)/scan")} activeOpacity={0.85}>
          <Text style={styles.scanCTAIcon}>📷</Text>
          <Text style={styles.scanCTAText}>{t.driver.scan}</Text>
        </TouchableOpacity>

        {/* Recent trips */}
        {(data?.recentTrips ?? []).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t.driver.trips}</Text>
            {data!.recentTrips.slice(0, 5).map((trip, i) => (
              <View key={trip.id ?? i} style={styles.tripRow}>
                <Text style={styles.tripType}>{trip.cardType ?? "-"}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.tripEarning}>+{Number(trip.driverEarning).toFixed(0)} {t.common.dinar}</Text>
                <Text style={styles.tripDate}>{trip.createdAt ? new Date(trip.createdAt).toLocaleTimeString() : ""}</Text>
              </View>
            ))}
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
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  balanceCard: {
    backgroundColor: C.primary, borderRadius: 20, padding: 24, alignItems: "center",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  balanceLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: "rgba(255,255,255,0.75)" },
  balanceAmount: { fontFamily: "Changa_700Bold", fontSize: 48, color: "#FFF", lineHeight: 56 },
  balanceCurrency: { fontFamily: "Changa_600SemiBold", fontSize: 18, color: C.accent, marginTop: -4 },
  driverName: { fontFamily: "Changa_500Medium", fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 },
  sectionTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
  row: { flexDirection: "row", gap: 10 },
  row2: { flexDirection: "row", gap: 10 },
  scanCTA: {
    backgroundColor: C.accent, borderRadius: 16, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  scanCTAIcon: { fontSize: 32 },
  scanCTAText: { fontFamily: "Changa_700Bold", fontSize: 20, color: "#FFF" },
  tripRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.card, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  tripType: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.foreground },
  tripEarning: { fontFamily: "Changa_700Bold", fontSize: 14, color: C.success },
  tripDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
  hBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  hBtnText: { fontSize: 14, color: "#FFF" },
});
