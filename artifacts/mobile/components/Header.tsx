import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  title: string;
  showLogout?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, showLogout = false, right }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const { C } = useTheme();
  const styles = makeStyles(C);

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8) }]}>
      <View style={styles.inner}>
        <Text style={styles.logo}>NQL DZ</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>
          {right}
          {showLogout && (
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
              <Text style={styles.logoutText}>⏻</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    container: {
      backgroundColor: C.primary,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 44,
    },
    logo: {
      fontFamily: "Changa_700Bold",
      fontSize: 14,
      color: C.accent,
      letterSpacing: 1,
      minWidth: 56,
    },
    title: {
      fontFamily: "Changa_700Bold",
      fontSize: 18,
      color: "#FFFFFF",
      flex: 1,
      textAlign: "center",
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 56,
      justifyContent: "flex-end",
    },
    logoutBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    logoutText: { fontSize: 18, color: "#FFF" },
  });
}
