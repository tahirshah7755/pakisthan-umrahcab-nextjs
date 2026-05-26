"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: { username: string } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  extrasUnlocked: boolean;
  unlockExtras: (pin: string) => boolean;
  lockExtras: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [extrasUnlocked, setExtrasUnlocked] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem("umrahcab_user");
    const savedExtras = sessionStorage.getItem("umrahcab_extras_unlocked");
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedExtras === "true") {
      setExtrasUnlocked(true);
    }
  }, []);

  // Protect admin routes
  useEffect(() => {
    const isPublicRoute = pathname === "/" || pathname === "/login";
    const savedUser = sessionStorage.getItem("umrahcab_user");
    
    if (!savedUser && !isPublicRoute) {
      router.push("/login");
    }
  }, [pathname, router]);

  const login = (username: string, password: string): boolean => {
    if (username.toLowerCase() === "umrahcab" && password === "786umrahcab786") {
      const newUser = { username: "umrahcab" };
      setUser(newUser);
      sessionStorage.setItem("umrahcab_user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setExtrasUnlocked(false);
    sessionStorage.removeItem("umrahcab_user");
    sessionStorage.removeItem("umrahcab_extras_unlocked");
    router.push("/login");
  };

  const unlockExtras = (pin: string): boolean => {
    if (pin === "786") {
      setExtrasUnlocked(true);
      sessionStorage.setItem("umrahcab_extras_unlocked", "true");
      return true;
    }
    return false;
  };

  const lockExtras = () => {
    setExtrasUnlocked(false);
    sessionStorage.removeItem("umrahcab_extras_unlocked");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        extrasUnlocked,
        unlockExtras,
        lockExtras,
        sidebarOpen,
        setSidebarOpen,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
