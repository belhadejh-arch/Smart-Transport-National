import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { C, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? "#2C5A70" : "#C5DFE8",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { C } = useTheme();
  return (
    <View style={[{ backgroundColor: C.card, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: C.border }, style]}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton height={14} borderRadius={6} />
          <Skeleton width="60%" height={12} borderRadius={6} />
        </View>
      </View>
      <Skeleton height={12} borderRadius={6} />
      <Skeleton width="80%" height={12} borderRadius={6} />
    </View>
  );
}

export function SkeletonStatRow() {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <SkeletonCard style={{ flex: 1 }} />
      <SkeletonCard style={{ flex: 1 }} />
    </View>
  );
}
