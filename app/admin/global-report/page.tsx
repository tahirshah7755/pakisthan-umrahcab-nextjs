"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function GlobalPerformanceReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    monthBookings: 0,
    grossValue: 0,
    monthGrossValue: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
  });

  const [vehicleStats, setVehicleStats] = useState<{ vehicle: string; count: number; value: number }[]>([]);

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        const bookings = await api.getBookings();
        if (Array.isArray(bookings)) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          let totalCount = bookings.length;
          let monthCount = 0;
          let totalGross = 0;
          let monthGross = 0;
          let confirmedCount = 0;
          let pendingCount = 0;

          const vehiclesMap: Record<string, { count: number; value: number }> = {};

          bookings.forEach((b: any) => {
            const price = parseFloat(b.car_price || b.carPrice || 0);
            totalGross += price;

            // Status counts
            const status = String(b.status || "").toLowerCase();
            if (status.includes("confirm") || status.includes("active") || status.includes("complete")) {
              confirmedCount++;
            } else if (status.includes("pending") || status.includes("check")) {
              pendingCount++;
            }

            // Month filtering
            if (b.date) {
              const bDate = new Date(b.date);
              if (!isNaN(bDate.getTime())) {
                if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
                  monthCount++;
                  monthGross += price;
                }
              }
            }

            // Vehicle stats
            const vehicle = b.car_type || b.carType || "Standard Sedan";
            if (!vehiclesMap[vehicle]) {
              vehiclesMap[vehicle] = { count: 0, value: 0 };
            }
            vehiclesMap[vehicle].count += 1;
            vehiclesMap[vehicle].value += price;
          });

          setStats({
            totalBookings: totalCount,
            monthBookings: monthCount,
            grossValue: totalGross,
            monthGrossValue: monthGross,
            confirmedBookings: confirmedCount,
            pendingBookings: pendingCount,
          });

          const vList = Object.entries(vehiclesMap).map(([vehicle, data]) => ({
            vehicle,
            count: data.count,
            value: data.value,
          })).sort((a, b) => b.count - a.count);

          setVehicleStats(vList);
        }
      } catch (err) {
        console.error("Failed to load global performance report:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)", padding: "25px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Global Performance Report</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Consolidated summary statistics and booking volume insights across all companies.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/hub")} 
          style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "300px", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px", borderTopColor: "#2563eb" }}></div>
          <span style={{ marginTop: "15px", color: "#64748b", fontWeight: "600" }}>Compiling performance statistics...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="db-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            <div className="db-stat-card" style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "15px" }}>
              <div className="db-stat-icon active" style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px" }}>
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="db-stat-info" style={{ display: "flex", flexDirection: "column" }}>
                <span className="db-stat-value" style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>{stats.monthBookings} Bookings</span>
                <span className="db-stat-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>This Month</span>
              </div>
            </div>

            <div className="db-stat-card" style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "15px" }}>
              <div className="db-stat-icon completed" style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#dcfce7", color: "#166534", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px" }}>
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <div className="db-stat-info" style={{ display: "flex", flexDirection: "column" }}>
                <span className="db-stat-value" style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>SR {stats.monthGrossValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="db-stat-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Monthly Gross</span>
              </div>
            </div>

            <div className="db-stat-card" style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "15px" }}>
              <div className="db-stat-icon" style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#f5f3ff", color: "#7c3aed", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px" }}>
                <i className="fas fa-globe"></i>
              </div>
              <div className="db-stat-info" style={{ display: "flex", flexDirection: "column" }}>
                <span className="db-stat-value" style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>{stats.totalBookings} Bookings</span>
                <span className="db-stat-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>All-Time Total</span>
              </div>
            </div>

            <div className="db-stat-card" style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "15px" }}>
              <div className="db-stat-icon pending" style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px" }}>
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="db-stat-info" style={{ display: "flex", flexDirection: "column" }}>
                <span className="db-stat-value" style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>SR {stats.grossValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="db-stat-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Gross value</span>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "25px", alignItems: "start" }}>
            {/* Booking Status Breakdown */}
            <div className="form-card" style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                <i className="fas fa-chart-pie" style={{ marginRight: "8px", color: "#2563eb" }}></i> Booking Status Metrics
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Confirmed / Dispatch / Completed</span>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#166534" }}>{stats.confirmedBookings} Bookings</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${stats.totalBookings > 0 ? (stats.confirmedBookings / stats.totalBookings) * 100 : 0}%`, height: "100%", background: "#10b981" }}></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Pending Audits / Enquiries</span>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#b45309" }}>{stats.pendingBookings} Bookings</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${stats.totalBookings > 0 ? (stats.pendingBookings / stats.totalBookings) * 100 : 0}%`, height: "100%", background: "#f59e0b" }}></div>
                </div>
              </div>
            </div>

            {/* Vehicle Volume Breakdown */}
            <div className="form-card" style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                <i className="fas fa-bus" style={{ marginRight: "8px", color: "#2563eb" }}></i> Vehicle Type Share & Volume
              </h3>
              {vehicleStats.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No active vehicle dispatch data.</div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                        <th style={{ textAlign: "left", padding: "10px 5px", fontWeight: "700" }}>Vehicle Model</th>
                        <th style={{ textAlign: "center", padding: "10px 5px", fontWeight: "700" }}>Trips</th>
                        <th style={{ textAlign: "right", padding: "10px 5px", fontWeight: "700" }}>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleStats.map((v, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < vehicleStats.length - 1 ? "1px solid #f8fafc" : "none" }}>
                          <td style={{ padding: "12px 5px", fontWeight: "600", color: "#334155" }}>{v.vehicle}</td>
                          <td style={{ padding: "12px 5px", textAlign: "center", fontWeight: "700", color: "#2563eb" }}>{v.count}</td>
                          <td style={{ padding: "12px 5px", textAlign: "right", fontWeight: "700", color: "#10b981" }}>SR {v.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
