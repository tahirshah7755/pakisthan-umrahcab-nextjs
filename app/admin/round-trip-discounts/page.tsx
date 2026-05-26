"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoundTripDiscountsPage() {
  const router = useRouter();

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Discount rate configuration updated successfully!", "success");
    setTimeout(() => {
      router.push("/admin/extras");
    }, 1000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "900px", margin: "0 auto", padding: "10px" }}>
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

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Round Trip Discount Rates</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Configure percentage or fixed discount offsets dynamically triggered for multi-leg bookings.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/extras")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Utilities</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <form onSubmit={handleSaveDiscount} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Minimum Legs Trigger *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-arrows-spin form-icon" style={{ color: "#16a34a" }}></i>
                <select className="form-input form-select" required style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}>
                  <option value="2">2 Legs (Round Trip standard)</option>
                  <option value="3">3+ Legs (Full Circuit discount)</option>
                </select>
                <i className="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Discount Percentage (%) *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-percent form-icon" style={{ color: "#16a34a" }}></i>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 5" 
                  defaultValue="5" 
                  required 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: "15px" }}>
            <button 
              type="submit" 
              className="btn-submit" 
              style={{ 
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", 
                background: "#15803d", height: "50px", fontWeight: "600", fontSize: "15px", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer" 
              }}
            >
              <i className="fas fa-floppy-disk"></i>
              <span>Save Discount Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
