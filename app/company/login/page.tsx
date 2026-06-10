"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CompanyLoginPage() {
  const { companyLogin, companyUser } = useAuth();
  const router = useRouter();

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "info",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (companyUser) {
      router.push("/company/dashboard");
    }
  }, [companyUser, router]);

  // Apply custom body style
  useEffect(() => {
    document.body.classList.add("login-body");
    return () => {
      document.body.classList.remove("login-body");
    };
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      showToast("Please enter both agent username and password.", "error");
      setLoading(false);
      return;
    }

    const success = await companyLogin(username, password);
    setLoading(false);

    if (success) {
      showToast("B2B Sign in successful! Redirecting...", "success");
      setTimeout(() => {
        router.push("/company/dashboard");
      }, 1200);
    } else {
      showToast("Invalid username or password. Please try again.", "error");
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-circle-check text-success"
                  : toast.type === "error"
                  ? "fa-circle-xmark text-danger"
                  : "fa-circle-info text-primary"
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="login-card-container">
        {/* Left Side: Background Image */}
        <div className="login-bg-image" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px", color: "#ffffff" }}>
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#d4af37", marginBottom: "15px" }}>Umrah Cab B2B</h1>
            <p style={{ fontSize: "16px", color: "#94a3b8", lineHeight: "1.6" }}>
              Exclusive agent gateway for managing bookings, checking vouchers, following up on statements, and managing corporate account ledgers.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-side">
          <img src="/logo2.png" className="login-logo" alt="Logo" />
          
          <h2 className="login-title">Agent Portal</h2>
          <p className="login-subtitle">Enter your agent credentials to access your B2B account</p>

          <form onSubmit={handleSubmit}>
            {/* Username field */}
            <div className="input-container">
              <span className="login-input-icon">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                className="login-input"
                placeholder="Agent Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Password field */}
            <div className="input-container">
              <span className="login-input-icon">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Agent Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              >
                <i
                  className={`far ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </span>
            </div>

            <div style={{ marginBottom: "1.5rem" }}></div>

            {/* Submit Button */}
            <button type="submit" className="login-btn" disabled={loading} style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", color: "#ffffff" }}>
              {loading ? "Verifying Agent..." : "Sign In to Portal"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
