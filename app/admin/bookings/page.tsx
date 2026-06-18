"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

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
}

export default function BookingsList() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null);
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
    
    const excelContent = [
      headers.join("\t"),
      ...textRows.map(r => r.join("\t"))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bookings_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Excel spreadsheet downloaded successfully!", "success");
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
          <div>${b.pickupDate || ""}</div>
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

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getBookings();
        if (data) {
          const mapped = data.map((b: any) => {
            let uiStatus: "Pending" | "Confirmed" | "Completed" | "Cancelled" = "Pending";
            if (b.status === "Active Dispatch") uiStatus = "Confirmed";
            else if (b.status === "Confirmed Booking") uiStatus = "Confirmed";
            else if (b.status === "Completed") uiStatus = "Completed";
            else if (b.status === "Cancelled") uiStatus = "Cancelled";

            return {
              id: b.booking_code || b.id || "UCB-XXXX",
              customerName: b.full_name || b.fullName || "Guest",
              pickupDate: b.date,
              pickupTime: b.time.substring(0, 5),
              pickupLocation: b.pickup,
              dropoffLocation: b.destination,
              vehicle: b.car_type || b.carType,
              priceBeforeDiscount: parseFloat(b.car_price || b.carPrice || 0),
              discount: 0,
              finalPrice: parseFloat(b.car_price || b.carPrice || 0),
              status: uiStatus
            };
          });
          setBookings(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      let dbStatus = "Pending Check";
      if (editingBooking.status === "Confirmed") dbStatus = "Confirmed Booking";
      else if (editingBooking.status === "Completed") dbStatus = "Completed";
      else if (editingBooking.status === "Cancelled") dbStatus = "Cancelled";

      const updatedFields = {
        date: editingBooking.pickupDate,
        time: editingBooking.pickupTime,
        car_price: editingBooking.finalPrice,
        status: dbStatus,
        pickup: editingBooking.pickupLocation,
        destination: editingBooking.dropoffLocation,
        full_name: editingBooking.customerName,
      };

      await api.updateBooking(editingBooking.id, updatedFields);
      showToast("Booking updated successfully!", "success");
      setEditingBooking(null);

      // Reload
      const data = await api.getBookings();
      if (data) {
        const mapped = data.map((b: any) => {
          let uiStatus: "Pending" | "Confirmed" | "Completed" | "Cancelled" = "Pending";
          if (b.status === "Active Dispatch") uiStatus = "Confirmed";
          else if (b.status === "Confirmed Booking") uiStatus = "Confirmed";
          else if (b.status === "Completed") uiStatus = "Completed";
          else if (b.status === "Cancelled") uiStatus = "Cancelled";

          return {
            id: b.booking_code || b.id || "UCB-XXXX",
            customerName: b.full_name || b.fullName || "Guest",
            pickupDate: b.date,
            pickupTime: b.time.substring(0, 5),
            pickupLocation: b.pickup,
            dropoffLocation: b.destination,
            vehicle: b.car_type || b.carType,
            priceBeforeDiscount: parseFloat(b.car_price || b.carPrice || 0),
            discount: 0,
            finalPrice: parseFloat(b.car_price || b.carPrice || 0),
            status: uiStatus
          };
        });
        setBookings(mapped);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update booking.", "error");
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.dropoffLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button onClick={() => router.push("/admin/bookings/add")} className="form-btn-back">
          <i className="fas fa-plus"></i>
          <span>Add New Booking</span>
        </button>
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

      {/* Bookings Table */}
      <div className="table-card">
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
                      <span>{b.pickupDate}</span>
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
                        onClick={() => setSelectedBooking(b)}
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
                        onClick={() => setEditingBooking(b)}
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
      </div>

      {/* View Booking Details Modal */}
      {selectedBooking && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)" }}><i className="fas fa-file-invoice"></i> Booking Details ({selectedBooking.id})</h3>
              <button onClick={() => setSelectedBooking(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Customer Name</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedBooking.customerName}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Car/Vehicle Model</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedBooking.vehicle}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pickup Date</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedBooking.pickupDate}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pickup Time</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedBooking.pickupTime}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Route Mapping</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{selectedBooking.pickupLocation} → {selectedBooking.dropoffLocation}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Billing Value</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--success-color)" }}>SR {selectedBooking.finalPrice.toFixed(2)}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Tracking Status</span>
                <span className={`status-pill ${selectedBooking.status.toLowerCase()}`}>{selectedBooking.status}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedBooking(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)" }}><i className="fas fa-pen-to-square"></i> Modify Transportation Booking ({editingBooking.id})</h3>
              <button onClick={() => setEditingBooking(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateBooking} className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div className="form-group-full">
                <label className="form-label">Customer Full Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-user form-icon"></i>
                  <input type="text" className="form-input" value={editingBooking.customerName} onChange={(e) => setEditingBooking({...editingBooking, customerName: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label className="form-label">Pickup Date *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-calendar form-icon"></i>
                  <input type="date" className="form-input" value={editingBooking.pickupDate} onChange={(e) => setEditingBooking({...editingBooking, pickupDate: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label className="form-label">Pickup Time *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-clock form-icon"></i>
                  <input type="time" className="form-input" value={editingBooking.pickupTime} onChange={(e) => setEditingBooking({...editingBooking, pickupTime: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="form-label">Pickup Location *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-location-dot form-icon"></i>
                  <input type="text" className="form-input" value={editingBooking.pickupLocation} onChange={(e) => setEditingBooking({...editingBooking, pickupLocation: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="form-label">Dropoff Destination *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-location-arrow form-icon"></i>
                  <input type="text" className="form-input" value={editingBooking.dropoffLocation} onChange={(e) => setEditingBooking({...editingBooking, dropoffLocation: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="form-label">Fare Price (SR) *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-money-bill-wave form-icon"></i>
                  <input type="number" step="0.01" className="form-input" value={editingBooking.finalPrice} onChange={(e) => setEditingBooking({...editingBooking, finalPrice: parseFloat(e.target.value) || 0})} required />
                </div>
              </div>

              <div>
                <label className="form-label">Booking Status *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-info-circle form-icon"></i>
                  <select className="form-input form-select" value={editingBooking.status} onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value as any})} required>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div className="form-group-full" style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => setEditingBooking(null)} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
