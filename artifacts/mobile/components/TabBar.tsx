import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

export interface TabItem {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface TabBarProps {
  tabs: TabItem[];
  activeKey: string;
}

export function TabBar({ tabs, activeKey }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { C } = useTheme();
  const styles = makeStyles(C);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 4) }]}>
      {tabs.map(tab => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={tab.onPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            {isActive && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: C.card,
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingTop: 8,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 4,
      position: "relative",
    },
    icon: { fontSize: 22, color: C.mutedForeground, marginBottom: 2 },
    iconActive: { color: C.primary },
    label: {
      fontFamily: "Changa_400Regular",
      fontSize: 10,
      color: C.mutedForeground,
    },
    labelActive: {
      fontFamily: "Changa_600SemiBold",
      color: C.primary,
    },
    indicator: {
      position: "absolute",
      top: 0,
      width: 24,
      height: 3,
      backgroundColor: C.primary,
      borderRadius: 2,
    },
  });
}
