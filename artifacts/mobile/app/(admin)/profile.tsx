import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch, Modal, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://nqldz.onrender.com";

export default function AdminProfile() {
  const { t, isRTL } = useLanguage();
  const { user, token, logout, refreshUser } = useAuth();
  const { C, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const [currentPwdEmail, setCurrentPwdEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.admin.dashboard, onPress: () => router.replace("/(admin)/dashboard") },
    { key: "users", icon: "👥", label: t.admin.users, onPress: () => router.replace("/(admin)/users") },
    { key: "cards", icon: "💳", label: t.admin.cards, onPress: () => router.replace("/(admin)/cards") },
    { key: "withdrawals", icon: "💰", label: t.admin.withdrawals, onPress: () => router.replace("/(admin)/withdrawals") },
    { key: "profile", icon: "👤", label: t.admin.profile, onPress: () => {} },
  ];

  const initials = `${user?.name?.[0] ?? "A"}${user?.lastName?.[0] ?? "D"}`.toUpperCase();
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "";

  async function handleChangePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Toast.show({ type: "error", text1: t.common.error, text2: "All fields required" });
      return;
    }
    if (newPwd !== confirmPwd) {
      Toast.show({ type: "error", text1: t.common.error, text2: "Passwords do not match" });
      return;
    }
    if (newPwd.length < 6) {
      Toast.show({ type: "error", text1: t.common.error, text2: "Password must be at least 6 characters" });
      return;
    }
    setPwdLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Failed");
      Toast.show({ type: "success", text1: t.common.success, text2: "Password changed successfully" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setShowPwdModal(false);
    } catch (e: any) {
      Toast.show({ type: "error", text1: t.common.error, text2: e.message });
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleChangeEmail() {
    if (!currentPwdEmail || !newEmail) {
      Toast.show({ type: "error", text1: t.common.error, text2: "All fields required" });
      return;
    }
    setEmailLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/change-email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwdEmail, newEmail }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Failed");
      Toast.show({ type: "success", text1: t.common.success, text2: "Email updated successfully" });
      await refreshUser();
      setCurrentPwdEmail(""); setNewEmail("");
      setShowEmailModal(false);
    } catch (e: any) {
      Toast.show({ type: "error", text1: t.common.error, text2: e.message });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleLogout() {
    setShowLogoutModal(false);
    await logout();
  }

  const styles = makeStyles(C, isRTL);

  return (
    <View style={styles.screen}>
      <Header title={t.admin.profile} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name} {user?.lastName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>👑 Admin</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.profileSection.accountInfo}</Text>
          <InfoRow label={t.common.email} value={user?.email ?? ""} icon="📧" C={C} />
          <InfoRow label={t.common.phone} value={user?.phone ?? ""} icon="📱" C={C} />
          <InfoRow label={t.profileSection.joinDate} value={joinedDate} icon="📅" C={C} />
          <InfoRow label={t.profileSection.accountStatus} value={user?.status === "active" ? t.profileSection.activeStatus : t.profileSection.inactiveStatus} icon="🔵" C={C} />
        </View>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Dark Mode Toggle */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>{isDark ? "🌙" : "☀️"}</Text>
              <View>
                <Text style={styles.toggleLabel}>{t.profileSection.darkModeLabel}</Text>
                <Text style={styles.toggleSub}>{isDark ? t.profileSection.darkModeOn : t.profileSection.darkModeOff}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor={isDark ? C.accent : "#FFF"}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>الإعدادات</Text>

          <TouchableOpacity style={styles.actionRow} onPress={() => setShowPwdModal(true)} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>🔑</Text>
            <View style={styles.actionBody}>
              <Text style={styles.actionLabel}>تغيير كلمة المرور</Text>
              <Text style={styles.actionSub}>حماية حسابك بكلمة مرور جديدة</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={() => setShowEmailModal(true)} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>✉️</Text>
            <View style={styles.actionBody}>
              <Text style={styles.actionLabel}>تغيير البريد الإلكتروني</Text>
              <Text style={styles.actionSub}>{user?.email}</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutIcon}>⏻</Text>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <Text style={styles.version}>NQL DZ v1.0 • الإدارة</Text>
      </ScrollView>

      <TabBar tabs={tabs} activeKey="profile" />

      {/* Change Password Modal */}
      <Modal visible={showPwdModal} animationType="slide" transparent onRequestClose={() => setShowPwdModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔑 تغيير كلمة المرور</Text>
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور الحالية"
              placeholderTextColor={C.mutedForeground}
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
            />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور الجديدة"
              placeholderTextColor={C.mutedForeground}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
            />
            <TextInput
              style={styles.input}
              placeholder="تأكيد كلمة المرور الجديدة"
              placeholderTextColor={C.mutedForeground}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.primary }]}
              onPress={handleChangePassword}
              disabled={pwdLoading}
            >
              {pwdLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>تغيير كلمة المرور</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.muted }]} onPress={() => { setShowPwdModal(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }}>
              <Text style={[styles.modalBtnText, { color: C.mutedForeground }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Email Modal */}
      <Modal visible={showEmailModal} animationType="slide" transparent onRequestClose={() => setShowEmailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✉️ تغيير البريد الإلكتروني</Text>
            <Text style={styles.modalSub}>البريد الحالي: {user?.email}</Text>
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور الحالية للتحقق"
              placeholderTextColor={C.mutedForeground}
              secureTextEntry
              value={currentPwdEmail}
              onChangeText={setCurrentPwdEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني الجديد"
              placeholderTextColor={C.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.primary }]}
              onPress={handleChangeEmail}
              disabled={emailLoading}
            >
              {emailLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>تحديث البريد</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.muted }]} onPress={() => { setShowEmailModal(false); setCurrentPwdEmail(""); setNewEmail(""); }}>
              <Text style={[styles.modalBtnText, { color: C.mutedForeground }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} animationType="fade" transparent onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: "center" }]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
            <Text style={[styles.modalTitle, { textAlign: "center" }]}>تأكيد تسجيل الخروج</Text>
            <Text style={[styles.modalSub, { textAlign: "center", marginBottom: 20 }]}>
              سيتم مسح جميع بيانات الجلسة من الجهاز. هل أنت متأكد من الخروج؟
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.destructive, width: "100%" }]}
              onPress={handleLogout}
            >
              <Text style={styles.modalBtnText}>نعم، تسجيل الخروج</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.muted, width: "100%" }]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: C.mutedForeground }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value, icon, C }: { label: string; value: string; icon: string; C: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>{label}</Text>
        <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground }}>{value}</Text>
      </View>
    </View>
  );
}

function makeStyles(C: any, isRTL: boolean) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100, gap: 14 },
    avatarSection: { alignItems: "center", paddingVertical: 20, gap: 8 },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    avatarText: { fontFamily: "Changa_700Bold", fontSize: 28, color: "#FFF" },
    userName: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground },
    roleBadge: {
      backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 4,
      borderRadius: 20,
    },
    roleBadgeText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: "#FFF" },
    card: {
      backgroundColor: C.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: C.border,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    cardTitle: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground, marginBottom: 8 },
    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    toggleIcon: { fontSize: 24 },
    toggleLabel: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    toggleSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
    actionIcon: { fontSize: 20, width: 32, textAlign: "center" },
    actionBody: { flex: 1 },
    actionLabel: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    actionSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    actionChevron: { fontSize: 22, color: C.mutedForeground },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
    logoutBtn: {
      backgroundColor: C.destructive, borderRadius: 16, padding: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    },
    logoutIcon: { fontSize: 20 },
    logoutText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
    version: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: "center", paddingTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40, gap: 10,
    },
    modalTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground },
    modalSub: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground },
    input: {
      backgroundColor: C.input, borderRadius: 12, padding: 14,
      fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground,
      borderWidth: 1, borderColor: C.border, textAlign: isRTL ? "right" : "left",
    },
    modalBtn: { borderRadius: 12, padding: 14, alignItems: "center" },
    modalBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: "#FFF" },
  });
}
