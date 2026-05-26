"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddInvoicePage() {
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

  const handlePostInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Invoice generated and sent to email!", "success");
    setTimeout(() => {
      router.push("/admin/invoices");
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
        <div>
          <h2>Generate PDF Invoice</h2>
          <p>Generate a new invoice against completed transportation vouchers.</p>
        </div>
        <button onClick={() => router.push("/admin/invoices")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Invoices</span>
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handlePostInvoice} className="form-grid">
          <div>
            <label className="form-label">Bill To Customer *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-building form-icon"></i>
              <select className="form-input form-select" required>
                <option value="">Select corporate customer...</option>
                <option value="Zahid Travels">Zahid Travels</option>
                <option value="Al-Latif Group">Al-Latif Group</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div>
            <label className="form-label">Booking Reference Mapping *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-receipt form-icon"></i>
              <input type="text" className="form-input" placeholder="e.g. UCB-8736..." required />
            </div>
          </div>

          <div>
            <label className="form-label">Invoice Base Amount *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-coins form-icon"></i>
              <input type="number" className="form-input" placeholder="0.00" required />
            </div>
          </div>

          <div>
            <label className="form-label">Default Tax Options</label>
            <div className="form-input-wrapper">
              <i className="fas fa-percent form-icon"></i>
              <select className="form-input form-select">
                <option value="15">VAT 15% (Saudi Standard)</option>
                <option value="0">Zero Tax Rate</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="form-group-full form-submit-row">
            <button type="submit" className="btn-submit">Generate PDF Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
}
