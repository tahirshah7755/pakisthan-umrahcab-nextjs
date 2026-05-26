"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddLedgerPage() {
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

  const handlePostLedger = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Ledger adjustment posted successfully!", "success");
    setTimeout(() => {
      router.push("/admin/ledgers");
    }, 1000);
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" }}>
        <div>
          <h2>Create Ledger Entry</h2>
          <p>Add manual ledger adjustments or cash balance offsets.</p>
        </div>
        <button onClick={() => router.push("/admin/ledgers")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Ledger</span>
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handlePostLedger} className="form-grid">
          <div>
            <label className="form-label">Target Corporate Account *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-building form-icon"></i>
              <select className="form-input form-select" required>
                <option value="">Select associated account...</option>
                <option value="Zahid Travels">Zahid Travels</option>
                <option value="Al-Latif Group">Al-Latif Group</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div>
            <label className="form-label">Entry Type Mapping *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-arrows-spin form-icon"></i>
              <select className="form-input form-select" required>
                <option value="Debit">Debit (Dr) - Reduction</option>
                <option value="Credit">Credit (Cr) - Addition</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div>
            <label className="form-label">Amount (SR) *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-coins form-icon"></i>
              <input type="number" className="form-input" placeholder="0.00" required />
            </div>
          </div>

          <div>
            <label className="form-label">Adjustment Narrative *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-comment form-icon"></i>
              <input type="text" className="form-input" placeholder="Narrative notes..." required />
            </div>
          </div>

          <div className="form-group-full form-submit-row">
            <button type="submit" className="btn-submit">Post Ledger Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
}
