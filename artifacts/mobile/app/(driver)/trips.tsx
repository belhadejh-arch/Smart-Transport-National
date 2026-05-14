import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useGetDriverTrips } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function DriverTrips() {
  const { t, isRTL } = useLanguage();
  const C = colors.light;
  const { data, isLoading } = useGetDriverTrips({});

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan", icon: "📷", label: t.driver.scan, onPress: () => router.replace("/(driver)/scan") },
    { key: "trips", icon: "🚍", label: t.driver.trips, onPress: () => {} },
    { key: "withdraw", icon: "💰", label: t.driver.withdraw, onPress: () => router.replace("/(driver)/withdraw") },
    { key: "profile", icon: "👤", label: t.driver.profile, onPress: () => router.replace("/(driver)/profile") },
  ];

  const cardTypeLabels: Record<string, string> = {
    standard: t.customer.cardTypes.standard,
    student: t.customer.cardTypes.student,
    employee: t.customer.cardTypes.employee,
    special_needs: t.customer.cardTypes.special_needs,
  };

  return (
    <View style={styles.screen}>
      <Header title={t.driver.trips} />
      {!isLoading && data && (
        <View style={styles.summary}>
          <Text style={[styles.summaryLabel, { textAlign: isRTL ? "right" : "left" }]}>
            {t.driver.totalTrips}: <Text style={styles.summaryValue}>{data.total}</Text>
          </Text>
          <Text style={[styles.summaryLabel, { textAlign: isRTL ? "right" : "left" }]}>
            {t.driver.earnings}: <Text style={[styles.summaryValue, { color: C.success }]}>{(data.totalEarnings ?? 0).toFixed(0)} {t.common.dinar}</Text>
          </Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {(data?.trips ?? []).length === 0 ? (
            <Text style={styles.empty}>{t.driver.noTrips}</Text>
          ) : (
            (data?.trips ?? []).map((trip, i) => (
              <View key={trip.id ?? i} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>🚍</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardType}>{cardTypeLabels[trip.cardType ?? ""] ?? (trip.cardType ?? "-")}</Text>
                  <Text style={styles.cardDate}>{trip.createdAt ? new Date(trip.createdAt).toLocaleString() : ""}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.earning}>+{Number(trip.driverEarning).toFixed(0)}</Text>
                  <Text style={styles.currency}>{t.common.dinar}</Text>
                  <Text style={styles.fee}>-{Number(trip.platformFee).toFixed(0)} {t.common.dinar}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
      <TabBar tabs={tabs} activeKey="trips" />
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  summary: {
    backgroundColor: C.card, padding: 14, marginHorizontal: 12, marginTop: 10,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, gap: 2,
  },
  summaryLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  summaryValue: { fontFamily: "Changa_700Bold", color: C.primary },
  loader: { marginTop: 60 },
  scroll: { flex: 1 },
  list: { padding: 12, gap: 8, paddingBottom: 24 },
  card: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: C.border,
  },
  cardLeft: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  cardIcon: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardType: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
  cardDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
  cardRight: { alignItems: "flex-end" },
  earning: { fontFamily: "Changa_700Bold", fontSize: 18, color: C.success },
  currency: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.success },
  fee: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.destructive, marginTop: 2 },
  empty: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", marginTop: 60 },
});
