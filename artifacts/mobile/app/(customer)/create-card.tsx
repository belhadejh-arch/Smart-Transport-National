import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Image, Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCreateCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import colors from "@/constants/colors";

type CardType = "standard" | "student" | "employee" | "special_needs";

interface UploadedDoc {
  uri: string;
  base64: string | null;
  name: string;
}

const C = colors.light;

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
  const { t } = useLanguage();

  async function handlePress() {
    Alert.alert(t.customer.photoSource, "", [
      {
        text: t.customer.fromGallery,
        onPress: () => pickImage("library"),
      },
      {
        text: t.customer.fromCamera,
        onPress: () => pickImage("camera"),
      },
      { text: t.common.cancel, style: "cancel" },
    ]);
  }

  async function pickImage(source: "library" | "camera") {
    let result: ImagePicker.ImagePickerResult;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: "images",
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    };

    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t.common.error, "Camera permission required");
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t.common.error, "Gallery permission required");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onUpload({
        uri: asset.uri,
        base64: asset.base64 ?? null,
        name: asset.fileName ?? `doc_${Date.now()}.jpg`,
      });
    }
  }

  const uploaded = !!doc;

  return (
    <View style={styles.uploadField}>
      <View style={[styles.uploadLabelRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={[styles.uploadLabel, { textAlign: isRTL ? "right" : "left", flex: 1 }]}>
          {label}
        </Text>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>إلزامي</Text>
        </View>
      </View>
      <Text style={[styles.uploadHint, { textAlign: isRTL ? "right" : "left" }]}>{hint}</Text>

      <TouchableOpacity
        style={[styles.uploadBox, uploaded && styles.uploadBoxDone]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {uploaded ? (
          <View style={styles.uploadedRow}>
            <Image source={{ uri: doc!.uri }} style={styles.thumbImg} />
            <View style={styles.uploadedInfo}>
              <Text style={styles.uploadedCheck}>✓</Text>
              <Text style={styles.uploadedText}>{t.customer.uploaded}</Text>
              <Text style={styles.uploadedSub}>{t.customer.tapToUpload}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.uploadPrompt}>
            <Text style={styles.uploadIcon}>📎</Text>
            <Text style={styles.uploadPromptText}>{t.customer.tapToUpload}</Text>
            {Platform.OS === "web" && (
              <Text style={styles.uploadWebNote}>(Gallery only on web)</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function CreateCard() {
  const { t, isRTL } = useLanguage();
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
    setSpecialDoc(null);
  }

  async function handleCreate() {
    if (!nationalIdDoc) {
      Alert.alert(t.common.error, t.customer.uploadNationalId + " — " + t.customer.documentRequired);
      return;
    }
    if (type !== "standard" && !specialDoc) {
      Alert.alert(t.common.error, getSpecialDocLabel() + " — " + t.customer.documentRequired);
      return;
    }

    const toDataUri = (doc: UploadedDoc) =>
      doc.base64 ? `data:image/jpeg;base64,${doc.base64}` : doc.uri;

    try {
      await createCard({
        data: {
          type,
          nationalId: toDataUri(nationalIdDoc),
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

  const isFormValid = !!nationalIdDoc && (type === "standard" || !!specialDoc);

  return (
    <View style={styles.screen}>
      <Header title={t.customer.createCardTitle} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Card type selector */}
        <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>
          {t.customer.selectType}
        </Text>
        <View style={styles.typeGrid}>
          {cardTypes.map(ct => (
            <TouchableOpacity
              key={ct.key}
              style={[
                styles.typeCard,
                type === ct.key && { borderColor: ct.color, backgroundColor: `${ct.color}15` },
              ]}
              onPress={() => handleTypeChange(ct.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>{ct.icon}</Text>
              <Text style={[styles.typeLabel, type === ct.key && { color: ct.color }]}>{ct.label}</Text>
              <Text style={styles.typeFare}>{ct.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending notice for non-standard */}
        {type !== "standard" && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>⏳ {t.customer.pendingApproval}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>الوثائق المطلوبة</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* National ID — mandatory for ALL types */}
        <UploadField
          label={t.customer.uploadNationalId}
          hint="بطاقة التعريف الوطنية (الوجه الأمامي)"
          doc={nationalIdDoc}
          onUpload={setNationalIdDoc}
          isRTL={isRTL}
        />

        {/* Special doc — mandatory for student / employee / special_needs */}
        {type !== "standard" && (
          <UploadField
            label={getSpecialDocLabel()}
            hint={getSpecialDocHint()}
            doc={specialDoc}
            onUpload={setSpecialDoc}
            isRTL={isRTL}
          />
        )}

        {/* Progress indicator */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, nationalIdDoc && styles.progressDotDone]} />
          {type !== "standard" && (
            <View style={[styles.progressDot, specialDoc && styles.progressDotDone]} />
          )}
          <Text style={styles.progressText}>
            {[nationalIdDoc, type !== "standard" ? specialDoc : true].filter(Boolean).length} /{" "}
            {type === "standard" ? 1 : 2} {" وثيقة"}
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.createBtn, !isFormValid && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={isPending || !isFormValid}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>{t.common.create}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, gap: 16, paddingBottom: 50 },
  sectionLabel: { fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%", backgroundColor: C.card, borderRadius: 16, padding: 16,
    alignItems: "center", gap: 6, borderWidth: 2, borderColor: C.border,
  },
  typeIcon: { fontSize: 32 },
  typeLabel: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.foreground, textAlign: "center" },
  typeFare: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground },
  infoBox: {
    backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#F59E0B",
  },
  infoText: { fontFamily: "Changa_500Medium", fontSize: 13, color: "#92400E" },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.mutedForeground },

  /* Upload field */
  uploadField: { gap: 6 },
  uploadLabelRow: { alignItems: "center", gap: 8 },
  uploadLabel: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.foreground },
  requiredBadge: {
    backgroundColor: "#FEE2E2", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: "#FECACA",
  },
  requiredText: { fontFamily: "Changa_500Medium", fontSize: 11, color: "#DC2626" },
  uploadHint: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
  uploadBox: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 2,
    borderColor: C.border, borderStyle: "dashed", minHeight: 100,
    overflow: "hidden",
  },
  uploadBoxDone: {
    borderColor: C.success, borderStyle: "solid", backgroundColor: `${C.success}08`,
  },
  uploadedRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 14 },
  thumbImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: C.muted },
  uploadedInfo: { flex: 1, gap: 2 },
  uploadedCheck: { fontSize: 24 },
  uploadedText: { fontFamily: "Changa_700Bold", fontSize: 14, color: C.success },
  uploadedSub: { fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground },
  uploadPrompt: { alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  uploadIcon: { fontSize: 36 },
  uploadPromptText: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, textAlign: "center" },
  uploadWebNote: { fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground, textAlign: "center" },

  /* Progress */
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.border },
  progressDotDone: { backgroundColor: C.success },
  progressText: { fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground },

  /* Submit */
  createBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  createBtnDisabled: { backgroundColor: C.muted, shadowOpacity: 0 },
  createBtnText: { fontFamily: "Changa_700Bold", fontSize: 18, color: "#FFF" },
});
