"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

interface BookingRecord {
  id: string;
  booking_code: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  passengers: string;
  car_type: string;
  car_price: number;
  full_name: string;
  status: string;
}

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [makkahTime, setMakkahTime] = useState("");
  const [makkahDate, setMakkahDate] = useState("");
  
  // States loaded from backend API
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [totalBookings, setTotalBookings] = useState(0);
  const [activeBookings, setActiveBookings] = useState(0);
  const [confirmedBookings, setConfirmedBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [latestBookings, setLatestBookings] = useState<BookingRecord[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any>({
    total_debit: 0,
    total_credit: 0,
    current_balance: 0,
  });
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [pendingPaymentsTotal, setPendingPaymentsTotal] = useState(0);
  const [pendingPaymentsList, setPendingPaymentsList] = useState<any[]>([]);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Clock Update Effect (Saudi Arabia Riyad / Makkah Time Zone)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Riyadh",
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      setMakkahTime(timeFmt.format(now));
      setMakkahDate(dateFmt.format(now));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch B2B dashboard summary from the backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getCompanyDashboardSummary();
        if (res) {
          setCompanyInfo(res.company);
          setTotalBookings(res.total_bookings || 0);
          setActiveBookings(res.active_bookings || 0);
          setConfirmedBookings(res.confirmed_bookings || 0);
          setPendingBookings(res.pending_bookings || 0);
          setLatestBookings(res.latest_bookings || []);
          setLedgerSummary(res.ledger_summary || { total_debit: 0, total_credit: 0, current_balance: 0 });
          setPendingPaymentsCount(res.pending_payments_count || 0);
          setPendingPaymentsTotal(res.pending_payments_total || 0);
          setPendingPaymentsList(res.pending_payments_list || []);
        }
      } catch (err) {
        console.error("Failed to load company dashboard summary:", err);
        showToast("Error connecting to corporate API.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("completed")) return "completed";
    if (s.includes("cancel")) return "cancelled";
    if (s.includes("pending")) return "pending";
    return "active";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "450px" }}>
        <div className="spinner-gold" style={{ width: "50px", height: "50px" }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", padding: "5px" }}>
      {toast.show && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", borderRadius: "8px", background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#fff", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
            <i className={`fas ${toast.type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
            <span style={{ fontWeight: 600 }}>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 🚀 Welcome Header Banner */}
      <div 
        className="form-header-card mobile-header-card" 
        style={{ 
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
          padding: "30px 40px", 
          borderRadius: "16px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "25px", flex: 1, minWidth: "280px", flexWrap: "wrap" }}>
          {companyInfo?.logo_path && (
            <div className="mobile-header-logo-container" style={{ width: "80px", height: "80px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              <img src={`${IMAGE_BASE}/${companyInfo.logo_path}`} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          )}
          <div>
            <span style={{ color: "#d4af37", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Welcome Back Agent</span>
            <h2 className="mobile-header-title" style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", margin: "5px 0 8px 0", letterSpacing: "-0.5px" }}>
              {companyInfo?.name || "Corporate Partner"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
              Manage bookings, check invoice status, and view real-time account balances from your agent dashboard.
            </p>
          </div>
        </div>

        {/* Makkah Clock Widget */}
        <div 
          className="mobile-clock-widget"
          style={{ 
            background: "#1e293b", 
            borderRadius: "12px", 
            padding: "12px 24px", 
            border: "1px solid #334155",
            display: "flex", 
            alignItems: "center", 
            gap: "15px",
            minWidth: "220px",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#d4af37", letterSpacing: "1px", textTransform: "uppercase" }}>
              <i className="fas fa-clock" style={{ marginRight: "5px" }}></i> Makkah Time
            </span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", fontFamily: "monospace", marginTop: "4px" }}>
              {makkahTime || "00:00:00 AM"}
            </span>
          </div>
          <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "rgba(212, 175, 55, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4af37", fontSize: "20px" }}>
            <i className="fas fa-mosque"></i>
          </div>
        </div>
      </div>

      {/* 📊 Four Real-Time Dynamic Action Stat Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        
        {/* Ledger Balance Card */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderLeft: "4px solid #d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "rgba(212, 175, 55, 0.1)", color: "#b48a1d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <span style={{ color: "#d4af37", fontWeight: 800, fontSize: "12px", background: "rgba(212, 175, 55, 0.15)", padding: "2px 8px", borderRadius: "6px" }}>LEDGER BALANCE</span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Current Balance</h4>
            <p style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0 0" }}>SAR {Number(ledgerSummary?.current_balance || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Pending Payments Card */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderLeft: "4px solid #f97316" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "rgba(249, 115, 22, 0.1)", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-clock"></i>
            </div>
            <span style={{ color: "#f97316", fontWeight: 800, fontSize: "12px", background: "rgba(249, 115, 22, 0.15)", padding: "2px 8px", borderRadius: "6px" }}>PENDING CLEARANCE</span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Pending Payments ({pendingPaymentsCount})</h4>
            <p style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0 0" }}>SAR {Number(pendingPaymentsTotal || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Active Bookings Card */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-calendar-day"></i>
            </div>
            <span style={{ color: "#3b82f6", fontWeight: 800, fontSize: "12px", background: "#dbeafe", padding: "2px 8px", borderRadius: "6px" }}>ACTIVE</span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Active Bookings</h4>
            <p style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0 0" }}>{activeBookings}</p>
          </div>
        </div>

        {/* Confirmed Bookings Card */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#d1fae5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-circle-check"></i>
            </div>
            <span style={{ color: "#10b981", fontWeight: 800, fontSize: "12px", background: "#d1fae5", padding: "2px 8px", borderRadius: "6px" }}>CONFIRMED</span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Confirmed bookings</h4>
            <p style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0 0" }}>{confirmedBookings}</p>
          </div>
        </div>

        {/* Total Bookings Card */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderLeft: "4px solid #6366f1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#e0e7ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-globe"></i>
            </div>
            <span style={{ color: "#6366f1", fontWeight: 800, fontSize: "12px", background: "#e0e7ff", padding: "2px 8px", borderRadius: "6px" }}>OVERALL</span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Total Bookings</h4>
            <p style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0 0" }}>{totalBookings}</p>
          </div>
        </div>

      </div>

      {/* Profile & Settings Details Card */}
      <div className="table-card mobile-card" style={{ padding: "25px", borderRadius: "12px", background: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", margin: "0 0 15px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
          <i className="fas fa-building-user" style={{ color: "#d4af37", marginRight: "8px" }}></i>
          Corporate Account Details
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#64748b" }}>
              <strong style={{ color: "#334155" }}>Email Address:</strong> {companyInfo?.email || "N/A"}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#64748b" }}>
              <strong style={{ color: "#334155" }}>Contact Phone:</strong> {companyInfo?.phone || "N/A"}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#64748b" }}>
              <strong style={{ color: "#334155" }}>Company Address:</strong> {companyInfo?.address || "N/A"}
            </p>
          </div>
          <div>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#64748b" }}>
              <strong style={{ color: "#334155" }}>Voucher Access:</strong>{" "}
              <span style={{ color: companyInfo?.vouchers ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                {companyInfo?.vouchers ? "ENABLED" : "DISABLED"}
              </span>
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#64748b" }}>
              <strong style={{ color: "#334155" }}>Reminders Alerts:</strong>{" "}
              <span style={{ color: companyInfo?.reminders ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                {companyInfo?.reminders ? "ENABLED" : "DISABLED"}
              </span>
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#64748b" }}>
              <strong style={{ color: "#334155" }}>Invoices Access:</strong>{" "}
              <span style={{ color: companyInfo?.invoice ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                {companyInfo?.invoice ? "ENABLED" : "DISABLED"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 📋 Latest Bookings Table */}
      <div className="table-card mobile-card" style={{ padding: "25px", borderRadius: "12px", background: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div className="mobile-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
              <i className="fas fa-list" style={{ color: "#3b82f6", marginRight: "8px" }}></i>
              Recent B2B Bookings
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0 0" }}>Most recently registered corporate dispatches.</p>
          </div>
          <button 
            onClick={() => router.push("/company/bookings")}
            style={{ background: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
          >
            View All Bookings
          </button>
        </div>

        <div className="table-responsive">
          <table className="db-table">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Passenger Name</th>
                <th>Trip Details</th>
                <th>Scheduled Date / Time</th>
                <th>Car Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {latestBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No bookings registered under this corporate account yet.
                  </td>
                </tr>
              ) : (
                latestBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: "700", color: "#2563eb" }}>{b.booking_code}</td>
                    <td style={{ fontWeight: "600" }}>{b.full_name}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "600" }}>{b.pickup} &rarr; {b.destination}</span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Vehicle: {b.car_type}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "600" }}>{b.date}</span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{b.time}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: "700", color: "#d97706" }}>SAR {parseFloat(b.car_price as any || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status-pill ${getStatusClass(b.status)}`}>{b.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .mobile-header-card {
            padding: 20px 15px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 15px !important;
          }
          .mobile-header-logo-container {
            width: 60px !important;
            height: 60px !important;
          }
          .mobile-header-title {
            font-size: 20px !important;
          }
          .mobile-clock-widget {
            min-width: 100% !important;
            box-sizing: border-box !important;
          }
          .mobile-card {
            padding: 15px !important;
          }
          .mobile-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .mobile-card-header button {
            width: 100% !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
