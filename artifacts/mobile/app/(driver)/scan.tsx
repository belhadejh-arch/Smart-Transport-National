import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useDriverScanCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { Sounds } from "@/utils/sounds";

export default function DriverScan() {
  const { t } = useLanguage();
  const { C } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCard, setManualCard] = useState("");
  const { mutateAsync: scan } = useDriverScanCard();
  const cooldown = useRef(false);

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan", icon: "📷", label: t.driver.scan, onPress: () => {} },
    { key: "trips", icon: "🚍", label: t.driver.trips, onPress: () => router.replace("/(driver)/trips") },
    { key: "withdraw", icon: "💰", label: t.driver.withdraw, onPress: () => router.replace("/(driver)/withdraw") },
    { key: "profile", icon: "👤", label: t.driver.profile, onPress: () => router.replace("/(driver)/profile") },
  ];

  async function processCard(cardNumber: string) {
    const cn = cardNumber.trim();
    if (!cn || processing || cooldown.current) return;
    cooldown.current = true;
    setProcessing(true);
    setShowManual(false);

    // Scan beep
    Sounds.scan();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await scan({ data: { cardNumber: cn } });
      setResult(res);
      setShowResult(true);
      // Success sound + haptic
      Sounds.success();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      // Error sound + haptic
      Sounds.error();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, error: e?.message ?? t.driver.invalidCard });
      setShowResult(true);
    } finally {
      setProcessing(false);
      setScanned(false);
      setManualCard("");
      setTimeout(() => { cooldown.current = false; }, 2000);
    }
  }

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned || processing || cooldown.current) return;
    setScanned(true);
    processCard(data);
  }, [scanned, processing]);

  function handleClose() {
    setShowResult(false);
    setResult(null);
    setScanned(false);
  }

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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
          <Text style={{ fontSize: 72 }}>📷</Text>
          <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: C.foreground, textAlign: "center" }}>
            نحتاج إذن الكاميرا
          </Text>
          <Text style={{ fontFamily: "Changa_400Regular", fontSize: 14, color: C.mutedForeground, textAlign: "center" }}>
            لمسح رموز QR لبطاقات الركاب
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, borderRadius: 14, padding: 16, paddingHorizontal: 40 }}
            onPress={requestPermission}
          >
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>السماح بالكاميرا</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowManual(true)}>
            <Text style={{ fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground, textDecorationLine: "underline" }}>
              أو أدخل رقم البطاقة يدوياً
            </Text>
          </TouchableOpacity>
        </View>
        <TabBar tabs={tabs} activeKey="scan" />
        <ManualModal visible={showManual} value={manualCard} onChange={setManualCard} onSubmit={() => processCard(manualCard)} onClose={() => setShowManual(false)} processing={processing} C={C} />
        <ResultModal visible={showResult} result={result} onClose={handleClose} C={C} t={t} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Header title={t.driver.scanTitle} />
      <View style={{ flex: 1, position: "relative" }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
            <View style={{ flexDirection: "row", height: 260 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ width: 260, height: 260 }}>
                <View style={{ position: "absolute", top: 0, left: 0, width: 32, height: 32, borderColor: "#D4A24E", borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 }} />
                <View style={{ position: "absolute", top: 0, right: 0, width: 32, height: 32, borderColor: "#D4A24E", borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 }} />
                <View style={{ position: "absolute", bottom: 0, left: 0, width: 32, height: 32, borderColor: "#D4A24E", borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 }} />
                <View style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderColor: "#D4A24E", borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 }} />
                {processing && (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                    <ActivityIndicator color="#D4A24E" size="large" />
                    <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: "#FFF", marginTop: 8 }}>جاري المعالجة...</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
              <Text style={{ fontFamily: "Changa_500Medium", fontSize: 15, color: "#FFF", textAlign: "center" }}>
                {processing ? "جاري خصم الأجرة..." : "وجّه الكاميرا نحو رمز QR للراكب"}
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: "rgba(212,162,78,0.25)", borderWidth: 1, borderColor: "#D4A24E", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
                onPress={() => setShowManual(true)}
              >
                <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 13, color: "#D4A24E" }}>🔢 إدخال يدوي</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      <TabBar tabs={tabs} activeKey="scan" />
      <ManualModal visible={showManual} value={manualCard} onChange={setManualCard} onSubmit={() => processCard(manualCard)} onClose={() => setShowManual(false)} processing={processing} C={C} />
      <ResultModal visible={showResult} result={result} onClose={handleClose} C={C} t={t} />
    </View>
  );
}

function ManualModal({ visible, value, onChange, onSubmit, onClose, processing, C }: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 14 }}>
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: C.foreground, textAlign: "center" }}>🔢 إدخال رقم البطاقة</Text>
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
              style={{ backgroundColor: processing ? C.muted : C.primary, borderRadius: 14, padding: 15, alignItems: "center" }}
              onPress={onSubmit}
              disabled={processing || !value.trim()}
            >
              {processing ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" }}>خصم الأجرة 🚌</Text>}
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

function ResultModal({ visible, result, onClose, C, t }: any) {
  const success = result?.success;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  // Old balance = new balance + fare (since fare was deducted)
  const oldBalance = success ? (Number(result?.cardBalance ?? 0) + Number(result?.fareAmount ?? 0)) : 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <Animated.View style={{
          backgroundColor: C.card,
          borderTopLeftRadius: 32, borderTopRightRadius: 32,
          padding: 28, paddingBottom: 48, gap: 18, alignItems: "center",
          transform: [{ scale: scaleAnim }],
        }}>
          {/* Icon */}
          <View style={{
            width: 84, height: 84, borderRadius: 42,
            backgroundColor: success ? C.success : C.destructive,
            alignItems: "center", justifyContent: "center",
            shadowColor: success ? C.success : C.destructive,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
          }}>
            <Text style={{ fontSize: 40 }}>{success ? "✓" : "✗"}</Text>
          </View>

          <Text style={{ fontFamily: "Changa_700Bold", fontSize: 22, color: C.foreground, textAlign: "center" }}>
            {success ? t.driver.fareDeducted : (result?.error ?? t.driver.invalidCard)}
          </Text>

          {success && (
            <View style={{ width: "100%", gap: 6 }}>
              {/* Balance flow: before → deducted → after */}
              <View style={{ backgroundColor: `${C.primary}12`, borderRadius: 16, padding: 16, gap: 0, borderWidth: 1, borderColor: `${C.primary}25` }}>
                <Text style={{ fontFamily: "Changa_600SemiBold", fontSize: 12, color: C.mutedForeground, textAlign: "center", marginBottom: 10 }}>
                  حركة رصيد البطاقة
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>قبل</Text>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: C.foreground }}>{oldBalance} دج</Text>
                  </View>
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 22, color: C.destructive }}>−{result.fareAmount}</Text>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 10, color: C.mutedForeground }}>الأجرة</Text>
                  </View>
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text style={{ fontFamily: "Changa_400Regular", fontSize: 11, color: C.mutedForeground }}>بعد</Text>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 18, color: C.success }}>{result.cardBalance} دج</Text>
                  </View>
                </View>
              </View>

              {/* Driver earnings row */}
              <View style={{ backgroundColor: C.muted, borderRadius: 14, overflow: "hidden" }}>
                {[
                  { label: "🎫 نوع البطاقة", value: t.customer?.cardTypes?.[result.cardType] ?? result.cardType, color: C.foreground },
                  { label: "💼 أجرتك", value: `+${result.driverEarning} دج`, color: C.success },
                  { label: "🏛️ رسوم المنصة", value: `${result.platformFee} دج`, color: C.mutedForeground },
                ].map((row, i, arr) => (
                  <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 13, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <Text style={{ fontFamily: "Changa_500Medium", fontSize: 13, color: C.mutedForeground }}>{row.label}</Text>
                    <Text style={{ fontFamily: "Changa_700Bold", fontSize: 15, color: row.color }}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={{ backgroundColor: success ? C.primary : C.destructive, borderRadius: 16, padding: 16, width: "100%", alignItems: "center", shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
            onPress={onClose}
          >
            <Text style={{ fontFamily: "Changa_700Bold", fontSize: 17, color: "#FFF" }}>{t.common.close}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
