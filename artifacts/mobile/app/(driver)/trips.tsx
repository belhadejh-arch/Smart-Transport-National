import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useGetDriverTrips, useGetDriverDashboard, useGetDriverWithdrawals } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";
import { generateAndSharePDF } from "@/utils/pdfReport";

export default function DriverTrips() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const C = colors.light;
  const { data, isLoading } = useGetDriverTrips({});
  const { data: dashboard } = useGetDriverDashboard();
  const { data: withdrawals } = useGetDriverWithdrawals();
  const [pdfLoading, setPdfLoading] = useState(false);

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan",      icon: "📷", label: t.driver.scan,      onPress: () => router.replace("/(driver)/scan") },
    { key: "trips",     icon: "🚍", label: t.driver.trips,     onPress: () => {} },
    { key: "withdraw",  icon: "💰", label: t.driver.withdraw,  onPress: () => router.replace("/(driver)/withdraw") },
    { key: "profile",   icon: "👤", label: t.driver.profile,   onPress: () => router.replace("/(driver)/profile") },
  ];

  const cardTypeLabels: Record<string, string> = {
    standard: t.customer.cardTypes.standard,
    student:  t.customer.cardTypes.student,
    employee: t.customer.cardTypes.employee,
    special_needs: t.customer.cardTypes.special_needs,
  };

  const trips = data?.trips ?? [];
  const approvedWithdrawals = (withdrawals?.requests ?? []).filter(r => r.status === "approved");
  const totalWithdrawn = approvedWithdrawals.reduce((s, r) => s + Number(r.amount), 0);

  async function handlePDF() {
    if (!trips.length) { Alert.alert("", "لا توجد رحلات لتصديرها"); return; }
    setPdfLoading(true);
    try {
      await generateAndSharePDF({
        title: "كشف حساب السائق",
        subtitle: "سجل الرحلات والمكاسب",
        userName: `${user?.name ?? ""} ${user?.lastName ?? ""}`,
        generatedAt: new Date().toLocaleString("ar-DZ"),
        summary: [
          { label: "الرصيد الحالي",        value: `${(dashboard?.balance ?? 0).toFixed(0)} دج` },
          { label: "إجمالي الرحلات",       value: `${data?.total ?? 0} رحلة` },
          { label: "إجمالي المكاسب",       value: `${(data?.totalEarnings ?? 0).toFixed(0)} دج` },
          { label: "إجمالي رسوم المنصة",   value: `${trips.reduce((s, t) => s + Number(t.platformFee), 0).toFixed(0)} دج` },
          { label: "إجمالي المسحوب",       value: `${totalWithdrawn.toFixed(0)} دج` },
          { label: "رحلات اليوم",          value: `${dashboard?.todayPassengers ?? 0}` },
        ],
        rows: trips.map(trip => ({
          date: trip.createdAt ? new Date(trip.createdAt).toLocaleString("ar-DZ") : "",
          description: `رحلة • ${cardTypeLabels[trip.cardType ?? ""] ?? (trip.cardType ?? "-")}`,
          amount: `+${Number(trip.driverEarning).toFixed(0)} دج`,
          type: "credit",
        })),
      });
    } catch {
      Alert.alert(t.common.error, "فشل إنشاء التقرير");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header
        title={t.driver.trips}
        right={
          <TouchableOpacity style={styles.pdfBtn} onPress={handlePDF} disabled={pdfLoading}>
            {pdfLoading
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.pdfBtnText}>📄 PDF</Text>
            }
          </TouchableOpacity>
        }
      />

      {!isLoading && data && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{data.total}</Text>
            <Text style={[styles.summaryLbl, { textAlign: isRTL ? "right" : "left" }]}>{t.driver.totalTrips}</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: C.success }]}>{(data.totalEarnings ?? 0).toFixed(0)}</Text>
            <Text style={[styles.summaryLbl, { textAlign: isRTL ? "right" : "left" }]}>{t.driver.earnings} (دج)</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: C.primary }]}>{(dashboard?.balance ?? 0).toFixed(0)}</Text>
            <Text style={styles.summaryLbl}>الرصيد (دج)</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {trips.length === 0 ? (
            <Text style={styles.empty}>{t.driver.noTrips}</Text>
          ) : (
            trips.map((trip, i) => (
              <View key={trip.id ?? i} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>🚍</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardType}>{cardTypeLabels[trip.cardType ?? ""] ?? (trip.cardType ?? "-")}</Text>
                  <Text style={styles.cardDate}>{trip.createdAt ? new Date(trip.createdAt).toLocaleString("ar-DZ") : ""}</Text>
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
  pdfBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pdfBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: "#FFF" },
  summary: {
    flexDirection: "row", backgroundColor: C.card, padding: 14,
    marginHorizontal: 12, marginTop: 10,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryVal: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.primary },
  summaryLbl: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
  summaryDiv: { width: 1, height: 36, backgroundColor: C.border },
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
