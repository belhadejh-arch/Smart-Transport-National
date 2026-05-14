import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useGetCustomerTransactions } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function CustomerTransactions() {
  const { t, isRTL } = useLanguage();
  const C = colors.light;
  const { data, isLoading } = useGetCustomerTransactions();

  const tabs = [
    { key: "dashboard", icon: "🏠", label: t.customer.dashboard, onPress: () => router.replace("/(customer)/dashboard") },
    { key: "my-card", icon: "💳", label: t.customer.myCard, onPress: () => router.replace("/(customer)/my-card") },
    { key: "transactions", icon: "📋", label: t.customer.transactions, onPress: () => {} },
    { key: "profile", icon: "👤", label: t.customer.profile, onPress: () => router.replace("/(customer)/profile") },
  ];

  const typeIcons: Record<string, string> = { ride: "🚌", topup: "💰" };
  const typeColors: Record<string, string> = { ride: C.destructive, topup: C.success };

  return (
    <View style={styles.screen}>
      <Header title={t.customer.transactions} />
      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {(data?.transactions ?? []).length === 0 ? (
            <Text style={styles.empty}>{t.customer.noTransactions}</Text>
          ) : (
            (data?.transactions ?? []).map((tx, i) => (
              <View key={tx.id ?? i} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: typeColors[tx.type] ?? C.primary }]}>
                  <Text style={styles.icon}>{typeIcons[tx.type] ?? "💳"}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.txType}>{tx.type === "ride" ? "Ride" : "Top Up"}</Text>
                  <Text style={styles.txCardType}>{tx.cardType ?? "-"}</Text>
                  <Text style={styles.txDate}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ""}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === "topup" ? C.success : C.destructive }]}>
                  {tx.type === "topup" ? "+" : "-"}{Number(tx.amount).toFixed(0)} {t.common.dinar}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
      <TabBar tabs={tabs} activeKey="transactions" />
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  loader: { marginTop: 60 },
  scroll: { flex: 1 },
  list: { padding: 12, gap: 8, paddingBottom: 24 },
  card: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: C.border,
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 22 },
  cardBody: { flex: 1 },
  txType: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
  txCardType: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
  txDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
  txAmount: { fontFamily: "Changa_700Bold", fontSize: 16 },
  empty: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", marginTop: 60 },
});
