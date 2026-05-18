import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { useGetCustomerCards } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function MyCard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const C = colors.light;
  const { data, isLoading } = useGetCustomerCards();
  const card = data?.cards?.[0];

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
    Alert.alert("✓", "تم نسخ رقم البطاقة");
  }

  return (
    <View style={styles.screen}>
      <Header title={t.customer.myCard} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 60 }} />
        ) : card ? (
          <>
            {/* QR Code */}
            {card.status === "active" ? (
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <QRCode
                    value={card.cardNumber}
                    size={220}
                    color={C.foreground}
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrHint}>{t.driver.scanInstruction}</Text>
              </View>
            ) : (
              <View style={styles.pendingBox}>
                <Text style={styles.pendingIcon}>⏳</Text>
                <Text style={styles.pendingText}>
                  {card.status === "pending" ? t.customer.pendingApproval : `Status: ${card.status}`}
                </Text>
              </View>
            )}

            {/* Card info */}
            <View style={[styles.infoCard, { borderLeftColor: cardTypeColors[card.type] ?? C.primary, borderLeftWidth: 4 }]}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.common.type}</Text>
                <Text style={styles.infoValue}>
                  {t.customer.cardTypes[card.type as keyof typeof t.customer.cardTypes] ?? card.type}
                </Text>
              </View>

              {/* Card number row with copy button */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.customer.cardNumber}</Text>
                <View style={styles.cardNumberRow}>
                  <Text style={[styles.infoValue, { fontFamily: "Changa_400Regular", letterSpacing: 2 }]}>
                    {card.cardNumber}
                  </Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={copyCardNumber} activeOpacity={0.7}>
                    <Text style={styles.copyBtnText}>📋</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.common.balance}</Text>
                <Text style={[styles.infoValue, { color: C.success, fontSize: 18 }]}>
                  {Number(card.balance).toFixed(0)} {t.common.dinar}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>{t.common.status}</Text>
                <Text style={[styles.infoValue, { color: card.status === "active" ? C.success : C.warning }]}>{card.status}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noCard}>
            <Text style={styles.noCardIcon}>💳</Text>
            <Text style={styles.noCardText}>{t.customer.noCard}</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push("/(customer)/create-card")}>
              <Text style={styles.createBtnText}>+ {t.customer.createCard}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <TabBar tabs={tabs} activeKey="my-card" />
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, alignItems: "center", gap: 20, paddingBottom: 40 },
  qrContainer: { alignItems: "center", gap: 12 },
  qrBox: {
    backgroundColor: "#FFF", padding: 20, borderRadius: 24,
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
  infoCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, width: "100%",
    borderWidth: 1, borderColor: C.border,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
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
