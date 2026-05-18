import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import {
  useCreateDistributorBalanceRequest,
  useGetDistributorBalanceRequests,
  useGetDistributorDashboard,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { Sounds } from "@/utils/sounds";

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export default function DistributorBalanceRequest() {
  const { C } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [amount, setAmount] = useState("");
  const [phone, setPhone]   = useState(user?.phone ?? "");

  const { data: dashboard } = useGetDistributorDashboard();
  const { data, isLoading, refetch } = useGetDistributorBalanceRequests();
  const { mutateAsync: createRequest, isPending } = useCreateDistributorBalanceRequest();

  const balance = dashboard?.balance ?? 0;
  const hasPendingRequest = (data?.requests ?? []).some(r => r.status === "pending");
  const canRequest = balance === 0 && !hasPendingRequest;

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.distributor.dashboard, onPress: () => router.replace("/(distributor)/dashboard") },
    { key: "scan",      icon: "📷", label: t.distributor.scan,      onPress: () => router.replace("/(distributor)/scan") },
    { key: "profile",   icon: "👤", label: t.distributor.profile,   onPress: () => router.replace("/(distributor)/profile") },
  ];

  const tabs2 = [
    ...tabs.slice(0, 2),
    { key: "balance", icon: "💳", label: "طلب رصيد", onPress: () => {} },
    tabs[2],
  ];

  const statusColor: Record<string, string> = {
    pending:  C.warning,
    approved: C.success,
    rejected: C.destructive,
  };
  const statusLabel: Record<string, string> = {
    pending:  "⏳ قيد المراجعة",
    approved: "✅ تم التحويل",
    rejected: "❌ مرفوض",
  };

  async function handleSubmit() {
    const num = Number(amount);
    if (!num || num <= 0) { Alert.alert("خطأ", "أدخل مبلغاً صحيحاً"); return; }
    if (!phone.trim()) { Alert.alert("خطأ", "رقم الهاتف مطلوب"); return; }

    Alert.alert(
      "تأكيد طلب الرصيد",
      `طلب رصيد بقيمة ${num.toLocaleString()} دج\nرقم الهاتف: ${phone.trim()}\n\nسيتم مراجعة طلبك من قِبل الإدارة وتحويل الرصيد قريباً.`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "إرسال الطلب", onPress: async () => {
          try {
            await createRequest({ data: { amount: num, phone: phone.trim() } });
            Sounds.success();
            refetch();
            setAmount("");
            Alert.alert("✅ تم إرسال الطلب", "سيتم مراجعة طلبك والرد عليه في أقرب وقت. شكراً!");
          } catch (e: any) {
            Sounds.error();
            Alert.alert("خطأ", e?.message ?? "فشل إرسال الطلب");
          }
        }},
      ]
    );
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title="💳 طلب رصيد من المنصة" />

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.accent} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current balance */}
        <View style={[s.balanceBanner, { backgroundColor: balance === 0 ? C.success : C.accent }]}>
          <Text style={s.balanceBannerLabel}>رصيدك الحالي</Text>
          <Text style={s.balanceBannerAmount}>{balance.toLocaleString()} دج</Text>
          {balance > 0 && (
            <Text style={s.balanceBannerNote}>⚠️ لا يمكنك طلب رصيد جديد قبل استنفاد رصيدك الحالي</Text>
          )}
          {balance === 0 && hasPendingRequest && (
            <Text style={s.balanceBannerNote}>⏳ لديك طلب قيد المراجعة — يرجى الانتظار</Text>
          )}
          {canRequest && (
            <Text style={s.balanceBannerNote}>✅ رصيدك صفر — يمكنك إرسال طلب رصيد جديد الآن</Text>
          )}
        </View>

        {/* Request form */}
        {canRequest && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>📋 تفاصيل طلب الرصيد</Text>

            {/* Quick amounts */}
            <Text style={s.fieldLabel}>اختر المبلغ</Text>
            <View style={s.quickRow}>
              {QUICK_AMOUNTS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[s.quickBtn, amount === String(q) && s.quickBtnActive]}
                  onPress={() => setAmount(String(q))}
                  activeOpacity={0.75}
                >
                  <Text style={[s.quickBtnText, amount === String(q) && s.quickBtnTextActive]}>
                    {q >= 1000 ? `${q / 1000}k` : q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>أو أدخل مبلغاً آخر (دج)</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="مثال: 30000"
              placeholderTextColor={C.mutedForeground}
            />

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>رقم هاتفك للتواصل</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="0XXX XXX XXX"
              placeholderTextColor={C.mutedForeground}
            />

            <View style={s.infoBox}>
              <Text style={s.infoBoxText}>
                ℹ️ سيتم التحقق من طلبك من قِبل فريق الإدارة. تأكد من صحة رقم الهاتف للتواصل معك عند الحاجة.
              </Text>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, (!amount || !phone || isPending) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!amount || !phone || isPending}
              activeOpacity={0.85}
            >
              {isPending
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.submitBtnText}>📤 إرسال طلب الرصيد</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Not eligible notice */}
        {!canRequest && !hasPendingRequest && balance > 0 && (
          <View style={s.noticeCard}>
            <Text style={s.noticeIcon}>🔒</Text>
            <Text style={s.noticeTitle}>طلب الرصيد غير متاح حالياً</Text>
            <Text style={s.noticeSub}>
              يمكنك طلب رصيد جديد فقط عند وصول رصيدك إلى الصفر.{"\n"}
              رصيدك الحالي: <Text style={{ color: C.accent, fontFamily: "Changa_700Bold" }}>{balance.toLocaleString()} دج</Text>
            </Text>
          </View>
        )}

        {hasPendingRequest && (
          <View style={[s.noticeCard, { borderColor: C.warning }]}>
            <Text style={s.noticeIcon}>⏳</Text>
            <Text style={s.noticeTitle}>طلبك قيد المراجعة</Text>
            <Text style={s.noticeSub}>سيقوم فريق الإدارة بمراجعة طلبك وتحويل الرصيد قريباً. شكراً على صبرك!</Text>
          </View>
        )}

        {/* History */}
        {(data?.requests ?? []).length > 0 && (
          <>
            <Text style={s.histTitle}>سجل الطلبات</Text>
            {(data?.requests ?? []).map(req => (
              <View key={req.id} style={s.histCard}>
                <View style={s.histTop}>
                  <View>
                    <Text style={s.histAmount}>{req.amount.toLocaleString()} دج</Text>
                    <Text style={s.histPhone}>📞 {req.phone}</Text>
                    <Text style={s.histDate}>{new Date(req.createdAt).toLocaleDateString("ar-DZ")}</Text>
                  </View>
                  <View style={[s.histBadge, { backgroundColor: statusColor[req.status] ?? C.muted }]}>
                    <Text style={s.histBadgeText}>{statusLabel[req.status] ?? req.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <TabBar tabs={tabs2} activeKey="balance" />
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    content: { padding: 16, gap: 14, paddingBottom: 100 },
    balanceBanner: {
      borderRadius: 20, padding: 24, alignItems: "center", gap: 6,
      shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
    },
    balanceBannerLabel: { fontFamily: "Changa_500Medium", fontSize: 13, color: "rgba(255,255,255,0.8)" },
    balanceBannerAmount: { fontFamily: "Changa_700Bold", fontSize: 40, color: "#FFF" },
    balanceBannerNote: { fontFamily: "Changa_400Regular", fontSize: 12, color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: 4 },
    formCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: C.border, gap: 8,
    },
    formTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground, marginBottom: 4 },
    fieldLabel: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground },
    quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    quickBtn: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: C.muted, borderWidth: 1.5, borderColor: C.border,
    },
    quickBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
    quickBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.mutedForeground },
    quickBtnTextActive: { color: "#FFF" },
    input: {
      backgroundColor: C.background, borderRadius: 12, padding: 13,
      fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground,
      borderWidth: 1.5, borderColor: C.border, marginTop: 4,
    },
    infoBox: {
      backgroundColor: `${C.primary}10`, borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: `${C.primary}25`, marginTop: 4,
    },
    infoBoxText: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, lineHeight: 20 },
    submitBtn: {
      backgroundColor: C.primary, borderRadius: 14, padding: 16,
      alignItems: "center", marginTop: 8,
      shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    submitBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
    noticeCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 24,
      alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: C.border,
    },
    noticeIcon: { fontSize: 48 },
    noticeTitle: { fontFamily: "Changa_700Bold", fontSize: 17, color: C.foreground, textAlign: "center" },
    noticeSub: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center", lineHeight: 22 },
    histTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
    histCard: {
      backgroundColor: C.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: C.border,
    },
    histTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    histAmount: { fontFamily: "Changa_700Bold", fontSize: 18, color: C.primary },
    histPhone: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, marginTop: 3 },
    histDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
    histBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    histBadgeText: { fontFamily: "Changa_600SemiBold", fontSize: 11, color: "#FFF" },
  });
}
