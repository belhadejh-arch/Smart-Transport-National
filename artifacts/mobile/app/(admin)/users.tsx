import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from "react-native";
import { router } from "expo-router";
import { useGetAdminUsers, useResetUserPassword, useTopupDistributor, useUpdateUser, useGetAdminDistributorBalances } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

type RoleFilter = "all" | "driver" | "customer" | "distributor";
const FIXED_TOPUP = 10000;

export default function AdminUsers() {
  const { t, isRTL } = useLanguage();
  const { user: authUser } = useAuth();
  const { C } = useTheme();
  const isMainAdmin = authUser?.role === "admin";

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [modalUser, setModalUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [quickId, setQuickId] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [showDistBalances, setShowDistBalances] = useState(false);

  const { data, isLoading, refetch } = useGetAdminUsers({ role: roleFilter === "all" ? undefined : roleFilter });
  const { data: distData, refetch: refetchDist } = useGetAdminDistributorBalances();
  const { mutateAsync: resetPwd } = useResetUserPassword();
  const { mutateAsync: topup } = useTopupDistributor();
  const { mutateAsync: updateUser } = useUpdateUser();

  const tabs = [
    { key: "dashboard",   icon: "📊", label: t.admin.dashboard,   onPress: () => router.replace("/(admin)/dashboard") },
    { key: "users",       icon: "👥", label: t.admin.users,        onPress: () => {} },
    { key: "cards",       icon: "💳", label: t.admin.cards,        onPress: () => isMainAdmin ? router.replace("/(admin)/cards") : Alert.alert("", "غير مصرح للأدمن الفرعي") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals,  onPress: () => isMainAdmin ? router.replace("/(admin)/withdrawals") : Alert.alert("", "غير مصرح للأدمن الفرعي") },
    { key: "profile",     icon: "👤", label: t.admin.profile,      onPress: () => router.replace("/(admin)/profile") },
  ];

  const filters: { key: RoleFilter; label: string }[] = [
    { key: "all",         label: t.common.all },
    { key: "driver",      label: t.admin.totalDrivers },
    { key: "customer",    label: t.admin.totalCustomers },
    { key: "distributor", label: t.admin.totalDistributors },
  ];

  const users = (data?.users ?? []).filter(u =>
    `${u.name} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleResetPwd() {
    if (!isMainAdmin) { Alert.alert("", "غير مصرح للأدمن الفرعي"); return; }
    if (!newPassword.trim()) return;
    try {
      await resetPwd({ id: modalUser.id, data: { newPassword } });
      Alert.alert(t.common.success, "تم تغيير كلمة المرور");
      setNewPassword(""); setModalUser(null);
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleTopup() {
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) return;
    try {
      await topup({ id: modalUser.id, data: { amount } });
      Alert.alert(t.common.success, t.admin.topupBalance);
      setTopupAmount(""); setModalUser(null); refetch();
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleToggleStatus() {
    if (!isMainAdmin) { Alert.alert("", "غير مصرح للأدمن الفرعي"); return; }
    const newStatus = modalUser.status === "active" ? "inactive" : "active";
    try {
      await updateUser({ id: modalUser.id, data: { status: newStatus } });
      Alert.alert(t.common.success, t.common.success);
      setModalUser(null); refetch();
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleQuickTopup() {
    const id = Number(quickId.trim());
    if (!id || id <= 0) { Alert.alert(t.common.error, "أدخل رقم ID صحيح للموزع"); return; }
    Alert.alert("تأكيد الشحن", `إضافة ${FIXED_TOPUP.toLocaleString()} دج لحساب الموزع رقم #${id}`, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: "شحن",
        onPress: async () => {
          setQuickLoading(true);
          try {
            await topup({ id, data: { amount: FIXED_TOPUP } });
            Alert.alert("✅ تم الشحن", `تمت إضافة ${FIXED_TOPUP.toLocaleString()} دج للموزع #${id}`);
            setQuickId(""); refetch(); refetchDist();
          } catch { Alert.alert(t.common.error, "فشل الشحن — تحقق من رقم ID"); }
          finally { setQuickLoading(false); }
        },
      },
    ]);
  }

  const roleColors: Record<string, string> = {
    admin: "#8B5CF6", sub_admin: "#6366F1", driver: C.primary,
    customer: C.success, distributor: C.accent,
  };

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title={t.admin.users} />

      <View style={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} style={[s.filterBtn, roleFilter === f.key && s.filterBtnActive]} onPress={() => setRoleFilter(f.key)}>
            <Text style={[s.filterText, roleFilter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.searchRow}>
        <TextInput style={[s.searchInput, { textAlign: isRTL ? "right" : "left" }]} value={search} onChangeText={setSearch} placeholder={t.common.search} placeholderTextColor={C.mutedForeground} />
      </View>

      <View style={s.quickTopupBox}>
        <Text style={s.quickTopupTitle}>💳 شحن حساب موزع سريع</Text>
        <Text style={s.quickTopupSub}>المبلغ الثابت: <Text style={{ color: C.accent, fontFamily: "Changa_700Bold" }}>{FIXED_TOPUP.toLocaleString()} دج</Text></Text>
        <View style={s.quickTopupRow}>
          <TextInput style={s.quickTopupInput} value={quickId} onChangeText={setQuickId} placeholder="رقم ID الموزع" placeholderTextColor={C.mutedForeground} keyboardType="numeric" returnKeyType="done" onSubmitEditing={handleQuickTopup} />
          <TouchableOpacity style={[s.quickTopupBtn, quickLoading && { opacity: 0.6 }]} onPress={handleQuickTopup} disabled={quickLoading} activeOpacity={0.85}>
            {quickLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.quickTopupBtnText}>شحن</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={s.distBalBtn} onPress={() => { setShowDistBalances(!showDistBalances); if (!showDistBalances) refetchDist(); }} activeOpacity={0.8}>
        <Text style={s.distBalBtnText}>{showDistBalances ? "▲" : "▼"} أرصدة الموزعين</Text>
      </TouchableOpacity>

      {showDistBalances && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 130 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 8 }}>
          {(distData?.distributors ?? []).map((d: any) => (
            <View key={d.id} style={s.distBalCard}>
              <Text style={s.distBalId}>ID: #{d.id}</Text>
              <Text style={s.distBalName}>{d.name} {d.lastName}</Text>
              <Text style={s.distBalAmount}>{Number(d.balance).toLocaleString()} دج</Text>
              <View style={[s.distBalDot, { backgroundColor: d.status === "active" ? C.success : C.destructive }]} />
            </View>
          ))}
          {!(distData?.distributors?.length) && <Text style={{ fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, paddingVertical: 20 }}>لا يوجد موزعون</Text>}
        </ScrollView>
      )}

      <TouchableOpacity style={s.addBtn} onPress={() => router.push("/(admin)/create-user")} activeOpacity={0.85}>
        <Text style={s.addBtnText}>+ {t.admin.createUser}</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={s.loader} />
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.list}>
          {users.map(u => (
            <TouchableOpacity key={u.id} style={s.card} onPress={() => setModalUser(u)} activeOpacity={0.85}>
              <View style={[s.roleDot, { backgroundColor: roleColors[u.role] ?? C.primary }]} />
              <View style={s.cardBody}>
                <Text style={s.userName}>{u.name} {u.lastName}</Text>
                <Text style={s.userEmail}>{u.email}</Text>
                <Text style={s.userPhone}>ID: #{u.id} • {u.phone}</Text>
              </View>
              <View style={s.cardRight}>
                <Text style={[s.roleBadge, { backgroundColor: roleColors[u.role] ?? C.primary }]}>{u.role}</Text>
                {(u.role === "driver" || u.role === "distributor") && (
                  <Text style={s.balance}>{Number(u.balance ?? 0).toFixed(0)} {t.common.dinar}</Text>
                )}
                <Text style={[s.statusBadge, { color: u.status === "active" ? C.success : C.destructive }]}>
                  {u.status === "active" ? t.common.active : t.common.inactive}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {users.length === 0 && <Text style={s.empty}>{t.common.noData}</Text>}
        </ScrollView>
      )}

      <TabBar tabs={tabs} activeKey="users" />

      <Modal visible={!!modalUser} animationType="slide" transparent onRequestClose={() => setModalUser(null)}>
        <View style={s.modalOverlay}>
          <ScrollView style={{ width: "100%" }} contentContainerStyle={s.modalCard}>
            <Text style={s.modalTitle}>{modalUser?.name} {modalUser?.lastName}</Text>
            <Text style={[s.modalSub, { color: C.primary, fontFamily: "Changa_700Bold" }]}>ID: #{modalUser?.id}</Text>
            <Text style={s.modalSub}>{modalUser?.email} • {modalUser?.phone}</Text>
            {modalUser?.licenseNumber && <Text style={s.modalSub}>{t.admin.licenseNumber}: {modalUser.licenseNumber}</Text>}
            <Text style={[s.modalSub, { color: roleColors[modalUser?.role] ?? C.primary, fontFamily: "Changa_600SemiBold" }]}>
              الدور: {modalUser?.role}
            </Text>
            {(modalUser?.role === "driver" || modalUser?.role === "distributor") && (
              <Text style={[s.modalSub, { color: C.success, fontFamily: "Changa_600SemiBold" }]}>
                {t.common.balance}: {Number(modalUser?.balance ?? 0).toFixed(0)} {t.common.dinar}
              </Text>
            )}

            {isMainAdmin && (
              <>
                <Text style={s.modalSection}>{t.admin.resetPassword}</Text>
                <TextInput style={s.modalInput} value={newPassword} onChangeText={setNewPassword} placeholder={t.admin.newPassword} placeholderTextColor={C.mutedForeground} secureTextEntry />
                <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.primary }]} onPress={handleResetPwd}>
                  <Text style={s.modalBtnText}>{t.admin.resetPassword}</Text>
                </TouchableOpacity>
              </>
            )}

            {modalUser?.role === "distributor" && (
              <>
                <Text style={s.modalSection}>{t.admin.topupBalance}</Text>
                <TextInput style={s.modalInput} value={topupAmount} onChangeText={setTopupAmount} placeholder={t.admin.topupAmount} placeholderTextColor={C.mutedForeground} keyboardType="numeric" />
                <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.accent }]} onPress={handleTopup}>
                  <Text style={s.modalBtnText}>{t.admin.topupBalance}</Text>
                </TouchableOpacity>
              </>
            )}

            {isMainAdmin && (
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: modalUser?.status === "active" ? C.destructive : C.success }]} onPress={handleToggleStatus}>
                <Text style={s.modalBtnText}>{modalUser?.status === "active" ? t.common.inactive : t.common.active}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.closeBtn} onPress={() => setModalUser(null)}>
              <Text style={s.closeBtnText}>{t.common.close}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.muted },
    filterBtnActive: { backgroundColor: C.primary },
    filterText: { fontFamily: "Changa_500Medium", fontSize: 12, color: C.mutedForeground },
    filterTextActive: { color: "#FFF" },
    searchRow: { paddingHorizontal: 12, marginBottom: 6 },
    searchInput: { backgroundColor: C.card, borderRadius: 10, padding: 10, fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground, borderWidth: 1, borderColor: C.border },
    quickTopupBox: { marginHorizontal: 12, marginBottom: 8, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: `${C.accent}50`, gap: 6 },
    quickTopupTitle: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground },
    quickTopupSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    quickTopupRow: { flexDirection: "row", gap: 8, marginTop: 2 },
    quickTopupInput: { flex: 1, backgroundColor: C.input, borderRadius: 10, padding: 10, fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground, borderWidth: 1.5, borderColor: C.border, textAlign: "center" },
    quickTopupBtn: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 20, justifyContent: "center", alignItems: "center" },
    quickTopupBtnText: { fontFamily: "Changa_700Bold", fontSize: 15, color: "#FFF" },
    distBalBtn: { marginHorizontal: 12, marginBottom: 6, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    distBalBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.mutedForeground },
    distBalCard: { backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border, minWidth: 120, alignItems: "center", gap: 3 },
    distBalId: { fontFamily: "Changa_500Medium", fontSize: 11, color: C.mutedForeground },
    distBalName: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.foreground, textAlign: "center" },
    distBalAmount: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.accent },
    distBalDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
    addBtn: { marginHorizontal: 12, marginBottom: 8, backgroundColor: C.primary, borderRadius: 10, padding: 10, alignItems: "center" },
    addBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: "#FFF" },
    loader: { marginTop: 60 },
    scroll: { flex: 1 },
    list: { padding: 12, gap: 8, paddingBottom: 24 },
    card: { backgroundColor: C.card, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.border },
    roleDot: { width: 8, height: 8, borderRadius: 4 },
    cardBody: { flex: 1 },
    userName: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.foreground },
    userEmail: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    userPhone: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    cardRight: { alignItems: "flex-end", gap: 4 },
    roleBadge: { fontFamily: "Changa_500Medium", fontSize: 10, color: "#FFF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    balance: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.primary },
    statusBadge: { fontFamily: "Changa_500Medium", fontSize: 10 },
    empty: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", marginTop: 40 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, marginBottom: 4 },
    modalSub: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, marginBottom: 2 },
    modalSection: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground, marginTop: 16, marginBottom: 6 },
    modalInput: { backgroundColor: C.input, borderRadius: 10, padding: 12, fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
    modalBtn: { borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 8 },
    modalBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: "#FFF" },
    closeBtn: { borderRadius: 10, padding: 12, alignItems: "center", backgroundColor: C.muted },
    closeBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.mutedForeground },
  });
}
