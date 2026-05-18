import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import colors from "@/constants/colors";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  C: typeof colors.light;
  setMode: (m: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  isDark: false,
  C: colors.light,
  setMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    AsyncStorage.getItem("nql_theme").then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored as ThemeMode);
      }
    });
  }, []);

  const isDark = mode === "dark" || (mode === "system" && systemScheme === "dark");
  const C = isDark ? colors.dark : colors.light;

  async function setMode(m: ThemeMode) {
    setModeState(m);
    await AsyncStorage.setItem("nql_theme", m);
  }

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    setMode(next);
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, C, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
