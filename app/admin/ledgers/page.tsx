"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface LedgerItem {
  id: string;
  company: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function LedgersPage() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
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
    const loadLedgers = async () => {
      try {
        setLoading(true);
        const ledgList = await api.getLedgers();
        if (ledgList) {
          setLedgers(ledgList.map((l: any) => ({
            id: l.custom_id || `LED-${l.id}`,
            company: l.company,
            date: l.date,
            description: l.description,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            balance: parseFloat(l.balance) || 0
          })));
        } else {
          // Fallback static ledgers
          setLedgers([
            { id: "LED-1", company: "Zahid Travels", date: "2026-05-25", description: "Deposit to Jeddah Bank Account", debit: 0, credit: 5000, balance: 5000 },
            { id: "LED-2", company: "Al-Latif Group", date: "2026-05-25", description: "Payment for Transport Booking BKG-9843", debit: 1200, credit: 0, balance: 3800 }
          ]);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch ledger logs", "error");
      } finally {
        setLoading(false);
      }
    };
    loadLedgers();
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" }}>
        <div>
          <h2>System General Ledgers</h2>
          <p>Audit bank deposits, cash withdrawals, and transport trip transactions.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/admin/ledgers/add")} className="form-btn-back" style={{ background: "var(--success-color)" }}>
            <i className="fas fa-plus"></i>
            <span>Add Ledger Entry</span>
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
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #1e3a8a", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Ledger ID</th>
                  <th>Company</th>
                  <th>Transaction Date</th>
                  <th>Description</th>
                  <th>Debit (Dr)</th>
                  <th>Credit (Cr)</th>
                  <th>Net Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 700 }}>{l.id}</td>
                    <td style={{ fontWeight: 600 }}>{l.company}</td>
                    <td>{l.date}</td>
                    <td>{l.description}</td>
                    <td style={{ color: l.debit > 0 ? "var(--danger-color)" : "", fontWeight: l.debit > 0 ? 700 : 500 }}>
                      {l.debit > 0 ? `SR ${l.debit.toFixed(2)}` : "-"}
                    </td>
                    <td style={{ color: l.credit > 0 ? "var(--success-color)" : "", fontWeight: l.credit > 0 ? 700 : 500 }}>
                      {l.credit > 0 ? `SR ${l.credit.toFixed(2)}` : "-"}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>SR {l.balance.toFixed(2)}</td>
                  </tr>
                ))}
                {ledgers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "25px", color: "#94a3b8" }}>No ledger logs found.</td>
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
