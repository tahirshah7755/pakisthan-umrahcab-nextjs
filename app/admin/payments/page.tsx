"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface PaymentItem {
  id: string;
  company: string;
  date: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
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
    const loadPayments = async () => {
      try {
        setLoading(true);
        const payList = await api.getPayments();
        if (payList) {
          setPayments(payList.map((p: any) => ({
            id: p.custom_id || `PAY-${p.id}`,
            company: p.company,
            date: p.date,
            method: p.method,
            amount: parseFloat(p.amount) || 0,
            currency: p.currency,
            status: p.status
          })));
        } else {
          // Fallback static payments
          setPayments([
            { id: "PAY-1002", company: "Zahid Travels", date: "2026-05-25", method: "Bank Transfer", amount: 5000, currency: "SAR", status: "Verified" },
            { id: "PAY-1003", company: "Al-Latif Group", date: "2026-05-25", method: "Cash Deposit", amount: 1500, currency: "SAR", status: "Pending" }
          ]);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch payments registry", "error");
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

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
          <h2>General Payments Ledger</h2>
          <p>Log deposits, advance cash payouts, bank transfers, and financial receipts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/admin/payments/add")} className="form-btn-back">
            <i className="fas fa-plus"></i>
            <span>Register Cash Deposit</span>
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
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #059669", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Depositor Company</th>
                  <th>Transaction Date</th>
                  <th>Payment Method</th>
                  <th>Deposited Amount</th>
                  <th>Exchange Currency</th>
                  <th>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.company}</td>
                    <td>{p.date}</td>
                    <td>{p.method}</td>
                    <td style={{ fontWeight: 700, color: "var(--success-color)" }}>{p.amount.toFixed(2)}</td>
                    <td>{p.currency}</td>
                    <td>
                      <span className={`status-pill ${p.status === "Verified" ? "completed" : "pending"}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "25px", color: "#94a3b8" }}>No payments logs found in database.</td>
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
