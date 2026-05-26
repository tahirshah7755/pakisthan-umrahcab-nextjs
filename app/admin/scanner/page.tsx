"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScannerPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #090d16 0%, #1e293b 100%)" }}>
        <div>
          <h2>Pilgrim Visa / Passport Document Scanner</h2>
          <p>Simulate document optical scanning. Use this to auto-populate pilgrim bookings.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      <div className="form-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "40px 20px" }}>
        <div style={{ width: "280px", height: "180px", border: "3px dashed #64748b", borderRadius: "12px", position: "relative", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: "100%", height: "2px", background: "rgba(34, 197, 94, 0.6)", top: "50%", animation: "scanLine 2s infinite linear" }}></div>
          <i className="fas fa-passport" style={{ fontSize: "3rem", color: "#334155" }}></i>
        </div>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Align Passport MRZ Zone inside scanner framework</h3>
        <button
          onClick={() => {
            showToast("Scanning Document MRZ Data...", "success");
            setTimeout(() => {
              showToast("Scan Success! Pilgrim: AMJAD ALI, Passport: EJ9843829", "success");
            }, 1500);
          }}
          className="btn-submit"
        >
          Simulate Scan Capture
        </button>

        <style>{`
          @keyframes scanLine {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          div[style*="scanLine"] {
            animation: scanLine 2s infinite linear;
          }
        `}</style>
      </div>
    </div>
  );
}
