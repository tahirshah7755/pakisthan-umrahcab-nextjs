"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface InvoiceItem {
  id: string;
  customer: string;
  date: string;
  amount: number;
  balance: number;
  status: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const invList = await api.getInvoices();
        if (invList) {
          setInvoices(invList.map((i: any) => ({
            id: i.invoice_code || `INV-${i.id}`,
            customer: i.customer,
            date: i.date,
            amount: parseFloat(i.amount) || 0,
            balance: parseFloat(i.balance) || 0,
            status: i.status
          })));
        } else {
          // Fallback static data
          setInvoices([
            { id: "INV-8736", customer: "Zobair Ahmad", date: "2026-05-25", amount: 1200, balance: 500, status: "Pending" },
            { id: "INV-8737", customer: "Abu Bakar", date: "2026-05-25", amount: 2400, balance: 0, status: "Paid" }
          ]);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch invoices register", "error");
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, []);

  const handleMarkPaid = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, balance: 0, status: "Paid" } : inv));
    showToast("Invoice marked as Paid successfully!", "success");
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
          <h2>Billing & Invoice Register</h2>
          <p>Review customer billing invoices, paid receipts, and pending accounts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/admin/invoices/add")} className="form-btn-back">
            <i className="fas fa-plus"></i>
            <span>Create PDF Invoice</span>
          </button>
          <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
          </button>
        </div>
      </div>

      <div className="table-card" style={{ padding: "25px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #1e293b", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer Name</th>
                  <th>Billing Date</th>
                  <th>Base Amount</th>
                  <th>Outstanding Bal</th>
                  <th>Invoice Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{inv.id}</td>
                    <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                    <td>{inv.date}</td>
                    <td style={{ fontWeight: 700 }}>SR {inv.amount.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: inv.balance > 0 ? "var(--danger-color)" : "var(--success-color)" }}>
                      SR {inv.balance.toFixed(2)}
                    </td>
                    <td>
                      <span className={`status-pill ${inv.status === "Paid" ? "completed" : "pending"}`}>{inv.status}</span>
                    </td>
                    <td>
                      <button title="View PDF" onClick={() => showToast("Exporting Invoice view as PDF!", "success")} style={{ background: "#f0fdf4", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", color: "var(--success-color)", marginRight: "5px" }}>
                        <i className="fas fa-file-pdf"></i>
                      </button>
                      {inv.status !== "Paid" && (
                        <button title="Mark Paid" onClick={() => handleMarkPaid(inv.id)} style={{ background: "#f8fafc", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", color: "var(--primary-color)" }}>
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "25px", color: "#94a3b8" }}>No invoices found in database.</td>
                  </tr>
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
