"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      showToast("Please enter both username and password.", "error");
      return;
    }

    const success = login(username, password);

    if (success) {
      showToast("Sign in successful! Redirecting to dashboard...", "success");
      setTimeout(() => {
        router.push("/admin/hub");
      }, 1000);
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
        <div className="login-bg-image"></div>

        {/* Right Side: Form */}
        <div className="login-form-side">
          <img src="/logo2.png" className="login-logo" alt="Logo" />
          <h2 className="login-title">Sign in to your account</h2>
          <p className="login-subtitle">
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleSubmit}>
            {/* Username field */}
            <div className="input-container">
              <span className="login-input-icon">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                className="login-input"
                placeholder="Username"
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`far ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </span>
            </div>

            {/* Empty space matching target layout */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            ></div>

            {/* Submit Button */}
            <button type="submit" className="login-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
