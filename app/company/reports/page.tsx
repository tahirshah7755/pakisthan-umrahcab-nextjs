"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";

interface BookingRecord {
  id: string;
  booking_code: string;
  pickup: string;
  destination: string;
  date: string;
  car_price: number;
  status: string;
}

export default function CompanyReportsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [grossValue, setGrossValue] = useState(0);

  // Route breakdown helper
  const [routeStats, setRouteStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const data = await api.getCompanyBookings("");
        if (data && Array.isArray(data)) {
          setBookings(data);
          setTotalBookings(data.length);

          let pending = 0;
          let confirmed = 0;
          let cancelled = 0;
          let totalVal = 0;
          const routeCounts: Record<string, number> = {};

          data.forEach((b: BookingRecord) => {
            const status = b.status.toLowerCase();
            if (status.includes("pending")) pending++;
            else if (status.includes("cancel")) cancelled++;
            else confirmed++;

            const price = parseFloat(b.car_price as any || 0);
            totalVal += price;

            // Group by route
            const routeKey = `${b.pickup} to ${b.destination}`;
            routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
          });

          setPendingCount(pending);
          setConfirmedCount(confirmed);
          setCancelledCount(cancelled);
          setGrossValue(totalVal);
          setRouteStats(routeCounts);
        }
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Agent Performance Report</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>A comprehensive overview of your sales metrics, route volumes, and booking statuses.</p>
        </div>
        <button onClick={() => router.push("/company/dashboard")} className="form-btn-back" style={{ background: "#ffffff", color: "#0f172a" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Dashboard</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "50px", background: "#ffffff", borderRadius: "12px", textAlign: "center", color: "#64748b" }}>
          <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }}></div>
          <p style={{ fontWeight: "600" }}>Generating your report analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                <i className="fas fa-list-check"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, color: "#64748b", fontSize: "12px", fontWeight: "600", uppercase: "true" } as any}>Total Bookings</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{totalBookings}</p>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                <i className="fas fa-circle-check"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, color: "#64748b", fontSize: "12px", fontWeight: "600" }}>Confirmed</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{confirmedCount}</p>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                <i className="fas fa-hourglass-half"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, color: "#64748b", fontSize: "12px", fontWeight: "600" }}>Pending Check</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{pendingCount}</p>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "rgba(212, 175, 55, 0.1)", color: "#b48a1d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                <i className="fas fa-wallet"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, color: "#64748b", fontSize: "12px", fontWeight: "600" }}>Gross Booking Value</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>SR {grossValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px" }} className="report-grid-layout">
            {/* Left Column: Route Volume Breakdown */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>Route Booking Volume</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {Object.entries(routeStats).length === 0 ? (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>No route data available.</p>
                ) : (
                  Object.entries(routeStats).map(([route, count]) => {
                    const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
                    return (
                      <div key={route} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600" }}>
                          <span style={{ color: "#334155" }}>{route}</span>
                          <span style={{ color: "#0f172a" }}>{count} Bookings ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", background: "linear-gradient(90deg, #d4af37 0%, #b48a1d 100%)", borderRadius: "4px" }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Status & Sales breakdown */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>Booking Status Ratios</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Ratio items */}
                {[
                  { label: "Confirmed / Completed", count: confirmedCount, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
                  { label: "Pending Verification", count: pendingCount, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
                  { label: "Cancelled", count: cancelledCount, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" }
                ].map((item) => {
                  const pct = totalBookings > 0 ? (item.count / totalBookings) * 100 : 0;
                  return (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }}></div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{item.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{item.count} Bookings</span>
                          <span style={{ background: item.bg, color: item.color, fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @media (max-width: 991px) {
          .report-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
