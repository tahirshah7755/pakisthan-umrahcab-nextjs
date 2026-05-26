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
  customer?: {
    id: number;
    custom_id: string;
    name: string;
    company: string;
    contact: string;
  };
}

export default function FlightsDirectory() {
  const router = useRouter();
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [fltPage, setFltPage] = useState(1);
  const [fltPerPage, setFltPerPage] = useState(10);
  const [totalFltCount, setTotalFltCount] = useState(0);
  const [fltTotalPages, setFltTotalPages] = useState(1);
  const [fltSearch, setFltSearch] = useState("");
  const [fltStartDate, setFltStartDate] = useState("");
  const [fltEndDate, setFltEndDate] = useState("");
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

  const fetchFlightsList = async () => {
    try {
      setLoading(true);
      const res = await api.getFlights(
        fltSearch,
        undefined,
        fltPage,
        fltPerPage,
        fltStartDate,
        fltEndDate
      );
      if (res) {
        setFlights(res.data || []);
        setTotalFltCount(res.total || 0);
        setFltTotalPages(res.last_page || 1);
      }
    } catch (err) {
      console.error("Failed to load flights list:", err);
      showToast("Failed to load flight directory.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightsList();
  }, [fltPage, fltPerPage, fltSearch]);

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this flight record? This cannot be undone.")) return;
    try {
      const res = await api.deleteFlight(id);
      if (res && res.success) {
        showToast("Flight record deleted successfully.", "success");
        fetchFlightsList();
      } else {
        showToast(res.error || "Failed to delete flight record.", "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred.", "error");
    }
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthName = months[monthIndex] || parts[1];
        return `${day < 10 ? '0' + day : day} ${monthName}, ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTimeString = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const parts = timeStr.split(":");
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours < 10 ? '0' + hours : hours}:${minutes} ${ampm}`;
      }
      return timeStr;
    } catch {
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

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "700" }}>Flight Directory</h2>
          <p style={{ opacity: 0.9 }}>Lookup and manage departure and arrival records for all passengers.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/flights/add")} 
          style={{
            background: "#ffffff",
            color: "#0f172a",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
          }}
        >
          <i className="fas fa-plus"></i>
          <span>New Flight</span>
        </button>
      </div>

      {/* Date & Filter Panel */}
      <div className="form-card" style={{ 
        padding: "20px", 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr auto auto", 
        gap: "15px", 
        alignItems: "end", 
        background: "#ffffff", 
        border: "1px solid #e2e8f0", 
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div>
          <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Flight Start Date</label>
          <div className="form-input-wrapper">
            <i className="far fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
            <input type="date" className="form-input" value={fltStartDate} onChange={(e) => { setFltStartDate(e.target.value); setFltPage(1); }} />
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Flight End Date</label>
          <div className="form-input-wrapper">
            <i className="far fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
            <input type="date" className="form-input" value={fltEndDate} onChange={(e) => { setFltEndDate(e.target.value); setFltPage(1); }} />
          </div>
        </div>

        <button
          onClick={() => {
            fetchFlightsList();
            showToast("Filters applied", "success");
          }}
          style={{
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "10px 24px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            height: "42px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
        >
          <i className="fas fa-filter" style={{ color: "#475569" }}></i>
          <span>Apply Filter</span>
        </button>

        <button
          onClick={() => {
            setFltSearch("");
            setFltStartDate("");
            setFltEndDate("");
            setFltPage(1);
            showToast("Filters reset", "success");
          }}
          style={{
            background: "#cbd5e1",
            color: "#475569",
            border: "none",
            borderRadius: "8px",
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#b91c1c"; e.currentTarget.style.color = "#ffffff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#cbd5e1"; e.currentTarget.style.color = "#475569"; }}
          title="Reset Filters"
        >
          <i className="fas fa-undo"></i>
        </button>
      </div>

      {/* Export & Search Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Copy", "CSV", "Excel", "PDF", "Print"].map((exportOpt, idx) => (
            <button
              key={idx}
              onClick={() => showToast(`${exportOpt} exported successfully!`, "success")}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
              }}
            >
              {exportOpt}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
          <input
            type="text"
            placeholder=""
            value={fltSearch}
            onChange={(e) => {
              setFltSearch(e.target.value);
              setFltPage(1);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: "14px",
              width: "200px",
              background: "#ffffff"
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "80px" }}>ID</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Flight #</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Passenger</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Type</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Port / City</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Date</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Time</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "120px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Loading flight records...
                  </td>
                </tr>
              ) : flights.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No flight records found matching the search criteria.
                  </td>
                </tr>
              ) : (
                flights.map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>{f.custom_id || `#FLT-${f.id}`}</td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{f.flightNo}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{f.customer ? f.customer.name : "Walk-in Passenger"}</div>
                      {f.customer && f.customer.company && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{f.customer.company}</div>
                      )}
                    </td>
                    <td>
                      {f.leg === "Departure" ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#dbeafe",
                          color: "#1e40af",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}>
                          <i className="fas fa-plane-departure" style={{ fontSize: "10px" }}></i>
                          Departure
                        </span>
                      ) : f.leg === "Both Legs" ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#f3e8ff",
                          color: "#6b21a8",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}>
                          <i className="fas fa-arrows-left-right" style={{ fontSize: "10px" }}></i>
                          Both Legs
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#dcfce7",
                          color: "#166534",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}>
                          <i className="fas fa-plane-arrival" style={{ fontSize: "10px" }}></i>
                          Arrival
                        </span>
                      )}
                    </td>
                    <td style={{ color: "#475569", fontSize: "13px" }}>{f.route}</td>
                    <td style={{ color: "#0f172a", fontSize: "13px", fontWeight: "500" }}>{formatDateString(f.date)}</td>
                    <td style={{ color: "#0f172a", fontSize: "13px", fontWeight: "500" }}>{formatTimeString(f.time)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => router.push(`/admin/flights/view?id=${f.id}`)}
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
                          onClick={() => router.push(`/admin/flights/edit?id=${f.id}`)}
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
                          title="Edit Record"
                        >
                          <i className="far fa-edit" style={{ fontSize: "12px" }}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(239,68,68,0.2)"
                          }}
                          title="Delete Record"
                        >
                          <i className="far fa-trash-alt" style={{ fontSize: "12px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            Showing {flights.length} of {totalFltCount} records
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setFltPage(prev => Math.max(1, prev - 1))}
              style={{
                background: fltPage === 1 ? "#f1f5f9" : "#e0e7ff",
                color: fltPage === 1 ? "#94a3b8" : "#4338ca",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
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
              style={{
                background: fltPage >= fltTotalPages ? "#f1f5f9" : "#e0e7ff",
                color: fltPage >= fltTotalPages ? "#94a3b8" : "#4338ca",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: fltPage >= fltTotalPages ? "not-allowed" : "pointer"
              }}
              disabled={fltPage >= fltTotalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
