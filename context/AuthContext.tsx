"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: { 
    email: string; 
    name?: string; 
    username?: string;
    role?: string;
    permissions?: Record<string, string> | null;
  } | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, passwordConfirm: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  // B2B Company Auth
  companyUser: { id: string; name: string; agent_username: string; email: string; logo_path?: string } | null;
  companyLogin: (agent_username: string, agent_password: string) => Promise<{ success: boolean; message?: string }>;
  companyLogout: () => void;
  // Driver Auth
  driverUser: { id: string; name: string; username: string; phone?: string; vehicle_id?: number; edit_rights?: boolean } | null;
  driverLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  driverLogout: () => void;
  
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
  const [user, setUser] = useState<{ 
    email: string; 
    name?: string; 
    username?: string;
    role?: string;
    permissions?: Record<string, string> | null;
  } | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("umrahcab_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [companyUser, setCompanyUser] = useState<{ id: string; name: string; agent_username: string; email: string; logo_path?: string } | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("umrahcab_company_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [driverUser, setDriverUser] = useState<{ id: string; name: string; username: string; phone?: string; vehicle_id?: number; edit_rights?: boolean } | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("umrahcab_driver_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [extrasUnlocked, setExtrasUnlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("umrahcab_extras_unlocked") === "true";
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  // Load state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("umrahcab_user");
    const savedCompanyUser = localStorage.getItem("umrahcab_company_user");
    const savedDriverUser = localStorage.getItem("umrahcab_driver_user");
    const savedExtras = localStorage.getItem("umrahcab_extras_unlocked");
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedCompanyUser) {
      setCompanyUser(JSON.parse(savedCompanyUser));
    }
    if (savedDriverUser) {
      setDriverUser(JSON.parse(savedDriverUser));
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

  // Protect routes
  useEffect(() => {
    const savedUser = localStorage.getItem("umrahcab_user");
    const savedCompanyUser = localStorage.getItem("umrahcab_company_user");
    const savedDriverUser = localStorage.getItem("umrahcab_driver_user");
    
    if (pathname.startsWith("/driver")) {
      const isDriverPublicRoute = pathname === "/driver/login";
      if (!savedDriverUser && !isDriverPublicRoute) {
        router.push("/driver/login");
      }
    } else if (pathname.startsWith("/company")) {
      const isCompanyPublicRoute = pathname === "/company/login";
      if (!savedCompanyUser && !isCompanyPublicRoute) {
        router.push("/company/login");
      }
    } else {
      const isPublicRoute = pathname === "/" || pathname === "/login" || pathname.startsWith("/driver") || pathname.startsWith("/company");
      if (!savedUser && !isPublicRoute) {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
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
        credentials: "include",
      });

      const resData = await response.json();

      if (!response.ok) {
        return { success: false, message: resData.message || "Invalid email or password" };
      }

      const dataObj = resData?.data || resData;
      const token = dataObj?.token;
      const admin = dataObj?.admin;

      if (token) {
        const newUser = { 
          email: admin?.email || email,
          name: admin?.name || "Admin",
          username: admin?.username || "",
          role: admin?.role || "SUPER_ADMIN",
          permissions: admin?.permissions || null
        };
        setUser(newUser);
        localStorage.setItem("umrahcab_user", JSON.stringify(newUser));
        localStorage.setItem("umrahcab_token", token);
        return { success: true };
      }
      return { success: false, message: "Authentication failed. No token returned." };
    } catch (err: any) {
      console.error("Admin login API call failed:", err);
      return { success: false, message: err?.message || "Failed to connect to login server." };
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
        credentials: "include",
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
          username: admin?.username || "",
          role: admin?.role || "SUPER_ADMIN",
          permissions: admin?.permissions || null
        };
        setUser(newUser);
        localStorage.setItem("umrahcab_user", JSON.stringify(newUser));
        localStorage.setItem("umrahcab_token", token);
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
    localStorage.removeItem("umrahcab_user");
    localStorage.removeItem("umrahcab_token");
    localStorage.removeItem("umrahcab_extras_unlocked");
    router.push("/login");
  };

  const companyLogin = async (agent_username: string, agent_password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
      const loginUrl = apiBase.endsWith("/")
        ? apiBase.replace(/umrahcab\/?$/, "auth/company/login")
        : apiBase.replace("umrahcab", "auth/company/login");

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent_username, agent_password }),
        credentials: "include",
      });

      const resData = await response.json();

      if (!response.ok) {
        return { success: false, message: resData.message || "Invalid agent username or password" };
      }

      const dataObj = resData?.data || resData;
      const token = dataObj?.token;
      const company = dataObj?.company;

      if (token) {
        const newCompanyUser = {
          id: String(company?.id),
          name: company?.name || "B2B Agent",
          agent_username: company?.agent_username || agent_username,
          email: company?.email || "",
          logo_path: company?.logo_path || ""
        };
        setCompanyUser(newCompanyUser);
        localStorage.setItem("umrahcab_company_user", JSON.stringify(newCompanyUser));
        localStorage.setItem("umrahcab_company_token", token);
        return { success: true };
      }
      return { success: false, message: "Authentication failed. No token returned." };
    } catch (err: any) {
      console.error("Company login API call failed:", err);
      return { success: false, message: err?.message || "Failed to connect to B2B login server." };
    }
  };

  const companyLogout = () => {
    setCompanyUser(null);
    localStorage.removeItem("umrahcab_company_user");
    localStorage.removeItem("umrahcab_company_token");
    router.push("/company/login");
  };

  const driverLogin = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
      const loginUrl = apiBase.endsWith("/")
        ? apiBase.replace(/umrahcab\/?$/, "auth/driver/login")
        : apiBase.replace("umrahcab", "auth/driver/login");

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const resData = await response.json();

      if (!response.ok) {
        return { success: false, message: resData.message || "Invalid driver username or password" };
      }

      const dataObj = resData?.data || resData;
      const token = dataObj?.token;
      const driver = dataObj?.driver;

      if (token) {
        const newDriverUser = {
          id: String(driver?.id),
          name: driver?.name || "Driver",
          username: driver?.username || username,
          phone: driver?.phone || "",
          vehicle_id: driver?.vehicle_id,
          edit_rights: !!driver?.edit_rights
        };
        setDriverUser(newDriverUser);
        localStorage.setItem("umrahcab_driver_user", JSON.stringify(newDriverUser));
        localStorage.setItem("umrahcab_driver_token", token);
        return { success: true };
      }
      return { success: false, message: "Authentication failed. No token returned." };
    } catch (err: any) {
      console.error("Driver login API call failed:", err);
      return { success: false, message: err?.message || "Failed to connect to driver login server." };
    }
  };

  const driverLogout = () => {
    setDriverUser(null);
    localStorage.removeItem("umrahcab_driver_user");
    localStorage.removeItem("umrahcab_driver_token");
    router.push("/driver/login");
  };

  const unlockExtras = (pin: string): boolean => {
    if (pin === "786") {
      setExtrasUnlocked(true);
      localStorage.setItem("umrahcab_extras_unlocked", "true");
      return true;
    }
    return false;
  };

  const lockExtras = () => {
    setExtrasUnlocked(false);
    localStorage.removeItem("umrahcab_extras_unlocked");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        companyUser,
        companyLogin,
        companyLogout,
        driverUser,
        driverLogin,
        driverLogout,
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
