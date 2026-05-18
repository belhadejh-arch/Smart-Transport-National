import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Modal,
} from "react-native";
import { router } from "expo-router";
import {
  useGetAdminUsers, useResetUserPassword, useTopupDistributor,
  useUpdateUser, useGetAdminDistributorBalances,
  useResetUserBalance, useDeleteUser,
} from "@workspace/api-client-react";
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

  const [roleFilter, setRoleFilter]     = useState<RoleFilter>("all");
  const [search, setSearch]             = useState("");
  const [modalUser, setModalUser]       = useState<any>(null);
  const [activeTab, setActiveTab]       = useState<"info" | "actions">("info");

  const [newPassword, setNewPassword]   = useState("");
  const [topupAmount, setTopupAmount]   = useState("");
  const [quickId, setQuickId]           = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [showDistBalances, setShowDistBalances] = useState(false);

  // Edit-info state
  const [editName, setEditName]         = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone]       = useState("");
  const [editLicense, setEditLicense]   = useState("");
  const [editLoading, setEditLoading]   = useState(false);

  const { data, isLoading, refetch }          = useGetAdminUsers({ role: roleFilter === "all" ? undefined : roleFilter });
  const { data: distData, refetch: refetchDist } = useGetAdminDistributorBalances();
  const { mutateAsync: resetPwd }             = useResetUserPassword();
  const { mutateAsync: topup }                = useTopupDistributor();
  const { mutateAsync: updateUser }           = useUpdateUser();
  const { mutateAsync: resetBalance }         = useResetUserBalance();
  const { mutateAsync: deleteUser }           = useDeleteUser();

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
    `${u.name} ${u.lastName} ${u.email} ${u.id}`.toLowerCase().includes(search.toLowerCase())
  );

  function openModal(u: any) {
    setModalUser(u);
    setActiveTab("info");
    setEditName(u.name ?? "");
    setEditLastName(u.lastName ?? "");
    setEditPhone(u.phone ?? "");
    setEditLicense(u.licenseNumber ?? "");
    setNewPassword("");
    setTopupAmount("");
  }

  function closeModal() {
    setModalUser(null);
    setNewPassword("");
    setTopupAmount("");
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleEditInfo() {
    setEditLoading(true);
    try {
      await updateUser({ id: modalUser.id, data: {
        name: editName || undefined,
        lastName: editLastName || undefined,
        phone: editPhone || undefined,
        licenseNumber: editLicense || undefined,
      }});
      Alert.alert("✅", "تم تحديث المعلومات بنجاح");
      closeModal(); refetch();
    } catch { Alert.alert(t.common.error, t.common.error); }
    finally { setEditLoading(false); }
  }

  async function handleResetPwd() {
    if (!isMainAdmin) { Alert.alert("", "غير مصرح للأدمن الفرعي"); return; }
    if (!newPassword.trim()) return;
    try {
      await resetPwd({ id: modalUser.id, data: { newPassword } });
      Alert.alert("✅", "تم تغيير كلمة المرور");
      setNewPassword(""); closeModal();
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleTopup() {
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) return;
    try {
      await topup({ id: modalUser.id, data: { amount } });
      Alert.alert("✅", t.admin.topupBalance);
      setTopupAmount(""); closeModal(); refetch();
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleToggleStatus() {
    if (!isMainAdmin) { Alert.alert("", "غير مصرح للأدمن الفرعي"); return; }
    const newStatus = modalUser.status === "active" ? "inactive" : "active";
    const label = newStatus === "inactive" ? "تعطيل" : "تفعيل";
    Alert.alert(`تأكيد ${label}`, `هل تريد ${label} حساب ${modalUser.name}?`, [
      { text: t.common.cancel, style: "cancel" },
      { text: label, style: newStatus === "inactive" ? "destructive" : "default", onPress: async () => {
        try {
          await updateUser({ id: modalUser.id, data: { status: newStatus } });
          Alert.alert("✅", t.common.success);
          closeModal(); refetch();
        } catch { Alert.alert(t.common.error, t.common.error); }
      }},
    ]);
  }

  async function handleResetBalance() {
    if (!isMainAdmin) { Alert.alert("", "غير مصرح للأدمن الفرعي"); return; }
    Alert.alert(
      "⚠️ تصفير الرصيد",
      `هل أنت متأكد من تصفير رصيد ${modalUser.name} ${modalUser.lastName}؟\nالرصيد الحالي: ${Number(modalUser.balance ?? 0).toFixed(0)} دج\n\nهذا الإجراء لا يمكن التراجع عنه!`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: "تصفير الرصيد", style: "destructive",
          onPress: async () => {
            try {
              await resetBalance({ id: modalUser.id });
              Alert.alert("✅", "تم تصفير الرصيد إلى صفر");
              closeModal(); refetch();
            } catch { Alert.alert(t.common.error, t.common.error); }
          },
        },
      ]
    );
  }

  async function handleDeleteUser() {
    if (!isMainAdmin) { Alert.alert("", "غير مصرح للأدمن الفرعي"); return; }
    Alert.alert(
      "🗑️ حذف الحساب",
      `هل أنت متأكد من حذف حساب ${modalUser.name} ${modalUser.lastName} (${modalUser.role})؟\n\nسيتم حذف جميع البيانات المرتبطة به نهائياً!`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: "حذف نهائي", style: "destructive",
          onPress: async () => {
            try {
              await deleteUser({ id: modalUser.id });
              Alert.alert("✅", "تم حذف الحساب بنجاح");
              closeModal(); refetch();
            } catch (e: any) {
              Alert.alert(t.common.error, e?.message ?? "فشل الحذف");
            }
          },
        },
      ]
    );
  }

  async function handleQuickTopup() {
    const id = Number(quickId.trim());
    if (!id || id <= 0) { Alert.alert(t.common.error, "أدخل رقم ID صحيح للموزع"); return; }
    Alert.alert("تأكيد الشحن", `إضافة ${FIXED_TOPUP.toLocaleString()} دج للموزع رقم #${id}`, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: "شحن", onPress: async () => {
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
        <TextInput
          style={[s.searchInput, { textAlign: isRTL ? "right" : "left" }]}
          value={search} onChangeText={setSearch}
          placeholder={`${t.common.search} (الاسم، البريد، ID)`}
          placeholderTextColor={C.mutedForeground}
        />
      </View>

      <View style={s.quickTopupBox}>
        <Text style={s.quickTopupTitle}>💳 شحن حساب موزع سريع</Text>
        <Text style={s.quickTopupSub}>المبلغ الثابت: <Text style={{ color: C.accent, fontFamily: "Changa_700Bold" }}>{FIXED_TOPUP.toLocaleString()} دج</Text></Text>
        <View style={s.quickTopupRow}>
          <TextInput
            style={s.quickTopupInput}
            value={quickId} onChangeText={setQuickId}
            placeholder="رقم ID الموزع" placeholderTextColor={C.mutedForeground}
            keyboardType="numeric" returnKeyType="done"
            onSubmitEditing={handleQuickTopup}
          />
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
          {!(distData?.distributors?.length) && (
            <Text style={{ fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, paddingVertical: 20 }}>لا يوجد موزعون</Text>
          )}
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
            <TouchableOpacity key={u.id} style={s.card} onPress={() => openModal(u)} activeOpacity={0.85}>
              <View style={[s.roleDot, { backgroundColor: roleColors[u.role] ?? C.primary }]} />
              <View style={s.cardBody}>
                <Text style={s.userName}>{u.name} {u.lastName}</Text>
                <Text style={s.userEmail}>{u.email}</Text>
                <Text style={s.userPhone}>ID: #{u.id} • {u.phone}</Text>
              </View>
              <View style={s.cardRight}>
                <View style={[s.rolePill, { backgroundColor: roleColors[u.role] ?? C.primary }]}>
                  <Text style={s.rolePillText}>{u.role}</Text>
                </View>
                {(u.role === "driver" || u.role === "distributor") && (
                  <Text style={s.balance}>{Number(u.balance ?? 0).toFixed(0)} {t.common.dinar}</Text>
                )}
                <Text style={[s.statusDot, { color: u.status === "active" ? C.success : C.destructive }]}>
                  {u.status === "active" ? "● نشط" : "● معطل"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {users.length === 0 && <Text style={s.empty}>{t.common.noData}</Text>}
        </ScrollView>
      )}

      <TabBar tabs={tabs} activeKey="users" />

      {/* ── User Detail Modal ── */}
      <Modal visible={!!modalUser} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {/* Header */}
            <View style={s.modalHeader}>
              <View style={[s.modalAvatar, { backgroundColor: roleColors[modalUser?.role] ?? C.primary }]}>
                <Text style={s.modalAvatarText}>{modalUser?.name?.[0]?.toUpperCase() ?? "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>{modalUser?.name} {modalUser?.lastName}</Text>
                <Text style={s.modalId}>ID: #{modalUser?.id} • <Text style={{ color: roleColors[modalUser?.role] ?? C.primary }}>{modalUser?.role}</Text></Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={s.modalCloseBtn}>
                <Text style={s.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={s.modalTabs}>
              <TouchableOpacity style={[s.modalTab, activeTab === "info" && s.modalTabActive]} onPress={() => setActiveTab("info")}>
                <Text style={[s.modalTabText, activeTab === "info" && s.modalTabTextActive]}>✏️ تعديل المعلومات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalTab, activeTab === "actions" && s.modalTabActive]} onPress={() => setActiveTab("actions")}>
                <Text style={[s.modalTabText, activeTab === "actions" && s.modalTabTextActive]}>⚙️ إجراءات</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {activeTab === "info" ? (
                /* ── Edit Info Tab ── */
                <View style={{ gap: 12 }}>
                  <View style={s.infoBox}>
                    <Text style={s.infoBoxText}>📧 {modalUser?.email}</Text>
                    {(modalUser?.role === "driver" || modalUser?.role === "distributor") && (
                      <Text style={[s.infoBoxText, { color: C.success, fontFamily: "Changa_700Bold" }]}>
                        💰 الرصيد: {Number(modalUser?.balance ?? 0).toFixed(0)} دج
                      </Text>
                    )}
                    <Text style={[s.infoBoxText, { color: modalUser?.status === "active" ? C.success : C.destructive }]}>
                      {modalUser?.status === "active" ? "✅ نشط" : "🔴 معطل"}
                    </Text>
                  </View>

                  {[
                    { label: "الاسم الأول", value: editName, onChange: setEditName },
                    { label: "الاسم الأخير", value: editLastName, onChange: setEditLastName },
                    { label: t.common.phone, value: editPhone, onChange: setEditPhone, keyboard: "phone-pad" as const },
                    ...(modalUser?.role === "driver" ? [{ label: t.admin.licenseNumber, value: editLicense, onChange: setEditLicense }] : []),
                  ].map(f => (
                    <View key={f.label}>
                      <Text style={s.fieldLabel}>{f.label}</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={f.value}
                        onChangeText={f.onChange}
                        keyboardType={(f as any).keyboard ?? "default"}
                        autoCapitalize="none"
                        placeholderTextColor={C.mutedForeground}
                      />
                    </View>
                  ))}

                  <TouchableOpacity style={[s.actionFullBtn, { backgroundColor: C.primary }]} onPress={handleEditInfo} disabled={editLoading} activeOpacity={0.85}>
                    {editLoading ? <ActivityIndicator color="#FFF" /> : <Text style={s.actionFullBtnText}>💾 حفظ التغييرات</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                /* ── Actions Tab ── */
                <View style={{ gap: 10 }}>

                  {/* Reset password — main admin only */}
                  {isMainAdmin && (
                    <View style={s.actionSection}>
                      <Text style={s.actionSectionTitle}>🔑 تغيير كلمة المرور</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={newPassword} onChangeText={setNewPassword}
                        placeholder={t.admin.newPassword}
                        placeholderTextColor={C.mutedForeground}
                        secureTextEntry
                      />
                      <TouchableOpacity style={[s.actionFullBtn, { backgroundColor: C.primary }]} onPress={handleResetPwd} activeOpacity={0.85}>
                        <Text style={s.actionFullBtnText}>{t.admin.resetPassword}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Topup distributor */}
                  {modalUser?.role === "distributor" && (
                    <View style={s.actionSection}>
                      <Text style={s.actionSectionTitle}>💰 شحن رصيد الموزع</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={topupAmount} onChangeText={setTopupAmount}
                        placeholder={t.admin.topupAmount}
                        placeholderTextColor={C.mutedForeground}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity style={[s.actionFullBtn, { backgroundColor: C.accent }]} onPress={handleTopup} activeOpacity={0.85}>
                        <Text style={s.actionFullBtnText}>{t.admin.topupBalance}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Reset balance — main admin only, driver or distributor */}
                  {isMainAdmin && (modalUser?.role === "driver" || modalUser?.role === "distributor") && (
                    <TouchableOpacity style={[s.actionFullBtn, { backgroundColor: C.warning }]} onPress={handleResetBalance} activeOpacity={0.85}>
                      <Text style={s.actionFullBtnText}>🔄 تصفير الرصيد إلى 0</Text>
                    </TouchableOpacity>
                  )}

                  {/* Toggle status — main admin only */}
                  {isMainAdmin && (
                    <TouchableOpacity
                      style={[s.actionFullBtn, { backgroundColor: modalUser?.status === "active" ? "#F59E0B" : C.success }]}
                      onPress={handleToggleStatus}
                      activeOpacity={0.85}
                    >
                      <Text style={s.actionFullBtnText}>
                        {modalUser?.status === "active" ? "⏸ تعطيل الحساب" : "▶ تفعيل الحساب"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete user — main admin only, cannot delete admins */}
                  {isMainAdmin && !["admin", "sub_admin"].includes(modalUser?.role) && (
                    <TouchableOpacity style={[s.actionFullBtn, { backgroundColor: C.destructive }]} onPress={handleDeleteUser} activeOpacity={0.85}>
                      <Text style={s.actionFullBtnText}>🗑️ حذف الحساب نهائياً</Text>
                    </TouchableOpacity>
                  )}

                  {!isMainAdmin && (
                    <View style={s.subAdminNote}>
                      <Text style={s.subAdminNoteText}>🛡️ أنت أدمن فرعي — بعض الإجراءات مقيدة</Text>
                    </View>
                  )}
                </View>
              )}
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
    filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.muted },
    filterBtnActive: { backgroundColor: C.primary },
    filterText: { fontFamily: "Changa_500Medium", fontSize: 12, color: C.mutedForeground },
    filterTextActive: { color: "#FFF" },
    searchRow: { paddingHorizontal: 12, marginBottom: 6 },
    searchInput: {
      backgroundColor: C.card, borderRadius: 10, padding: 10,
      fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground,
      borderWidth: 1, borderColor: C.border,
    },
    quickTopupBox: {
      marginHorizontal: 12, marginBottom: 8, backgroundColor: C.card,
      borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: `${C.accent}50`, gap: 6,
    },
    quickTopupTitle: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground },
    quickTopupSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    quickTopupRow: { flexDirection: "row", gap: 8, marginTop: 2 },
    quickTopupInput: {
      flex: 1, backgroundColor: C.input, borderRadius: 10, padding: 10,
      fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground,
      borderWidth: 1.5, borderColor: C.border, textAlign: "center",
    },
    quickTopupBtn: {
      backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 20,
      justifyContent: "center", alignItems: "center",
    },
    quickTopupBtnText: { fontFamily: "Changa_700Bold", fontSize: 15, color: "#FFF" },
    distBalBtn: {
      marginHorizontal: 12, marginBottom: 6, alignSelf: "flex-start",
      paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    },
    distBalBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.mutedForeground },
    distBalCard: {
      backgroundColor: C.card, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: C.border, minWidth: 120, alignItems: "center", gap: 3,
    },
    distBalId: { fontFamily: "Changa_500Medium", fontSize: 11, color: C.mutedForeground },
    distBalName: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.foreground, textAlign: "center" },
    distBalAmount: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.accent },
    distBalDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
    addBtn: {
      marginHorizontal: 12, marginBottom: 8, backgroundColor: C.primary,
      borderRadius: 10, padding: 10, alignItems: "center",
    },
    addBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: "#FFF" },
    loader: { marginTop: 60 },
    scroll: { flex: 1 },
    list: { padding: 12, gap: 8, paddingBottom: 24 },
    card: {
      backgroundColor: C.card, borderRadius: 14, padding: 14,
      flexDirection: "row", alignItems: "center", gap: 10,
      borderWidth: 1, borderColor: C.border,
    },
    roleDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
    cardBody: { flex: 1, gap: 2 },
    userName: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.foreground },
    userEmail: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    userPhone: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    cardRight: { alignItems: "flex-end", gap: 4 },
    rolePill: {
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    },
    rolePillText: { fontFamily: "Changa_500Medium", fontSize: 10, color: "#FFF" },
    balance: { fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.primary },
    statusDot: { fontFamily: "Changa_500Medium", fontSize: 10 },
    empty: { fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center", marginTop: 40 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      maxHeight: "90%", paddingBottom: 24,
    },
    modalHeader: {
      flexDirection: "row", alignItems: "center", gap: 14,
      padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    modalAvatar: {
      width: 52, height: 52, borderRadius: 26,
      alignItems: "center", justifyContent: "center",
    },
    modalAvatarText: { fontFamily: "Changa_700Bold", fontSize: 22, color: "#FFF" },
    modalTitle: { fontFamily: "Changa_700Bold", fontSize: 17, color: C.foreground },
    modalId: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, marginTop: 2 },
    modalCloseBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: C.muted, alignItems: "center", justifyContent: "center",
    },
    modalCloseBtnText: { fontSize: 14, color: C.mutedForeground },
    modalTabs: {
      flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8,
    },
    modalTab: {
      flex: 1, paddingVertical: 10, borderRadius: 12,
      backgroundColor: C.muted, alignItems: "center",
    },
    modalTabActive: { backgroundColor: C.primary },
    modalTabText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.mutedForeground },
    modalTabTextActive: { color: "#FFF" },
    modalBody: { paddingHorizontal: 16, paddingTop: 16 },

    infoBox: {
      backgroundColor: C.card, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: C.border, gap: 4,
    },
    infoBoxText: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground },
    fieldLabel: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground, marginBottom: 4 },
    fieldInput: {
      backgroundColor: C.card, borderRadius: 10, padding: 12,
      fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground,
      borderWidth: 1.5, borderColor: C.border, marginBottom: 8,
    },
    actionSection: { gap: 6, marginBottom: 4 },
    actionSectionTitle: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    actionFullBtn: {
      borderRadius: 12, padding: 14, alignItems: "center",
      shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    actionFullBtnText: { fontFamily: "Changa_700Bold", fontSize: 15, color: "#FFF" },
    subAdminNote: {
      backgroundColor: C.muted, borderRadius: 10, padding: 12, marginTop: 8,
    },
    subAdminNoteText: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center" },
  });
}
