import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  small?: boolean;
}

export function StatCard({ label, value, icon, color, small }: StatCardProps) {
  const C = colors.light;
  return (
    <View style={[styles.card, small && styles.cardSmall]}>
      {icon && <Text style={[styles.icon, small && styles.iconSmall]}>{icon}</Text>}
      <Text style={[styles.value, small && styles.valueSmall, color ? { color } : {}]}>{value}</Text>
      <Text style={[styles.label, small && styles.labelSmall]}>{label}</Text>
    </View>
  );
}

const C = colors.light;
const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardSmall: { padding: 12 },
  icon: { fontSize: 28, marginBottom: 8 },
  iconSmall: { fontSize: 20, marginBottom: 4 },
  value: {
    fontFamily: "Changa_700Bold",
    fontSize: 22,
    color: C.primary,
    marginBottom: 4,
  },
  valueSmall: { fontSize: 16 },
  label: {
    fontFamily: "Changa_400Regular",
    fontSize: 12,
    color: C.mutedForeground,
    textAlign: "center",
  },
  labelSmall: { fontSize: 11 },
});
