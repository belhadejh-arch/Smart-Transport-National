import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Alert, Modal, Platform,
  ActivityIndicator, ScrollView, TextInput,
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
  const { t, isRTL } = useLanguage();
  const { C } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scannedCard, setScannedCard] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(AMOUNTS[3]);
  const [manualCard, setManualCard] = useState("");
  const { mutateAsync: scan, isPending } = useDistributorScanCard();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.distributor.dashboard, onPress: () => router.replace("/(distributor)/dashboard") },
    { key: "scan", icon: "📷", label: t.distributor.scan, onPress: () => {} },
    { key: "profile", icon: "👤", label: t.distributor.profile, onPress: () => router.replace("/(distributor)/profile") },
  ];

  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setScannedCard(data.trim());
    setShowAmountModal(true);
  }

  function handleManualScan() {
    const card = manualCard.trim();
    if (!card) { Alert.alert("خطأ", "أدخل رقم البطاقة"); return; }
    setScannedCard(card);
    setShowAmountModal(true);
  }

  async function handleTopup() {
    if (!selectedAmount) return;
    setShowAmountModal(false);
    try {
      const res = await scan({ data: { cardNumber: scannedCard, amount: selectedAmount.value } });
      setResult(res);
      setShowResult(true);
    } catch (e: any) {
      const msg = e?.message ?? t.distributor.insufficientBalance;
      Alert.alert(t.common.error, msg, [
        { text: t.common.close, onPress: () => { setScanned(false); setScannedCard(""); } },
      ]);
    }
  }

  function handleClose() {
    setShowResult(false);
    setScanned(false);
    setResult(null);
    setScannedCard("");
    setManualCard("");
  }

  function handleCancelAmount() {
    setShowAmountModal(false);
    setScanned(false);
    setScannedCard("");
  }

  const tabs2 = tabs;

  /* ── WEB fallback ── */
  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Header title={t.distributor.scanTitle} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, gap: 12 }}>
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: C.foreground, textAlign: "center" }}>
              🔢 إدخال رقم البطاقة يدوياً
            </Text>
            <Text style={{ fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: "center" }}>
              (المسح بالكاميرا متاح على تطبيق Expo Go)
            </Text>
            <TextInput
              value={manualCard}
              onChangeText={setManualCard}
              placeholder="NQL-XXXXXXXX"
              placeholderTextColor={C.mutedForeground}
              style={{
                backgroundColor: C.input, borderRadius: 10, padding: 14,
                fontFamily: "Changa_400Regular", fontSize: 15, color: C.foreground,
                borderWidth: 1, borderColor: C.border, textAlign: "center",
              }}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 12, padding: 14, alignItems: "center" }}
              onPress={handleManualScan}
            >
              <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>متابعة</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <TabBar tabs={tabs2} activeKey="scan" />
        <AmountModal
          visible={showAmountModal}
          selected={selectedAmount}
          onSelect={setSelectedAmount}
          onConfirm={handleTopup}
          onCancel={handleCancelAmount}
          isPending={isPending}
          C={C}
        />
        <ResultModal
          visible={showResult}
          result={result}
          onClose={handleClose}
          C={C}
          t={t}
        />
      </View>
    );
  }

  /* ── Camera permission ── */
  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Header title={t.distributor.scanTitle} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
          <Text style={{ fontSize: 64 }}>📷</Text>
          <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.foreground, textAlign: "center" }}>
            {t.distributor.scanTitle}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, paddingHorizontal: 32 }}
            onPress={requestPermission}
          >
            <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" }}>السماح بالكاميرا</Text>
          </TouchableOpacity>
        </View>
        <TabBar tabs={tabs2} activeKey="scan" />
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
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
            <View style={{ flexDirection: "row", height: 280 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
              <View style={{ width: 280, height: 280, position: "relative" }}>
                {/* Corner markers */}
                {[
                  { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
                  { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
                  { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
                  { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
                ].map((s, i) => (
                  <View key={i} style={[{ position: "absolute", width: 28, height: 28, borderColor: "#D4A24E", borderWidth: 3 }, s]} />
                ))}
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", paddingTop: 20, gap: 16 }}>
              <Text style={{ fontFamily: "Changa_500Medium", fontSize: 14, color: "#FFF", textAlign: "center", paddingHorizontal: 32 }}>
                وجّه الكاميرا نحو رمز QR لبطاقة المستخدم
              </Text>
              {scanned && !showAmountModal && (
                <TouchableOpacity
                  style={{ backgroundColor: "#D4A24E", borderRadius: 12, padding: 12, paddingHorizontal: 24 }}
                  onPress={() => setScanned(false)}
                >
                  <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 14, color: "#FFF" }}>{t.common.retry}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </View>

      <TabBar tabs={tabs2} activeKey="scan" />

      <AmountModal
        visible={showAmountModal}
        selected={selectedAmount}
        onSelect={setSelectedAmount}
        onConfirm={handleTopup}
        onCancel={handleCancelAmount}
        isPending={isPending}
        C={C}
      />
      <ResultModal
        visible={showResult}
        result={result}
        onClose={handleClose}
        C={C}
        t={t}
      />
    </View>
  );
}

/* ─────── Amount Selection Modal ─────── */
function AmountModal({
  visible, selected, onSelect, onConfirm, onCancel, isPending, C,
}: {
  visible: boolean;
  selected: { value: number; profit: number };
  onSelect: (a: { value: number; profit: number }) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  C: any;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 }}>
          {/* Header */}
          <View style={{ padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, textAlign: "center" }}>
              💳 اختر مبلغ الشحن
            </Text>
            <Text style={{ fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground, textAlign: "center", marginTop: 4 }}>
              ربحك محسوب تلقائياً لكل مبلغ
            </Text>
          </View>

          {/* Amount grid */}
          <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
            {AMOUNTS.map(a => {
              const isActive = selected?.value === a.value;
              return (
                <TouchableOpacity
                  key={a.value}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: isActive ? `${C.accent}18` : C.muted,
                    borderRadius: 14, padding: 16, borderWidth: 2,
                    borderColor: isActive ? C.accent : "transparent",
                  }}
                  onPress={() => onSelect(a)}
                  activeOpacity={0.75}
                >
                  <View>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: isActive ? C.accent : C.foreground }}>
                      {a.value.toLocaleString()} دج
                    </Text>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 12, color: C.mutedForeground }}>
                      مبلغ الشحن
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: C.success }}>
                      +{a.profit} دج
                    </Text>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>
                      ربحك
                    </Text>
                  </View>
                  {isActive && (
                    <View style={{
                      position: "absolute", top: 8, right: 8,
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ fontSize: 10, color: "#FFF" }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Preview */}
          {selected && (
            <View style={{ marginHorizontal: 16, backgroundColor: `${C.primary}12`, borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.primary }}>
                يُشحن للمستخدم: {selected.value.toLocaleString()} دج
              </Text>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: C.success }}>
                ربحك: +{selected.profit} دج
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={{ padding: 16, gap: 10 }}>
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: "center" }}
              onPress={onConfirm}
              disabled={isPending || !selected}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>
                  تأكيد الشحن — {selected?.value.toLocaleString() ?? 0} دج
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: C.muted, borderRadius: 14, padding: 14, alignItems: "center" }}
              onPress={onCancel}
            >
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.mutedForeground }}>
                {"\u0625\u0644\u063a\u0627\u0621"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─────── Result Modal ─────── */
function ResultModal({
  visible, result, onClose, C, t,
}: {
  visible: boolean;
  result: any;
  onClose: () => void;
  C: any;
  t: any;
}) {
  const success = result?.success;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44, gap: 16, alignItems: "center" }}>
          {/* Icon */}
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: success ? C.success : C.destructive,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 40, color: "#FFF" }}>{success ? "✓" : "✗"}</Text>
          </View>

          <Text style={{ fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground, textAlign: "center" }}>
            {success ? "✅ تم الشحن بنجاح" : "❌ فشل الشحن"}
          </Text>

          {result && success && (
            <View style={{ width: "100%", backgroundColor: C.muted, borderRadius: 16, overflow: "hidden" }}>
              {[
                { label: "💳 المبلغ المشحون للمستخدم", value: `+${result.amount} دج`, color: C.success },
                { label: "💼 رصيد المستخدم الجديد", value: `${result.cardBalance} دج`, color: C.primary },
                { label: "💰 ربحك من هذه العملية", value: `+${result.profit} دج`, color: C.accent },
                { label: "🏦 رصيدك المتبقي", value: `${result.distributorBalance} دج`, color: C.foreground },
              ].map((row, i, arr) => (
                <View key={row.label} style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  padding: 14, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border,
                }}>
                  <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground, flex: 1 }}>
                    {row.label}
                  </Text>
                  <Text style={{ fontFamily: "Changa_700Bold", fontSize: 15, color: row.color }}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={{ backgroundColor: C.primary, borderRadius: 14, padding: 16, width: "100%", alignItems: "center" }}
            onPress={onClose}
          >
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
