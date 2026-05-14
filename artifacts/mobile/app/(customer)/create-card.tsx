import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { useCreateCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import colors from "@/constants/colors";

type CardType = "standard" | "student" | "employee" | "special_needs";

export default function CreateCard() {
  const { t, isRTL } = useLanguage();
  const C = colors.light;
  const [type, setType] = useState<CardType>("standard");
  const [nationalId, setNationalId] = useState("");
  const [studentId, setStudentId] = useState("");
  const { mutateAsync: createCard, isPending } = useCreateCard();

  const cardTypes: { key: CardType; icon: string; label: string; color: string; desc: string }[] = [
    { key: "standard", icon: "🚌", label: t.customer.cardTypes.standard, color: C.primary, desc: "50 DZD" },
    { key: "student", icon: "🎓", label: t.customer.cardTypes.student, color: "#7C3AED", desc: "35 DZD" },
    { key: "employee", icon: "💼", label: t.customer.cardTypes.employee, color: "#059669", desc: "40 DZD" },
    { key: "special_needs", icon: "♿", label: t.customer.cardTypes.special_needs, color: "#D97706", desc: "40 DZD" },
  ];

  async function handleCreate() {
    if (!nationalId.trim()) {
      Alert.alert(t.common.error, `${t.customer.nationalId} ${t.common.error}`);
      return;
    }
    if (type === "student" && !studentId.trim()) {
      Alert.alert(t.common.error, `${t.customer.studentId} required`);
      return;
    }
    try {
      await createCard({ data: {
        type, nationalId,
        studentId: type === "student" ? studentId : undefined,
      }});
      const msg = type === "standard" ? t.customer.cardActive : t.customer.pendingApproval;
      Alert.alert(t.common.success, msg, [
        { text: t.common.confirm, onPress: () => router.replace("/(customer)/my-card") },
      ]);
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title={t.customer.createCardTitle} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>{t.customer.selectType}</Text>
        <View style={styles.typeGrid}>
          {cardTypes.map(ct => (
            <TouchableOpacity
              key={ct.key}
              style={[styles.typeCard, type === ct.key && { borderColor: ct.color, backgroundColor: `${ct.color}15` }]}
              onPress={() => setType(ct.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>{ct.icon}</Text>
              <Text style={[styles.typeLabel, type === ct.key && { color: ct.color }]}>{ct.label}</Text>
              <Text style={styles.typeFare}>{ct.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info box */}
        {type !== "standard" && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>⏳ {t.customer.pendingApproval}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{t.customer.nationalId}</Text>
          <TextInput
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            value={nationalId}
            onChangeText={setNationalId}
            placeholder={t.customer.nationalId}
            placeholderTextColor={C.mutedForeground}
            keyboardType="numeric"
          />
        </View>

        {type === "student" && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{t.customer.studentId}</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={studentId}
              onChangeText={setStudentId}
              placeholder={t.customer.studentId}
              placeholderTextColor={C.mutedForeground}
            />
          </View>
        )}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={isPending} activeOpacity={0.85}>
          {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>{t.common.create}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  sectionLabel: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%", backgroundColor: C.card, borderRadius: 16, padding: 16,
    alignItems: "center", gap: 6, borderWidth: 2, borderColor: C.border,
  },
  typeIcon: { fontSize: 32 },
  typeLabel: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.foreground, textAlign: "center" },
  typeFare: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
  infoBox: { backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#F59E0B" },
  infoText: { fontFamily: "Changa_500Medium", fontSize: 13, color: "#92400E" },
  field: { gap: 6 },
  fieldLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  input: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    fontFamily: "Changa_400Regular", fontSize: 16, color: C.foreground,
    borderWidth: 1.5, borderColor: C.border,
  },
  createBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  createBtnText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
});
