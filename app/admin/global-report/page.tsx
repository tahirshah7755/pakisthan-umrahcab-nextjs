"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function GlobalPerformanceReportPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "1000px", margin: "0 auto", padding: "10px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Global Performance Report</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Consolidated summary statistics and booking volume insights across all companies.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/extras")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Utilities</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="db-stats-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="db-stat-card" style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", display: "flex", alignItems: "center", gap: "20px" }}>
          <div className="db-stat-icon active" style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" }}>
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="db-stat-info" style={{ display: "flex", flexDirection: "column" }}>
            <span className="db-stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b" }}>12 Bookings</span>
            <span className="db-stat-label" style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>This Month</span>
          </div>
        </div>

        <div className="db-stat-card" style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", display: "flex", alignItems: "center", gap: "20px" }}>
          <div className="db-stat-icon completed" style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#dcfce7", color: "#166534", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px" }}>
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <div className="db-stat-info" style={{ display: "flex", flexDirection: "column" }}>
            <span className="db-stat-value" style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b" }}>SR 58,950.00</span>
            <span className="db-stat-label" style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Gross Value</span>
          </div>
        </div>
      </div>
    </div>
  );
}
