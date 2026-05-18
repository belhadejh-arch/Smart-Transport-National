import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Modal, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import {
  useGetAdminUsers, useCreateDriverPayment,
  useGetAdminDriverPayments,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { printAndShareReceipt } from "@/utils/receipt";

export default function AdminDriverPayments() {
  const { C } = useTheme();
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const isMainAdmin = authUser?.role === "admin";

  const [showNewModal, setShowNewModal]   = useState(false);
  const [selDriver, setSelDriver]         = useState<any>(null);
  const [amount, setAmount]               = useState("");
  const [note, setNote]                   = useState("");
  const [creating, setCreating]           = useState(false);
  const [driverFilter, setDriverFilter]   = useState<number | undefined>();
  const [search, setSearch]               = useState("");
  const [driverSearch, setDriverSearch]   = useState("");
  const [showDriverPicker, setShowDriverPicker] = useState(false);

  const { data: usersData }       = useGetAdminUsers({ role: "driver" });
  const { data, isLoading, refetch } = useGetAdminDriverPayments(
    driverFilter ? { driverId: driverFilter } : {}
  );
  const { mutateAsync: createPayment } = useCreateDriverPayment();

  const tabs = [
    { key: "dashboard",   icon: "📊", label: t.admin.dashboard,   onPress: () => router.replace("/(admin)/dashboard") },
    { key: "users",       icon: "👥", label: t.admin.users,        onPress: () => router.replace("/(admin)/users") },
    { key: "cards",       icon: "💳", label: t.admin.cards,        onPress: () => router.replace("/(admin)/cards") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals,  onPress: () => router.replace("/(admin)/withdrawals") },
    { key: "profile",     icon: "👤", label: t.admin.profile,      onPress: () => router.replace("/(admin)/profile") },
  ];

  const allDrivers = (usersData?.users ?? []);
  const filteredDrivers = allDrivers.filter(d =>
    `${d.name} ${d.lastName} ${d.id}`.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const payments = (data?.payments ?? []).filter(p =>
    `${p.driverName} ${p.driverLastName} ${p.receiptNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() {
    if (!isMainAdmin) { Alert.alert("", "الأدمن الفرعي لا يملك صلاحية إنشاء دفعات"); return; }
    setSelDriver(null); setAmount(""); setNote("");
    setDriverSearch(""); setShowDriverPicker(false);
    setShowNewModal(true);
  }

  async function handleCreate() {
    if (!selDriver) { Alert.alert("خطأ", "اختر السائق أولاً"); return; }
    const num = Number(amount);
    if (!num || num <= 0) { Alert.alert("خطأ", "أدخل مبلغاً صحيحاً"); return; }

    Alert.alert(
      "تأكيد التحويل",
      `خصم ${num.toLocaleString()} دج من حساب\n${selDriver.name} ${selDriver.lastName}\nالرصيد الحالي: ${Number(selDriver.balance).toFixed(0)} دج`,
      [
        { text: t.common.cancel, style: "cancel" },
        { text: "تأكيد التحويل", style: "default", onPress: async () => {
          setCreating(true);
          try {
            const payment = await createPayment({ id: selDriver.id, data: { amount: num, note: note || undefined } });
            setShowNewModal(false);
            refetch();
            Alert.alert(
              "✅ تم التحويل بنجاح",
              `رقم الوصل: ${payment.receiptNumber}\nالمبلغ: ${num.toLocaleString()} دج`,
              [
                { text: "تحميل الوصل PDF", onPress: () => printAndShareReceipt({
                  receiptNumber: payment.receiptNumber,
                  driverName: payment.driverName ?? selDriver.name,
                  driverLastName: payment.driverLastName ?? selDriver.lastName,
                  driverEmail: payment.driverEmail ?? selDriver.email,
                  amount: payment.amount,
                  note: payment.note,
                  adminName: payment.adminName ?? authUser?.name,
                  createdAt: payment.createdAt,
                })},
                { text: "إغلاق" },
              ]
            );
          } catch (e: any) {
            Alert.alert("خطأ", e?.message ?? "فشل التحويل");
          } finally {
            setCreating(false);
          }
        }},
      ]
    );
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title="💸 دفعات السائقين" />

      {/* Stats bar */}
      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{data?.total ?? 0}</Text>
          <Text style={s.statLabel}>إجمالي العمليات</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: C.accent }]}>{(data?.totalAmount ?? 0).toLocaleString()}</Text>
          <Text style={s.statLabel}>إجمالي المدفوعات (دج)</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="بحث بالاسم أو رقم الوصل..."
          placeholderTextColor={C.mutedForeground}
        />
        <TouchableOpacity
          style={[s.filterDriverBtn, driverFilter !== undefined && { backgroundColor: C.primary }]}
          onPress={() => {
            if (driverFilter !== undefined) { setDriverFilter(undefined); }
            else { setShowDriverPicker(true); }
          }}
        >
          <Text style={[s.filterDriverText, driverFilter !== undefined && { color: "#FFF" }]}>
            {driverFilter ? `سائق #${driverFilter} ✕` : "فلتر سائق"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.newBtn} onPress={openNew} activeOpacity={0.85}>
        <Text style={s.newBtnText}>+ تسجيل دفعة جديدة</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.primary} />}
        >
          {payments.length === 0 && (
            <Text style={s.empty}>لا توجد دفعات مسجّلة</Text>
          )}
          {payments.map(p => (
            <View key={p.id} style={s.card}>
              <View style={s.cardTop}>
                <View>
                  <Text style={s.cardDriver}>{p.driverName} {p.driverLastName}</Text>
                  <Text style={s.cardReceipt}>{p.receiptNumber}</Text>
                  <Text style={s.cardDate}>{new Date(p.createdAt).toLocaleDateString("ar-DZ")} • {new Date(p.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}</Text>
                  {p.note && <Text style={s.cardNote}>📝 {p.note}</Text>}
                </View>
                <View style={s.cardRight}>
                  <Text style={s.cardAmount}>{p.amount.toLocaleString()}</Text>
                  <Text style={s.cardCurrency}>دج</Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.receiptBtn}
                onPress={() => printAndShareReceipt({
                  receiptNumber: p.receiptNumber,
                  driverName: p.driverName ?? "",
                  driverLastName: p.driverLastName ?? "",
                  driverEmail: p.driverEmail ?? undefined,
                  amount: p.amount,
                  note: p.note,
                  adminName: p.adminName ?? undefined,
                  createdAt: p.createdAt,
                })}
                activeOpacity={0.8}
              >
                <Text style={s.receiptBtnText}>📄 تحميل الوصل PDF</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 12 }} />
        </ScrollView>
      )}

      <TabBar tabs={tabs} activeKey="withdrawals" />

      {/* ── New Payment Modal ── */}
      <Modal visible={showNewModal} animationType="slide" transparent onRequestClose={() => setShowNewModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>💸 تسجيل دفعة لسائق</Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
              {/* Driver picker */}
              <Text style={s.fieldLabel}>اختر السائق</Text>
              {selDriver ? (
                <TouchableOpacity style={s.selectedDriver} onPress={() => setSelDriver(null)}>
                  <View>
                    <Text style={s.selectedDriverName}>{selDriver.name} {selDriver.lastName}</Text>
                    <Text style={s.selectedDriverSub}>الرصيد: {Number(selDriver.balance).toFixed(0)} دج • #ID {selDriver.id}</Text>
                  </View>
                  <Text style={{ color: C.destructive, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <TextInput
                    style={s.input}
                    value={driverSearch}
                    onChangeText={setDriverSearch}
                    placeholder="ابحث عن السائق بالاسم أو ID..."
                    placeholderTextColor={C.mutedForeground}
                    autoFocus
                  />
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    {filteredDrivers.slice(0, 12).map(d => (
                      <TouchableOpacity
                        key={d.id}
                        style={s.driverPickItem}
                        onPress={() => { setSelDriver(d); setDriverSearch(""); }}
                        activeOpacity={0.75}
                      >
                        <Text style={s.driverPickName}>{d.name} {d.lastName}</Text>
                        <Text style={s.driverPickSub}>رصيد: {Number(d.balance).toFixed(0)} دج • #ID {d.id}</Text>
                      </TouchableOpacity>
                    ))}
                    {filteredDrivers.length === 0 && (
                      <Text style={s.empty}>لا يوجد سائق بهذا الاسم</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Amount */}
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>المبلغ (دج)</Text>
              <TextInput
                style={s.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="أدخل المبلغ المراد خصمه"
                placeholderTextColor={C.mutedForeground}
              />
              {selDriver && amount && Number(amount) > Number(selDriver.balance) && (
                <Text style={s.balanceWarning}>⚠️ المبلغ يتجاوز رصيد السائق ({Number(selDriver.balance).toFixed(0)} دج)</Text>
              )}

              {/* Note */}
              <Text style={[s.fieldLabel, { marginTop: 12 }]}>ملاحظة (اختياري)</Text>
              <TextInput
                style={[s.input, { minHeight: 72, textAlignVertical: "top" }]}
                value={note}
                onChangeText={setNote}
                placeholder="مثال: دفعة شهر مايو 2025..."
                placeholderTextColor={C.mutedForeground}
                multiline
              />

              <TouchableOpacity
                style={[s.createBtn, (creating || !selDriver || !amount) && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={creating || !selDriver || !amount}
                activeOpacity={0.85}
              >
                {creating
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={s.createBtnText}>✓ تأكيد الخصم وإنشاء الوصل</Text>
                }
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Driver filter picker modal */}
      <Modal visible={showDriverPicker} animationType="slide" transparent onRequestClose={() => setShowDriverPicker(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { maxHeight: "60%" }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>اختر سائقاً للفلتر</Text>
              <TouchableOpacity onPress={() => setShowDriverPicker(false)} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              {allDrivers.map(d => (
                <TouchableOpacity key={d.id} style={s.driverPickItem} onPress={() => { setDriverFilter(d.id); setShowDriverPicker(false); }} activeOpacity={0.75}>
                  <Text style={s.driverPickName}>{d.name} {d.lastName}</Text>
                  <Text style={s.driverPickSub}>رصيد: {Number(d.balance).toFixed(0)} دج • #ID {d.id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    statsBar: {
      flexDirection: "row", backgroundColor: C.card, marginHorizontal: 12,
      marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border,
    },
    statItem: { flex: 1, alignItems: "center" },
    statDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 8 },
    statValue: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.primary },
    statLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
    filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10, gap: 8 },
    searchInput: {
      flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 10,
      fontFamily: "Changa_400Regular", fontSize: 13, color: C.foreground,
      borderWidth: 1, borderColor: C.border,
    },
    filterDriverBtn: {
      backgroundColor: C.muted, borderRadius: 10, paddingHorizontal: 12,
      justifyContent: "center", borderWidth: 1, borderColor: C.border,
    },
    filterDriverText: { fontFamily: "Changa_500Medium", fontSize: 12, color: C.mutedForeground },
    newBtn: {
      marginHorizontal: 12, marginTop: 10, marginBottom: 4,
      backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: "center",
      shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },
    newBtnText: { fontFamily: "Changa_700Bold", fontSize: 15, color: "#FFF" },
    scroll: { flex: 1 },
    list: { padding: 12, gap: 10, paddingBottom: 24 },
    empty: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", marginTop: 40 },
    card: {
      backgroundColor: C.card, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: C.border, gap: 10,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    cardDriver: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
    cardReceipt: { fontFamily: "Changa_500Medium", fontSize: 11, color: C.primary, marginTop: 2 },
    cardDate: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, marginTop: 2 },
    cardNote: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, marginTop: 4 },
    cardRight: { alignItems: "flex-end" },
    cardAmount: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.destructive },
    cardCurrency: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground },
    receiptBtn: {
      backgroundColor: `${C.primary}15`, borderRadius: 10, padding: 10,
      alignItems: "center", borderWidth: 1, borderColor: `${C.primary}30`,
    },
    receiptBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.primary },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      maxHeight: "92%", paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    modalTitle: { fontFamily: "Changa_700Bold", fontSize: 18, color: C.foreground },
    closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
    closeBtnText: { fontSize: 14, color: C.mutedForeground },
    fieldLabel: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground, marginBottom: 6 },
    input: {
      backgroundColor: C.card, borderRadius: 12, padding: 12,
      fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground,
      borderWidth: 1.5, borderColor: C.border, marginBottom: 4,
    },
    selectedDriver: {
      backgroundColor: `${C.primary}12`, borderRadius: 12, padding: 14,
      borderWidth: 1.5, borderColor: C.primary, flexDirection: "row",
      justifyContent: "space-between", alignItems: "center", marginBottom: 4,
    },
    selectedDriverName: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground },
    selectedDriverSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, marginTop: 2 },
    driverPickItem: {
      backgroundColor: C.card, borderRadius: 10, padding: 12, marginBottom: 6,
      borderWidth: 1, borderColor: C.border,
    },
    driverPickName: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    driverPickSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, marginTop: 2 },
    balanceWarning: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.destructive, marginTop: 4, marginBottom: 4 },
    createBtn: {
      backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 16,
      shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    createBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
  });
}
