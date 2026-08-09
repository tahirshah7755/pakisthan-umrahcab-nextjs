"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateToCustom, getSaudiTodayDate } from "@/utils/formatters";
import { exportToExcel } from "@/utils/excelHelper";

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
  driver_id?: number | null;
  driver?: any;
  status?: string;
  driver_trip_status?: string | null;
}

export default function FlightsDirectory() {
  const router = useRouter();
  const { user } = useAuth();

  // Determine permissions
  const getPermission = () => {
    if (!user) return "none";
    if (user.role === "SUPER_ADMIN") return "full";
    const userPerms = (user as any).permissions || {};
    return userPerms["flights"] || "none";
  };

  const permission = getPermission();
  const canEdit = permission === "edit" || permission === "full";
  const canDelete = permission === "full";

  // Redirect if unauthorized
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      const userPerms = (user as any).permissions || {};
      const access = userPerms["flights"] || "none";
      if (access === "none") {
        router.push("/admin/hub");
      }
    }
  }, [user, router]);
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [fltPage, setFltPage] = useState(1);
  const [fltPerPage, setFltPerPage] = useState(10);
  const [totalFltCount, setTotalFltCount] = useState(0);
  const [fltTotalPages, setFltTotalPages] = useState(1);
  const [fltSearch, setFltSearch] = useState("");
  const [fltStartDate, setFltStartDate] = useState("");
  const [fltEndDate, setFltEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedShareFlight, setSelectedShareFlight] = useState<FlightItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function loadDrivers() {
      try {
        const res = await api.getDrivers();
        if (Array.isArray(res)) setDrivers(res);
      } catch (err) {
        console.warn("Could not load drivers in flights list", err);
      }
    }
    loadDrivers();
  }, []);

  const handleInlineDriverChange = async (flightId: string | number, driverId: string) => {
    try {
      setLoading(true);
      const flight = flights.find(f => String(f.id) === String(flightId));
      if (!flight) return;

      const payload = {
        customer_id: flight.customer?.id || (flight as any).customer_id,
        driver_id: driverId ? parseInt(driverId) : null,
        flight_no: (flight as any).flight_no || flight.flightNo,
        leg: flight.leg,
        date: flight.date,
        time: flight.time,
        route: flight.route,
        status: flight.status || "On Time",
        driver_trip_status: (flight as any).driver_trip_status || null
      };

      const res = await api.updateFlight(flightId, payload);
      if (res && res.success) {
        showToast("Driver assignment updated successfully!", "success");
        fetchFlightsList();
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

  const handleInlineDriverTripStatusChange = async (flightId: string | number, tripStatus: string) => {
    try {
      setLoading(true);
      const flight = flights.find(f => String(f.id) === String(flightId));
      if (!flight) return;

      const payload = {
        customer_id: flight.customer?.id || (flight as any).customer_id,
        driver_id: (flight as any).driver_id || null,
        flight_no: (flight as any).flight_no || flight.flightNo,
        leg: flight.leg,
        date: flight.date,
        time: flight.time,
        route: flight.route,
        status: flight.status || "On Time",
        driver_trip_status: tripStatus || null
      };

      const res = await api.updateFlight(flightId, payload);
      if (res && res.success) {
        showToast("Driver trip status updated successfully!", "success");
        fetchFlightsList();
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

  const handleCopy = () => {
    if (flights.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["ID", "Flight #", "Passenger", "Associated Company", "Type", "Port / City", "Date", "Time"];
    const textRows = flights.map((f: any) => [
      f.custom_id || `#FLT-${f.id}`,
      f.flightNo || "",
      f.customer ? f.customer.name : "Walk-in Passenger",
      f.customer && f.customer.company ? f.customer.company : "",
      f.leg || "",
      f.route || "",
      formatDateString(f.date),
      formatTimeString(f.time)
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied flights to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (flights.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Flight #", "Passenger", "Associated Company", "Type", "Port / City", "Date", "Time"];
    const csvContent = [
      headers.join(","),
      ...flights.map((f: any) => [
        `"${(f.custom_id || `#FLT-${f.id}`).replace(/"/g, '""')}"`,
        `"${(f.flightNo || "").replace(/"/g, '""')}"`,
        `"${(f.customer ? f.customer.name : "Walk-in Passenger").replace(/"/g, '""')}"`,
        `"${(f.customer && f.customer.company ? f.customer.company : "").replace(/"/g, '""')}"`,
        `"${(f.leg || "").replace(/"/g, '""')}"`,
        `"${(f.route || "").replace(/"/g, '""')}"`,
        `"${formatDateString(f.date).replace(/"/g, '""')}"`,
        `"${formatTimeString(f.time).replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `flights_${getSaudiTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handleExportExcel = () => {
    if (flights.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Flight #", "Passenger", "Associated Company", "Type", "Port / City", "Date", "Time"];
    const textRows = flights.map((f: any) => [
      f.custom_id || `#FLT-${f.id}`,
      f.flightNo || "",
      f.customer ? f.customer.name : "Walk-in Passenger",
      f.customer && f.customer.company ? f.customer.company : "",
      f.leg || "",
      f.route || "",
      formatDateString(f.date),
      formatTimeString(f.time)
    ]);
    
    exportToExcel({
      title: "Flight Passenger Registry",
      headers,
      rows: textRows,
      filename: `flights_${getSaudiTodayDate()}.xls`
    });
  };

  const handlePrint = (title: string = "Flight Passenger Directory") => {
    if (flights.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Riyadh" });
    
    const rowsHtml = flights.map((f: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0284c7;">${f.custom_id || `#FLT-${f.id}`}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${f.flightNo || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700;">${f.customer ? f.customer.name : "Walk-in Passenger"}</div>
          ${f.customer && f.customer.company ? `<div style="font-size: 10px; color: #64748b;">${f.customer.company}</div>` : ""}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${f.leg || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${f.route || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${formatDateString(f.date)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${formatTimeString(f.time)}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0284c7; font-size: 24px; }
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
              <p>Umrah Cab Flight Passenger Directory</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Flights:</strong> ${flights.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Flight #</th>
                <th>Passenger</th>
                <th>Type</th>
                <th>Port / City</th>
                <th>Date</th>
                <th>Time</th>
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
    return formatDateToCustom(dateStr);
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
        {canEdit && (
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
        )}
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
          <button onClick={handleCopy} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}>
            Copy
          </button>
          <button onClick={handleExportCSV} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}>
            CSV
          </button>
          <button onClick={handleExportExcel} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}>
            Excel
          </button>
          <button onClick={() => handlePrint("Flight Directory - PDF Report")} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}>
            PDF
          </button>
          <button onClick={() => handlePrint("Flight Passenger Directory")} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}>
            Print
          </button>
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
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "150px" }}>Driver</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "180px" }}>Driver Trip Status</th>
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
                      <select
                        value={(f as any).driver_id || ""}
                        onChange={(e) => handleInlineDriverChange(f.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          width: "140px",
                          color: (f as any).driver_id ? "#1e293b" : "#94a3b8",
                          fontWeight: (f as any).driver_id ? "600" : "normal",
                          outline: "none"
                        }}
                      >
                        <option value="">-- No Driver --</option>
                        {drivers.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <select
                          value={(f as any).driver_trip_status || ""}
                          onChange={(e) => handleInlineDriverTripStatusChange(f.id, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            width: "155px",
                            color: (f as any).driver_trip_status ? "#1e293b" : "#94a3b8",
                            fontWeight: (f as any).driver_trip_status ? "600" : "normal",
                            outline: "none"
                          }}
                        >
                          <option value="">Select Status</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Guest In Contact">Guest In Contact</option>
                          <option value="No Reply From Guest">No Reply From Guest</option>
                          <option value="On The Way">On The Way</option>
                          <option value="Reached At Location">Reached At Location</option>
                          <option value="Pickup Done">Pickup Done</option>
                          <option value="Ride End">Ride End</option>
                          <option value="Ride Cancelled">Ride Cancelled</option>
                          <option value="Ride Miss">Ride Miss</option>
                          <option value="No Show">No Show</option>
                          <option value="Driver Copy Shared">Driver Copy Shared</option>
                        </select>
                        <button
                          onClick={() => {
                            setSelectedShareFlight(f);
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
                            fontSize: "12px"
                          }}
                          title="Share template messages"
                        >
                          <i className="fas fa-info-circle"></i>
                        </button>
                      </div>
                    </td>
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
                        {canEdit && (
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
                        )}
                        {canDelete && (
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
                        )}
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

      {showShareModal && selectedShareFlight && (
        <ShareTemplateModal
          booking={selectedShareFlight}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedShareFlight(null);
          }}
        />
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
    return `*HEBA CAB FLIGHT DETAILS (DRIVER COPY)*\n---------------------------------\n*Flight Code:* ${b.custom_id || b.id}\n*Guest Name:* ${b.customer ? b.customer.name : "Walk-in Passenger"}\n*Guest Phone:* ${b.customer ? b.customer.contact : "N/A"}\n*Date & Time:* ${b.date} at ${b.time}\n*Flight No:* ${b.flightNo}\n*Leg/Type:* ${b.leg}\n*Port / City:* ${b.route}`;
  };

  const getAgentCopy = (b: any) => {
    const dName = b.driver ? b.driver.name : "None";
    const dPhone = b.driver ? b.driver.phone : "";
    return `*HEBA CAB STATUS UPDATE (AGENT COPY)*\n---------------------------------\n*Flight Code:* ${b.custom_id || b.id}\n*Guest Name:* ${b.customer ? b.customer.name : "Walk-in Passenger"}\n*Date & Time:* ${b.date} at ${b.time}\n*Driver Assigned:* ${dName} ${dPhone ? `(${dPhone})` : ""}\n*Trip Status:* ${b.driver_trip_status || "Not Set"}`;
  };

  const getClientCopy = (b: any) => {
    const dName = b.driver ? b.driver.name : "TBD";
    const dPhone = b.driver ? b.driver.phone : "TBD";
    return `*HEBA CAB STATUS UPDATE (CLIENT COPY)*\n---------------------------------\nDear *${b.customer ? b.customer.name : "Passenger"}*,\n\nYour driver's status has been updated:\n*Status:* ${b.driver_trip_status || "Assigned"}\n*Driver Name:* ${dName}\n*Driver Phone:* ${dPhone}\n\nThank you for choosing Heba Cab!`;
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
      phone = booking.customer ? booking.customer.contact : "";
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
