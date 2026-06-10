"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface LedgerRecord {
  id: string;
  custom_id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function CompanyLedgerPage() {
  const [ledgers, setLedgers] = useState<LedgerRecord[]>([]);
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

  const loadLedgers = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyLedgers();
      setLedgers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve ledger statements.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgers();
  }, []);

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
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Account Ledger</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>View detailed account ledgers, payments, and outstanding balances.</p>
        </div>
      </div>

      {/* Ledger Table Card */}
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
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Debit (Charges)</th>
                  <th>Credit (Payments)</th>
                  <th>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No ledger transactions recorded yet.</td>
                  </tr>
                ) : (
                  ledgers.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{l.custom_id}</td>
                      <td>{l.date}</td>
                      <td style={{ fontWeight: "600" }}>{l.description}</td>
                      <td style={{ color: l.debit > 0 ? "#ef4444" : "#64748b", fontWeight: "700" }}>
                        {l.debit > 0 ? `SAR ${parseFloat(l.debit as any).toFixed(2)}` : "-"}
                      </td>
                      <td style={{ color: l.credit > 0 ? "#10b981" : "#64748b", fontWeight: "700" }}>
                        {l.credit > 0 ? `SAR ${parseFloat(l.credit as any).toFixed(2)}` : "-"}
                      </td>
                      <td style={{ fontWeight: 800, color: "#1e293b" }}>SAR {parseFloat(l.balance as any).toFixed(2)}</td>
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
