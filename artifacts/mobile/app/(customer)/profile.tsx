import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useChangePassword } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function CustomerProfile() {
  const { t, isRTL } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const C = colors.light;
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { mutateAsync: changePassword, isPending } = useChangePassword();

  const tabs = [
    { key: "dashboard", icon: "🏠", label: t.customer.dashboard, onPress: () => router.replace("/(customer)/dashboard") },
    { key: "my-card", icon: "💳", label: t.customer.myCard, onPress: () => router.replace("/(customer)/my-card") },
    { key: "transactions", icon: "📋", label: t.customer.transactions, onPress: () => router.replace("/(customer)/transactions") },
    { key: "profile", icon: "👤", label: t.customer.profile, onPress: () => {} },
  ];

  async function handleChangePwd() {
    if (!currentPassword || !newPassword) return;
    try {
      await changePassword({ data: { currentPassword, newPassword } });
      Alert.alert(t.common.success, "Password changed");
      setShowPwdModal(false);
      setCurrentPassword(""); setNewPassword("");
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Header title={t.customer.profile} />
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "U"}</Text>
        </View>
        <Text style={styles.name}>{user?.name} {user?.lastName}</Text>
        <Text style={styles.role}>👤 Customer</Text>

        <View style={styles.infoCard}>
          {[
            { label: t.common.email, value: user?.email },
            { label: t.common.phone, value: user?.phone },
          ].map(item => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value ?? "-"}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.pwdBtn} onPress={() => setShowPwdModal(true)}>
          <Text style={styles.pwdBtnText}>🔒 {t.customer.changePassword}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.switchBtn} onPress={switchAccount}>
          <Text style={styles.switchBtnText}>↔ {t.common.switchAccount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Text style={styles.logoutBtnText}>⏻ {t.common.logout}</Text>
        </TouchableOpacity>
      </View>
      <TabBar tabs={tabs} activeKey="profile" />

      <Modal visible={showPwdModal} animationType="slide" transparent onRequestClose={() => setShowPwdModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.customer.changePassword}</Text>
            <TextInput style={styles.modalInput} value={currentPassword} onChangeText={setCurrentPassword} placeholder={t.customer.currentPassword} placeholderTextColor={C.mutedForeground} secureTextEntry />
            <TextInput style={styles.modalInput} value={newPassword} onChangeText={setNewPassword} placeholder={t.customer.newPassword} placeholderTextColor={C.mutedForeground} secureTextEntry />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.primary }]} onPress={handleChangePwd} disabled={isPending}>
              {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>{t.common.save}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.muted }]} onPress={() => setShowPwdModal(false)}>
              <Text style={[styles.modalBtnText, { color: C.mutedForeground }]}>{t.common.cancel}</Text>
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
  content: { flex: 1, padding: 20, alignItems: "center", gap: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginTop: 16 },
  avatarText: { fontFamily: "Changa_700Bold", fontSize: 36, color: "#FFF" },
  name: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground },
  role: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  infoCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, width: "100%", borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  infoValue: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
  pwdBtn: { backgroundColor: C.muted, borderRadius: 12, padding: 14, width: "100%", alignItems: "center" },
  pwdBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.primary },
  switchBtn: { backgroundColor: C.secondary, borderRadius: 12, padding: 14, width: "100%", alignItems: "center" },
  switchBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.primary },
  logoutBtn: { backgroundColor: C.destructive, borderRadius: 12, padding: 14, width: "100%", alignItems: "center" },
  logoutBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  modalTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, marginBottom: 8 },
  modalInput: { backgroundColor: C.input, borderRadius: 10, padding: 12, fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground, borderWidth: 1, borderColor: C.border },
  modalBtn: { borderRadius: 10, padding: 14, alignItems: "center" },
  modalBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: "#FFF" },
});
