import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Modal,
  Platform, ActivityIndicator, TextInput, KeyboardAvoidingView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useDriverScanCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

export default function DriverScan() {
  const { t } = useLanguage();
  const { C } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [manualCard, setManualCard] = useState("");
  const { mutateAsync: scan, isPending } = useDriverScanCard();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan", icon: "📷", label: t.driver.scan, onPress: () => {} },
    { key: "trips", icon: "🚍", label: t.driver.trips, onPress: () => router.replace("/(driver)/trips") },
    { key: "withdraw", icon: "💰", label: t.driver.withdraw, onPress: () => router.replace("/(driver)/withdraw") },
    { key: "profile", icon: "👤", label: t.driver.profile, onPress: () => router.replace("/(driver)/profile") },
  ];

  async function processCard(cardNumber: string) {
    const cn = cardNumber.trim();
    if (!cn) return;
    if (scanning || isPending) return;
    setScanning(true);
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await scan({ data: { cardNumber: cn } });
      setResult(res);
      setShowResult(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e?.message ?? t.driver.invalidCard;
      Alert.alert(t.common.error, msg, [
        { text: t.common.close, onPress: () => { setScanned(false); } },
      ]);
    } finally {
      setScanning(false);
    }
  }

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned || scanning || isPending) return;
    setScanned(true);
    processCard(data);
  }, [scanned, scanning, isPending]);

  function handleClose() {
    setShowResult(false);
    setScanned(false);
    setResult(null);
    setManualCard("");
  }

  const ResultModal = (
    <Modal visible={showResult} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: 28, paddingBottom: 44, gap: 16, alignItems: "center",
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: result?.success ? C.success : C.destructive,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 40, color: "#FFF" }}>{result?.success ? "✓" : "✗"}</Text>
          </View>

          <Text style={{ fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, textAlign: "center" }}>
            {result?.success ? t.driver.fareDeducted : t.driver.invalidCard}
          </Text>

          {result?.success && (
            <View style={{ width: "100%", backgroundColor: C.muted, borderRadius: 16, overflow: "hidden" }}>
              {[
                {
                  label: t.customer.cardTypes[result.cardType as keyof typeof t.customer.cardTypes] ?? result.cardType,
                  value: `${result.fareAmount} دج`,
                  color: C.foreground,
                },
                { label: t.driver.driverEarning, value: `+${result.driverEarning} دج`, color: C.success },
                { label: t.driver.platformFee, value: `${result.platformFee} دج`, color: C.mutedForeground },
                { label: t.driver.cardBalance, value: `${result.cardBalance} دج`, color: C.primary },
              ].map((row, i, arr) => (
                <View key={row.label} style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  padding: 14, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border,
                }}>
                  <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground }}>{row.label}</Text>
                  <Text style={{ fontFamily: "Changa_700Bold", fontSize: 15, color: row.color }}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={{ backgroundColor: C.primary, borderRadius: 14, padding: 16, width: "100%", alignItems: "center" }}
            onPress={handleClose}
          >
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>{t.common.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  /* ── WEB fallback with manual input ── */
  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Header title={t.driver.scanTitle} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 20 }}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 64 }}>🎫</Text>
              <Text style={{ fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, textAlign: "center" }}>
                {t.driver.scanTitle}
              </Text>
              <Text style={{ fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center" }}>
                المسح بالكاميرا متاح على Expo Go • أدخل رقم البطاقة للاختبار
              </Text>
            </View>

            <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, gap: 12 }}>
              <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.foreground, textAlign: "center" }}>
                🔢 إدخال رقم البطاقة
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
                onSubmitEditing={() => processCard(manualCard)}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: isPending ? C.muted : C.primary,
                  borderRadius: 12, padding: 15, alignItems: "center",
                }}
                onPress={() => processCard(manualCard)}
                disabled={isPending || !manualCard.trim()}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>
                    خصم الأجرة 🚌
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <TabBar tabs={tabs} activeKey="scan" />
        {ResultModal}
      </View>
    );
  }

  /* ── Camera permission ── */
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Header title={t.driver.scanTitle} />
        <ActivityIndicator style={{ flex: 1 }} color={C.primary} />
        <TabBar tabs={tabs} activeKey="scan" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Header title={t.driver.scanTitle} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
          <Text style={{ fontSize: 64 }}>📷</Text>
          <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.foreground, textAlign: "center" }}>
            {t.driver.scanInstruction}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, paddingHorizontal: 32 }}
            onPress={requestPermission}
          >
            <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" }}>السماح بالكاميرا</Text>
          </TouchableOpacity>
        </View>
        <TabBar tabs={tabs} activeKey="scan" />
      </View>
    );
  }

  /* ── Camera scanner ── */
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Header title={t.driver.scanTitle} />

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
              {/* Scan box */}
              <View style={{ width: 280, height: 280, position: "relative" }}>
                {[
                  { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
                  { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
                  { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
                  { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
                ].map((s, i) => (
                  <View key={i} style={[{ position: "absolute", width: 32, height: 32, borderColor: "#D4A24E", borderWidth: 4 }, s]} />
                ))}
                {(scanning || isPending) && (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator color="#D4A24E" size="large" />
                  </View>
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
            </View>
            <View style={{
              flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center", justifyContent: "center", paddingTop: 20, gap: 16, paddingHorizontal: 32,
            }}>
              <Text style={{ fontFamily: "Changa_500Medium", fontSize: 14, color: "#FFF", textAlign: "center" }}>
                {scanning || isPending ? "جاري المعالجة..." : t.driver.scanInstruction}
              </Text>
              {scanned && !showResult && !scanning && (
                <TouchableOpacity
                  style={{ backgroundColor: "#D4A24E", borderRadius: 12, padding: 12, paddingHorizontal: 28 }}
                  onPress={() => setScanned(false)}
                >
                  <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 14, color: "#FFF" }}>{t.common.retry}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </View>

      <TabBar tabs={tabs} activeKey="scan" />
      {ResultModal}
    </View>
  );
}
