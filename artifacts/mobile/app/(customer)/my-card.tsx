import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { useGetCustomerCards, useGetCustomerTransactions } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { Sounds } from "@/utils/sounds";

export default function MyCard() {
  const { t } = useLanguage();
  const { C, isDark } = useTheme();

  const { data, isLoading, refetch } = useGetCustomerCards();
  const { data: txData, refetch: refetchTx } = useGetCustomerTransactions();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchTx();
    }, [])
  );

  const card = data?.cards?.[0];
  const lastRide = txData?.transactions?.find((tx: any) => tx.type === "ride");

  const tabs = [
    { key: "dashboard", icon: "🏠", label: t.customer.dashboard, onPress: () => router.replace("/(customer)/dashboard") },
    { key: "my-card", icon: "💳", label: t.customer.myCard, onPress: () => {} },
    { key: "transactions", icon: "📋", label: t.customer.transactions, onPress: () => router.replace("/(customer)/transactions") },
    { key: "profile", icon: "👤", label: t.customer.profile, onPress: () => router.replace("/(customer)/profile") },
  ];

  const cardTypeColors: Record<string, string> = {
    standard: C.primary,
    student: "#7C3AED",
    employee: "#059669",
    special_needs: "#D97706",
  };

  async function copyCardNumber() {
    if (!card?.cardNumber) return;
    await Clipboard.setStringAsync(card.cardNumber);
    Sounds.tap();
    Alert.alert("✓", "تم نسخ رقم البطاقة");
  }

  function handleRefresh() {
    Sounds.scan();
    refetch();
    refetchTx();
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title={t.customer.myCard} />
      <ScrollView contentContainerStyle={s.content}>
        {isLoading ? (
          <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 60 }} />
        ) : card ? (
          <>
            {card.status === "active" ? (
              <View style={s.qrContainer}>
                <View style={s.qrBox}>
                  <QRCode
                    value={card.cardNumber}
                    size={220}
                    color={isDark ? "#FFFFFF" : "#1A3A4A"}
                    backgroundColor={isDark ? "#152936" : "#FFFFFF"}
                  />
                </View>
                <Text style={s.qrHint}>{t.driver.scanInstruction}</Text>
              </View>
            ) : (
              <View style={s.pendingBox}>
                <Text style={s.pendingIcon}>⏳</Text>
                <Text style={s.pendingText}>
                  {card.status === "pending" ? t.customer.pendingApproval : `Status: ${card.status}`}
                </Text>
              </View>
            )}

            {card.status === "active" && (
              <View style={[s.balanceCard, { borderColor: `${C.primary}30` }]}>
                <View style={s.balanceRow}>
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground }}>
                      {t.common.balance}
                    </Text>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 32, color: C.success }}>
                      {Number(card.balance).toFixed(0)}
                    </Text>
                    <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground }}>
                      {t.common.dinar}
                    </Text>
                  </View>
                  {lastRide && (
                    <View style={[s.lastRideBadge, { backgroundColor: `${C.destructive}12`, borderColor: `${C.destructive}30` }]}>
                      <Text style={{ fontFamily: "Changa_400Regular", fontSize: 10, color: C.mutedForeground }}>
                        آخر رحلة
                      </Text>
                      <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: C.destructive }}>
                        −{Number(lastRide.amount).toFixed(0)}
                      </Text>
                      <Text style={{ fontFamily: "Changa_400Regular", fontSize: 10, color: C.mutedForeground }}>
                        {t.common.dinar}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={s.refreshBtn} onPress={handleRefresh}>
                  <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.primary }}>🔄 تحديث الرصيد</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[s.infoCard, { borderLeftColor: cardTypeColors[card.type] ?? C.primary, borderLeftWidth: 4 }]}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>{t.common.type}</Text>
                <Text style={s.infoValue}>
                  {t.customer.cardTypes[card.type as keyof typeof t.customer.cardTypes] ?? card.type}
                </Text>
              </View>

              <View style={s.infoRow}>
                <Text style={s.infoLabel}>{t.customer.cardNumber}</Text>
                <View style={s.cardNumberRow}>
                  <Text style={[s.infoValue, { fontFamily: "Changa_400Regular", letterSpacing: 2 }]}>
                    {card.cardNumber}
                  </Text>
                  <TouchableOpacity style={s.copyBtn} onPress={copyCardNumber} activeOpacity={0.7}>
                    <Text style={s.copyBtnText}>📋</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={s.infoLabel}>{t.common.status}</Text>
                <Text style={[s.infoValue, { color: card.status === "active" ? C.success : C.warning }]}>
                  {card.status === "active" ? "✅ مفعّلة" : "⏳ " + card.status}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={s.noCard}>
            <Text style={s.noCardIcon}>💳</Text>
            <Text style={s.noCardText}>{t.customer.noCard}</Text>
            <TouchableOpacity style={s.createBtn} onPress={() => router.push("/(customer)/create-card")}>
              <Text style={s.createBtnText}>+ {t.customer.createCard}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <TabBar tabs={tabs} activeKey="my-card" />
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    content: { padding: 20, alignItems: "center", gap: 16, paddingBottom: 40 },
    qrContainer: { alignItems: "center", gap: 12 },
    qrBox: {
      backgroundColor: C.card, padding: 20, borderRadius: 24,
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
      borderWidth: 1, borderColor: C.border,
    },
    qrHint: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center" },
    pendingBox: {
      backgroundColor: C.muted, borderRadius: 20, padding: 40, alignItems: "center",
      width: "100%", gap: 12,
    },
    pendingIcon: { fontSize: 56 },
    pendingText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.warning, textAlign: "center" },
    balanceCard: {
      width: "100%", backgroundColor: C.card, borderRadius: 20,
      borderWidth: 1, padding: 18, gap: 12,
    },
    balanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    lastRideBadge: {
      flex: 1, alignItems: "center", borderRadius: 14,
      borderWidth: 1, paddingVertical: 12, paddingHorizontal: 8, marginLeft: 12,
    },
    refreshBtn: {
      alignSelf: "center", paddingVertical: 6, paddingHorizontal: 18,
      borderRadius: 20, backgroundColor: `${C.primary}12`,
      borderWidth: 1, borderColor: `${C.primary}30`,
    },
    infoCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, width: "100%",
      borderWidth: 1, borderColor: C.border,
    },
    infoRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    infoLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
    infoValue: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground },
    cardNumberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    copyBtn: {
      backgroundColor: C.muted, borderRadius: 8, padding: 6,
      borderWidth: 1, borderColor: C.border,
    },
    copyBtnText: { fontSize: 16 },
    noCard: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 60 },
    noCardIcon: { fontSize: 80 },
    noCardText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.mutedForeground },
    createBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 14, paddingHorizontal: 28 },
    createBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
  });
}
