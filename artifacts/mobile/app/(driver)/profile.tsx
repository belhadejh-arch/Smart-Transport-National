import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, Linking, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function DriverProfile() {
  const { t } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const { C, isDark, toggleTheme } = useTheme();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan", icon: "📷", label: t.driver.scan, onPress: () => router.replace("/(driver)/scan") },
    { key: "trips", icon: "🚍", label: t.driver.trips, onPress: () => router.replace("/(driver)/trips") },
    { key: "withdraw", icon: "💰", label: t.driver.withdraw, onPress: () => router.replace("/(driver)/withdraw") },
    { key: "profile", icon: "👤", label: t.driver.profile, onPress: () => {} },
  ];

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  const s = makeStyles(C);

  return (
    <View style={s.screen}>
      <Header title={t.driver.profile} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "D"}</Text>
        </View>
        <Text style={s.name}>{user?.name} {user?.lastName}</Text>
        <Text style={s.role}>🚍 {t.admin.driver}</Text>

        <View style={s.infoCard}>
          {[
            { label: t.common.email, value: user?.email },
            { label: t.common.phone, value: user?.phone },
            ...(user?.licenseNumber ? [{ label: t.admin.licenseNumber, value: user.licenseNumber }] : []),
          ].map(item => (
            <View key={item.label} style={s.infoRow}>
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={s.infoValue}>{item.value ?? "-"}</Text>
            </View>
          ))}

          <View style={s.themeRow}>
            <Text style={s.infoLabel}>{isDark ? `🌙 ${t.profileSection.darkModeLabel}` : `☀️ ${t.profileSection.darkModeLabel}`}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor={isDark ? C.accent : "#FFF"}
            />
          </View>
        </View>

        <View style={s.note}>
          <Text style={s.noteText}>🔒 {t.customer.changePassword} — {t.admin.resetPassword}</Text>
        </View>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Support contact */}
        <View style={s.supportCard}>
          <Text style={s.supportTitle}>{t.support.title}</Text>
          <Text style={s.supportSub}>{t.support.subtitle}</Text>
          <TouchableOpacity
            style={s.supportBtn}
            onPress={() => Linking.openURL("tel:0774148015")}
            activeOpacity={0.85}
          >
            <Text style={s.supportBtnText}>📲 0774148015</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.whatsappBtn}
            onPress={() => Linking.openURL("https://wa.me/213774148015")}
            activeOpacity={0.85}
          >
            <Text style={s.whatsappBtnText}>💬 {t.support.whatsapp}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.switchBtn} onPress={switchAccount} activeOpacity={0.85}>
          <Text style={s.switchBtnText}>↔ {t.common.switchAccount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
          <Text style={s.logoutBtnText}>⏻ {t.common.logout}</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
      <TabBar tabs={tabs} activeKey="profile" />
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.background },
    content: { flex: 1, padding: 20, alignItems: "center", gap: 12 },
    avatar: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
      marginTop: 16,
    },
    avatarText: { fontFamily: "Changa_700Bold", fontSize: 36, color: "#FFF" },
    name: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground },
    role: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
    infoCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, width: "100%",
      borderWidth: 1, borderColor: C.border, gap: 0,
    },
    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    infoLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
    infoValue: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
    themeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
    note: { backgroundColor: C.muted, borderRadius: 10, padding: 12, width: "100%" },
    noteText: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: "center" },
    supportCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, width: "100%",
      borderWidth: 1.5, borderColor: `${C.primary}40`, gap: 8, alignItems: "center",
    },
    supportTitle: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
    supportSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: "center" },
    supportBtn: {
      backgroundColor: C.primary, borderRadius: 12, padding: 13, width: "100%", alignItems: "center",
    },
    supportBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
    whatsappBtn: {
      backgroundColor: "#25D366", borderRadius: 12, padding: 12, width: "100%", alignItems: "center",
    },
    whatsappBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: "#FFF" },
    switchBtn: {
      backgroundColor: C.secondary, borderRadius: 12, padding: 14, width: "100%", alignItems: "center",
    },
    switchBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.primary },
    logoutBtn: {
      backgroundColor: C.destructive, borderRadius: 12, padding: 14, width: "100%", alignItems: "center",
    },
    logoutBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" },
  });
}
