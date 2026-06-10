"use client";

import React, { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  whatsapp: string;
  flight_no: string;
  notes: string;
  status: string;
}

function CompanyBookingsContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "";

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const getPageTitle = () => {
    switch (filter) {
      case "current":
        return "Current Bookings";
      case "upcoming":
        return "Upcoming Bookings";
      case "cancelled":
        return "Cancelled Bookings";
      default:
        return "My Bookings";
    }
  };

  const getPageDesc = () => {
    switch (filter) {
      case "current":
        return "List of active or ongoing bookings scheduled for today or currently dispatching.";
      case "upcoming":
        return "List of bookings confirmed for future dates.";
      case "cancelled":
        return "List of bookings that have been cancelled.";
      default:
        return "List of bookings requested under your agent account.";
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyBookings(search);
      
      // Filter locally
      let filtered = data || [];
      if (filter) {
        const today = new Date().toISOString().split("T")[0];
        filtered = filtered.filter((b: BookingRecord) => {
          const status = b.status.toLowerCase();
          if (filter === "cancelled") {
            return status.includes("cancel") || status.includes("cancelled");
          }
          if (filter === "current") {
            const isPastOrToday = b.date <= today;
            const isActiveStatus = status.includes("dispatch") || status.includes("pending") || status.includes("confirm");
            const isCancelledOrCompleted = status.includes("cancel") || status.includes("completed");
            return (b.date === today || (isPastOrToday && isActiveStatus)) && !isCancelledOrCompleted;
          }
          if (filter === "upcoming") {
            const isFuture = b.date > today;
            const isCancelledOrCompleted = status.includes("cancel") || status.includes("completed");
            return isFuture && !isCancelledOrCompleted;
          }
          return true;
        });
      }
      
      setBookings(filtered);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve B2B bookings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [search, filter]);

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("completed")) return "completed";
    if (s.includes("cancel")) return "cancelled";
    if (s.includes("pending")) return "pending";
    return "active";
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
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>{getPageTitle()}</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>{getPageDesc()}</p>
        </div>
        <Link 
          href="/company/bookings/add" 
          style={{ 
            background: "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", 
            color: "#0f172a", 
            border: "none", 
            borderRadius: "8px", 
            padding: "10px 20px", 
            fontSize: "14px", 
            fontWeight: "700", 
            cursor: "pointer", 
            textDecoration: "none",
            display: "flex", 
            alignItems: "center", 
            gap: "8px" 
          }}
        >
          <i className="fas fa-plus"></i> Create Booking
        </Link>
      </div>

      {/* Bookings Grid Card */}
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
          
          <div className="mobile-search-box" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Search:</span>
            <input
              type="text"
              placeholder="Search booking, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", width: "220px", outline: "none" }}
            />
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
                  <th>Booking Code</th>
                  <th>Passenger Name</th>
                  <th>Trip Details</th>
                  <th>Date & Time</th>
                  <th>Car Type</th>
                  <th>Price</th>
                  <th>Flight No</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No bookings found.</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>{b.booking_code}</td>
                      <td style={{ fontWeight: 600 }}>{b.full_name}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{b.pickup} &rarr; {b.destination}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600 }}>{b.date}</span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>{b.time}</span>
                        </div>
                      </td>
                      <td>{b.car_type}</td>
                      <td style={{ fontWeight: 700, color: "#d97706" }}>SAR {parseFloat(b.car_price as any || 0).toFixed(2)}</td>
                      <td>{b.flight_no || "N/A"}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(b.status)}`}>{b.status}</span>
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
          .mobile-header-card a {
            justify-content: center !important;
            width: 100% !important;
            box-sizing: border-box !important;
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
          .mobile-search-box {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .mobile-search-box input {
            flex-grow: 1 !important;
            width: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CompanyBookingsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CompanyBookingsContent />
    </Suspense>
  );
}
