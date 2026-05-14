import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useGetCustomerCards } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function CustomerDashboard() {
  const { t, isRTL } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const C = colors.light;
  const { data, isLoading } = useGetCustomerCards();

  const card = data?.cards?.[0];

  const tabs = [
    { key: "dashboard", icon: "🏠", label: t.customer.dashboard, onPress: () => {} },
    { key: "my-card", icon: "💳", label: t.customer.myCard, onPress: () => router.push("/(customer)/my-card") },
    { key: "transactions", icon: "📋", label: t.customer.transactions, onPress: () => router.push("/(customer)/transactions") },
    { key: "profile", icon: "👤", label: t.customer.profile, onPress: () => router.push("/(customer)/profile") },
  ];

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  const cardTypeColors: Record<string, string> = {
    standard: C.primary,
    student: "#7C3AED",
    employee: "#059669",
    special_needs: "#D97706",
  };

  const cardEmojis: Record<string, string> = {
    standard: "🚌",
    student: "🎓",
    employee: "💼",
    special_needs: "♿",
  };

  const fares: Record<string, string> = {
    standard: "50",
    student: "35",
    employee: "40",
    special_needs: "40",
  };

  return (
    <View style={styles.screen}>
      <Header
        title={t.customer.dashboard}
        right={
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity onPress={switchAccount} style={styles.hBtn}><Text style={styles.hBtnText}>↔</Text></TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} style={styles.hBtn}><Text style={styles.hBtnText}>⏻</Text></TouchableOpacity>
          </View>
        }
      />

      <View style={styles.content}>
        <Text style={styles.greeting}>
          {t.auth.welcome}, {user?.name}!
        </Text>

        {isLoading ? (
          <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 60 }} />
        ) : card ? (
          <>
            {/* Card visual */}
            <View style={[styles.cardVisual, { backgroundColor: cardTypeColors[card.type] ?? C.primary }]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardAppName}>NQL DZ</Text>
                <Text style={styles.cardEmoji}>{cardEmojis[card.type] ?? "🚌"}</Text>
              </View>
              <Text style={styles.cardTypeName}>
                {t.customer.cardTypes[card.type as keyof typeof t.customer.cardTypes] ?? card.type}
              </Text>
              <Text style={styles.cardNumber}>#{card.cardNumber}</Text>
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardBalanceLabel}>{t.common.balance}</Text>
                  <Text style={styles.cardBalance}>{Number(card.balance).toFixed(0)} {t.common.dinar}</Text>
                </View>
                <View>
                  <Text style={styles.cardFareLabel}>Fare</Text>
                  <Text style={styles.cardFare}>{fares[card.type] ?? "50"} {t.common.dinar}</Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: card.status === "active" ? "rgba(255,255,255,0.25)" : "rgba(255,0,0,0.3)" }]}>
                <Text style={styles.statusPillText}>
                  {card.status === "active" ? t.customer.cardActive : card.status === "pending" ? t.customer.pendingApproval : card.status}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionTile} onPress={() => router.push("/(customer)/my-card")} activeOpacity={0.8}>
                <Text style={styles.actionTileIcon}>📲</Text>
                <Text style={styles.actionTileLabel}>{t.customer.showQR}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionTile} onPress={() => router.push("/(customer)/transactions")} activeOpacity={0.8}>
                <Text style={styles.actionTileIcon}>📋</Text>
                <Text style={styles.actionTileLabel}>{t.customer.transactions}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noCard}>
            <Text style={styles.noCardIcon}>💳</Text>
            <Text style={styles.noCardText}>{t.customer.noCard}</Text>
            <TouchableOpacity style={styles.createCardBtn} onPress={() => router.push("/(customer)/create-card")} activeOpacity={0.85}>
              <Text style={styles.createCardBtnText}>+ {t.customer.createCard}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TabBar tabs={tabs} activeKey="dashboard" />
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { flex: 1, padding: 16, gap: 14 },
  greeting: { fontFamily: "Changa_700Bold", fontSize: 18, color: C.foreground },
  cardVisual: {
    borderRadius: 24, padding: 24, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
    minHeight: 200,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardAppName: { fontFamily: "Changa_700Bold", fontSize: 16, color: "rgba(255,255,255,0.85)", letterSpacing: 1 },
  cardEmoji: { fontSize: 28 },
  cardTypeName: { fontFamily: "Changa_700Bold", fontSize: 22, color: "#FFF", marginTop: 8 },
  cardNumber: { fontFamily: "Changa_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)", letterSpacing: 2 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 },
  cardBalanceLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: "rgba(255,255,255,0.7)" },
  cardBalance: { fontFamily: "Changa_700Bold", fontSize: 26, color: "#FFF" },
  cardFareLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: "rgba(255,255,255,0.7)" },
  cardFare: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: "rgba(255,255,255,0.9)" },
  statusPill: {
    alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
  },
  statusPillText: { fontFamily: "Changa_500Medium", fontSize: 11, color: "#FFF" },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionTile: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: C.border,
  },
  actionTileIcon: { fontSize: 28 },
  actionTileLabel: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.foreground },
  noCard: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  noCardIcon: { fontSize: 72 },
  noCardText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.mutedForeground },
  createCardBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 14, paddingHorizontal: 28 },
  createCardBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
  hBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  hBtnText: { fontSize: 14, color: "#FFF" },
});
