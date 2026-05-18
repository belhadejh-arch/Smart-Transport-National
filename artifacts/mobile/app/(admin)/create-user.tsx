import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { useCreateUser } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import colors from "@/constants/colors";

type Role = "driver" | "distributor" | "sub_admin";

export default function CreateUserScreen() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const C = colors.light;
  const isMainAdmin = user?.role === "admin";

  const [role, setRole] = useState<Role>("driver");
  const [form, setForm] = useState({ name: "", lastName: "", email: "", phone: "", password: "", licenseNumber: "" });
  const { mutateAsync: createUser, isPending } = useCreateUser();

  const update = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleCreate() {
    if (!form.name || !form.lastName || !form.email || !form.phone || !form.password) {
      Alert.alert(t.common.error, "جميع الحقول مطلوبة");
      return;
    }
    if (role === "sub_admin" && !isMainAdmin) {
      Alert.alert(t.common.error, "فقط الأدمن الرئيسي يمكنه إنشاء أدمن فرعي");
      return;
    }
    try {
      await createUser({ data: {
        name: form.name, lastName: form.lastName, email: form.email,
        phone: form.phone, password: form.password, role,
        licenseNumber: role === "driver" ? form.licenseNumber : undefined,
      }});
      const label = role === "driver" ? "السائق" : role === "distributor" ? "الموزع" : "الأدمن الفرعي";
      Alert.alert(t.common.success, `تم إنشاء حساب ${label} بنجاح`);
      router.back();
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  const roleOptions: { key: Role; icon: string; label: string; desc: string; adminOnly?: boolean }[] = [
    { key: "driver",      icon: "🚍", label: t.admin.driver,       desc: "يقوم بمسح البطاقات وتحصيل الأجرة" },
    { key: "distributor", icon: "🏪", label: t.admin.distributor,  desc: "يشحن رصيد بطاقات المستخدمين" },
    ...(isMainAdmin ? [{ key: "sub_admin" as Role, icon: "🛡️", label: "أدمن فرعي", desc: "صلاحيات محدودة • لا يرى الأرباح المالية" }] : []),
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.screen}>
        <Header title={t.admin.createUser} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Role selection */}
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.admin.selectRole}</Text>
          <View style={styles.roleGrid}>
            {roleOptions.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
                onPress={() => setRole(r.key)}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleBtnText, role === r.key && styles.roleBtnTextActive]}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sub-admin info banner */}
          {role === "sub_admin" && (
            <View style={styles.subAdminBanner}>
              <Text style={styles.subAdminBannerTitle}>🛡️ صلاحيات الأدمن الفرعي</Text>
              <Text style={styles.subAdminBannerItem}>✅ إضافة سائقين وموزعين</Text>
              <Text style={styles.subAdminBannerItem}>✅ شحن رصيد الموزعين</Text>
              <Text style={styles.subAdminBannerItem}>✅ عرض أرصدة الموزعين</Text>
              <Text style={styles.subAdminBannerItem}>✅ عرض قائمة المستخدمين</Text>
              <Text style={[styles.subAdminBannerItem, { color: C.destructive }]}>❌ لا يرى أرباح المنصة المالية</Text>
              <Text style={[styles.subAdminBannerItem, { color: C.destructive }]}>❌ لا يمكنه تغيير كلمات المرور</Text>
              <Text style={[styles.subAdminBannerItem, { color: C.destructive }]}>❌ لا يمكنه تعطيل الحسابات</Text>
            </View>
          )}

          {/* Form fields */}
          {[
            { key: "name",     label: t.common.name },
            { key: "lastName", label: t.common.lastName },
            { key: "email",    label: t.common.email,    keyboard: "email-address" },
            { key: "phone",    label: t.common.phone,    keyboard: "phone-pad" },
            { key: "password", label: t.common.password, secure: true },
            ...(role === "driver" ? [{ key: "licenseNumber", label: t.admin.licenseNumber }] : []),
          ].map((f: any) => (
            <View key={f.key} style={styles.field}>
              <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{f.label}</Text>
              <TextInput
                style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
                value={form[f.key as keyof typeof form]}
                onChangeText={update(f.key as keyof typeof form)}
                keyboardType={f.keyboard ?? "default"}
                secureTextEntry={f.secure}
                autoCapitalize="none"
                placeholder={f.label}
                placeholderTextColor={C.mutedForeground}
              />
            </View>
          ))}

          {role === "distributor" && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>💰 رصيد البداية للموزع: 10,000 {t.common.dinar}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={isPending} activeOpacity={0.85}>
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>{t.common.create}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 40, gap: 4 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  roleBtn: {
    width: "47%", backgroundColor: C.muted, borderRadius: 14, padding: 14,
    alignItems: "center", borderWidth: 2, borderColor: "transparent", gap: 4,
  },
  roleBtnActive: { borderColor: C.primary, backgroundColor: C.secondary },
  roleIcon: { fontSize: 26 },
  roleBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.mutedForeground, textAlign: "center" },
  roleBtnTextActive: { color: C.primary },
  roleDesc: { fontFamily: "Changa_400Regular", fontSize: 10, color: C.mutedForeground, textAlign: "center" },
  subAdminBanner: {
    backgroundColor: "#F0F9FF", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#BAE6FD", marginBottom: 12, gap: 4,
  },
  subAdminBannerTitle: { fontFamily: "Changa_700Bold", fontSize: 14, color: "#0369A1", marginBottom: 6 },
  subAdminBannerItem: { fontFamily: "Changa_400Regular", fontSize: 12, color: "#374151" },
  field: { marginBottom: 14 },
  label: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, marginBottom: 6 },
  input: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    fontFamily: "Changa_400Regular", fontSize: 16, color: C.foreground,
    borderWidth: 1.5, borderColor: C.border,
  },
  infoBox: { backgroundColor: C.secondary, borderRadius: 10, padding: 12, marginBottom: 12 },
  infoText: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.primary },
  createBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  createBtnText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
});
