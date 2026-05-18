import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Image, Dimensions, StatusBar } from "react-native";

const { width, height } = Dimensions.get("window");

interface SplashIntroProps {
  onFinish: () => void;
}

export function SplashIntro({ onFinish }: SplashIntroProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
      <StatusBar hidden />
      <Image
        source={require("../assets/images/splash-intro.png")}
        style={styles.image}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 9999,
    backgroundColor: "#2C6B7F",
  },
  image: {
    width,
    height,
  },
});
