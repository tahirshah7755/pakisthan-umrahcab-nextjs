"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel } from "@/utils/excelHelper";
import { formatDateToCustom } from "@/utils/formatters";

interface BookingItem {
  id: string;
  customerName: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicle: string;
  priceBeforeDiscount: number;
  discount: number;
  finalPrice: number;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  passengers?: string;
  email?: string;
  whatsapp?: string;
  flightNo?: string;
  notes?: string;
}

export default function BookingsList() {
  const router = useRouter();
  const { user } = useAuth();

  // Determine permissions
  const getPermission = () => {
    if (!user) return "none";
    if (user.role === "SUPER_ADMIN") return "full";
    const userPerms = (user as any).permissions || {};
    return userPerms["bookings"] || "none";
  };

  const permission = getPermission();
  const canEdit = permission === "edit" || permission === "full";
  const canDelete = permission === "full";

  // Redirect if unauthorized
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      const userPerms = (user as any).permissions || {};
      const access = userPerms["bookings"] || "none";
      if (access === "none") {
        router.push("/admin/hub");
      }
    }
  }, [user, router]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<BookingItem | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApproveBooking, setSelectedApproveBooking] = useState<BookingItem | null>(null);

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
    if (filteredBookings.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Booking ID", "Customer", "Pickup Date", "Pickup Time", "Pickup Location", "Dropoff Location", "Vehicle", "Price (SR)", "Status"];
    const textRows = filteredBookings.map((b: any) => [
      b.id,
      b.customerName || "Guest",
      b.pickupDate || "",
      b.pickupTime || "",
      b.pickupLocation || "",
      b.dropoffLocation || "",
      b.vehicle || "",
      b.finalPrice || 0,
      b.status || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied bookings list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Booking ID", "Customer", "Pickup Date", "Pickup Time", "Pickup Location", "Dropoff Location", "Vehicle", "Price (SR)", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredBookings.map((b: any) => [
        `"${(b.id || "").replace(/"/g, '""')}"`,
        `"${(b.customerName || "Guest").replace(/"/g, '""')}"`,
        `"${(b.pickupDate || "").replace(/"/g, '""')}"`,
        `"${(b.pickupTime || "").replace(/"/g, '""')}"`,
        `"${(b.pickupLocation || "").replace(/"/g, '""')}"`,
        `"${(b.dropoffLocation || "").replace(/"/g, '""')}"`,
        `"${(b.vehicle || "").replace(/"/g, '""')}"`,
        b.finalPrice || 0,
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

  const handleExportExcel = () => {
    if (filteredBookings.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Booking ID", "Customer", "Pickup Date", "Pickup Time", "Pickup Location", "Dropoff Location", "Vehicle", "Price (SR)", "Status"];
    const textRows = filteredBookings.map((b: any) => [
      b.id,
      b.customerName || "Guest",
      b.pickupDate || "",
      b.pickupTime || "",
      b.pickupLocation || "",
      b.dropoffLocation || "",
      b.vehicle || "",
      b.finalPrice || 0,
      b.status || ""
    ]);
    
    exportToExcel({
      title: "Transportation Bookings Registry",
      headers,
      rows: textRows,
      filename: `bookings_${new Date().toISOString().split("T")[0]}.xls`,
      totalsIndices: [7],
      statusIndex: 8
    });
  };

  const handlePrint = (title: string = "Transportation Bookings Registry") => {
    if (filteredBookings.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = filteredBookings.map((b: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1f6f8b;">${b.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${b.customerName || "Guest"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <div>${formatDateToCustom(b.pickupDate)}</div>
          <div style="font-size: 10px; color: #64748b;">${b.pickupTime || ""}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.pickupLocation} &rarr; ${b.dropoffLocation}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.vehicle || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right; color: #10b981;">SR ${b.finalPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.status}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f6f8b; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1f6f8b; font-size: 24px; }
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
              <p>Umrah Cab Transportation Bookings Registrar</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Bookings:</strong> ${filteredBookings.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Pickup Date/Time</th>
                <th>Route (From &rarr; To)</th>
                <th>Vehicle</th>
                <th style="text-align: right;">Final Price</th>
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

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.getBookings(debouncedSearch, currentPage, perPage);
      if (response) {
        let rawData = [];
        if (response.data && Array.isArray(response.data)) {
          rawData = response.data;
          setTotalCount(response.total || response.data.length);
          setTotalPages(response.last_page || 1);
        } else if (Array.isArray(response)) {
          rawData = response;
          setTotalCount(response.length);
          setTotalPages(1);
        }

        const mapped = rawData.map((b: any) => {
          let uiStatus: "Pending" | "Confirmed" | "Completed" | "Cancelled" = "Pending";
          if (b.status === "Active Dispatch") uiStatus = "Confirmed";
          else if (b.status === "Confirmed Booking") uiStatus = "Confirmed";
          else if (b.status === "Completed") uiStatus = "Completed";
          else if (b.status === "Cancelled") uiStatus = "Cancelled";

          return {
            id: b.booking_code || b.id || "UCB-XXXX",
            customerName: b.full_name || b.fullName || "Guest",
            pickupDate: b.date,
            pickupTime: b.time ? b.time.substring(0, 5) : "",
            pickupLocation: b.pickup,
            dropoffLocation: b.destination,
            vehicle: b.car_type || b.carType,
            priceBeforeDiscount: parseFloat(b.car_price || b.carPrice || 0),
            discount: 0,
            finalPrice: parseFloat(b.car_price || b.carPrice || 0),
            status: uiStatus,
            passengers: b.passengers || "",
            email: b.email || "",
            whatsapp: b.whatsapp || "",
            flightNo: b.flight_no || "",
            notes: b.notes || "",
          };
        });
        setBookings(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [debouncedSearch, currentPage, perPage]);

  const filteredBookings = bookings;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Toast notifications */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <i className={`fas ${toast.type === "success" ? "fa-circle-check text-success" : "fa-circle-xmark text-danger"}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #3b4cca 0%, #1f6f8b 100%)" }}>
        <div>
          <h2>Transportation Bookings</h2>
          <p>View, filter, and register transportation bookings for your clients.</p>
        </div>
        {canEdit && (
          <button onClick={() => router.push("/admin/bookings/add")} className="form-btn-back">
            <i className="fas fa-plus"></i>
            <span>Add New Booking</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="matrix-search-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div className="matrix-search-input-wrapper" style={{ flex: 1, minWidth: "250px", marginBottom: 0 }}>
          <i className="fas fa-search matrix-search-icon"></i>
          <input
            type="text"
            className="matrix-search-input"
            placeholder="Search bookings by ID, customer name, routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
          <button onClick={() => handlePrint("Transportation Bookings Registry - PDF Report")} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            PDF
          </button>
          <button onClick={() => handlePrint("Transportation Bookings Registry")} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            Print
          </button>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", flexDirection: "column", gap: "12px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid var(--primary-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
            <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "500" }}>Loading bookings...</span>
          </div>
        ) : (
          <div className="table-responsive">
          <table className="db-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Pickup Date/Time</th>
                <th>Route (From → To)</th>
                <th>Vehicle</th>
                <th>Final Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--primary-color)" }}>
                      {b.id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{formatDateToCustom(b.pickupDate)}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {b.pickupTime}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>{b.pickupLocation}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>→ {b.dropoffLocation}</span>
                    </div>
                  </td>
                  <td>{b.vehicle}</td>
                  <td style={{ fontWeight: 700, color: "var(--success-color)" }}>
                    SR {b.finalPrice.toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${b.status.toLowerCase()}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => router.push(`/admin/bookings/view?id=${b.id}`)}
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
                      {canEdit && (
                        <button
                          onClick={() => router.push(`/admin/bookings/edit?id=${b.id}`)}
                          title="Edit Booking"
                          style={{
                            background: "#f1f5f9",
                            border: "none",
                            borderRadius: "6px",
                            width: "30px",
                            height: "30px",
                            cursor: "pointer",
                            color: "var(--primary-color)",
                          }}
                        >
                          <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                        </button>
                      )}
                      {canEdit && b.status === "Pending" && (
                        <button
                          onClick={() => {
                            setSelectedApproveBooking(b);
                            setShowApproveModal(true);
                          }}
                          title="Confirm & Approve Booking"
                          style={{
                            background: "#dcfce7",
                            border: "none",
                            borderRadius: "6px",
                            width: "30px",
                            height: "30px",
                            cursor: "pointer",
                            color: "#16a34a",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="fas fa-check" style={{ fontSize: "12px" }}></i>
                        </button>
                      )}
                      {canEdit && b.status !== "Cancelled" && (
                        <button
                          onClick={() => {
                            setSelectedCancelBooking(b);
                            setShowCancelModal(true);
                          }}
                          title="Cancel & Refund Booking"
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: "6px",
                            width: "30px",
                            height: "30px",
                            cursor: "pointer",
                            color: "#ef4444",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="fas fa-ban" style={{ fontSize: "12px" }}></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    No bookings found matching your search.
                  </td>
                </tr>
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
              className="tool-date-input" 
              value={perPage} 
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: "70px", padding: "4px 8px", height: "auto" }}
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
              className="form-btn-back" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ 
                background: currentPage === 1 ? "#f1f5f9" : "var(--primary-color)", 
                color: currentPage === 1 ? "#94a3b8" : "#ffffff", 
                border: "none",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                padding: "6px 12px",
                fontWeight: "600",
                borderRadius: "6px",
                margin: 0
              }}
            >
              Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="form-btn-back" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{ 
                background: (currentPage === totalPages || totalPages === 0) ? "#f1f5f9" : "var(--primary-color)", 
                color: (currentPage === totalPages || totalPages === 0) ? "#94a3b8" : "#ffffff", 
                border: "none",
                cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer",
                padding: "6px 12px",
                fontWeight: "600",
                borderRadius: "6px",
                margin: 0
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>


      {/* Premium Cancel & Refund Modal */}
      {showCancelModal && selectedCancelBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "480px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                background: "#fee2e2",
                color: "#ef4444",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Cancel &amp; Refund Booking
              </h3>
            </div>

            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
              <p style={{ margin: "0 0 12px 0" }}>
                Are you sure you want to cancel booking <strong style={{ color: "#0f172a" }}>{selectedCancelBooking.id}</strong> for <strong style={{ color: "#0f172a" }}>{selectedCancelBooking.customerName}</strong>?
              </p>
              <div style={{
                background: "#f8fafc",
                borderRadius: "8px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Fare Price:</span>
                  <span style={{ fontWeight: "600" }}>SAR {selectedCancelBooking.finalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", fontWeight: "600" }}>
                  <span>Refund Amount:</span>
                  <span>SAR {selectedCancelBooking.finalPrice.toFixed(2)}</span>
                </div>
              </div>
              <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                <i className="fas fa-info-circle" style={{ marginRight: "4px" }}></i>
                If this booking was created by a B2B agent, the refund will be credited back to their ledger balance automatically.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedCancelBooking(null);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
              >
                No, Keep Booking
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setShowCancelModal(false);
                    const res = await api.updateBooking(selectedCancelBooking.id, { status: "Cancelled" });
                    if (res?.success) {
                      showToast(`Booking ${selectedCancelBooking.id} cancelled & refunded successfully!`, "success");
                      loadData();
                    } else {
                      showToast(res?.error || "Failed to cancel booking.", "error");
                      setLoading(false);
                    }
                  } catch (err) {
                    console.error(err);
                    showToast("Error cancelling booking.", "error");
                    setLoading(false);
                  } finally {
                    setSelectedCancelBooking(null);
                  }
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
              >
                Yes, Cancel &amp; Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Confirm & Approve Modal */}
      {showApproveModal && selectedApproveBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "480px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                background: "#dcfce7",
                color: "#16a34a",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}>
                <i className="fas fa-check-circle"></i>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Approve &amp; Confirm Booking
              </h3>
            </div>

            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
              <p style={{ margin: "0 0 12px 0" }}>
                Are you sure you want to approve booking <strong style={{ color: "#0f172a" }}>{selectedApproveBooking.id}</strong> for <strong style={{ color: "#0f172a" }}>{selectedApproveBooking.customerName}</strong>?
              </p>
              <div style={{
                background: "#f8fafc",
                borderRadius: "8px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Route:</span>
                  <span style={{ fontWeight: "600" }}>{selectedApproveBooking.pickupLocation} → {selectedApproveBooking.dropoffLocation}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Fare Price:</span>
                  <span style={{ fontWeight: "600" }}>SAR {selectedApproveBooking.finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedApproveBooking(null);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
              >
                No, Keep Pending
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setShowApproveModal(false);
                    const res = await api.updateBooking(selectedApproveBooking.id, { status: "Confirmed Booking" });
                    if (res?.success) {
                      showToast(`Booking ${selectedApproveBooking.id} approved & confirmed successfully!`, "success");
                      loadData();
                    } else {
                      showToast(res?.error || "Failed to approve booking.", "error");
                      setLoading(false);
                    }
                  } catch (err) {
                    console.error(err);
                    showToast("Error approving booking.", "error");
                    setLoading(false);
                  } finally {
                    setSelectedApproveBooking(null);
                  }
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#16a34a",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#15803d"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#16a34a"}
              >
                Yes, Approve &amp; Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
