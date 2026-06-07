"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: { email: string; name?: string; username?: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, passwordConfirm: string) => Promise<{ success: boolean; message: string }>;
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
  const [user, setUser] = useState<{ email: string; name?: string; username?: string } | null>(null);
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

  // Handle responsive sidebar default state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Protect admin routes
  useEffect(() => {
    const isPublicRoute = pathname === "/" || pathname === "/login";
    const savedUser = sessionStorage.getItem("umrahcab_user");
    
    if (!savedUser && !isPublicRoute) {
      router.push("/login");
    }
  }, [pathname, router]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
      const loginUrl = apiBase.endsWith("/")
        ? apiBase.replace(/umrahcab\/?$/, "auth/admin/login")
        : apiBase.replace("umrahcab", "auth/admin/login");

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const resData = await response.json();
      const dataObj = resData?.data || resData;
      const token = dataObj?.token;
      const admin = dataObj?.admin;

      if (token) {
        const newUser = { 
          email: admin?.email || email,
          name: admin?.name || "Admin",
          username: admin?.username || ""
        };
        setUser(newUser);
        sessionStorage.setItem("umrahcab_user", JSON.stringify(newUser));
        sessionStorage.setItem("umrahcab_token", token);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Admin login API call failed:", err);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, passwordConfirm: string): Promise<{ success: boolean; message: string }> => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
      const registerUrl = apiBase.endsWith("/")
        ? apiBase.replace(/umrahcab\/?$/, "auth/admin/register")
        : apiBase.replace("umrahcab", "auth/admin/register");

      const response = await fetch(registerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirm
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: resData.message || "Registration failed. Please check validation rules." 
        };
      }

      const dataObj = resData?.data || resData;
      const token = dataObj?.token;
      const admin = dataObj?.admin;

      if (token) {
        const newUser = { 
          email: admin?.email || email,
          name: admin?.name || name,
          username: admin?.username || ""
        };
        setUser(newUser);
        sessionStorage.setItem("umrahcab_user", JSON.stringify(newUser));
        sessionStorage.setItem("umrahcab_token", token);
        return { success: true, message: resData.message || "Registration successful!" };
      }
      return { success: false, message: "No token returned from server." };
    } catch (err) {
      console.error("Admin registration API call failed:", err);
      return { success: false, message: "API connection failed." };
    }
  };

  const logout = () => {
    setUser(null);
    setExtrasUnlocked(false);
    sessionStorage.removeItem("umrahcab_user");
    sessionStorage.removeItem("umrahcab_token");
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
        register,
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
