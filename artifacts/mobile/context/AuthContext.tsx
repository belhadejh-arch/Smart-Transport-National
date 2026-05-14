import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { router } from "expo-router";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
setBaseUrl(API_BASE);

export interface AuthUser {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  role: "admin" | "driver" | "customer" | "distributor";
  profileImage: string | null;
  licenseNumber: string | null;
  balance: number;
  status: string;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  switchAccount: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  setAuthTokenGetter(() => tokenRef.current);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem("nql_token"),
        AsyncStorage.getItem("nql_user"),
      ]);
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        tokenRef.current = storedToken;
        setToken(storedToken);
        setUser(parsedUser);
        // Refresh user data from API
        try {
          const resp = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (resp.ok) {
            const freshUser = await resp.json() as AuthUser;
            setUser(freshUser);
            await AsyncStorage.setItem("nql_user", JSON.stringify(freshUser));
          } else {
            // Token expired
            await clearAuth();
          }
        } catch {
          // Keep stored user if API fails
        }
      }
    } catch {}
    setIsLoading(false);
  }

  async function clearAuth() {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove(["nql_token", "nql_user"]);
  }

  async function login(newToken: string, newUser: AuthUser) {
    tokenRef.current = newToken;
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem("nql_token", newToken);
    await AsyncStorage.setItem("nql_user", JSON.stringify(newUser));
    navigateToRole(newUser.role);
  }

  async function logout() {
    await clearAuth();
    router.replace("/login");
  }

  async function switchAccount() {
    await clearAuth();
    router.replace("/login");
  }

  async function refreshUser() {
    if (!tokenRef.current) return;
    try {
      const resp = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (resp.ok) {
        const freshUser = await resp.json() as AuthUser;
        setUser(freshUser);
        await AsyncStorage.setItem("nql_user", JSON.stringify(freshUser));
      }
    } catch {}
  }

  function navigateToRole(role: string) {
    switch (role) {
      case "admin": router.replace("/(admin)/dashboard"); break;
      case "driver": router.replace("/(driver)/dashboard"); break;
      case "customer": router.replace("/(customer)/dashboard"); break;
      case "distributor": router.replace("/(distributor)/dashboard"); break;
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchAccount, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
