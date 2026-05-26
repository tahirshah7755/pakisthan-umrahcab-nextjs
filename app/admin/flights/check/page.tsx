"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface FlightItem {
  id: string;
  custom_id: string;
  flightNo: string;
  leg: "Arrival" | "Departure" | "Both Legs";
  route: string;
  date: string;
  time: string;
  status: string;
  customer?: {
    id: number;
    custom_id: string;
    name: string;
    company: string;
    contact: string;
  };
}

export default function FlightStatusCheck() {
  const router = useRouter();

  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [fltPage, setFltPage] = useState(1);
  const [fltPerPage, setFltPerPage] = useState(10);
  const [totalFltCount, setTotalFltCount] = useState(0);
  const [fltTotalPages, setFltTotalPages] = useState(1);
  const [fltSearch, setFltSearch] = useState("");
  const [fltLegFilter, setFltLegFilter] = useState("All");
  const [fltStartDate, setFltStartDate] = useState("");
  const [fltEndDate, setFltEndDate] = useState("");
  const [fltHasSearched, setFltHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchFlightsCheck = async () => {
    try {
      setLoading(true);
      const res = await api.getFlights(
        fltSearch,
        fltLegFilter === "All" ? undefined : fltLegFilter,
        fltPage,
        fltPerPage,
        undefined, // status
        fltStartDate,
        fltEndDate
      );
      if (res && res.data) {
        setFlights(res.data);
        setTotalFltCount(res.total || 0);
        setFltTotalPages(res.last_page || 1);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Error searching flight records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fltHasSearched) {
      fetchFlightsCheck();
    }
  }, [fltPage, fltPerPage, fltHasSearched]);

  const handleApply = () => {
    if (!fltStartDate && !fltEndDate && !fltSearch && fltLegFilter === "All") {
      showToast("Please enter search parameters or select dates.", "error");
      return;
    }
    setFltHasSearched(true);
    setFltPage(1);
    fetchFlightsCheck();
    showToast("Search filters applied", "success");
  };

  const handleReset = () => {
    setFltSearch("");
    setFltLegFilter("All");
    setFltStartDate("");
    setFltEndDate("");
    setFltHasSearched(false);
    setFlights([]);
    showToast("Reset filters", "success");
  };

  const handleQuickDateFilter = (opt: string) => {
    const formatLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const today = new Date();
    let start = formatLocal(today);
    let end = formatLocal(today);

    if (opt === "Tomorrow") {
      const tomorrow = new Date(Date.now() + 86400000);
      start = formatLocal(tomorrow);
      end = formatLocal(tomorrow);
    } else if (opt === "Next 7 Days") {
      const next7 = new Date(Date.now() + 7 * 86400000);
      start = formatLocal(today);
      end = formatLocal(next7);
    }

    setFltStartDate(start);
    setFltEndDate(end);
    setFltHasSearched(true);
    setFltPage(1);
    
    // We delay the execution slightly to allow states to update, or trigger fetch directly
    setTimeout(() => {
      showToast(`Filtered for: ${opt}`, "success");
    }, 50);
  };

  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const formattedHours = h % 12 || 12;
      const pad = (n: number) => n < 10 ? `0${n}` : n;
      return `${pad(formattedHours)}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "slideIn 0.3s ease-out"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1084cc 0%, #0284c7 100%)" }}>
        <div>
          <h2>Flight Status Check</h2>
          <p>Monitor incoming and outgoing flights for scheduled passengers.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/admin/flights")} className="form-btn-back" style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.15)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
            <i className="fas fa-plane"></i>
            <span>Directory</span>
          </button>
          <button onClick={() => router.push("/admin/flights/add")} className="form-btn-back" style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "none", color: "#0284c7", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <i className="fas fa-plus"></i>
            <span>New Flight</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="form-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "15px" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr auto auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Start Date</label>
            <div className="form-input-wrapper">
              <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
              <input type="date" className="form-input" value={fltStartDate} onChange={(e) => setFltStartDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>End Date</label>
            <div className="form-input-wrapper">
              <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
              <input type="date" className="form-input" value={fltEndDate} onChange={(e) => setFltEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Type</label>
            <div className="form-input-wrapper">
              <i className="fas fa-arrows-spin form-icon" style={{ color: "#94a3b8" }}></i>
              <select
                className="form-input form-select"
                value={fltLegFilter}
                onChange={(e) => setFltLegFilter(e.target.value)}
              >
                <option value="All">All Flights</option>
                <option value="Arrival">Arrival</option>
                <option value="Departure">Departure</option>
                <option value="Both Legs">Both Legs</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Search</label>
            <div className="form-input-wrapper">
              <i className="fas fa-search form-icon" style={{ color: "#94a3b8" }}></i>
              <input
                type="text"
                className="form-input"
                placeholder="Name or Flight #"
                value={fltSearch}
                onChange={(e) => setFltSearch(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleApply}
            className="btn-submit"
            style={{
              background: "#1e293b",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0 24px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "42px",
              cursor: "pointer"
            }}
          >
            <i className="fas fa-filter"></i>
            <span>Apply</span>
          </button>

          <button
            onClick={handleReset}
            style={{
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              width: "42px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
            title="Reset Filters"
          >
            <i className="fas fa-sync"></i>
          </button>
        </div>

        {/* Quick Filter Buttons Row */}
        <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
          {["Today", "Tomorrow", "Next 7 Days"].map((filterOpt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickDateFilter(filterOpt)}
              style={{
                background: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className={`fas ${filterOpt === "Today" ? "fa-calendar-day" : filterOpt === "Tomorrow" ? "fa-calendar-plus" : "fa-calendar-week"}`}></i>
              {filterOpt}
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      {!fltHasSearched ? (
        <div className="form-card" style={{ padding: "80px 20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "15px", color: "#64748b" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-search" style={{ fontSize: "36px", color: "#94a3b8" }}></i>
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Search Flight Logistics</h3>
          <p style={{ maxWidth: "450px", textAlign: "center", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
            Select a date range or use the quick buttons above to view scheduled flights. This helps keep the dashboard clean and fast.
          </p>
        </div>
      ) : (
        <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "15%" }}>Schedule</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "20%" }}>Flight Number</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "12%" }}>Type</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "23%" }}>Passenger & Company</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "20%" }}>Origin / Destination</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "10%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Searching flights...
                    </td>
                  </tr>
                ) : flights.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                      <i className="fas fa-plane-slash" style={{ fontSize: "24px", display: "block", marginBottom: "10px" }}></i>
                      No flight records found matching the search criteria
                    </td>
                  </tr>
                ) : (
                  flights.map((f: any) => {
                    const isArrival = f.leg === "Arrival" || f.leg === "Both Legs";
                    return (
                      <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {/* 1. Schedule */}
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>{formatScheduleDate(f.date)}</span>
                            <span style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                              <i className="far fa-clock"></i> {formatTime12h(f.time)}
                            </span>
                          </div>
                        </td>
                        
                        {/* 2. Flight Number */}
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            gap: "8px",
                            minWidth: "150px"
                          }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>
                              <span style={{ color: "#94a3b8" }}>+</span>
                              {f.flightNo}
                            </span>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(f.flightNo);
                                  showToast(`Copied ${f.flightNo} to clipboard!`, "success");
                                }}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "4px",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  color: "#64748b"
                                }}
                                title="Copy Flight Number"
                              >
                                <i className="far fa-copy" style={{ fontSize: "11px" }}></i>
                              </button>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(f.flightNo)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "4px",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#64748b",
                                  textDecoration: "none"
                                }}
                                title="Track Flight"
                              >
                                <i className="fas fa-external-link-alt" style={{ fontSize: "11px" }}></i>
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* 3. Type */}
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: isArrival ? "#e8f5e9" : "#ffebee",
                            color: isArrival ? "#2e7d32" : "#c62828",
                            borderRadius: "20px",
                            padding: "4px 10px",
                            fontSize: "10px",
                            fontWeight: "700",
                            textTransform: "uppercase"
                          }}>
                            <i className={`fas ${isArrival ? "fa-plane-arrival" : "fa-plane-departure"}`}></i>
                            {isArrival ? "Arrival" : "Departure"}
                          </span>
                        </td>

                        {/* 4. Passenger & Company */}
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <i className="fas fa-circle-user" style={{ color: "#2e7d32", fontSize: "18px" }}></i>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>
                                {f.customer ? f.customer.name : "N/A"}
                              </span>
                              <span style={{ color: "#64748b", fontSize: "11px" }}>
                                {f.customer ? f.customer.company : "Independent"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 5. Origin / Destination */}
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b" }}>
                            <i className="fas fa-location-dot" style={{ color: "#94a3b8", fontSize: "14px" }}></i>
                            <span style={{ fontSize: "13px", fontWeight: "500" }}>{f.route}</span>
                          </div>
                        </td>

                        {/* 6. Actions */}
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                router.push(`/admin/flights/view?id=${f.id}`);
                              }}
                              style={{
                                background: "#10b981",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(16,185,129,0.2)"
                              }}
                              title="View Details"
                            >
                              <i className="far fa-eye" style={{ fontSize: "12px" }}></i>
                            </button>
                            <button
                              onClick={() => {
                                router.push(`/admin/flights/edit?id=${f.id}`);
                              }}
                              style={{
                                background: "#3b82f6",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
                              }}
                              title="Edit Flight"
                            >
                              <i className="far fa-edit" style={{ fontSize: "12px" }}></i>
                            </button>
                            <a
                              href={f.customer && f.customer.contact ? `https://wa.me/${f.customer.contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${f.customer.name}, checking your flight ${f.flightNo} status.`)}` : "#"}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                if (!f.customer || !f.customer.contact) {
                                  e.preventDefault();
                                  showToast("No customer contact number available!", "error");
                                }
                              }}
                              style={{
                                background: "#25d366",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "50%",
                                width: "26px",
                                height: "26px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(37,211,102,0.2)"
                              }}
                              title="WhatsApp Passenger"
                            >
                              <i className="fab fa-whatsapp" style={{ fontSize: "12px" }}></i>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Segment */}
          {flights.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Showing {totalFltCount === 0 ? 0 : (fltPage - 1) * fltPerPage + 1} to {Math.min(fltPage * fltPerPage, totalFltCount)} of {totalFltCount} entries
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setFltPage(prev => Math.max(1, prev - 1))}
                  className="form-btn-back"
                  style={{
                    background: fltPage === 1 ? "#f1f5f9" : "#e0e7ff",
                    color: fltPage === 1 ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: fltPage === 1 ? "not-allowed" : "pointer"
                  }}
                  disabled={fltPage === 1}
                >
                  Previous
                </button>
                <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                  Page {fltPage} of {fltTotalPages}
                </span>
                <button
                  onClick={() => setFltPage(prev => Math.min(fltTotalPages, prev + 1))}
                  className="form-btn-back"
                  style={{
                    background: fltPage >= fltTotalPages ? "#f1f5f9" : "#e0e7ff",
                    color: fltPage >= fltTotalPages ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: fltPage >= fltTotalPages ? "not-allowed" : "pointer"
                  }}
                  disabled={fltPage >= fltTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
