"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel, exportToCSV, exportToPDF } from "@/utils/exportHelper";
import { formatDateToCustom } from "@/utils/formatters";

interface BookingItem {
  id: string;
  rawId?: number | string | null;
  bookingCode?: string | null;
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
  driverId?: number | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverTripStatus?: string;
  paymentMethod?: string;
  receivedAmount?: number | null;
  pendingAmount?: number | null;
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
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedShareBooking, setSelectedShareBooking] = useState<BookingItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

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

  const buildAdminBookingsExportData = () => {
    const headers = ["Booking ID", "Customer", "Pickup Date", "Pickup Time", "Pickup Location", "Dropoff Location", "Vehicle", "Price (SR)", "Status"];
    const rows = filteredBookings.map((b: any) => [
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
    return { headers, rows };
  };

  const [exportingFmt, setExportingFmt] = useState<string | null>(null);

  const fetchAllMatchingBookings = async () => {
    try {
      showToast("Fetching all matching bookings for export...", "success");
      const res = await api.getBookings(searchTerm, 1, 10000);
      let rawList: any[] = [];
      if (res && res.data && Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res)) {
        rawList = res;
      } else {
        rawList = bookings;
      }
      return rawList.map((b: any) => ({
        id: b.booking_code ? String(b.booking_code).replace(/UCB-/gi, "HCB-") : (b.custom_id ? String(b.custom_id).replace(/UCB-/gi, "HCB-") : `HCB-${10000 + Number(b.id || 0)}`),
        customerName: b.full_name || b.customer_relation?.name || "Guest",
        pickupDate: b.date || "",
        pickupTime: b.time || "",
        pickupLocation: b.pickup || "",
        dropoffLocation: b.destination || "",
        vehicle: b.car_type || "",
        finalPrice: Number(b.car_price || 0),
        status: b.status || "Pending"
      }));
    } catch (err) {
      console.error("Error fetching all bookings for export:", err);
      return filteredBookings;
    }
  };

  const handleExportCSV = async () => {
    setExportingFmt("CSV");
    try {
      const exportList = await fetchAllMatchingBookings();
      if (exportList.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["Booking ID", "Customer Name", "Pickup Date", "Pickup Time", "Pickup Location", "Dropoff Location", "Vehicle Type", "Final Price (SAR)", "Status"];
      const rows = exportList.map((b: any) => [
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
      exportToCSV({
        title: "Transportation Bookings Registry",
        filename: "bookings_report",
        headers,
        rows
      });
      showToast(`Exported all ${exportList.length} bookings to CSV!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingFmt("Excel");
    try {
      const exportList = await fetchAllMatchingBookings();
      if (exportList.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["Booking ID", "Customer Name", "Pickup Date", "Pickup Time", "Pickup Location", "Dropoff Location", "Vehicle Type", "Final Price (SAR)", "Status"];
      const rows = exportList.map((b: any) => [
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
      const totalPrice = exportList.reduce((sum: number, b: any) => sum + Number(b.finalPrice || 0), 0);
      exportToExcel({
        title: "Transportation Bookings Registry",
        filename: "bookings_report",
        headers,
        rows,
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

  const handlePrint = async (title: string = "Transportation Bookings Registry", fmtType: string = "Print") => {
    setExportingFmt(fmtType);
    try {
      const exportList = await fetchAllMatchingBookings();
      if (exportList.length === 0) {
        showToast("No data to print!", "error");
        return;
      }
      const headers = ["Booking ID", "Customer Name", "Pickup Date", "Pickup Time", "Pickup Location", "Dropoff Location", "Vehicle Type", "Final Price (SAR)", "Status"];
      const rows = exportList.map((b: any) => [
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
      const totalPrice = exportList.reduce((sum: number, b: any) => sum + Number(b.finalPrice || 0), 0);
      exportToPDF({
        title,
        filename: "bookings_report",
        headers,
        rows,
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
            id: b.booking_code ? String(b.booking_code).replace(/UCB-/gi, "HCB-") : (b.custom_id ? String(b.custom_id).replace(/UCB-/gi, "HCB-") : (b.id ? `HCB-${10000 + Number(b.id)}` : "HCB-10001")),
            rawId: b.id,
            bookingCode: b.booking_code || b.custom_id || null,
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
            driverId: b.driver_id,
            driverName: b.driver ? b.driver.name : null,
            driverPhone: b.driver ? b.driver.phone : null,
            driverTripStatus: b.driver_trip_status || "",
            paymentMethod: b.payment_method || "",
            receivedAmount: b.received_amount !== null && b.received_amount !== undefined ? parseFloat(b.received_amount) : null,
            pendingAmount: b.pending_amount !== null && b.pending_amount !== undefined ? parseFloat(b.pending_amount) : null,
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

  const handleInlineDriverChange = async (bookingId: string | number, driverId: string) => {
    try {
      setLoading(true);
      const res = await api.updateBooking(String(bookingId), { 
        driver_id: driverId ? parseInt(driverId) : null,
        status: driverId ? "Active Dispatch" : "Confirmed Booking"
      });
      if (res?.success) {
        showToast("Driver assignment updated successfully!", "success");
        loadData();
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

  const handleInlineDriverTripStatusChange = async (bookingId: string | number, tripStatus: string) => {
    try {
      setLoading(true);
      const res = await api.updateBooking(String(bookingId), { 
        driver_trip_status: tripStatus || null
      });
      if (res?.success) {
        showToast("Driver trip status updated successfully!", "success");
        loadData();
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
 
  useEffect(() => {
    loadData();
  }, [debouncedSearch, currentPage, perPage]);
 
  useEffect(() => {
    async function loadDrivers() {
      try {
        const res = await api.getDrivers();
        if (Array.isArray(res)) setDrivers(res);
      } catch (err) {
        console.warn("Could not load drivers in bookings list", err);
      }
    }
    loadDrivers();
  }, []);

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
          <button disabled={!!exportingFmt} onClick={handleCopy} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            Copy
          </button>
          <button disabled={!!exportingFmt} onClick={handleExportCSV} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            {exportingFmt === "CSV" && <i className="fas fa-spinner fa-spin"></i>}
            <span>CSV</span>
          </button>
          <button disabled={!!exportingFmt} onClick={handleExportExcel} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            {exportingFmt === "Excel" && <i className="fas fa-spinner fa-spin"></i>}
            <span>Excel</span>
          </button>
          <button disabled={!!exportingFmt} onClick={() => handlePrint("Transportation Bookings Registry - PDF Report", "PDF")} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            {exportingFmt === "PDF" && <i className="fas fa-spinner fa-spin"></i>}
            <span>PDF</span>
          </button>
          <button disabled={!!exportingFmt} onClick={() => handlePrint("Transportation Bookings Registry", "Print")} style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"} onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}>
            {exportingFmt === "Print" && <i className="fas fa-spinner fa-spin"></i>}
            <span>Print</span>
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
                <th>Driver</th>
                <th>Driver Trip Status</th>
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
                  <td>
                    <select
                      value={b.driverId || ""}
                      onChange={(e) => handleInlineDriverChange(b.rawId || b.id, e.target.value)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        width: "140px",
                        color: b.driverId ? "#1e293b" : "#94a3b8",
                        fontWeight: b.driverId ? "600" : "normal",
                        outline: "none"
                      }}
                      className="hover:border-slate-400"
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
                        value={b.driverTripStatus || ""}
                        onChange={(e) => handleInlineDriverTripStatusChange(b.rawId || b.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          width: "155px",
                          color: b.driverTripStatus ? "#1e293b" : "#94a3b8",
                          fontWeight: b.driverTripStatus ? "600" : "normal",
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
                          fontSize: "12px"
                        }}
                        title="Share template messages"
                      >
                        <i className="fas fa-info-circle"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 700, color: "var(--success-color)" }}>
                        SR {b.finalPrice.toFixed(2)}
                      </span>
                      {b.paymentMethod && (
                        <span style={{ fontSize: "11px", color: b.paymentMethod === "Cash" ? "#d97706" : "#2563eb", fontWeight: "600", marginTop: "2px" }}>
                          <i className={b.paymentMethod === "Cash" ? "fas fa-money-bill-wave" : "fas fa-credit-card"} style={{ marginRight: "3px" }}></i>
                          {b.paymentMethod}
                          {b.paymentMethod === "Cash" && b.pendingAmount !== undefined && b.pendingAmount !== null && (
                            <span style={{ display: "block", fontSize: "10px", color: "#ef4444" }}>
                              Pending: SR {b.pendingAmount.toFixed(2)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
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
                        onClick={() => router.push(`/admin/bookings/view?id=${b.rawId || b.id}`)}
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
                          onClick={() => router.push(`/admin/bookings/edit?id=${b.rawId || b.id}`)}
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
                    colSpan={9}
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
      `}</style>
    </div>
  );
}

function ShareTemplateModal({ booking, isOpen, onClose }: { booking: any; isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"driver" | "agent" | "client">("driver");
  const [copied, setCopied] = useState(false);
  const [texts, setTexts] = useState({
    driver: "",
    agent: "",
    client: ""
  });
  const [phone, setPhone] = useState("");

  const formatDateVoucher = (dStr: string | null | undefined) => {
    if (!dStr) return "";
    try {
      const match = String(dStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = match[3];
        const month = months[parseInt(match[2], 10) - 1];
        const year = match[1];
        return `${day}-${month}-${year}`;
      }
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = d.getDate() < 10 ? `0${d.getDate()}` : String(d.getDate());
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return String(dStr);
    } catch {
      return String(dStr);
    }
  };

  const getDriverCopy = (b: any) => {
    const bookingCode = b.id || (b.booking_code ? String(b.booking_code).replace(/UCB-/gi, "HCB-") : "HCB-10001");
    const guestName = b.customerName || b.full_name || "Guest";
    const phone = b.whatsapp || b.phone || b.contact || "N/A";
    const passengers = b.passengers ? `${b.passengers} Passengers` : "N/A";
    const pickup = b.pickupLocation || b.pickup || "N/A";
    const dropoff = b.dropoffLocation || b.destination || "N/A";
    const pDate = formatDateVoucher(b.pickupDate || b.date);
    const pTime = b.pickupTime || b.time || "";
    const carType = b.vehicle || b.car_type || "Sedan";
    
    let cashPending = 0;
    const isCash = (b.paymentMethod === "Cash" || b.payment_method === "Cash");
    if (isCash) {
      cashPending = b.pendingAmount !== undefined && b.pendingAmount !== null 
        ? Number(b.pendingAmount) 
        : (b.pending_amount !== undefined && b.pending_amount !== null ? Number(b.pending_amount) : Number(b.finalPrice || b.car_price || 0));
    } else {
      cashPending = b.cash_to_receive ? Number(b.cash_to_receive) : 0;
    }

    const extraInfo = b.notes || (b.flightNo ? `Flight No: ${b.flightNo}` : "");

    return `★ hebacab.com ★
★ Driver Voucher ★
👤 Guest Name: ${guestName}

📄 PNR No: ${bookingCode}
📞 Contact No: ${phone}
💬 Whatsapp: ${phone}
👥 No Of Passengers: ${passengers}

Pickup Details:
📍 Pickup Location: ${pickup}
🏨 Drop Off Location: ${dropoff}
📅 Pickup Date: ${pDate}
⏰ Pickup Time: ${pTime}
🚗 Car Type: (${carType})
💵 Cash Receive From Customer: ${cashPending} SAR
ℹ️ Extra Information: ${extraInfo ? extraInfo : ""}
🛄 Visa Type: ( Umrah )`;
  };

  const getAgentCopy = (b: any) => {
    let paymentStr = "";
    if (b.paymentMethod === "Cash") {
      paymentStr = `\n*Payment Info:* Cash (Received: SR ${(b.receivedAmount || 0).toFixed(2)}, Pending: SR ${(b.pendingAmount || 0).toFixed(2)})`;
    } else {
      paymentStr = `\n*Payment Info:* Credit`;
    }
    return `*HEBA CAB STATUS UPDATE (AGENT COPY)*\n---------------------------------\n*Booking Code:* ${b.id}\n*Guest Name:* ${b.customerName}\n*Date & Time:* ${b.pickupDate} at ${b.pickupTime}\n*Driver Assigned:* ${b.driverName || "None"} ${b.driverPhone ? `(${b.driverPhone})` : ""}\n*Trip Status:* ${b.driverTripStatus || "Not Set"}${paymentStr}`;
  };

  const getClientCopy = (b: any) => {
    const bookingCode = b.id || (b.booking_code ? String(b.booking_code).replace(/UCB-/gi, "HCB-") : "HCB-10001");
    const guestName = b.customerName || b.full_name || "Guest";
    const phone = b.whatsapp || b.phone || b.contact || "N/A";
    const passengers = b.passengers ? `${b.passengers} Passengers` : "N/A";
    const pickup = b.pickupLocation || b.pickup || "N/A";
    const dropoff = b.dropoffLocation || b.destination || "N/A";
    const pDate = formatDateVoucher(b.pickupDate || b.date);
    const pTime = b.pickupTime || b.time || "";
    const carType = b.vehicle || b.car_type || "Sedan";
    const driverName = b.driverName || b.driver?.name || "";
    const driverContact = b.driverPhone || b.driver?.phone || "";

    let cashPending = 0;
    const isCash = (b.paymentMethod === "Cash" || b.payment_method === "Cash");
    if (isCash) {
      cashPending = b.pendingAmount !== undefined && b.pendingAmount !== null 
        ? Number(b.pendingAmount) 
        : (b.pending_amount !== undefined && b.pending_amount !== null ? Number(b.pending_amount) : Number(b.finalPrice || b.car_price || 0));
    } else {
      cashPending = b.cash_to_receive ? Number(b.cash_to_receive) : 0;
    }

    const extraInfo = b.notes || (b.flightNo ? `Flight No: ${b.flightNo}` : "");

    return `★ Customer Voucher ★

📄 PNR No: ${bookingCode}
👤 Guest Name: ${guestName}
📞 Contact No: ${phone}
💬 Whatsapp: ${phone}
👥 No Of Passengers: ${passengers}

Pickup Details:
📍 Pickup Location: ${pickup}
🏨 Drop Off Location: ${dropoff}
📅 Pickup Date: ${pDate}
⏰ Pickup Time: ${pTime}
🚖 Driver Name: ${driverName}
📱 Driver Contact: ${driverContact}
🚗 Car Type: (${carType})
💵 Cash Receive From Customer: ${cashPending} SAR
ℹ️ Extra Information: ${extraInfo ? extraInfo : ""}
🛄 Visa Type: ( Umrah )

For Driver Details:
Please Contact On: +966567799616
Thanks for choosing hebacab.com`;
  };

  useEffect(() => {
    if (booking) {
      setTexts({
        driver: getDriverCopy(booking),
        agent: getAgentCopy(booking),
        client: getClientCopy(booking)
      });
      if (activeTab === "driver") {
        setPhone(booking.driverPhone || "");
      } else if (activeTab === "client") {
        setPhone(booking.whatsapp || "");
      } else {
        setPhone("");
      }
    }
  }, [booking, activeTab]);

  if (!isOpen || !booking) return null;

  const handleTextChange = (val: string) => {
    setTexts(prev => ({ ...prev, [activeTab]: val }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(texts[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(texts[activeTab]);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
  };

  const formatWhatsAppMessage = (text: string) => {
    if (!text) return "";
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Replace *bold* with <strong>bold</strong>
    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    
    // Replace _italic_ with <em>italic</em>
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
    
    // Replace ~strikethrough~ with <del>strikethrough</del>
    formatted = formatted.replace(/~(.*?)~/g, "<del>$1</del>");
    
    // Replace newlines with <br />
    formatted = formatted.replace(/\n/g, "<br />");
    
    return formatted;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
      <div style={{ background: "#ffffff", borderRadius: "16px", width: "500px", maxWidth: "90%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", display: "flex", flexDirection: "column" }}>
        {/* Modal Header */}
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
              {tab === "client" ? "Customer" : tab} Voucher
            </button>
          ))}
        </div>

        {/* Recipient Phone Number */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Recipient Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#334155",
              outline: "none",
              fontWeight: "600",
              fontFamily: "monospace"
            }}
          />
        </div>

        {/* Text Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Edit Message Content</label>
          <textarea
            value={texts[activeTab]}
            onChange={(e) => handleTextChange(e.target.value)}
            style={{
              width: "100%",
              height: "150px",
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
        </div>

        {/* Live Preview (WhatsApp Simulator) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Live Preview (WhatsApp Format)</label>
          <div style={{
            background: "#efeae2",
            padding: "12px",
            borderRadius: "8px",
            maxHeight: "130px",
            overflowY: "auto",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              background: "#d9fdd3",
              padding: "8px 12px",
              borderRadius: "8px",
              maxWidth: "90%",
              fontSize: "13px",
              lineHeight: "1.5",
              color: "#111b21",
              boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap"
            }} dangerouslySetInnerHTML={{ __html: formatWhatsAppMessage(texts[activeTab]) }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
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
