"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface PaymentRecord {
  id: string;
  custom_id: string;
  date: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
}

export default function CompanyPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve payments history.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("success") || s.includes("approve") || s.includes("paid")) return "completed";
    if (s.includes("pending") || s.includes("process")) return "pending";
    return "cancelled";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast.show && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600" }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ marginRight: "8px" }}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Payments History</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>View detailed records of all deposits and processed balance payments.</p>
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="table-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {["Copy", "CSV", "Excel", "PDF", "Print"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => showToast(`${fmt} Export Triggered!`, "success")}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No payments registered under this corporate account.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{p.custom_id}</td>
                      <td>{p.date}</td>
                      <td style={{ fontWeight: 600 }}>{p.method}</td>
                      <td style={{ fontWeight: 700, color: "#10b981" }}>SAR {parseFloat(p.amount as any).toFixed(2)}</td>
                      <td>{p.currency}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(p.status)}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
