import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function DistributorProfile() {
  const { t } = useLanguage();
  const { user, logout, switchAccount } = useAuth();
  const C = colors.light;

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.distributor.dashboard, onPress: () => router.replace("/(distributor)/dashboard") },
    { key: "scan", icon: "📷", label: t.distributor.scan, onPress: () => router.replace("/(distributor)/scan") },
    { key: "profile", icon: "👤", label: t.distributor.profile, onPress: () => {} },
  ];

  function confirmLogout() {
    Alert.alert(t.common.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.confirm, onPress: logout, style: "destructive" },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Header title={t.distributor.profile} />
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: C.accent }]}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "D"}</Text>
        </View>
        <Text style={styles.name}>{user?.name} {user?.lastName}</Text>
        <Text style={styles.role}>🏪 {t.admin.distributor}</Text>

        <View style={styles.infoCard}>
          {[
            { label: "🪪 ID", value: `#${user?.id ?? "-"}` },
            { label: t.common.email, value: user?.email },
            { label: t.common.phone, value: user?.phone },
            { label: t.common.balance, value: `${Number(user?.balance ?? 0).toFixed(0)} ${t.common.dinar}` },
          ].map(item => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value ?? "-"}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.switchBtn} onPress={switchAccount}>
          <Text style={styles.switchBtnText}>↔ {t.common.switchAccount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Text style={styles.logoutBtnText}>⏻ {t.common.logout}</Text>
        </TouchableOpacity>
      </View>
      <TabBar tabs={tabs} activeKey="profile" />
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { flex: 1, padding: 20, alignItems: "center", gap: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginTop: 16 },
  avatarText: { fontFamily: "Changa_700Bold", fontSize: 36, color: "#FFF" },
  name: { fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground },
  role: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  infoCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, width: "100%", borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  infoValue: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
  switchBtn: { backgroundColor: C.secondary, borderRadius: 12, padding: 14, width: "100%", alignItems: "center" },
  switchBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.primary },
  logoutBtn: { backgroundColor: C.destructive, borderRadius: 12, padding: 14, width: "100%", alignItems: "center" },
  logoutBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" },
});
