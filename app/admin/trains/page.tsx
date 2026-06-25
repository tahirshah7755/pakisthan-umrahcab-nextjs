"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel } from "@/utils/excelHelper";

interface TrainItem {
  id: string;      // custom_id (e.g. #TRN-32003)
  rawId: number;   // actual database integer ID
  trainNo: string;
  leg: "Arrival" | "Departure" | "Both Legs";
  route: string;
  date: string;
  time: string;
  customer?: {
    id: number;
    custom_id: string;
    name: string;
    company: string;
  };
}

export default function TrainsDirectory() {
  const router = useRouter();
  const { user } = useAuth();

  // Determine permissions
  const getPermission = () => {
    if (!user) return "none";
    if (user.role === "SUPER_ADMIN") return "full";
    const userPerms = (user as any).permissions || {};
    return userPerms["trains"] || "none";
  };

  const permission = getPermission();
  const canEdit = permission === "edit" || permission === "full";
  const canDelete = permission === "full";

  // Redirect if unauthorized
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      const userPerms = (user as any).permissions || {};
      const access = userPerms["trains"] || "none";
      if (access === "none") {
        router.push("/admin/hub");
      }
    }
  }, [user, router]);

  const [trains, setTrains] = useState<TrainItem[]>([]);
  const [trnPage, setTrnPage] = useState(1);
  const [trnPerPage, setTrnPerPage] = useState(10);
  const [totalTrnCount, setTotalTrnCount] = useState(0);
  const [trnTotalPages, setTrnTotalPages] = useState(1);
  const [trnSearch, setTrnSearch] = useState("");
  const [trnStartDate, setTrnStartDate] = useState("");
  const [trnEndDate, setTrnEndDate] = useState("");
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

  const handleCopy = () => {
    if (trains.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["ID", "Train #", "Passenger", "Company", "Type", "Station / City", "Date", "Time"];
    const textRows = trains.map((t: any) => [
      t.id,
      t.trainNo || "",
      t.customer ? t.customer.name : "Walk-in Passenger",
      t.customer ? t.customer.company : "UmrahCab Admin",
      t.leg || "",
      t.route || "",
      t.date ? formatScheduleDate(t.date) : "N/A",
      t.time ? formatTime12h(t.time) : "N/A"
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied trains list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (trains.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Train #", "Passenger", "Company", "Type", "Station / City", "Date", "Time"];
    const csvContent = [
      headers.join(","),
      ...trains.map((t: any) => [
        `"${(t.id || "").replace(/"/g, '""')}"`,
        `"${(t.trainNo || "").replace(/"/g, '""')}"`,
        `"${(t.customer ? t.customer.name : "Walk-in Passenger").replace(/"/g, '""')}"`,
        `"${(t.customer ? t.customer.company : "UmrahCab Admin").replace(/"/g, '""')}"`,
        `"${(t.leg || "").replace(/"/g, '""')}"`,
        `"${(t.route || "").replace(/"/g, '""')}"`,
        `"${(t.date ? formatScheduleDate(t.date) : "N/A").replace(/"/g, '""')}"`,
        `"${(t.time ? formatTime12h(t.time) : "N/A").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `trains_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handleExportExcel = () => {
    if (trains.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Train #", "Passenger", "Company", "Type", "Station / City", "Date", "Time"];
    const textRows = trains.map((t: any) => [
      t.id,
      t.trainNo || "",
      t.customer ? t.customer.name : "Walk-in Passenger",
      t.customer ? t.customer.company : "UmrahCab Admin",
      t.leg || "",
      t.route || "",
      t.date ? formatScheduleDate(t.date) : "N/A",
      t.time ? formatTime12h(t.time) : "N/A"
    ]);
    
    exportToExcel({
      title: "Train Passenger Registry",
      headers,
      rows: textRows,
      filename: `trains_${new Date().toISOString().split("T")[0]}.xls`
    });
  };

  const handlePrint = (title: string = "Train Passenger Directory") => {
    if (trains.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = trains.map((t: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #db2777;">${t.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${t.trainNo || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700;">${t.customer ? t.customer.name : "Walk-in Passenger"}</div>
          <div style="font-size: 10px; color: #64748b;">${t.customer ? t.customer.company : "UmrahCab Admin"}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${t.leg || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${t.route || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${t.date ? formatScheduleDate(t.date) : "N/A"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${t.time ? formatTime12h(t.time) : "N/A"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #db2777; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #db2777; font-size: 24px; }
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
              <p>Umrah Cab Train Passenger Directory</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Train Records:</strong> ${trains.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Train #</th>
                <th>Passenger</th>
                <th>Type</th>
                <th>Station / City</th>
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

  const fetchTrainsList = async () => {
    try {
      setLoading(true);
      const res = await api.getTrains(
        trnSearch,
        undefined, // leg
        trnPage,
        trnPerPage,
        undefined, // status
        trnStartDate,
        trnEndDate
      );
      if (res && res.data) {
        setTrains(
          res.data.map((t: any) => ({
            id: t.custom_id || `#TRN-${t.id}`,
            rawId: t.id,
            trainNo: t.train_no,
            leg: t.leg,
            route: t.route,
            date: t.date,
            time: t.time ? t.time.substring(0, 5) : "",
            customer: t.customer,
          }))
        );
        setTotalTrnCount(res.total || 0);
        setTrnTotalPages(res.last_page || 1);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load train records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainsList();
  }, [trnPage, trnPerPage, trnSearch]);

  const handleDeleteTrain = async (id: number, customId: string) => {
    if (window.confirm(`Are you sure you want to delete train record ${customId}?`)) {
      try {
        const res = await api.deleteTrain(id);
        if (res.success) {
          showToast(`Train record ${customId} deleted successfully`, "success");
          fetchTrainsList();
        } else {
          showToast("Failed to delete train record", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error deleting train record", "error");
      }
    }
  };

  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
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
      const pad = (n: number) => (n < 10 ? `0${n}` : n);
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

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #db2777 0%, #be185d 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Train Directory</h2>
          <p>Lookup and manage departure and arrival records for all train passengers.</p>
        </div>
        {canEdit && (
        <button onClick={() => router.push("/admin/trains/add")} className="form-btn-back" style={{ background: "#ffffff", color: "#be185d" }}>
          <i className="fas fa-plus-circle"></i>
          <span>New Train Record</span>
        </button>
      )}
      </div>

      {/* Date & Filter Panel */}
      <div className="form-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "15px", alignItems: "end", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <div>
          <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Journey Start Date</label>
          <div className="form-input-wrapper">
            <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
            <input type="date" className="form-input" value={trnStartDate} onChange={(e) => { setTrnStartDate(e.target.value); setTrnPage(1); }} />
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Journey End Date</label>
          <div className="form-input-wrapper">
            <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
            <input type="date" className="form-input" value={trnEndDate} onChange={(e) => { setTrnEndDate(e.target.value); setTrnPage(1); }} />
          </div>
        </div>

        <button
          onClick={() => {
            fetchTrainsList();
            showToast("Filters applied", "success");
          }}
          className="btn-submit"
          style={{
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "0 24px",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            height: "42px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
        >
          <i className="fas fa-filter"></i>
          <span>Apply Filter</span>
        </button>

        <button
          onClick={() => {
            setTrnSearch("");
            setTrnStartDate("");
            setTrnEndDate("");
            setTrnPage(1);
            showToast("Filters reset", "success");
          }}
          style={{
            background: "#f1f5f9",
            color: "#475569",
            border: "none",
            borderRadius: "8px",
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
          title="Reset Filters"
        >
          <i className="fas fa-undo"></i>
        </button>
      </div>

      {/* Export & Search Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleCopy} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            Copy
          </button>
          <button onClick={handleExportCSV} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            CSV
          </button>
          <button onClick={handleExportExcel} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            Excel
          </button>
          <button onClick={() => handlePrint("Trains Directory - PDF Report")} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            PDF
          </button>
          <button onClick={() => handlePrint("Train Passenger Directory")} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            Print
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
          <input
            type="text"
            placeholder="Search trains..."
            value={trnSearch}
            onChange={(e) => {
              setTrnSearch(e.target.value);
              setTrnPage(1);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: "14px",
              width: "180px",
              background: "#ffffff"
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>ID</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Train #</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Passenger</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Type</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Station / City</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Date</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Time</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Loading train records...
                  </td>
                </tr>
              ) : trains.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: "500" }}>
                    No train records found matching criteria.
                  </td>
                </tr>
              ) : (
                trains.map((t) => (
                  <tr key={t.rawId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>{t.id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                      <i className="fas fa-train" style={{ marginRight: "6px", color: "#db2777" }}></i>
                      {t.trainNo}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {t.customer ? t.customer.name : "Walk-in Passenger"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {t.customer ? t.customer.company : "UmrahCab Admin"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {t.leg === "Arrival" ? (
                        <span className="status-pill" style={{ background: "#dcfce7", color: "#15803d", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", padding: "4px 8px", borderRadius: "12px" }}>
                          <i className="fas fa-train" style={{ fontSize: "10px" }}></i> Arrival
                        </span>
                      ) : t.leg === "Departure" ? (
                        <span className="status-pill" style={{ background: "#dbeafe", color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", padding: "4px 8px", borderRadius: "12px" }}>
                          <i className="fas fa-train" style={{ fontSize: "10px" }}></i> Departure
                        </span>
                      ) : (
                        <span className="status-pill" style={{ background: "#f3e8ff", color: "#6b21a8", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", padding: "4px 8px", borderRadius: "12px" }}>
                          <i className="fas fa-arrows-left-right" style={{ fontSize: "10px" }}></i> Both Legs
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{t.route}</td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      {t.date ? formatScheduleDate(t.date) : "N/A"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      {t.time ? formatTime12h(t.time) : "N/A"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => router.push(`/admin/trains/view?id=${t.rawId}`)}
                          title="View Details"
                          style={{
                            background: "#10b981",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "4px",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
                        >
                          <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => router.push(`/admin/trains/edit?id=${t.rawId}`)}
                            title="Edit Record"
                            style={{
                              background: "#3b82f6",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                          >
                            <i className="fas fa-edit" style={{ fontSize: "12px" }}></i>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteTrain(t.rawId, t.id)}
                            title="Delete Record"
                            style={{
                              background: "#ef4444",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
                          >
                            <i className="fas fa-trash-alt" style={{ fontSize: "12px" }}></i>
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
            Showing {trains.length} of {totalTrnCount} records
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setTrnPage(prev => Math.max(1, prev - 1))}
              style={{
                background: trnPage === 1 ? "#f1f5f9" : "#e0e7ff",
                color: trnPage === 1 ? "#94a3b8" : "#4338ca",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: trnPage === 1 ? "not-allowed" : "pointer"
              }}
              disabled={trnPage === 1}
            >
              Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
              Page {trnPage} of {trnTotalPages}
            </span>
            <button
              onClick={() => setTrnPage(prev => Math.min(trnTotalPages, prev + 1))}
              style={{
                background: trnPage >= trnTotalPages ? "#f1f5f9" : "#e0e7ff",
                color: trnPage >= trnTotalPages ? "#94a3b8" : "#4338ca",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: trnPage >= trnTotalPages ? "not-allowed" : "pointer"
              }}
              disabled={trnPage >= trnTotalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
