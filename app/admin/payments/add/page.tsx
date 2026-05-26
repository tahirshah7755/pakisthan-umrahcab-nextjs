"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function AddPaymentPage() {
  const router = useRouter();

  // Form states
  const [pmtCompany, setPmtCompany] = useState("");
  const [pmtMethod, setPmtMethod] = useState("Bank Transfer");
  const [pmtAmount, setPmtAmount] = useState(0);
  const [pmtCurrency, setPmtCurrency] = useState("SAR");

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

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmtCompany || pmtAmount <= 0) {
      showToast("Invalid payment details.", "error");
      return;
    }
    try {
      const newPmt = {
        company: pmtCompany,
        date: new Date().toISOString().split("T")[0],
        method: pmtMethod,
        amount: pmtAmount,
        currency: pmtCurrency,
        status: "Pending"
      };
      await api.createPayment(newPmt);
      showToast("General payment registered! Awaiting audit verification.", "success");
      setTimeout(() => {
        router.push("/admin/payments");
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("Failed to register payment.", "error");
    }
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}>
        <div>
          <h2>Register Cash Deposit</h2>
          <p>Add cash receipts and bank transfer deposits to accounts ledger.</p>
        </div>
        <button onClick={() => router.push("/admin/payments")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Payments</span>
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleAddPaymentSubmit} className="form-grid">
          <div>
            <label className="form-label">Depositor Corporate *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-building form-icon"></i>
              <select className="form-input form-select" value={pmtCompany} onChange={(e) => setPmtCompany(e.target.value)} required>
                <option value="">Select corporate account...</option>
                <option value="Zahid Travels">Zahid Travels</option>
                <option value="Al-Latif Group">Al-Latif Group</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div>
            <label className="form-label">Payment Gateway Method *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-credit-card form-icon"></i>
              <select className="form-input form-select" value={pmtMethod} onChange={(e) => setPmtMethod(e.target.value)}>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash Receipt">Cash Deposit (Physical)</option>
                <option value="Online Gateway">Online Checkout Card</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div>
            <label className="form-label">Payment Amount *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-coins form-icon"></i>
              <input type="number" className="form-input" placeholder="0.00" value={pmtAmount || ""} onChange={(e) => setPmtAmount(parseFloat(e.target.value) || 0)} required />
            </div>
          </div>

          <div>
            <label className="form-label">Currency *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-money-bill-1-wave form-icon"></i>
              <select className="form-input form-select" value={pmtCurrency} onChange={(e) => setPmtCurrency(e.target.value)}>
                <option value="SAR">Saudi Riyal (SAR)</option>
                <option value="PKR">Pakistani Rupee (PKR)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="form-group-full form-submit-row">
            <button type="submit" className="btn-submit">Register Deposit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
