import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Platform, ActivityIndicator, TextInput } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useDistributorScanCard } from "@workspace/api-client-react";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import colors from "@/constants/colors";

const AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function DistributorScan() {
  const { t, isRTL } = useLanguage();
  const C = colors.light;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scannedCard, setScannedCard] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const { mutateAsync: scan, isPending } = useDistributorScanCard();

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.distributor.dashboard, onPress: () => router.replace("/(distributor)/dashboard") },
    { key: "scan", icon: "📷", label: t.distributor.scan, onPress: () => {} },
    { key: "profile", icon: "👤", label: t.distributor.profile, onPress: () => router.replace("/(distributor)/profile") },
  ];

  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setScannedCard(data);
    setShowAmountModal(true);
  }

  async function handleTopup() {
    const amount = customAmount ? Number(customAmount) : selectedAmount;
    if (!amount || amount <= 0) return;
    setShowAmountModal(false);
    try {
      const res = await scan({ data: { cardNumber: scannedCard, amount } });
      setResult(res);
      setShowResult(true);
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? t.distributor.insufficientBalance, [
        { text: t.common.close, onPress: () => { setScanned(false); setScannedCard(""); } },
      ]);
    }
  }

  function handleClose() {
    setShowResult(false);
    setScanned(false);
    setResult(null);
    setScannedCard("");
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.screen}>
        <Header title={t.distributor.scanTitle} />
        <View style={styles.webFallback}>
          <Text style={styles.webIcon}>📷</Text>
          <Text style={styles.webText}>{t.distributor.scanTitle}</Text>
          <Text style={styles.webSub}>Camera scanning available on Expo Go (mobile)</Text>
        </View>
        <TabBar tabs={tabs} activeKey="scan" />
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.screen}>
        <Header title={t.distributor.scanTitle} />
        <View style={styles.permContainer}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permText}>{t.distributor.scanTitle}</Text>
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
      <Header title={t.distributor.scanTitle} />
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
              <Text style={styles.instruction}>{t.distributor.scanTitle}</Text>
            </View>
          </View>
        </CameraView>
      </View>
      <TabBar tabs={tabs} activeKey="scan" />

      {/* Amount selection modal */}
      <Modal visible={showAmountModal} animationType="slide" transparent onRequestClose={() => { setShowAmountModal(false); setScanned(false); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.distributor.selectAmount}</Text>
            <View style={styles.amountGrid}>
              {AMOUNTS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.amountBtn, selectedAmount === a && !customAmount && styles.amountBtnActive]}
                  onPress={() => { setSelectedAmount(a); setCustomAmount(""); }}
                >
                  <Text style={[styles.amountBtnText, selectedAmount === a && !customAmount && styles.amountBtnTextActive]}>
                    {a} {t.common.dinar}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.customInput}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder={`Custom amount (${t.common.dinar})`}
              placeholderTextColor={C.mutedForeground}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.topupBtn} onPress={handleTopup} disabled={isPending}>
              {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.topupBtnText}>{t.common.confirm}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAmountModal(false); setScanned(false); }}>
              <Text style={styles.cancelBtnText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Result modal */}
      <Modal visible={showResult} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.resultIcon, { backgroundColor: result?.success ? C.success : C.destructive }]}>
              <Text style={styles.resultIconText}>{result?.success ? "✓" : "✗"}</Text>
            </View>
            <Text style={styles.resultTitle}>{result?.success ? t.distributor.topupSuccess : t.distributor.insufficientBalance}</Text>
            {result && (
              <View style={styles.resultDetails}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Amount Added</Text>
                  <Text style={[styles.resultValue, { color: C.success }]}>+{Number(result.fareAmount).toFixed(0)} {t.common.dinar}</Text>
                </View>
                <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.resultLabel}>{t.driver.cardBalance}</Text>
                  <Text style={[styles.resultValue, { color: C.primary }]}>{Number(result.cardBalance).toFixed(0)} {t.common.dinar}</Text>
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
  scanBox: { width: 280, height: 280, borderRadius: 12, backgroundColor: "transparent", position: "relative" },
  corner: { position: "absolute", width: 28, height: 28, borderColor: "#D4A24E", borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", paddingTop: 20 },
  instruction: { fontFamily: "Changa_500Medium", fontSize: 14, color: "#FFF", textAlign: "center", paddingHorizontal: 32 },
  webFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: C.background },
  webIcon: { fontSize: 64, marginBottom: 16 },
  webText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: C.foreground, textAlign: "center" },
  webSub: { fontFamily: "Changa_400Regular", fontSize: 13, color: C.mutedForeground, textAlign: "center", marginTop: 8 },
  permContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: C.background },
  permIcon: { fontSize: 64, marginBottom: 16 },
  permText: { fontFamily: "Changa_500Medium", fontSize: 16, color: C.foreground, textAlign: "center", marginBottom: 24 },
  permBtn: { backgroundColor: C.primary, borderRadius: 12, padding: 14, paddingHorizontal: 32 },
  permBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 16, color: "#FFF" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 12 },
  modalTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amountBtn: { backgroundColor: C.muted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 2, borderColor: "transparent" },
  amountBtnActive: { borderColor: C.accent, backgroundColor: `${C.accent}20` },
  amountBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 14, color: C.mutedForeground },
  amountBtnTextActive: { color: C.accent },
  customInput: { backgroundColor: C.input, borderRadius: 10, padding: 12, fontFamily: "Changa_400Regular", fontSize: 14, color: C.foreground, borderWidth: 1, borderColor: C.border },
  topupBtn: { backgroundColor: C.accent, borderRadius: 12, padding: 14, alignItems: "center" },
  topupBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
  cancelBtn: { backgroundColor: C.muted, borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText: { fontFamily: "Changa_600SemiBold", fontSize: 15, color: C.mutedForeground },
  resultIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  resultIconText: { fontSize: 36, color: "#FFF" },
  resultTitle: { fontFamily: "Changa_700Bold", fontSize: 20, color: C.foreground, textAlign: "center" },
  resultDetails: { gap: 0 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  resultLabel: { fontFamily: "Changa_500Medium", fontSize: 14, color: C.mutedForeground },
  resultValue: { fontFamily: "Changa_700Bold", fontSize: 14, color: C.foreground },
  doneBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 14, alignItems: "center" },
  doneBtnText: { fontFamily: "Changa_700Bold", fontSize: 16, color: "#FFF" },
});
