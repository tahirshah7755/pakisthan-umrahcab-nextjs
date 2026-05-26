"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetPerformanceQuery } from "@/store/api/performanceApi";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PerformancePage() {
  const router = useRouter();

  const { data: perfData, isLoading, isFetching } = useGetPerformanceQuery(undefined);

  const summary = perfData?.summary || {
    total_bookings: 0,
    active_routes: 0,
    verified_payments: 0,
    total_turnover: 0,
  };

  const branches = perfData?.branches || [];

  // Calculate max revenue to draw scaling progress bars
  const maxRevenue = Math.max(...branches.map((b: any) => b.total_revenue), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "10px" }}>
      
      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div>
          <h2>Agent Performance</h2>
          <p>Gain real-time insights on corporate bookings volumes, branch sales revenue, and ledger offsets.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isFetching && (
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#ffffff" }}></div>
              Syncing...
            </span>
          )}
          <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div className="spinner" style={{ borderTopColor: "#2563eb" }}></div>
          <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Fetching performance analytics...</span>
        </div>
      ) : (
        <>
          {/* Top Summary Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            
            <div className="filter-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #3b82f6" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <i className="fas fa-bus" style={{ fontSize: "20px", color: "#64748b" }}></i>
              </div>
              <div>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#3b82f6", display: "block" }}>{summary.total_bookings} Active</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#3b82f6", display: "block" }}>{fmt(summary.total_turnover)}</span>
                <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600", display: "block" }}>Cancelled: {branches.reduce((acc: number, b: any) => acc + (b.cancelled_bookings || 0), 0)}</span>
              </div>
            </div>

            <div className="filter-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #10b981" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <i className="fas fa-bell-concierge" style={{ fontSize: "20px", color: "#64748b" }}></i>
              </div>
              <div>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#10b981", display: "block" }}>{summary.active_routes} Active</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#10b981", display: "block" }}>{fmt(summary.total_turnover * 0.06)}</span>
              </div>
            </div>

            <div className="filter-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #8b5cf6" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <i className="fas fa-money-bill-wave" style={{ fontSize: "20px", color: "#64748b" }}></i>
              </div>
              <div>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#8b5cf6", display: "block" }}>{fmt(summary.verified_payments)}</span>
                <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "700", display: "block" }}>Total Sent: {fmt(summary.verified_payments)}</span>
              </div>
            </div>

            <div className="filter-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "5px solid #f59e0b" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <i className="fas fa-scale-balanced" style={{ fontSize: "20px", color: "#64748b" }}></i>
              </div>
              <div>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#f59e0b", display: "block" }}>{fmt(summary.total_turnover - summary.verified_payments)}</span>
              </div>
            </div>

          </div>

          {/* Detailed Branch Performance Table */}
          <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-building" style={{ marginRight: "8px", color: "#475569" }}></i> Corporate Branch Offices
              </h3>
            </div>
            
            <div className="table-responsive">
              <table className="db-table" style={{ margin: 0, fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "16px" }}>Branch Company Office</th>
                    <th style={{ textAlign: "center" }}>Total Bookings</th>
                    <th style={{ textAlign: "center" }}>Complete / Confirmed</th>
                    <th style={{ textAlign: "center" }}>Cancelled / Null</th>
                    <th>Total Revenue</th>
                    <th>Ledger Pending Balance</th>
                    <th style={{ paddingRight: "16px" }}>Sales Volume Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                        No corporate branches registered in system database.
                      </td>
                    </tr>
                  ) : (
                    branches.map((b: any, idx: number) => {
                      const ratio = Math.round((b.total_revenue / maxRevenue) * 100) || 0;
                      return (
                        <tr key={idx}>
                          <td style={{ paddingLeft: "16px", fontWeight: "700", color: "#1e293b" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                                <i className="fas fa-building" style={{ fontSize: "12px" }}></i>
                              </div>
                              <span>{b.company}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: "600" }}>
                            {b.total_bookings}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="status-pill completed" style={{ fontSize: "11px", padding: "2px 8px" }}>
                              {b.completed_bookings}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="status-pill pending" style={{ background: "#fef2f2", color: "#ef4444", fontSize: "11px", padding: "2px 8px" }}>
                              {b.cancelled_bookings}
                            </span>
                          </td>
                          <td style={{ fontWeight: "700", color: "#1d4ed8" }}>
                            {fmt(b.total_revenue)}
                          </td>
                          <td style={{ fontWeight: "700", color: b.pending_balance < 0 ? "#ef4444" : "#16a34a" }}>
                            {fmt(b.pending_balance)}
                          </td>
                          <td style={{ paddingRight: "16px", minWidth: "160px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                                <div style={{ width: `${ratio}%`, background: "linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)", height: "100%" }}></div>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", width: "30px", textAlign: "right" }}>{ratio}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; 2026 Umrah Cab. Performance Analytics Panel.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
