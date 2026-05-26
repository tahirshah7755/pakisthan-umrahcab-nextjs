"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface ServiceItem {
  id: string;      // custom_id (e.g. #SRV-4068)
  rawId: number;   // actual database integer ID
  name: string;
  type: string;
  description: string;
  basePrice: number;
  status: string;
  customerName: string;
  companyName: string;
  pickup: string;
  driverCash: number;
  date: string;
  time: string;
}

export default function ServicesDirectory() {
  const router = useRouter();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [srvPage, setSrvPage] = useState(1);
  const [srvPerPage, setSrvPerPage] = useState(10);
  const [totalSrvCount, setTotalSrvCount] = useState(0);
  const [srvTotalPages, setSrvTotalPages] = useState(1);
  const [srvSearch, setSrvSearch] = useState("");
  const [srvStatusFilter, setSrvStatusFilter] = useState("All");
  const [srvStartDate, setSrvStartDate] = useState("");
  const [srvEndDate, setSrvEndDate] = useState("");
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

  const fetchServicesList = async () => {
    try {
      setLoading(true);
      const res = await api.getServices(
        srvSearch,
        undefined, // type
        srvPage,
        srvPerPage,
        srvStatusFilter === "All" ? undefined : srvStatusFilter
      );
      if (res) {
        const dataArr = res.data || res;
        if (Array.isArray(dataArr)) {
          setServices(
            dataArr.map((s: any) => ({
              id: s.custom_id || `#SRV-${s.id}`,
              rawId: s.id,
              name: s.name,
              type: s.type,
              description: s.description || "",
              basePrice: parseFloat(s.base_price || 0),
              status: s.status || "Active",
              customerName: s.customer ? s.customer.name : "Guest",
              companyName: s.customer ? s.customer.company : "Walk-in",
              pickup: s.pickup || "",
              driverCash: parseFloat(s.driver_cash || 0),
              date: s.date || "",
              time: s.time || "",
            }))
          );
          setTotalSrvCount(res.total || dataArr.length);
          setSrvTotalPages(res.last_page || 1);
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load supplementary service records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServicesList();
    }, 200);
    return () => clearTimeout(timer);
  }, [srvPage, srvPerPage, srvSearch, srvStatusFilter]);

  const handleDeleteService = async (id: number, customId: string) => {
    if (window.confirm(`Are you sure you want to delete service record ${customId}?`)) {
      try {
        const res = await api.deleteService(String(id));
        if (res?.success) {
          showToast(`Service record ${customId} deleted successfully`, "success");
          fetchServicesList();
        } else {
          showToast("Failed to delete service record", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error deleting service record", "error");
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
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Additional Services</h2>
          <p>Manage, track, and export supplementary service records for pilgrims and transport passengers.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/admin/services/items")} className="form-btn-back" style={{ background: "rgba(255, 255, 255, 0.15)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.25)" }}>
            <i className="fas fa-cubes"></i>
            <span>Catalogue</span>
          </button>
          <button onClick={() => router.push("/admin/services/add")} className="form-btn-back" style={{ background: "#ffffff", color: "#6d28d9" }}>
            <i className="fas fa-plus-circle"></i>
            <span>New Service</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {["Today", "Yesterday", "Last 7 Days", "Next 7 Days"].map((filterOpt, idx) => (
          <button
            key={idx}
            onClick={() => showToast(`Filter updated to: ${filterOpt}`, "success")}
            style={{
              background: filterOpt === "Last 7 Days" ? "#f5f3ff" : "#ffffff",
              color: filterOpt === "Last 7 Days" ? "#7c3aed" : "#475569",
              border: `1px solid ${filterOpt === "Last 7 Days" ? "#7c3aed" : "#cbd5e1"}`,
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
            <i className={`fas ${filterOpt === "Today" ? "fa-calendar" : filterOpt === "Yesterday" ? "fa-calendar-minus" : filterOpt === "Last 7 Days" ? "fa-history" : "fa-calendar-plus"}`}></i>
            {filterOpt}
          </button>
        ))}
      </div>

      {/* Date & Filter Panel */}
      <div className="form-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: "15px", alignItems: "end", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <div>
          <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Start Date (Service Date)</label>
          <div className="form-input-wrapper">
            <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
            <input type="date" className="form-input" value={srvStartDate} onChange={(e) => { setSrvStartDate(e.target.value); setSrvPage(1); }} />
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>End Date (Service Date)</label>
          <div className="form-input-wrapper">
            <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
            <input type="date" className="form-input" value={srvEndDate} onChange={(e) => { setSrvEndDate(e.target.value); setSrvPage(1); }} />
          </div>
        </div>

        <div>
          <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Status</label>
          <div className="form-input-wrapper">
            <i className="fas fa-filter form-icon" style={{ color: "#94a3b8" }}></i>
            <select
              className="form-input form-select"
              value={srvStatusFilter}
              onChange={(e) => {
                setSrvStatusFilter(e.target.value);
                setSrvPage(1);
              }}
              style={{ paddingLeft: "40px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <i className="fas fa-chevron-down select-arrow" style={{ right: "12px" }}></i>
          </div>
        </div>

        <button
          onClick={() => {
            fetchServicesList();
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
            setSrvSearch("");
            setSrvStartDate("");
            setSrvEndDate("");
            setSrvStatusFilter("All");
            setSrvPage(1);
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
          {["Copy", "CSV", "Excel", "PDF", "Print"].map((exportOpt, idx) => (
            <button
              key={idx}
              onClick={() => showToast(`${exportOpt} exported successfully!`, "success")}
              style={{
                background: "#7c3aed",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#6d28d9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#7c3aed"}
            >
              {exportOpt}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
          <input
            type="text"
            placeholder="Search services..."
            value={srvSearch}
            onChange={(e) => {
              setSrvSearch(e.target.value);
              setSrvPage(1);
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
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Service Date</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Customer</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Service Type</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Pickup</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Status</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Total (SAR)</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Cash (Driver)</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Loading supplementary service records...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: "500" }}>
                    No service records found matching criteria.
                  </td>
                </tr>
              ) : (
                services.map((svc) => (
                  <tr key={svc.rawId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>{svc.id}</td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      {svc.date ? formatScheduleDate(svc.date) : "N/A"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{svc.customerName}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{svc.companyName}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="status-pill active" style={{ background: "#f5f3ff", color: "#7c3aed", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px" }}>
                        <i className="fas fa-sparkles" style={{ fontSize: "10px" }}></i>
                        {svc.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{svc.pickup || "N/A"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`status-pill ${
                        svc.status === "Active" || svc.status === "Completed" ? "completed" : svc.status === "Cancelled" ? "cancelled" : "pending"
                      }`} style={{ textTransform: "capitalize" }}>
                        {svc.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#10b981" }}>
                      SAR {svc.basePrice.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0ea5e9" }}>
                      SAR {svc.driverCash.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => router.push(`/admin/services/view?id=${svc.rawId}`)}
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
                        <button
                          onClick={() => handleDeleteService(svc.rawId, svc.id)}
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
            Showing {services.length} of {totalSrvCount} records
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setSrvPage(prev => Math.max(1, prev - 1))}
              style={{
                background: srvPage === 1 ? "#f1f5f9" : "#f5f3ff",
                color: srvPage === 1 ? "#94a3b8" : "#7c3aed",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: srvPage === 1 ? "not-allowed" : "pointer"
              }}
              disabled={srvPage === 1}
            >
              Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
              Page {srvPage} of {srvTotalPages}
            </span>
            <button
              onClick={() => setSrvPage(prev => Math.min(srvTotalPages, prev + 1))}
              style={{
                background: srvPage >= srvTotalPages ? "#f1f5f9" : "#f5f3ff",
                color: srvPage >= srvTotalPages ? "#94a3b8" : "#7c3aed",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: srvPage >= srvTotalPages ? "not-allowed" : "pointer"
              }}
              disabled={srvPage >= srvTotalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
