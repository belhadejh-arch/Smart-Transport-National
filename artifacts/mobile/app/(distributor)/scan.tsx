import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useDistributorScanCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

const AMOUNTS = [
  { value: 100,   profit: 5 },
  { value: 200,   profit: 10 },
  { value: 500,   profit: 20 },
  { value: 1000,  profit: 30 },
  { value: 2000,  profit: 100 },
  { value: 3000,  profit: 200 },
  { value: 4000,  profit: 300 },
  { value: 5000,  profit: 400 },
  { value: 10000, profit: 700 },
];

export default function DistributorScan() {
  const { t } = useLanguage();
  const { C } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedCard, setScannedCard] = useState("");
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCard, setManualCard] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(AMOUNTS[3]);
  const [result, setResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const { mutateAsync: scan } = useDistributorScanCard();
  const cooldown = useRef(false);

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.distributor.dashboard, onPress: () => router.replace("/(distributor)/dashboard") },
    { key: "scan", icon: "📷", label: t.distributor.scan, onPress: () => {} },
    { key: "profile", icon: "👤", label: t.distributor.profile, onPress: () => router.replace("/(distributor)/profile") },
  ];

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned || cooldown.current) return;
    cooldown.current = true;
    setScanned(true);
    setScannedCard(data.trim());
    setShowManual(false);
    setShowAmountModal(true);
  }, [scanned]);

  function openManual() {
    setShowManual(true);
  }

  function handleManualConfirm() {
    const card = manualCard.trim();
    if (!card) return;
    setScannedCard(card);
    setShowManual(false);
    setShowAmountModal(true);
  }

  async function handleTopup() {
    if (!selectedAmount || processing) return;
    setShowAmountModal(false);
    setProcessing(true);
    try {
      const res = await scan({ data: { cardNumber: scannedCard, amount: selectedAmount.value } });
      setResult({ ...res, profit: res.profit ?? selectedAmount.profit });
      setShowResult(true);
    } catch (e: any) {
      setResult({ success: false, error: e?.message ?? t.distributor.insufficientBalance });
      setShowResult(true);
    } finally {
      setProcessing(false);
    }
  }

  function handleCancelAmount() {
    setShowAmountModal(false);
    setScanned(false);
    setScannedCard("");
    cooldown.current = false;
  }

  function handleClose() {
    setShowResult(false);
    setResult(null);
    setScanned(false);
    setScannedCard("");
    setManualCard("");
    cooldown.current = false;
  }

  /* ── Permission required ── */
  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Header title={t.distributor.scanTitle} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
          <Text style={{ fontSize: 72 }}>📷</Text>
          <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: C.foreground, textAlign: "center" }}>
            نحتاج إذن الكاميرا
          </Text>
          <Text style={{ fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center" }}>
            لمسح رموز QR لبطاقات المستخدمين
          </Text>
          {!permission && (
            <ActivityIndicator color={C.accent} />
          )}
          {permission && !permission.granted && (
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 14, padding: 16, paddingHorizontal: 40 }}
              onPress={requestPermission}
            >
              <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>السماح بالكاميرا</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openManual}>
            <Text style={{ fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, textDecorationLine: "underline" }}>
              أو أدخل رقم البطاقة يدوياً
            </Text>
          </TouchableOpacity>
        </View>
        <TabBar tabs={tabs} activeKey="scan" />
        <ManualModal visible={showManual} value={manualCard} onChange={setManualCard} onSubmit={handleManualConfirm} onClose={() => setShowManual(false)} C={C} />
        <AmountModal visible={showAmountModal} selected={selectedAmount} onSelect={setSelectedAmount} onConfirm={handleTopup} onCancel={handleCancelAmount} processing={processing} C={C} />
        <ResultModal visible={showResult} result={result} onClose={handleClose} C={C} />
      </View>
    );
  }

  /* ── Camera scanner ── */
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Header title={t.distributor.scanTitle} />

      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
            <View style={{ flexDirection: "row", height: 260 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
              {/* Scan box */}
              <View style={{ width: 260, height: 260, position: "relative" }}>
                <View style={{ position: "absolute", top: 0, left: 0, width: 32, height: 32, borderColor: "#D4A24E", borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 }} />
                <View style={{ position: "absolute", top: 0, right: 0, width: 32, height: 32, borderColor: "#D4A24E", borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 }} />
                <View style={{ position: "absolute", bottom: 0, left: 0, width: 32, height: 32, borderColor: "#D4A24E", borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 }} />
                <View style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderColor: "#D4A24E", borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 }} />
                {processing && (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 8 }}>
                    <ActivityIndicator color="#D4A24E" size="large" />
                    <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: "#FFF", marginTop: 8 }}>جاري الشحن...</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
            </View>
            {/* Bottom */}
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
              <Text style={{ fontFamily: "Changa_500Medium", fontSize: 15, color: "#FFF", textAlign: "center" }}>
                وجّه الكاميرا نحو رمز QR لبطاقة المستخدم
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: "rgba(212,162,78,0.25)", borderWidth: 1, borderColor: "#D4A24E", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
                onPress={openManual}
              >
                <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: "#D4A24E" }}>🔢 إدخال يدوي</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      <TabBar tabs={tabs} activeKey="scan" />
      <ManualModal visible={showManual} value={manualCard} onChange={setManualCard} onSubmit={handleManualConfirm} onClose={() => setShowManual(false)} C={C} />
      <AmountModal visible={showAmountModal} selected={selectedAmount} onSelect={setSelectedAmount} onConfirm={handleTopup} onCancel={handleCancelAmount} processing={processing} C={C} />
      <ResultModal visible={showResult} result={result} onClose={handleClose} C={C} />
    </View>
  );
}

/* ─── Manual Input Modal ─── */
function ManualModal({ visible, value, onChange, onSubmit, onClose, C }: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 14 }}>
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: C.foreground, textAlign: "center" }}>🔢 رقم البطاقة</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="NQL-XXXXXXXX"
              placeholderTextColor={C.mutedForeground}
              style={{ backgroundColor: C.input, borderRadius: 12, padding: 14, fontFamily: "Changa_400Regular", fontSize: 16, color: C.foreground, borderWidth: 1, borderColor: C.border, textAlign: "center", letterSpacing: 2 }}
              autoCapitalize="characters"
              autoFocus
              onSubmitEditing={onSubmit}
            />
            <TouchableOpacity
              style={{ backgroundColor: value.trim() ? C.accent : C.muted, borderRadius: 14, padding: 15, alignItems: "center" }}
              onPress={onSubmit}
              disabled={!value.trim()}
            >
              <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: value.trim() ? "#FFF" : C.mutedForeground }}>متابعة →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ borderRadius: 14, padding: 12, alignItems: "center" }} onPress={onClose}>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.mutedForeground }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Amount Selection Modal ─── */
function AmountModal({ visible, selected, onSelect, onConfirm, onCancel, processing, C }: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40, maxHeight: "90%" }}>
          <View style={{ padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: "center" }}>
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground }}>💳 اختر مبلغ الشحن</Text>
            <Text style={{ fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, marginTop: 4 }}>ربحك محسوب تلقائياً</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {AMOUNTS.map(a => {
              const active = selected?.value === a.value;
              return (
                <TouchableOpacity
                  key={a.value}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: active ? `${C.accent}18` : C.muted, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: active ? C.accent : "transparent" }}
                  onPress={() => onSelect(a)}
                  activeOpacity={0.75}
                >
                  <View>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: active ? C.accent : C.foreground }}>{a.value.toLocaleString()} دج</Text>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>مبلغ الشحن</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: C.success }}>+{a.profit} دج</Text>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>ربحك</Text>
                  </View>
                  {active && <View style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 10, color: "#FFF" }}>✓</Text></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {selected && (
            <View style={{ marginHorizontal: 16, backgroundColor: `${C.primary}12`, borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.primary }}>للمستخدم: {selected.value.toLocaleString()} دج</Text>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.success }}>ربحك: +{selected.profit} دج</Text>
            </View>
          )}
          <View style={{ padding: 16, gap: 8 }}>
            <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: "center" }} onPress={onConfirm} disabled={processing || !selected}>
              {processing ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>تأكيد الشحن — {selected?.value.toLocaleString() ?? 0} دج</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: C.muted, borderRadius: 14, padding: 13, alignItems: "center" }} onPress={onCancel}>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.mutedForeground }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Result Modal ─── */
function ResultModal({ visible, result, onClose, C }: any) {
  const success = result?.success;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44, gap: 16, alignItems: "center" }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: success ? C.success : C.destructive, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 40, color: "#FFF" }}>{success ? "✓" : "✗"}</Text>
          </View>
          <Text style={{ fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground, textAlign: "center" }}>
            {success ? "✅ تم الشحن بنجاح" : (result?.error ?? "فشل الشحن")}
          </Text>
          {success && (
            <View style={{ width: "100%", backgroundColor: C.muted, borderRadius: 14, overflow: "hidden" }}>
              {[
                { label: "💳 المبلغ المشحون", value: `+${result.amount} دج`, color: C.success },
                { label: "💼 رصيد المستخدم الجديد", value: `${result.cardBalance} دج`, color: C.primary },
                { label: "💰 ربحك من هذه العملية", value: `+${result.profit} دج`, color: C.accent },
                { label: "🏦 رصيدك المتبقي", value: `${result.distributorBalance} دج`, color: C.foreground },
              ].map((row, i, arr) => (
                <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground }}>{row.label}</Text>
                  <Text style={{ fontFamily: "Changa_700Bold", fontSize: 15, color: row.color }}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={{ backgroundColor: C.primary, borderRadius: 14, padding: 15, width: "100%", alignItems: "center" }} onPress={onClose}>
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
