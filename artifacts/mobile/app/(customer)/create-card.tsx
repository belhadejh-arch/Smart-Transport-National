import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useCreateCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";

type CardType = "standard" | "student" | "employee" | "special_needs";

interface UploadedDoc {
  uri: string;
  base64: string | null;
  name: string;
  mimeType: string | null;
}

function UploadField({
  label,
  hint,
  doc,
  onUpload,
  isRTL,
}: {
  label: string;
  hint: string;
  doc: UploadedDoc | null;
  onUpload: (doc: UploadedDoc) => void;
  isRTL: boolean;
}) {
  const { C } = useTheme();

  async function handlePress() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onUpload({
          uri: asset.uri,
          base64: asset.base64 ?? null,
          name: asset.name,
          mimeType: asset.mimeType ?? null,
        });
      }
    } catch {
      Alert.alert("خطأ", "فشل فتح مدير الملفات");
    }
  }

  const uploaded = !!doc;
  const isPdf = doc?.mimeType === "application/pdf" || doc?.name?.endsWith(".pdf");

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground, flex: 1, textAlign: isRTL ? "right" : "left" }}>
          {label}
        </Text>
        <View style={{ backgroundColor: "#FEE2E2", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: "#FECACA" }}>
          <Text style={{ fontFamily: "Changa_500Medium", fontSize: 11, color: "#DC2626" }}>إلزامي</Text>
        </View>
      </View>
      <Text style={{ fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: isRTL ? "right" : "left" }}>{hint}</Text>

      <TouchableOpacity
        style={{
          backgroundColor: uploaded ? `${C.success}12` : C.card,
          borderRadius: 14, borderWidth: 2,
          borderColor: uploaded ? C.success : C.border,
          borderStyle: uploaded ? "solid" : "dashed",
          minHeight: 90, overflow: "hidden",
        }}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {uploaded ? (
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 10,
              backgroundColor: isPdf ? "#EF44441A" : `${C.success}20`,
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 28 }}>{isPdf ? "📄" : "🖼️"}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: "Changa_700Bold", fontSize: 13, color: C.success }}>✓ تم الرفع</Text>
              <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }} numberOfLines={1}>{doc!.name}</Text>
              <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>اضغط للتغيير</Text>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: "center", justifyContent: "center", padding: 20, gap: 8 }}>
            <Text style={{ fontSize: 32 }}>📂</Text>
            <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.primary }}>فتح مدير الملفات</Text>
            <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, textAlign: "center" }}>
              صورة أو PDF • اضغط للرفع
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function CreateCard() {
  const { t, isRTL } = useLanguage();
  const { C } = useTheme();
  const [type, setType] = useState<CardType>("standard");
  const [nationalIdDoc, setNationalIdDoc] = useState<UploadedDoc | null>(null);
  const [specialDoc, setSpecialDoc] = useState<UploadedDoc | null>(null);
  const { mutateAsync: createCard, isPending } = useCreateCard();

  const cardTypes: { key: CardType; icon: string; label: string; color: string; desc: string }[] = [
    { key: "standard", icon: "🚌", label: t.customer.cardTypes.standard, color: C.primary, desc: "50 دج" },
    { key: "student", icon: "🎓", label: t.customer.cardTypes.student, color: "#7C3AED", desc: "35 دج" },
    { key: "employee", icon: "💼", label: t.customer.cardTypes.employee, color: "#059669", desc: "40 دج" },
    { key: "special_needs", icon: "♿", label: t.customer.cardTypes.special_needs, color: "#D97706", desc: "40 دج" },
  ];

  function getSpecialDocLabel(): string {
    if (type === "student") return t.customer.uploadStudentCert;
    if (type === "employee") return t.customer.uploadWorkCard;
    if (type === "special_needs") return t.customer.uploadDisabilityCert;
    return "";
  }

  function getSpecialDocHint(): string {
    if (type === "student") return "شهادة التسجيل أو بطاقة الطالب";
    if (type === "employee") return "شهادة العمل أو بطاقة الموظف";
    if (type === "special_needs") return "وثيقة تثبت الحالة الخاصة";
    return "";
  }

  function handleTypeChange(newType: CardType) {
    setType(newType);
    setNationalIdDoc(null);
    setSpecialDoc(null);
  }

  async function handleCreate() {
    if (type !== "standard") {
      if (!nationalIdDoc) {
        Alert.alert(t.common.error, t.customer.uploadNationalId + " — " + t.customer.documentRequired);
        return;
      }
      if (!specialDoc) {
        Alert.alert(t.common.error, getSpecialDocLabel() + " — " + t.customer.documentRequired);
        return;
      }
    }

    const toDataUri = (doc: UploadedDoc) =>
      doc.base64 ? `data:${doc.mimeType ?? "image/jpeg"};base64,${doc.base64}` : doc.uri;

    try {
      await createCard({
        data: {
          type,
          nationalId: nationalIdDoc ? toDataUri(nationalIdDoc) : undefined,
          documentUrl: nationalIdDoc ? toDataUri(nationalIdDoc) : undefined,
          schoolCertUrl: type === "student" && specialDoc ? toDataUri(specialDoc) : undefined,
          workCardUrl: type === "employee" && specialDoc ? toDataUri(specialDoc) : undefined,
          disabilityCertUrl: type === "special_needs" && specialDoc ? toDataUri(specialDoc) : undefined,
        },
      });
      const msg = type === "standard" ? t.customer.cardActive : t.customer.pendingApproval;
      Alert.alert(t.common.success, msg, [
        { text: t.common.confirm, onPress: () => router.replace("/(customer)/my-card") },
      ]);
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.common.error);
    }
  }

  const isFormValid = type === "standard"
    ? true
    : !!nationalIdDoc && !!specialDoc;

  const needsDocs = type !== "standard";
  const docsUploaded = needsDocs ? (nationalIdDoc ? 1 : 0) + (specialDoc ? 1 : 0) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Header title={t.customer.createCardTitle} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">

        {/* Card type selector */}
        <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground, textAlign: isRTL ? "right" : "left" }}>
          {t.customer.selectType}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {cardTypes.map(ct => (
            <TouchableOpacity
              key={ct.key}
              style={{
                width: "47%", borderRadius: 16, padding: 16,
                alignItems: "center", gap: 6, borderWidth: 2,
                borderColor: type === ct.key ? ct.color : C.border,
                backgroundColor: type === ct.key ? `${ct.color}12` : C.card,
              }}
              onPress={() => handleTypeChange(ct.key)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 32 }}>{ct.icon}</Text>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: type === ct.key ? ct.color : C.foreground, textAlign: "center" }}>
                {ct.label}
              </Text>
              <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>{ct.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Standard card — no docs needed */}
        {type === "standard" && (
          <View style={{ backgroundColor: `${C.success}12`, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: `${C.success}40` }}>
            <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.success, textAlign: isRTL ? "right" : "left" }}>
              ✓ البطاقة العادية لا تحتاج وثائق — ستُفعَّل فوراً
            </Text>
          </View>
        )}

        {/* Non-standard — pending notice + docs */}
        {type !== "standard" && (
          <>
            <View style={{ backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#F59E0B" }}>
              <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: "#92400E" }}>
                ⏳ {t.customer.pendingApproval}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.mutedForeground }}>الوثائق المطلوبة</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            </View>

            {/* National ID */}
            <UploadField
              label={t.customer.uploadNationalId}
              hint="بطاقة التعريف الوطنية (الوجه الأمامي)"
              doc={nationalIdDoc}
              onUpload={setNationalIdDoc}
              isRTL={isRTL}
            />

            {/* Special doc */}
            <UploadField
              label={getSpecialDocLabel()}
              hint={getSpecialDocHint()}
              doc={specialDoc}
              onUpload={setSpecialDoc}
              isRTL={isRTL}
            />

            {/* Progress */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: nationalIdDoc ? C.success : C.border }} />
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: specialDoc ? C.success : C.border }} />
              <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground }}>
                {docsUploaded} / 2 وثيقة
              </Text>
            </View>
          </>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={{
            backgroundColor: isFormValid ? C.primary : C.muted,
            borderRadius: 14, padding: 16, alignItems: "center",
            shadowColor: isFormValid ? C.primary : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isFormValid ? 0.3 : 0,
            shadowRadius: 8, elevation: isFormValid ? 6 : 0,
          }}
          onPress={handleCreate}
          disabled={isPending || !isFormValid}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: isFormValid ? "#FFF" : C.mutedForeground }}>
              {t.common.create}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
