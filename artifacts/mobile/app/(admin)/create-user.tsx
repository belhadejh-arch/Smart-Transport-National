import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { useCreateUser } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import colors from "@/constants/colors";

type Role = "driver" | "distributor";

export default function CreateUserScreen() {
  const { t, isRTL } = useLanguage();
  const C = colors.light;
  const [role, setRole] = useState<Role>("driver");
  const [form, setForm] = useState({ name: "", lastName: "", email: "", phone: "", password: "", licenseNumber: "" });
  const { mutateAsync: createUser, isPending } = useCreateUser();

  const update = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleCreate() {
    if (!form.name || !form.lastName || !form.email || !form.phone || !form.password) {
      Alert.alert(t.common.error, "All fields required");
      return;
    }
    try {
      await createUser({ data: {
        name: form.name, lastName: form.lastName, email: form.email,
        phone: form.phone, password: form.password, role,
        licenseNumber: role === "driver" ? form.licenseNumber : undefined,
      }});
      Alert.alert(t.common.success, `${role === "driver" ? t.admin.totalDrivers : t.admin.totalDistributors} created`);
      router.back();
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.screen}>
        <Header title={t.admin.createUser} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Role selection */}
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.admin.selectRole}</Text>
          <View style={styles.roleRow}>
            {(["driver", "distributor"] as Role[]).map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
              >
                <Text style={styles.roleIcon}>{r === "driver" ? "🚍" : "🏪"}</Text>
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                  {r === "driver" ? t.admin.driver : t.admin.distributor}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form fields */}
          {[
            { key: "name", label: t.common.name },
            { key: "lastName", label: t.common.lastName },
            { key: "email", label: t.common.email, keyboard: "email-address" },
            { key: "phone", label: t.common.phone, keyboard: "phone-pad" },
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
              <Text style={styles.infoText}>💰 {t.admin.totalDistributors}: 10000 {t.common.dinar}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={isPending}>
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
  content: { padding: 16, paddingBottom: 40 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  roleBtn: {
    flex: 1, backgroundColor: C.muted, borderRadius: 14, padding: 16,
    alignItems: "center", borderWidth: 2, borderColor: "transparent", gap: 6,
  },
  roleBtnActive: { borderColor: C.primary, backgroundColor: C.secondary },
  roleIcon: { fontSize: 28 },
  roleBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.mutedForeground },
  roleBtnTextActive: { color: C.primary },
  field: { marginBottom: 14 },
  label: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, marginBottom: 6 },
  input: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    fontFamily: "Changa_400Regular", fontSize: 16, color: C.foreground,
    borderWidth: 1.5, borderColor: C.border,
  },
  infoBox: {
    backgroundColor: C.secondary, borderRadius: 10, padding: 12, marginBottom: 16,
  },
  infoText: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.primary },
  createBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8,
  },
  createBtnText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
});
