"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function MembersPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    agencyName: "",
    agree: false
  });

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (activeTab === "login") {
        alert("Login successful! Redirecting you to Portal Genesis.");
        router.push("/login");
      } else {
        alert("Account registered successfully! Welcome aboard.");
        setActiveTab("login");
      }
    }, 1500);
  };

  return (
    <div style={{ minHeight: "90vh", paddingTop: "120px", paddingBottom: "80px", background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)", display: "flex", alignItems: "center" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%", padding: "0 20px" }}>
        
        {/* Logo container */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img src="/logo2.png" alt="Umrah Cab" style={{ height: "64px", borderRadius: "12px", marginBottom: "12px" }} />
          <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 800 }}>Members Executive Portal</h2>
          <p style={{ color: "#8b949e", fontSize: "13px" }}>Exclusive agency rates, bulk bookings, and digital vouchers.</p>
        </div>

        {/* Form Wrap */}
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "20px", overflow: "hidden", boxShadow: "0 15px 40px rgba(0,0,0,0.4)" }}>
          
          {/* Tab buttons */}
          <div style={{ display: "flex", borderBottom: "1px solid #30363d" }}>
            <button
              onClick={() => setActiveTab("login")}
              style={{
                flex: 1,
                padding: "16px",
                background: activeTab === "login" ? "#0d1117" : "transparent",
                color: activeTab === "login" ? "var(--uc-primary)" : "#8b949e",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                borderBottom: activeTab === "login" ? "2px solid var(--uc-primary)" : "none",
                fontSize: "14px",
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              style={{
                flex: 1,
                padding: "16px",
                background: activeTab === "signup" ? "#0d1117" : "transparent",
                color: activeTab === "signup" ? "var(--uc-primary)" : "#8b949e",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                borderBottom: activeTab === "signup" ? "2px solid var(--uc-primary)" : "none",
                fontSize: "14px",
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form Body */}
          <div style={{ padding: "32px" }}>
            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {activeTab === "signup" && (
                <>
                  <div className="uc-form-group">
                    <label className="uc-form-label" style={{ color: "#d0d7de" }}>Full Name *</label>
                    <input
                      type="text"
                      className="uc-form-input"
                      style={{ background: "#0d1117", border: "1px solid #30363d", color: "#fff" }}
                      placeholder="e.g. Salim Khan..."
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="uc-form-group">
                    <label className="uc-form-label" style={{ color: "#d0d7de" }}>Phone / WhatsApp *</label>
                    <input
                      type="text"
                      className="uc-form-input"
                      style={{ background: "#0d1117", border: "1px solid #30363d", color: "#fff" }}
                      placeholder="e.g. +96656..."
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="uc-form-group">
                    <label className="uc-form-label" style={{ color: "#d0d7de" }}>Travel Agency Name (Optional)</label>
                    <input
                      type="text"
                      className="uc-form-input"
                      style={{ background: "#0d1117", border: "1px solid #30363d", color: "#fff" }}
                      placeholder="e.g. Madinah Travels..."
                      value={formData.agencyName}
                      onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="uc-form-group">
                <label className="uc-form-label" style={{ color: "#d0d7de" }}>Email Address *</label>
                <input
                  type="email"
                  className="uc-form-input"
                  style={{ background: "#0d1117", border: "1px solid #30363d", color: "#fff" }}
                  placeholder="name@domain.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="uc-form-group">
                <label className="uc-form-label" style={{ color: "#d0d7de" }}>Password *</label>
                <input
                  type="password"
                  className="uc-form-input"
                  style={{ background: "#0d1117", border: "1px solid #30363d", color: "#fff" }}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {activeTab === "signup" ? (
                <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", color: "#8b949e", fontSize: "12px", lineHeight: 1.4 }}>
                  <input type="checkbox" required style={{ marginTop: "3px" }} checked={formData.agree} onChange={(e) => setFormData({ ...formData, agree: e.target.checked })} />
                  <span>I agree to the UmrahCab Terms of Service, Privacy Policies, and dispatch agent regulations.</span>
                </label>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer", color: "#8b949e" }}>
                    <input type="checkbox" /> Remember me
                  </label>
                  <a href="#" style={{ color: "var(--uc-primary)", textDecoration: "none" }}>Forgot Password?</a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="uc-btn-primary"
                style={{ width: "100%", justifyContent: "center", height: "45px", marginTop: "10px" }}
              >
                {loading ? "Please wait..." : activeTab === "login" ? "Sign In" : "Create Account"}
              </button>

            </form>
          </div>
        </div>

        {/* Footer / Helper Links */}
        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#8b949e" }}>
          <span>Looking for the Administrative Panel? </span>
          <a href="/login" style={{ color: "var(--uc-primary)", textDecoration: "none", fontWeight: 600 }}>Login here</a>
        </div>

      </div>
    </div>
  );
}
