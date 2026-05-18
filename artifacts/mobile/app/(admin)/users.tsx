import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetAdminUsers, useResetUserPassword, useTopupDistributor, useUpdateUser } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

type RoleFilter = "all" | "driver" | "customer" | "distributor";

export default function AdminUsers() {
  const { t, isRTL } = useLanguage();
  const C = colors.light;
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [modalUser, setModalUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [topupAmount, setTopupAmount] = useState("");

  const { data, isLoading, refetch } = useGetAdminUsers({ role: roleFilter === "all" ? undefined : roleFilter });
  const { mutateAsync: resetPwd } = useResetUserPassword();
  const { mutateAsync: topup } = useTopupDistributor();
  const { mutateAsync: updateUser } = useUpdateUser();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.admin.dashboard, onPress: () => router.replace("/(admin)/dashboard") },
    { key: "users", icon: "👥", label: t.admin.users, onPress: () => {} },
    { key: "cards", icon: "💳", label: t.admin.cards, onPress: () => router.replace("/(admin)/cards") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals, onPress: () => router.replace("/(admin)/withdrawals") },
    { key: "profile", icon: "👤", label: t.admin.profile, onPress: () => router.replace("/(admin)/profile") },
  ];

  const filters: { key: RoleFilter; label: string }[] = [
    { key: "all", label: t.common.all },
    { key: "driver", label: t.admin.totalDrivers },
    { key: "customer", label: t.admin.totalCustomers },
    { key: "distributor", label: t.admin.totalDistributors },
  ];

  const users = (data?.users ?? []).filter(u =>
    `${u.name} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleResetPwd() {
    if (!newPassword.trim()) return;
    try {
      await resetPwd({ id: modalUser.id, data: { newPassword } });
      Alert.alert(t.common.success, "Password reset");
      setNewPassword("");
      setModalUser(null);
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleTopup() {
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) return;
    try {
      await topup({ id: modalUser.id, data: { amount } });
      Alert.alert(t.common.success, t.admin.topupBalance);
      setTopupAmount("");
      setModalUser(null);
      refetch();
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  async function handleToggleStatus() {
    const newStatus = modalUser.status === "active" ? "inactive" : "active";
    try {
      await updateUser({ id: modalUser.id, data: { status: newStatus } });
      Alert.alert(t.common.success, t.common.success);
      setModalUser(null);
      refetch();
    } catch { Alert.alert(t.common.error, t.common.error); }
  }

  const roleColors: Record<string, string> = { admin: "#8B5CF6", driver: C.primary, customer: C.success, distributor: C.accent };

  return (
    <View style={styles.screen}>
      <Header title={t.admin.users} />
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, roleFilter === f.key && styles.filterBtnActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text style={[styles.filterText, roleFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { textAlign: isRTL ? "right" : "left" }]}
          value={search}
          onChangeText={setSearch}
          placeholder={t.common.search}
          placeholderTextColor={C.mutedForeground}
        />
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(admin)/create-user")} activeOpacity={0.85}>
        <Text style={styles.addBtnText}>+ {t.admin.createUser}</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color={C.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          {users.map(u => (
            <TouchableOpacity key={u.id} style={styles.card} onPress={() => setModalUser(u)} activeOpacity={0.85}>
              <View style={[styles.roleDot, { backgroundColor: roleColors[u.role] ?? C.primary }]} />
              <View style={styles.cardBody}>
                <Text style={styles.userName}>{u.name} {u.lastName}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <Text style={styles.userPhone}>{u.phone}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.roleBadge, { backgroundColor: roleColors[u.role] ?? C.primary }]}>{u.role}</Text>
                {(u.role === "driver" || u.role === "distributor") && (
                  <Text style={styles.balance}>{Number(u.balance ?? 0).toFixed(0)} {t.common.dinar}</Text>
                )}
                <Text style={[styles.statusBadge, { color: u.status === "active" ? C.success : C.destructive }]}>
                  {u.status === "active" ? t.common.active : t.common.inactive}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {users.length === 0 && <Text style={styles.empty}>{t.common.noData}</Text>}
        </ScrollView>
      )}

      <TabBar tabs={tabs} activeKey="users" />

      {/* User detail modal */}
      <Modal visible={!!modalUser} animationType="slide" transparent onRequestClose={() => setModalUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalUser?.name} {modalUser?.lastName}</Text>
            <Text style={styles.modalSub}>{modalUser?.email} • {modalUser?.phone}</Text>
            {modalUser?.licenseNumber && <Text style={styles.modalSub}>{t.admin.licenseNumber}: {modalUser.licenseNumber}</Text>}

            {/* Reset password */}
            <Text style={styles.modalSection}>{t.admin.resetPassword}</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t.admin.newPassword}
              placeholderTextColor={C.mutedForeground}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.primary }]} onPress={handleResetPwd}>
              <Text style={styles.modalBtnText}>{t.admin.resetPassword}</Text>
            </TouchableOpacity>

            {/* Distributor topup */}
            {modalUser?.role === "distributor" && (
              <>
                <Text style={styles.modalSection}>{t.admin.topupBalance}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={topupAmount}
                  onChangeText={setTopupAmount}
                  placeholder={t.admin.topupAmount}
                  placeholderTextColor={C.mutedForeground}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.accent }]} onPress={handleTopup}>
                  <Text style={styles.modalBtnText}>{t.admin.topupBalance}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: modalUser?.status === "active" ? C.destructive : C.success }]} onPress={handleToggleStatus}>
              <Text style={styles.modalBtnText}>{modalUser?.status === "active" ? t.common.inactive : t.common.active}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalUser(null)}>
              <Text style={styles.closeBtnText}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
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
  addBtn: {
    marginHorizontal: 12, marginBottom: 8,
    backgroundColor: C.primary, borderRadius: 10, padding: 10, alignItems: "center",
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
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, marginBottom: 4 },
  modalSub: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, marginBottom: 2 },
  modalSection: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground, marginTop: 16, marginBottom: 6 },
  modalInput: {
    backgroundColor: C.input, borderRadius: 10, padding: 12,
    fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  modalBtn: { borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 8 },
  modalBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: "#FFF" },
  closeBtn: { borderRadius: 10, padding: 12, alignItems: "center", backgroundColor: C.muted },
  closeBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.mutedForeground },
});
