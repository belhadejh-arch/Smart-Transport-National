import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const { isLoaded } = useLanguage();
  const { C } = useTheme();

  useEffect(() => {
    if (!isLoading && isLoaded) {
      if (user) {
        switch (user.role) {
          case "admin":
          case "sub_admin":
            router.replace("/(admin)/dashboard"); break;
          case "driver":
            router.replace("/(driver)/dashboard"); break;
          case "customer":
            router.replace("/(customer)/dashboard"); break;
          case "distributor":
            router.replace("/(distributor)/dashboard"); break;
        }
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, isLoaded]);

  return (
    <View style={{ flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}
