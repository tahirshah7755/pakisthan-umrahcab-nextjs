"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface InvoiceRecord {
  id: string;
  invoice_code: string;
  customer: string;
  date: string;
  period: string;
  amount: number;
  balance: number;
  status: string;
  type: string;
  remarks: string;
}

export default function CompanyInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
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

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyInvoices();
      setInvoices(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve corporate invoices.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("paid") && !s.includes("unpaid")) return "completed";
    if (s.includes("partial")) return "pending";
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
      <div className="form-header-card mobile-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>My Invoices</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Manage and view all corporate invoices and billing summaries.</p>
        </div>
      </div>

      {/* Invoices Grid Card */}
      <div className="table-card mobile-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div className="mobile-toolbar" style={{ display: "flex", gap: "6px" }}>
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
                  <th>Invoice Code</th>
                  <th>Customer Name</th>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Invoice Type</th>
                  <th>Amount</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No invoices registered under this account.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{inv.invoice_code}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                      <td>{inv.date}</td>
                      <td>{inv.period || "N/A"}</td>
                      <td>
                        <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{inv.type || "General"}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>SAR {parseFloat(inv.amount as any || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: "#ef4444" }}>SAR {parseFloat(inv.balance as any || 0).toFixed(2)}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(inv.status)}`}>{inv.status}</span>
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
        @media (max-width: 768px) {
          .mobile-header-card {
            padding: 15px 20px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 15px !important;
            text-align: center !important;
          }
          .mobile-card {
            padding: 15px !important;
          }
          .mobile-toolbar {
            width: 100% !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          .mobile-toolbar button {
            flex: 1 !important;
            min-width: 70px !important;
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}
