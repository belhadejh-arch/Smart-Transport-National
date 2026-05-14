import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, Lang } from "@/context/LanguageContext";
import colors from "@/constants/colors";

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const { lang, setLang, t, isLoaded } = useLanguage();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && isLoaded && user) {
      switch (user.role) {
        case "admin": router.replace("/(admin)/dashboard"); break;
        case "driver": router.replace("/(driver)/dashboard"); break;
        case "customer": router.replace("/(customer)/dashboard"); break;
        case "distributor": router.replace("/(distributor)/dashboard"); break;
      }
    }
  }, [user, isLoading, isLoaded]);

  if (isLoading || !isLoaded || user) return null;

  const langs: { code: Lang; label: string; flag: string }[] = [
    { code: "ar", label: "العربية", flag: "🇩🇿" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  const handleSelect = async (code: Lang) => {
    await setLang(code);
    router.replace("/login");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>NQL</Text>
          <Text style={styles.logoDZ}>DZ</Text>
        </View>
        <Text style={styles.appName}>NQL DZ</Text>
        <Text style={styles.tagline}>نظام النقل الذكي الوطني</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t.language.title}</Text>
        <Text style={styles.subtitle}>{t.language.subtitle}</Text>
        <View style={styles.langList}>
          {langs.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, lang === l.code && styles.langBtnActive]}
              onPress={() => handleSelect(l.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.langFlag}>{l.flag}</Text>
              <Text style={[styles.langLabel, lang === l.code && styles.langLabelActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontFamily: "Changa_700Bold",
    fontSize: 24,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  logoDZ: {
    fontFamily: "Changa_700Bold",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 3,
  },
  appName: {
    fontFamily: "Changa_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: "Changa_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: "Changa_700Bold",
    fontSize: 22,
    color: colors.light.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Changa_400Regular",
    fontSize: 13,
    color: colors.light.mutedForeground,
    textAlign: "center",
    marginBottom: 28,
  },
  langList: { width: "100%", gap: 12 },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.muted,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 12,
  },
  langBtnActive: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.secondary,
  },
  langFlag: { fontSize: 28 },
  langLabel: {
    fontFamily: "Changa_600SemiBold",
    fontSize: 18,
    color: colors.light.foreground,
  },
  langLabelActive: { color: colors.light.primary },
});
