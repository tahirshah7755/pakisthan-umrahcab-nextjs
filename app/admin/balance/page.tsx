"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function BalancePage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
        <div>
          <h2>Accounts Receivable & Balances</h2>
          <p>Monitor company ledger balances, receivables, and net outstanding totals.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Return to Hub</span>
        </button>
      </div>

      <div className="db-stats-row">
        <div className="db-stat-card">
          <div className="db-stat-icon active" style={{ background: "#4f46e5" }}>
            <i className="fas fa-wallet"></i>
          </div>
          <div className="db-stat-info">
            <span className="db-stat-value">SR 12,450.00</span>
            <span className="db-stat-label">Total Receivable</span>
          </div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon completed">
            <i className="fas fa-circle-check"></i>
          </div>
          <div className="db-stat-info">
            <span className="db-stat-value">SR 38,900.00</span>
            <span className="db-stat-label">Total Received</span>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ marginTop: "10px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "15px" }}>Outstanding Receivables Ledger</h3>
        <div className="table-responsive">
          <table className="db-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Net Receivables</th>
                <th>Net Ledger Balance</th>
                <th>Invoice count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Zahid Travels</td>
                <td style={{ color: "var(--danger-color)", fontWeight: 700 }}>SR 500.00</td>
                <td style={{ color: "var(--success-color)", fontWeight: 700 }}>SR +3,700.00</td>
                <td>1 Unpaid</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Al-Latif Group</td>
                <td style={{ color: "var(--danger-color)", fontWeight: 700 }}>SR 7,800.00</td>
                <td style={{ color: "var(--danger-color)", fontWeight: 700 }}>SR -7,800.00</td>
                <td>1 Unpaid</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
