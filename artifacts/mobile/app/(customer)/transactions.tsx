import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useGetCustomerTransactions, useGetCustomerCards } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { generateAndSharePDF } from "@/utils/pdfReport";

export default function CustomerTransactions() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { C } = useTheme();
  const { data, isLoading } = useGetCustomerTransactions();
  const { data: cardData } = useGetCustomerCards();
  const [pdfLoading, setPdfLoading] = useState(false);

  const tabs = [
    { key: "dashboard",    icon: "🏠", label: t.customer.dashboard,    onPress: () => router.replace("/(customer)/dashboard") },
    { key: "my-card",      icon: "💳", label: t.customer.myCard,        onPress: () => router.replace("/(customer)/my-card") },
    { key: "transactions", icon: "📋", label: t.customer.transactions,  onPress: () => {} },
    { key: "profile",      icon: "👤", label: t.customer.profile,       onPress: () => router.replace("/(customer)/profile") },
  ];

  const txs = data?.transactions ?? [];
  const card = cardData?.cards?.[0];

  const typeIcons: Record<string, string>  = { ride: "🚌", topup: "💰" };
  const typeColors: Record<string, string> = { ride: C.destructive, topup: C.success };

  const totalSpent  = txs.filter(tx => tx.type === "ride").reduce((s, tx) => s + Number(tx.amount), 0);
  const totalTopup  = txs.filter(tx => tx.type === "topup").reduce((s, tx) => s + Number(tx.amount), 0);

  async function handlePDF() {
    if (!txs.length) { Alert.alert("", "لا توجد عمليات لتصديرها"); return; }
    setPdfLoading(true);
    try {
      await generateAndSharePDF({
        title: "كشف حساب المستخدم",
        subtitle: "سجل الرحلات والشحن",
        userName: `${user?.name ?? ""} ${user?.lastName ?? ""}`,
        generatedAt: new Date().toLocaleString("ar-DZ"),
        summary: [
          { label: "الرصيد الحالي",    value: `${Number(card?.balance ?? 0).toFixed(0)} دج` },
          { label: "إجمالي الرحلات",   value: `${txs.filter(tx => tx.type === "ride").length} رحلة` },
          { label: "إجمالي المدفوع",   value: `${totalSpent.toFixed(0)} دج` },
          { label: "إجمالي الشحن",     value: `${totalTopup.toFixed(0)} دج` },
          { label: "رقم البطاقة",      value: card?.cardNumber ?? "-" },
          { label: "نوع البطاقة",      value: card?.type ?? "-" },
        ],
        rows: txs.map(tx => ({
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleString("ar-DZ") : "",
          description: tx.type === "ride" ? `رحلة • ${tx.cardType ?? ""}` : "شحن رصيد",
          amount: `${tx.type === "topup" ? "+" : "-"}${Number(tx.amount).toFixed(0)} دج`,
          type: tx.type === "topup" ? "credit" : "debit",
        })),
      });
    } catch {
      Alert.alert(t.common.error, "فشل إنشاء التقرير");
    } finally {
      setPdfLoading(false);
    }
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header
        title={t.customer.transactions}
        right={
          <TouchableOpacity style={s.pdfBtn} onPress={handlePDF} disabled={pdfLoading}>
            {pdfLoading
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={s.pdfBtnText}>📄 PDF</Text>
            }
          </TouchableOpacity>
        }
      />
      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={s.loader} />
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.list}>
          {txs.length > 0 && (
            <View style={s.summaryStrip}>
              <View style={s.summaryItem}>
                <Text style={s.summaryVal}>{txs.filter(x => x.type === "ride").length}</Text>
                <Text style={s.summaryLbl}>رحلة</Text>
              </View>
              <View style={s.summaryDiv} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryVal, { color: C.destructive }]}>{totalSpent.toFixed(0)}</Text>
                <Text style={s.summaryLbl}>مدفوع (دج)</Text>
              </View>
              <View style={s.summaryDiv} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryVal, { color: C.success }]}>{totalTopup.toFixed(0)}</Text>
                <Text style={s.summaryLbl}>شحن (دج)</Text>
              </View>
            </View>
          )}

          {txs.length === 0 ? (
            <Text style={s.empty}>{t.customer.noTransactions}</Text>
          ) : (
            txs.map((tx, i) => (
              <View key={(tx as any).id ?? i} style={s.card}>
                <View style={[s.iconBox, { backgroundColor: typeColors[tx.type] ?? C.primary }]}>
                  <Text style={s.icon}>{typeIcons[tx.type] ?? "💳"}</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.txType}>{tx.type === "ride" ? "رحلة" : "شحن رصيد"}</Text>
                  <Text style={s.txCardType}>{tx.cardType ?? "-"}</Text>
                  <Text style={s.txDate}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString("ar-DZ") : ""}</Text>
                </View>
                <Text style={[s.txAmount, { color: tx.type === "topup" ? C.success : C.destructive }]}>
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

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    loader: { marginTop: 60 },
    pdfBtn: {
      backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    pdfBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: "#FFF" },
    summaryStrip: {
      flexDirection: "row", backgroundColor: C.card, borderRadius: 12,
      padding: 14, borderWidth: 1, borderColor: C.border, alignItems: "center",
    },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryVal: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.primary },
    summaryLbl: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
    summaryDiv: { width: 1, height: 36, backgroundColor: C.border },
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
}
