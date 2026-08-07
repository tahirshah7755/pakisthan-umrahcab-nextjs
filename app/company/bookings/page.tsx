"use client";

import React, { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/exportHelper";
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
  driver_trip_status?: string | null;
  payment_method?: string;
  received_amount?: number | string | null;
  pending_amount?: number | string | null;
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

function CompanyBookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("filter") || "";

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedShareBooking, setSelectedShareBooking] = useState<BookingRecord | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

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
  const [exportingFmt, setExportingFmt] = useState<string | null>(null);

  const fetchAllMatchingCompanyBookings = async () => {
    try {
      showToast("Fetching all matching bookings for export...", "success");
      const res = await api.getCompanyBookings(search, 1, 10000);
      let rawList: any[] = [];
      if (res && res.data && Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res)) {
        rawList = res;
      } else {
        rawList = bookings;
      }
      return rawList.map((b: any) => ({
        booking_code: b.custom_id || `UCB-${b.id}`,
        full_name: b.full_name || b.customer_relation?.name || "Guest",
        pickup: b.pickup || "",
        destination: b.destination || "",
        date: b.date || "",
        time: b.time || "",
        car_type: b.car_type || "",
        car_price: Number(b.car_price || 0),
        flight_no: b.flight_no || "N/A",
        status: b.status || "Pending"
      }));
    } catch (err) {
      console.error("Error fetching company bookings for export:", err);
      return bookings;
    }
  };

  const handleExportExcel = async () => {
    setExportingFmt("Excel");
    try {
      const exportList = await fetchAllMatchingCompanyBookings();
      if (exportList.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["Booking Code", "Passenger Name", "Trip Details", "Date", "Time", "Car Type", "Price (SAR)", "Flight No", "Status"];
      const textRows = exportList.map((b: any) => [
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
      const totalPrice = exportList.reduce((sum: number, b: any) => sum + Number(b.car_price || 0), 0);
      exportToExcel({
        title: "My Bookings Statement",
        headers,
        rows: textRows,
        filename: "company_bookings_report",
        companyName: "HEBA CAB",
        summary: [
          { label: "Total Bookings", value: exportList.length },
          { label: "Total Value", value: `SR ${totalPrice.toFixed(2)}` }
        ]
      });
      showToast(`Exported all ${exportList.length} bookings to Excel!`, "success");
    } finally {
      setExportingFmt(null);
    }
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

  const handleExportCSV = async () => {
    setExportingFmt("CSV");
    try {
      const exportList = await fetchAllMatchingCompanyBookings();
      if (exportList.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["Booking Code", "Passenger Name", "Trip Details", "Date", "Time", "Car Type", "Price (SAR)", "Flight No", "Status"];
      const textRows = exportList.map((b: any) => [
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
      exportToCSV({
        title: "Transportation Bookings Registry",
        filename: "company_bookings_report",
        headers,
        rows: textRows
      });
      showToast(`Exported all ${exportList.length} bookings to CSV!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handlePrint = async (title: string = "Transportation Bookings Registry", fmtType: string = "Print") => {
    setExportingFmt(fmtType);
    try {
      const exportList = await fetchAllMatchingCompanyBookings();
      if (exportList.length === 0) {
        showToast("No data to print!", "error");
        return;
      }
      const headers = ["Booking Code", "Passenger Name", "Trip Details", "Date", "Time", "Car Type", "Price (SAR)", "Flight No", "Status"];
      const textRows = exportList.map((b: any) => [
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
      const totalPrice = exportList.reduce((sum: number, b: any) => sum + Number(b.car_price || 0), 0);
      await exportToPDF({
        title,
        filename: "company_bookings_report",
        headers,
        rows: textRows,
        companyName: "HEBA CAB",
        orientation: "landscape",
        mode: fmtType as any,
        summary: [
          { label: "Total Bookings", value: exportList.length },
          { label: "Total Value", value: `SR ${totalPrice.toFixed(2)}` }
        ]
      });
    } finally {
      setExportingFmt(null);
    }
  };

  const handleButtonClick = (fmt: string) => {
    if (fmt === "Copy") handleCopy();
    else if (fmt === "CSV") handleExportCSV();
    else if (fmt === "Excel") handleExportExcel();
    else if (fmt === "PDF" || fmt === "Print") handlePrint(fmt === "PDF" ? "Transportation Bookings Registry - PDF Report" : "Transportation Bookings Registry", fmt);
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

  const handleInlineDriverTripStatusChange = async (bookingId: string, tripStatus: string) => {
    try {
      setLoading(true);
      const res = await api.updateBooking(bookingId, { 
        driver_trip_status: tripStatus || null
      });
      if (res?.success) {
        showToast("Driver trip status updated successfully!", "success");
        loadBookings();
      } else {
        showToast(res?.error || "Failed to update driver trip status.", "error");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating driver trip status.", "error");
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
                disabled={!!exportingFmt}
                onClick={() => handleButtonClick(fmt)}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                {exportingFmt === fmt && <i className="fas fa-spinner fa-spin"></i>}
                <span>{fmt}</span>
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
                  <th>Driver Trip Status</th>
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
                        {b.driver_id ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            whiteSpace: "nowrap"
                          }}>
                            <i className="fas fa-user-check" style={{ fontSize: "11px" }}></i>
                            {b.driver?.name || drivers.find((d: any) => String(d.id) === String(b.driver_id))?.name || `Driver #${b.driver_id}`}
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: "#f1f5f9",
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                            whiteSpace: "nowrap"
                          }}>
                            <i className="fas fa-user-clock" style={{ fontSize: "11px" }}></i>
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {b.driver_trip_status ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: b.driver_trip_status === "Ride End" || b.driver_trip_status === "Pickup Done" 
                                ? "#ecfdf5" 
                                : b.driver_trip_status.includes("Cancel") || b.driver_trip_status.includes("Miss") || b.driver_trip_status === "No Show"
                                ? "#fef2f2"
                                : "#eff6ff",
                              color: b.driver_trip_status === "Ride End" || b.driver_trip_status === "Pickup Done"
                                ? "#047857"
                                : b.driver_trip_status.includes("Cancel") || b.driver_trip_status.includes("Miss") || b.driver_trip_status === "No Show"
                                ? "#dc2626"
                                : "#1d4ed8",
                              border: `1px solid ${
                                b.driver_trip_status === "Ride End" || b.driver_trip_status === "Pickup Done"
                                  ? "#a7f3d0"
                                  : b.driver_trip_status.includes("Cancel") || b.driver_trip_status.includes("Miss") || b.driver_trip_status === "No Show"
                                  ? "#fecaca"
                                  : "#bfdbfe"
                              }`,
                              whiteSpace: "nowrap"
                            }}>
                              <i className="fas fa-route" style={{ fontSize: "11px" }}></i>
                              {b.driver_trip_status}
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: "#f8fafc",
                              color: "#94a3b8",
                              border: "1px solid #e2e8f0",
                              whiteSpace: "nowrap"
                            }}>
                              Pending Status
                            </span>
                          )}

                          {b.driver_id && (
                            <button
                              onClick={() => {
                                setSelectedShareBooking(b);
                                setShowShareModal(true);
                              }}
                              style={{
                                border: "none",
                                background: "#e0f2fe",
                                color: "#2563eb",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "12px",
                                flexShrink: 0
                              }}
                              title="View / Share Driver Details"
                            >
                              <i className="fas fa-info-circle"></i>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 700, color: "#d97706" }}>
                            SAR {parseFloat(b.car_price as any || 0).toFixed(2)}
                          </span>
                          {b.payment_method && (
                            <span style={{ fontSize: "11px", color: b.payment_method === "Cash" ? "#d97706" : "#2563eb", fontWeight: "600", marginTop: "2px" }}>
                              <i className={b.payment_method === "Cash" ? "fas fa-money-bill-wave" : "fas fa-credit-card"} style={{ marginRight: "3px" }}></i>
                              {b.payment_method}
                              {b.payment_method === "Cash" && b.pending_amount !== undefined && b.pending_amount !== null && (
                                <span style={{ display: "block", fontSize: "10px", color: "#ef4444" }}>
                                  Pending: SAR {parseFloat(b.pending_amount as any || 0).toFixed(2)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
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

      {showShareModal && selectedShareBooking && (
        <ShareTemplateModal
          booking={selectedShareBooking}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedShareBooking(null);
          }}
        />
      )}

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
          .mobile-toolbar.mobile-search-box {
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

function ShareTemplateModal({ booking, isOpen, onClose }: { booking: any; isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"driver" | "agent" | "client">("driver");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking) return null;

  const getDriverCopy = (b: any) => {
    let paymentStr = "";
    if (b.payment_method === "Cash") {
      paymentStr = `\n*Payment Method:* Cash\n*Cash to Collect (Pending):* SR ${parseFloat(b.pending_amount as any || 0).toFixed(2)}\n*Amount Received:* SR ${parseFloat(b.received_amount as any || 0).toFixed(2)}`;
    } else {
      paymentStr = `\n*Payment Method:* Credit (Paid)`;
    }
    return `*UMRAH CAB BOOKING DETAILS (DRIVER COPY)*\n---------------------------------\n*Booking Code:* ${b.booking_code || b.id}\n*Guest Name:* ${b.full_name}\n*Guest WhatsApp:* ${b.whatsapp || "N/A"}\n*Date & Time:* ${b.date} at ${b.time}\n*Pickup Location:* ${b.pickup}\n*Destination:* ${b.destination}\n*Vehicle:* ${b.car_type}\n*Flight No:* ${b.flight_no || "N/A"}${paymentStr}\n*Notes:* ${b.notes || "N/A"}`;
  };

  const getAgentCopy = (b: any) => {
    let paymentStr = "";
    if (b.payment_method === "Cash") {
      paymentStr = `\n*Payment Info:* Cash (Received: SR ${parseFloat(b.received_amount as any || 0).toFixed(2)}, Pending: SR ${parseFloat(b.pending_amount as any || 0).toFixed(2)})`;
    } else {
      paymentStr = `\n*Payment Info:* Credit`;
    }
    const dName = b.driver ? b.driver.name : "None";
    const dPhone = b.driver ? b.driver.phone : "";
    return `*UMRAH CAB STATUS UPDATE (AGENT COPY)*\n---------------------------------\n*Booking Code:* ${b.booking_code || b.id}\n*Guest Name:* ${b.full_name}\n*Date & Time:* ${b.date} at ${b.time}\n*Driver Assigned:* ${dName} ${dPhone ? `(${dPhone})` : ""}\n*Trip Status:* ${b.driver_trip_status || "Not Set"}${paymentStr}`;
  };

  const getClientCopy = (b: any) => {
    let paymentStr = "";
    if (b.payment_method === "Cash") {
      paymentStr = `\n*Pending Cash to Pay:* SR ${parseFloat(b.pending_amount as any || 0).toFixed(2)}`;
    }
    const dName = b.driver ? b.driver.name : "TBD";
    const dPhone = b.driver ? b.driver.phone : "TBD";
    return `*UMRAH CAB STATUS UPDATE (CLIENT COPY)*\n---------------------------------\nDear *${b.full_name}*,\n\nYour driver's status has been updated:\n*Status:* ${b.driver_trip_status || "Assigned"}\n*Driver Name:* ${dName}\n*Driver Phone:* ${dPhone}\n*Vehicle:* ${b.car_type}${paymentStr}\n\nThank you for choosing Umrah Cab!`;
  };

  const textMap = {
    driver: getDriverCopy(booking),
    agent: getAgentCopy(booking),
    client: getClientCopy(booking),
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(textMap[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    let phone = "";
    if (activeTab === "driver") {
      phone = booking.driver ? booking.driver.phone : "";
    } else if (activeTab === "client") {
      phone = booking.whatsapp || "";
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(textMap[activeTab]);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
      <div style={{ background: "#ffffff", borderRadius: "16px", width: "500px", maxWidth: "90%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>Share Booking / Trip Details</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}>&times;</button>
        </div>
        
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", marginBottom: "16px", gap: "16px" }}>
          {(["driver", "agent", "client"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 4px",
                fontWeight: "600",
                fontSize: "14px",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent",
                color: activeTab === tab ? "#2563eb" : "#64748b",
                textTransform: "capitalize",
                marginBottom: "-2px"
              }}
            >
              {tab} Copy
            </button>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          readOnly
          value={textMap[activeTab]}
          style={{
            width: "100%",
            height: "180px",
            padding: "12px",
            fontFamily: "monospace",
            fontSize: "13px",
            lineHeight: "1.5",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#334155",
            resize: "none",
            outline: "none"
          }}
        />

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
          <button
            onClick={handleCopy}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <i className={copied ? "fas fa-check text-green-500" : "fas fa-copy"}></i>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleSendWhatsApp}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#25d366",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <i className="fab fa-whatsapp"></i>
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
