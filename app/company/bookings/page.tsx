"use client";

import React, { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { exportToExcel } from "@/utils/excelHelper";
import { formatDateToCustom } from "@/utils/formatters";

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
  driver_id?: number | null;
  driver?: any;
}

function CompanyBookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("filter") || "";

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleExportExcel = () => {
    if (bookings.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Booking Code", "Passenger Name", "Trip Details", "Date", "Time", "Car Type", "Price (SAR)", "Flight No", "Status"];
    const textRows = bookings.map((b: any) => [
      b.booking_code,
      b.full_name || "Guest",
      `${b.pickup} -> ${b.destination}`,
      b.date || "",
      b.time || "",
      b.car_type || "",
      b.car_price || 0,
      b.flight_no || "N/A",
      b.status || ""
    ]);
    
    exportToExcel({
      title: "My Bookings Statement",
      headers,
      rows: textRows,
      filename: `bookings_${new Date().toISOString().split("T")[0]}.xls`,
      totalsIndices: [6],
      statusIndex: 8
    });
  };

  const handleCopy = () => {
    if (bookings.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Booking Code", "Passenger Name", "Trip Details", "Date", "Time", "Car Type", "Price (SAR)", "Flight No", "Status"];
    const textRows = bookings.map((b: any) => [
      b.booking_code,
      b.full_name || "Guest",
      `${b.pickup} -> ${b.destination}`,
      b.date || "",
      b.time || "",
      b.car_type || "",
      b.car_price || 0,
      b.flight_no || "N/A",
      b.status || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied bookings list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Booking Code", "Passenger Name", "Trip Details", "Date", "Time", "Car Type", "Price (SAR)", "Flight No", "Status"];
    const csvContent = [
      headers.join(","),
      ...bookings.map((b: any) => [
        `"${(b.booking_code || "").replace(/"/g, '""')}"`,
        `"${(b.full_name || "Guest").replace(/"/g, '""')}"`,
        `"${(`${b.pickup} -> ${b.destination}`).replace(/"/g, '""')}"`,
        `"${(b.date || "").replace(/"/g, '""')}"`,
        `"${(b.time || "").replace(/"/g, '""')}"`,
        `"${(b.car_type || "").replace(/"/g, '""')}"`,
        b.car_price || 0,
        `"${(b.flight_no || "N/A").replace(/"/g, '""')}"`,
        `"${(b.status || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bookings_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handlePrint = (title: string = "Transportation Bookings Registry") => {
    if (bookings.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = bookings.map((b: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #2563eb;">${b.booking_code}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${b.full_name || "Guest"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.pickup} &rarr; ${b.destination}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${formatDateToCustom(b.date)} (${b.time})</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.car_type}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right; color: #d97706;">SAR ${Number(b.car_price || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.flight_no || "N/A"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.status}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #b48a1d; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #b48a1d; font-size: 24px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f8fafc; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; text-transform: uppercase; color: #475569; font-weight: 700; }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${title}</h1>
              <p>Umrah Cab B2B Agent Booking Statement</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Bookings:</strong> ${bookings.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Passenger Name</th>
                <th>Trip Details</th>
                <th>Date & Time</th>
                <th>Car Type</th>
                <th style="text-align: right;">Price</th>
                <th>Flight No</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleButtonClick = (fmt: string) => {
    if (fmt === "Copy") handleCopy();
    else if (fmt === "CSV") handleExportCSV();
    else if (fmt === "Excel") handleExportExcel();
    else if (fmt === "PDF" || fmt === "Print") handlePrint(fmt === "PDF" ? "Transportation Bookings Registry - PDF Report" : "Transportation Bookings Registry");
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

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
      const data = await api.getCompanyBookings(debouncedSearch, currentPage, perPage, filter);
      
      if (data) {
        if (data.data && Array.isArray(data.data)) {
          setBookings(data.data);
          setTotalCount(data.total || data.data.length);
          setTotalPages(data.last_page || 1);
        } else if (Array.isArray(data)) {
          setBookings(data);
          setTotalCount(data.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve B2B bookings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [debouncedSearch, filter, currentPage, perPage]);

  useEffect(() => {
    async function loadDrivers() {
      try {
        const res = await api.getDrivers();
        if (Array.isArray(res)) setDrivers(res);
      } catch (err) {
        console.warn("Could not load drivers in company bookings list", err);
      }
    }
    loadDrivers();
  }, []);

  const handleInlineDriverChange = async (bookingId: string, driverId: string) => {
    try {
      setLoading(true);
      const res = await api.updateBooking(bookingId, { 
        driver_id: driverId ? parseInt(driverId) : null,
        status: driverId ? "Active Dispatch" : "Confirmed Booking"
      });
      if (res?.success) {
        showToast("Driver assignment updated successfully!", "success");
        loadBookings();
      } else {
        showToast(res?.error || "Failed to update driver assignment.", "error");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating driver assignment.", "error");
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    const s = (status || "").toLowerCase();
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
                onClick={() => handleButtonClick(fmt)}
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
                  <th>Driver</th>
                  <th>Price</th>
                  <th>Flight No</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No bookings found.</td>
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
                          <span style={{ fontWeight: 600 }}>{formatDateToCustom(b.date)}</span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>{b.time}</span>
                        </div>
                      </td>
                      <td>{b.car_type}</td>
                      <td>
                        <select
                          value={b.driver_id || ""}
                          onChange={(e) => handleInlineDriverChange(b.id, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            width: "140px",
                            color: b.driver_id ? "#1e293b" : "#94a3b8",
                            fontWeight: b.driver_id ? "600" : "normal",
                            outline: "none"
                          }}
                        >
                          <option value="">-- No Driver --</option>
                          {drivers.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ fontWeight: 700, color: "#d97706" }}>SAR {parseFloat(b.car_price as any || 0).toFixed(2)}</td>
                      <td>{b.flight_no || "N/A"}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(b.status)}`}>{b.status}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => router.push(`/company/bookings/view?id=${b.id}`)}
                            title="View Details"
                            style={{
                              background: "#f1f5f9",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#475569",
                            }}
                          >
                            <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={() => router.push(`/company/bookings/edit?id=${b.id}`)}
                            title="Edit Booking"
                            style={{
                              background: "#f1f5f9",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#b48a1d",
                            }}
                          >
                            <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Elegant Pagination Controls */}
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginTop: "20px", 
            borderTop: "1px solid #f1f5f9", 
            paddingTop: "15px",
            flexWrap: "wrap",
            gap: "15px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Show</span>
            <select 
              value={perPage} 
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: "70px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", background: "#fff", fontSize: "13px" }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span style={{ fontSize: "13px", color: "#64748b" }}>entries</span>
          </div>

          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Showing {totalCount === 0 ? 0 : ((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} entries
          </span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ 
                background: currentPage === 1 ? "#f1f5f9" : "#b48a1d", 
                color: currentPage === 1 ? "#94a3b8" : "#ffffff", 
                border: "none",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                padding: "6px 12px",
                fontWeight: "600",
                borderRadius: "6px",
              }}
            >
              Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{ 
                background: (currentPage === totalPages || totalPages === 0) ? "#f1f5f9" : "#b48a1d", 
                color: (currentPage === totalPages || totalPages === 0) ? "#94a3b8" : "#ffffff", 
                border: "none",
                cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer",
                padding: "6px 12px",
                fontWeight: "600",
                borderRadius: "6px",
              }}
            >
              Next
            </button>
          </div>
        </div>
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
            margin-top: 10px;
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
