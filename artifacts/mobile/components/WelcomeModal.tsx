import React, { useEffect, useRef, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";

interface WelcomeConfig {
  icon: string;
  title: string;
  name?: string;
  subtitle: string;
  points: string[];
  footer: string;
  accentColor?: string;
}

const CONFIGS: Record<string, WelcomeConfig> = {
  customer: {
    icon: "🚍",
    title: "مرحباً بك في NQL DZ",
    subtitle: "نحن سعداء بانضمامك إلى منصة النقل الذكي الأولى في الجزائر 🇩🇿",
    points: [
      "التنقل بسهولة وأمان",
      "الدفع عبر QR Code",
      "شحن بطاقتك بسرعة",
      "متابعة رصيدك وعملياتك مباشرة",
    ],
    footer: "نتمنى لك تجربة نقل ذكية ومريحة ✨",
    accentColor: "#2C6B7F",
  },
  admin: {
    icon: "👑",
    title: "مرحباً بك في لوحة إدارة NQL DZ",
    subtitle: "أنت الآن داخل مركز التحكم الرئيسي لمنصة النقل الذكي في الجزائر 🇩🇿",
    points: [
      "إدارة السائقين والموزعين والمستخدمين",
      "مراقبة جميع العمليات المالية",
      "مراجعة البطاقات والوثائق",
      "متابعة الأرباح والإحصائيات",
      "الموافقة على طلبات السحب",
      "مراقبة النظام بشكل مباشر وآمن",
    ],
    footer: "شكراً لمساهمتك في تطوير منظومة النقل الذكي الحديثة ✨",
    accentColor: "#2C6B7F",
  },
  sub_admin: {
    icon: "👑",
    title: "مرحباً بك في لوحة إدارة NQL DZ",
    subtitle: "أنت الآن داخل مركز التحكم الرئيسي لمنصة النقل الذكي في الجزائر 🇩🇿",
    points: [
      "إدارة السائقين والموزعين والمستخدمين",
      "مراقبة جميع العمليات المالية",
      "مراجعة البطاقات والوثائق",
      "متابعة الأرباح والإحصائيات",
    ],
    footer: "شكراً لمساهمتك في تطوير منظومة النقل الذكي الحديثة ✨",
    accentColor: "#2C6B7F",
  },
  distributor: {
    icon: "🏪",
    title: "NQL DZ",
    subtitle: "أنت الآن جزء من شبكة التوزيع الذكية الخاصة بمنصة NQL DZ 🇩🇿",
    points: [
      "شحن أرصدة المستخدمين",
      "متابعة الأرباح اليومية",
      "مراقبة جميع العمليات",
      "إدارة الرصيد بسهولة وسرعة",
    ],
    footer: "شكراً لمساهمتك في تطوير النقل الذكي في الجزائر 🚍",
    accentColor: "#D4A24E",
  },
  driver: {
    icon: "🚌",
    title: "NQL DZ",
    subtitle: "مرحباً بك في نظام النقل الذكي الجديد في الجزائر 🇩🇿",
    points: [
      "استقبال المدفوعات عبر QR",
      "متابعة أرباحك مباشرة",
      "الاطلاع على عدد الرحلات اليومية",
      "تحميل تقاريرك بسهولة",
    ],
    footer: "نتمنى لك رحلات آمنة وتجربة عمل احترافية مع NQL DZ ✨",
    accentColor: "#2C6B7F",
  },
};

interface Props {
  userId: number;
  userName?: string;
  role: string;
}

export function WelcomeModal({ userId, userName, role }: Props) {
  const { C } = useTheme();
  const [visible, setVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const key = `nql_welcome_shown_${userId}`;
    AsyncStorage.getItem(key).then((shown) => {
      if (!shown) {
        setVisible(true);
        AsyncStorage.setItem(key, "1");
      }
    });
  }, [userId]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }

  const cfg = CONFIGS[role] ?? CONFIGS.customer;
  const accent = cfg.accentColor ?? "#2C6B7F";

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { backgroundColor: C.card, transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          {/* Header gradient band */}
          <View style={[s.headerBand, { backgroundColor: accent }]}>
            <Text style={s.headerIcon}>{cfg.icon}</Text>
          </View>

          <ScrollView
            contentContainerStyle={s.body}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Title + name */}
            <Text style={[s.title, { color: C.foreground }]}>{cfg.title}</Text>
            {userName && (
              <View style={[s.namePill, { backgroundColor: `${accent}18`, borderColor: `${accent}30` }]}>
                <Text style={[s.nameText, { color: accent }]}>{userName}</Text>
              </View>
            )}

            {/* Subtitle */}
            <Text style={[s.subtitle, { color: C.mutedForeground }]}>{cfg.subtitle}</Text>

            {/* Points */}
            <View style={[s.pointsBox, { backgroundColor: `${accent}08`, borderColor: `${accent}20` }]}>
              <Text style={[s.pointsTitle, { color: C.foreground }]}>يمكنك من خلال حسابك:</Text>
              {cfg.points.map((p, i) => (
                <View key={i} style={s.pointRow}>
                  <View style={[s.pointDot, { backgroundColor: accent }]} />
                  <Text style={[s.pointText, { color: C.foreground }]}>{p}</Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <Text style={[s.footer, { color: C.mutedForeground }]}>{cfg.footer}</Text>
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={[s.cta, { backgroundColor: accent }]}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={s.ctaText}>🚀 ابدأ الآن</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sheet: {
    borderRadius: 24,
    width: "100%",
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  headerBand: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: { fontSize: 52 },
  body: { padding: 24, paddingBottom: 12, gap: 14 },
  title: {
    fontFamily: "Changa_700Bold",
    fontSize: 20,
    textAlign: "center",
    lineHeight: 28,
  },
  namePill: {
    alignSelf: "center",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
  },
  nameText: {
    fontFamily: "Changa_700Bold",
    fontSize: 17,
  },
  subtitle: {
    fontFamily: "Changa_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  pointsBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  pointsTitle: {
    fontFamily: "Changa_600SemiBold",
    fontSize: 14,
    marginBottom: 4,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pointText: {
    fontFamily: "Changa_400Regular",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    fontFamily: "Changa_500Medium",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  cta: {
    margin: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontFamily: "Changa_700Bold",
    fontSize: 17,
    color: "#FFF",
  },
});
