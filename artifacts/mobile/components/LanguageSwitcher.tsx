import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLanguage, Lang } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

const LANGS: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: "ar", label: "العربية",  flag: "🇩🇿", native: "AR" },
  { code: "fr", label: "Français", flag: "🇫🇷", native: "FR" },
  { code: "en", label: "English",  flag: "🇬🇧", native: "EN" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const { C } = useTheme();

  return (
    <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
      <Text style={[s.cardTitle, { color: C.foreground }]}>🌐 اللغة / Language</Text>
      <View style={s.row}>
        {LANGS.map((l) => {
          const active = lang === l.code;
          return (
            <TouchableOpacity
              key={l.code}
              style={[
                s.btn,
                { backgroundColor: active ? C.primary : C.muted, borderColor: active ? C.primary : C.border },
              ]}
              onPress={() => setLang(l.code)}
              activeOpacity={0.8}
            >
              <Text style={s.flag}>{l.flag}</Text>
              <Text style={[s.native, { color: active ? "#FFF" : C.foreground }]}>{l.native}</Text>
              <Text style={[s.label, { color: active ? "rgba(255,255,255,0.85)" : C.mutedForeground }]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardTitle: {
    fontFamily: "Changa_700Bold",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
    gap: 3,
  },
  flag: { fontSize: 22 },
  native: {
    fontFamily: "Changa_700Bold",
    fontSize: 14,
  },
  label: {
    fontFamily: "Changa_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
});
