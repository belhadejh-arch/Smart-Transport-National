import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Platform, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useDriverScanCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

export default function DriverScan() {
  const { t, isRTL } = useLanguage();
  const C = colors.light;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const { mutateAsync: scan, isPending } = useDriverScanCard();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.driver.dashboard, onPress: () => router.replace("/(driver)/dashboard") },
    { key: "scan", icon: "📷", label: t.driver.scan, onPress: () => {} },
    { key: "trips", icon: "🚍", label: t.driver.trips, onPress: () => router.replace("/(driver)/trips") },
    { key: "withdraw", icon: "💰", label: t.driver.withdraw, onPress: () => router.replace("/(driver)/withdraw") },
    { key: "profile", icon: "👤", label: t.driver.profile, onPress: () => router.replace("/(driver)/profile") },
  ];

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || isPending) return;
    setScanned(true);
    try {
      const res = await scan({ data: { cardNumber: data } });
      setResult(res);
      setShowResult(true);
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.driver.invalidCard, [
        { text: t.common.close, onPress: () => setScanned(false) },
      ]);
    }
  }

  function handleClose() {
    setShowResult(false);
    setScanned(false);
    setResult(null);
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.screen}>
        <Header title={t.driver.scanTitle} />
        <View style={styles.webFallback}>
          <Text style={styles.webIcon}>📷</Text>
          <Text style={styles.webText}>{t.driver.scanInstruction}</Text>
          <Text style={styles.webSubText}>QR scanning is available on mobile devices via Expo Go</Text>
        </View>
        <TabBar tabs={tabs} activeKey="scan" />
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.screen}><Header title={t.driver.scanTitle} /><ActivityIndicator style={{ flex: 1 }} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <Header title={t.driver.scanTitle} />
        <View style={styles.permissionContainer}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permText}>{t.driver.scanInstruction}</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
        <TabBar tabs={tabs} activeKey="scan" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title={t.driver.scanTitle} />

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.topOverlay} />
            <View style={styles.middleRow}>
              <View style={styles.sideOverlay} />
              <View style={styles.scanBox}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <View style={styles.sideOverlay} />
            </View>
            <View style={styles.bottomOverlay}>
              <Text style={styles.instruction}>{t.driver.scanInstruction}</Text>
              {isPending && <ActivityIndicator color={C.accent} style={{ marginTop: 8 }} />}
            </View>
          </View>
        </CameraView>
      </View>

      {scanned && !showResult && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
          <Text style={styles.rescanBtnText}>{t.common.retry}</Text>
        </TouchableOpacity>
      )}

      <TabBar tabs={tabs} activeKey="scan" />

      {/* Result modal */}
      <Modal visible={showResult} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.resultIcon, { backgroundColor: result?.success ? C.success : C.destructive }]}>
              <Text style={styles.resultIconText}>{result?.success ? "✓" : "✗"}</Text>
            </View>
            <Text style={styles.resultTitle}>{result?.success ? t.driver.fareDeducted : t.driver.invalidCard}</Text>
            {result && (
              <View style={styles.resultDetails}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{t.customer.cardTypes[result.cardType as keyof typeof t.customer.cardTypes] ?? result.cardType}</Text>
                  <Text style={styles.resultValue}>{result.fareAmount} {t.common.dinar}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{t.driver.driverEarning}</Text>
                  <Text style={[styles.resultValue, { color: C.success }]}>+{result.driverEarning} {t.common.dinar}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{t.driver.platformFee}</Text>
                  <Text style={styles.resultValue}>{result.platformFee} {t.common.dinar}</Text>
                </View>
                <View style={[styles.resultRow, styles.resultRowLast]}>
                  <Text style={styles.resultLabel}>{t.driver.cardBalance}</Text>
                  <Text style={[styles.resultValue, { color: C.primary }]}>{result.cardBalance} {t.common.dinar}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
              <Text style={styles.doneBtnText}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  middleRow: { flexDirection: "row", height: 280 },
  sideOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  scanBox: {
    width: 280, height: 280, borderRadius: 12,
    backgroundColor: "transparent", position: "relative",
  },
  corner: { position: "absolute", width: 28, height: 28, borderColor: C.accent, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  bottomOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center", paddingTop: 20,
  },
  instruction: { fontFamily: "Changa_500Medium", fontSize: 14, color: "#FFF", textAlign: "center", paddingHorizontal: 32 },
  rescanBtn: {
    backgroundColor: C.accent, margin: 16, borderRadius: 12, padding: 14, alignItems: "center",
  },
  rescanBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" },
  webFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: C.background },
  webIcon: { fontSize: 64, marginBottom: 16 },
  webText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.foreground, textAlign: "center", marginBottom: 8 },
  webSubText: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center" },
  permissionContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: C.background },
  permIcon: { fontSize: 64, marginBottom: 16 },
  permText: { fontFamily: "Changa_500Medium", fontSize: 16, color: C.foreground, textAlign: "center", marginBottom: 24 },
  permBtn: { backgroundColor: C.primary, borderRadius: 12, padding: 14, paddingHorizontal: 32 },
  permBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, alignItems: "center", paddingBottom: 40,
  },
  resultIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  resultIconText: { fontSize: 36, color: "#FFF" },
  resultTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, marginBottom: 20 },
  resultDetails: { width: "100%", gap: 0 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  resultRowLast: { borderBottomWidth: 0 },
  resultLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  resultValue: { fontFamily: "Changa_700Bold", fontSize: 14, color: C.foreground },
  doneBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 14, paddingHorizontal: 48, marginTop: 20 },
  doneBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
});
