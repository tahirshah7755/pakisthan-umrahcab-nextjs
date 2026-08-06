"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const router = useRouter();
  const { settings } = useWebsiteSettings();

  const siteLogo = settings?.website_logo || "/logo2.png";
  const siteTitle = settings?.site_title || "Logo";

  // Tab State
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (user) {
      router.push("/admin/hub");
    }
  }, [user, router]);

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

    if (mode === "login") {
      if (!email || !password) {
        showToast("Please enter both email and password.", "error");
        setLoading(false);
        return;
      }

      const res = await login(email, password);
      setLoading(false);

      if (res.success) {
        showToast("Sign in successful! Redirecting to dashboard...", "success");
        setTimeout(() => {
          router.push("/admin/hub");
        }, 1200);
      } else {
        showToast(res.message || "Invalid email or password. Please try again.", "error");
      }
    } else {
      if (!name || !email || !password || !confirmPassword) {
        showToast("Please fill all required fields.", "error");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        showToast("Passwords do not match.", "error");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        showToast("Password must be at least 8 characters long.", "error");
        setLoading(false);
        return;
      }

      const res = await register(name, email, password, confirmPassword);
      setLoading(false);

      if (res.success) {
        showToast(res.message || "Registration successful! Redirecting...", "success");
        setTimeout(() => {
          router.push("/admin/hub");
        }, 1200);
      } else {
        showToast(res.message || "Registration failed. Please try again.", "error");
      }
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
        <div className="login-bg-image"></div>

        {/* Right Side: Form */}
        <div className="login-form-side">
          <img src={siteLogo} className="login-logo" alt={siteTitle} onError={(e) => { (e.target as HTMLImageElement).src = "/logo2.png"; }} />
          
          <h2 className="login-title">Sign in to your account</h2>
          <p className="login-subtitle">Enter your credentials to access your dashboard</p>

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="input-container">
              <span className="login-input-icon">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                className="login-input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Password"
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
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Processing..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
