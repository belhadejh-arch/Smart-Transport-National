import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, Modal, ActivityIndicator, Switch, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useChangePassword } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TabBar } from "@/components/TabBar";

export default function CustomerProfile() {
  const { t, isRTL } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const { C, isDark, toggleTheme } = useTheme();
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { mutateAsync: changePassword, isPending } = useChangePassword();

  const tabs = [
    { key: "dashboard", icon: "🏠", label: t.customer.dashboard, onPress: () => router.replace("/(customer)/dashboard") },
    { key: "my-card", icon: "💳", label: t.customer.myCard, onPress: () => router.replace("/(customer)/my-card") },
    { key: "transactions", icon: "📋", label: t.customer.transactions, onPress: () => router.replace("/(customer)/transactions") },
    { key: "profile", icon: "👤", label: t.customer.profile, onPress: () => {} },
  ];

  const initials = `${user?.name?.[0] ?? "U"}`.toUpperCase();
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "";

  async function handleChangePwd() {
    if (!currentPassword || !newPassword) {
      Alert.alert(t.common.error, "جميع الحقول مطلوبة");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t.common.error, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    try {
      await changePassword({ data: { currentPassword, newPassword } });
      Alert.alert(t.common.success, "تم تغيير كلمة المرور بنجاح");
      setShowPwdModal(false);
      setCurrentPassword(""); setNewPassword("");
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title={t.customer.profile} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{user?.name} {user?.lastName}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>👤 {t.profileSection.userRole}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t.profileSection.accountInfo}</Text>
          {[
            { icon: "📧", label: t.common.email, value: user?.email ?? "-" },
            { icon: "📱", label: t.common.phone, value: user?.phone ?? "-" },
            { icon: "📅", label: t.profileSection.joinDate, value: joinedDate },
          ].map(item => (
            <View key={item.label} style={s.infoRow}>
              <Text style={{ fontSize: 16, width: 24 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={s.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Dark Mode Toggle */}
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View style={s.toggleLeft}>
              <Text style={{ fontSize: 24 }}>{isDark ? "🌙" : "☀️"}</Text>
              <View>
                <Text style={s.toggleLabel}>{t.profileSection.darkModeLabel}</Text>
                <Text style={s.toggleSub}>{isDark ? t.profileSection.darkModeOn : t.profileSection.darkModeOff}</Text>
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
        <View style={s.card}>
          <TouchableOpacity style={s.actionRow} onPress={() => setShowPwdModal(true)} activeOpacity={0.7}>
            <Text style={{ fontSize: 20, width: 32, textAlign: "center" }}>🔑</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.actionLabel}>{t.customer.changePassword}</Text>
              <Text style={s.actionSub}>{t.profileSection.changePwdHint}</Text>
            </View>
            <Text style={{ fontSize: 22, color: C.mutedForeground }}>›</Text>
          </TouchableOpacity>

          <View style={s.divider} />

          <TouchableOpacity style={s.actionRow} onPress={switchAccount} activeOpacity={0.7}>
            <Text style={{ fontSize: 20, width: 32, textAlign: "center" }}>↔</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.actionLabel}>{t.common.switchAccount}</Text>
              <Text style={s.actionSub}>{t.profileSection.switchHint}</Text>
            </View>
            <Text style={{ fontSize: 22, color: C.mutedForeground }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Support contact */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📞 مراسلة الدعم</Text>
          <Text style={[s.infoLabel, { marginBottom: 10 }]}>تواصل مع فريق الدعم الفني للمساعدة</Text>
          <TouchableOpacity
            style={[s.modalBtn, { backgroundColor: "#2C6B7F", marginBottom: 6 }]}
            onPress={() => { const { Linking } = require("react-native"); Linking.openURL("tel:0774148015"); }}
            activeOpacity={0.85}
          >
            <Text style={s.modalBtnText}>📲 0774148015</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modalBtn, { backgroundColor: "#25D366" }]}
            onPress={() => { const { Linking } = require("react-native"); Linking.openURL("https://wa.me/213774148015"); }}
            activeOpacity={0.85}
          >
            <Text style={s.modalBtnText}>💬 واتساب</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 20 }}>⏻</Text>
          <Text style={s.logoutText}>{t.common.logout}</Text>
        </TouchableOpacity>

        <Text style={s.version}>NQL DZ v1.0</Text>
      </ScrollView>

      <TabBar tabs={tabs} activeKey="profile" />

      {/* Change Password Modal */}
      <Modal visible={showPwdModal} animationType="slide" transparent onRequestClose={() => setShowPwdModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>🔑 {t.customer.changePassword}</Text>
            <TextInput
              style={s.modalInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t.customer.currentPassword}
              placeholderTextColor={C.mutedForeground}
              secureTextEntry
            />
            <TextInput
              style={s.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t.customer.newPassword}
              placeholderTextColor={C.mutedForeground}
              secureTextEntry
            />
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: C.primary }]}
              onPress={handleChangePwd}
              disabled={isPending}
            >
              {isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBtnText}>{t.common.save}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.muted }]} onPress={() => setShowPwdModal(false)}>
              <Text style={[s.modalBtnText, { color: C.mutedForeground }]}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} animationType="fade" transparent onRequestClose={() => setShowLogoutModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { alignItems: "center" }]}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>⚠️</Text>
            <Text style={[s.modalTitle, { textAlign: "center" }]}>تأكيد تسجيل الخروج</Text>
            <Text style={{ fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center", marginBottom: 16 }}>
              سيتم مسح بيانات الجلسة من الجهاز. هل أنت متأكد؟
            </Text>
            <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.destructive, width: "100%" }]} onPress={async () => { setShowLogoutModal(false); await logout(); }}>
              <Text style={s.modalBtnText}>نعم، تسجيل الخروج</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.muted, width: "100%" }]} onPress={() => setShowLogoutModal(false)}>
              <Text style={[s.modalBtnText, { color: C.mutedForeground }]}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    content: { padding: 16, paddingBottom: 100, gap: 14 },
    avatarSection: { alignItems: "center", paddingVertical: 16, gap: 8 },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    avatarText: { fontFamily: "Changa_700Bold", fontSize: 32, color: "#FFF" },
    name: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground },
    roleBadge: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
    roleBadgeText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: "#FFF" },
    card: {
      backgroundColor: C.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: C.border,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cardTitle: { fontFamily: "Changa_700Bold", fontSize: 15, color: C.foreground, marginBottom: 8 },
    infoRow: {
      flexDirection: "row", alignItems: "center", paddingVertical: 10,
      gap: 10, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    infoLabel: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
    infoValue: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    toggleLabel: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    toggleSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
    actionLabel: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    actionSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
    logoutBtn: {
      backgroundColor: C.destructive, borderRadius: 16, padding: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    },
    logoutText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
    version: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: "center", paddingTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40, gap: 10,
    },
    modalTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground },
    modalInput: {
      backgroundColor: C.input, borderRadius: 12, padding: 14,
      fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground,
      borderWidth: 1, borderColor: C.border,
    },
    modalBtn: { borderRadius: 12, padding: 14, alignItems: "center" },
    modalBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: "#FFF" },
  });
}
