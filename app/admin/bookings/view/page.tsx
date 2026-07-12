"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { formatDateToCustom, formatTimeTo24h } from "@/utils/formatters";

function parseNotes(notesStr: string, carPrice: number) {
  const result = {
    tripPackage: "",
    vehicle: "",
    adults: 0,
    childrenCount: 0,
    timingStatus: "Confirmed",
    bags: 0,
    priceBeforeDiscount: carPrice,
    discount: 0,
    discountReason: "",
    tafweejRequired: false,
    cashToReceive: 0,
    paymentMethod: "Credit",
    receivedAmount: "",
    pendingAmount: "",
    internalNotes: "",
    externalNotes: "",
  };

  if (!notesStr) return result;

  const parts = notesStr.split(" | ");
  let matchedCount = 0;

  parts.forEach((part) => {
    const cleanPart = part.trim();
    if (cleanPart.startsWith("Route:")) {
      result.tripPackage = cleanPart.substring("Route:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Vehicle:")) {
      result.vehicle = cleanPart.substring("Vehicle:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Passengers:")) {
      const pStr = cleanPart.substring("Passengers:".length).trim();
      result.adults = parseInt(pStr) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Timing Status:")) {
      result.timingStatus = cleanPart.substring("Timing Status:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Bags:")) {
      result.bags = parseInt(cleanPart.substring("Bags:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Price Before Discount:")) {
      result.priceBeforeDiscount = parseFloat(cleanPart.substring("Price Before Discount:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Discount:")) {
      result.discount = parseFloat(cleanPart.substring("Discount:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Discount Reason:")) {
      result.discountReason = cleanPart.substring("Discount Reason:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Tafweej Required:")) {
      result.tafweejRequired = cleanPart.substring("Tafweej Required:".length).trim().toLowerCase() === "yes";
      matchedCount++;
    } else if (cleanPart.startsWith("Cash to Receive:")) {
      result.cashToReceive = parseFloat(cleanPart.substring("Cash to Receive:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Payment Method:")) {
      result.paymentMethod = cleanPart.substring("Payment Method:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Received Amount:")) {
      result.receivedAmount = cleanPart.substring("Received Amount:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Pending Amount:")) {
      result.pendingAmount = cleanPart.substring("Pending Amount:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Internal Notes:")) {
      result.internalNotes = cleanPart.substring("Internal Notes:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("External Notes:")) {
      result.externalNotes = cleanPart.substring("External Notes:".length).trim();
      matchedCount++;
    }
  });

  if (matchedCount < 2) {
    result.externalNotes = notesStr;
  }

  return result;
}

function BookingViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any | null>(null);
  const [customerObj, setCustomerObj] = useState<any | null>(null);

  const [isDebited, setIsDebited] = useState(false);
  const [checkingLedger, setCheckingLedger] = useState(false);
  const [submittingDebit, setSubmittingDebit] = useState(false);

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

  useEffect(() => {
    const loadBookingData = async () => {
      if (!targetId) return;
      try {
        setLoading(true);
        const result = await api.getBooking(targetId);
        if (result) {
          setBooking(result);
          if (result.customer_id) {
            const cust = await api.getCustomer(result.customer_id);
            if (cust) {
              const actualCust = cust.customer || cust;
              setCustomerObj(actualCust);
              if (actualCust.company) {
                try {
                  setCheckingLedger(true);
                  const ledgers = await api.getLedgers();
                  const code = result.booking_code || result.id;
                  const alreadyDebited = ledgers.some((ld: any) => 
                    ld.company === actualCust.company && 
                    (ld.description || "").includes(code)
                  );
                  setIsDebited(alreadyDebited);
                } catch (e) {
                  console.error("Failed to check ledger status", e);
                } finally {
                  setCheckingLedger(false);
                }
              }
            }
          }
        } else {
          showToast("Booking details not found.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error loading booking details.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [targetId]);

  const handleDebitLedger = async () => {
    if (!booking || !customerObj?.company) return;
    try {
      setSubmittingDebit(true);
      const code = booking.booking_code || booking.id;
      const res = await api.createLedger({
        company: customerObj.company,
        description: `Booking Debit: ${code}`,
        debit: parseFloat(booking.car_price || 0),
        credit: 0
      });
      if (res && res.success) {
        showToast(`Successfully debited SR ${parseFloat(booking.car_price || 0).toFixed(2)} from ${customerObj.company}'s Ledger!`, "success");
        setIsDebited(true);
      } else {
        showToast(res?.error || "Failed to create ledger entry.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error debiting ledger.", "error");
    } finally {
      setSubmittingDebit(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid var(--primary-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>Booking Details Not Found</h3>
        <button onClick={() => router.push("/admin/bookings")} className="form-btn-back" style={{ marginTop: "15px" }}>
          Back to Bookings
        </button>
      </div>
    );
  }

  const parsed = parseNotes(booking.notes, parseFloat(booking.car_price || 0));

  const getStatusClass = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("completed")) return "completed";
    if (s.includes("cancel")) return "cancelled";
    if (s.includes("pending")) return "pending";
    return "active";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "1000px", margin: "0 auto", padding: "10px" }}>
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>
            <i className="fas fa-file-invoice" style={{ marginRight: "10px" }}></i> Booking Details
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>
            Viewing full details for booking code: <strong style={{ color: "#f59e0b" }}>{booking.booking_code || booking.id}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => router.push(`/admin/bookings/edit?id=${booking.id || booking.booking_code}`)} 
            className="btn-submit"
            style={{ padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", border: "none", color: "#0f172a", borderRadius: "8px" }}
          >
            <i className="fas fa-edit"></i>
            <span>Edit Booking</span>
          </button>
          <button 
            onClick={() => router.push("/admin/bookings")} 
            className="form-btn-back"
            style={{ background: "#334155", color: "#ffffff", border: "none", margin: 0 }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to List</span>
          </button>
        </div>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" }}>
        
        {/* Left Side: General Info & Route & Passengers */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Card 1: Route & Schedule */}
          <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
              <i className="fas fa-route" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              Route & Schedule
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Pickup Location</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{booking.pickup || "N/A"}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Dropoff Destination</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{booking.destination || "N/A"}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Package / Route Description</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary-color)" }}>{parsed.tripPackage || "N/A"}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Pickup Date</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-calendar" style={{ marginRight: "6px", color: "#64748b" }}></i> {booking.date ? formatDateToCustom(booking.date) : "N/A"}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Pickup Time</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-clock" style={{ marginRight: "6px", color: "#64748b" }}></i> {booking.time ? formatTimeTo24h(booking.time) : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Vehicle & Passengers */}
          <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
              <i className="fas fa-car" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              Vehicle & Passenger Details
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Vehicle Model</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{parsed.vehicle || booking.car_type || "N/A"}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Bags Count</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-briefcase" style={{ marginRight: "6px", color: "#64748b" }}></i> {parsed.bags || 0} Bags</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Passengers Info</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-users" style={{ marginRight: "6px", color: "#64748b" }}></i> {booking.passengers || `${parsed.adults} Passengers`}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Is Tafweej Required?</span>
                <span style={{
                  fontSize: "12px", fontWeight: "700", display: "inline-block", padding: "4px 8px", borderRadius: "6px",
                  background: parsed.tafweejRequired ? "#fee2e2" : "#f1f5f9",
                  color: parsed.tafweejRequired ? "#991b1b" : "#475569"
                }}>
                  {parsed.tafweejRequired ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Notes & Comments */}
          <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
              <i className="fas fa-comment-dots" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              Notes / Special Instructions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Private Internal Notes (Admin-only)</span>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155", minHeight: "50px" }}>
                  {parsed.internalNotes || "No internal notes recorded."}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Public External Notes</span>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155", minHeight: "50px" }}>
                  {parsed.externalNotes || "No external notes provided."}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Customer info & Status & Payment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Card A: Status & Tracking */}
          <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
              <i className="fas fa-clock-rotate-left" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              Status
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Booking Status</span>
                <span className={`status-pill ${getStatusClass(booking.status)}`} style={{ display: "inline-block", fontSize: "12px", fontWeight: "700" }}>{booking.status}</span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Timing Status</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                  <i className="fas fa-circle-check" style={{ color: "#10b981", marginRight: "6px" }}></i>
                  {parsed.timingStatus || "Confirmed"}
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Customer Profile */}
          <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
              <i className="fas fa-user-tie" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              Customer Profile
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Full Name</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{booking.full_name || "Guest Customer"}</span>
              </div>
              {customerObj && (
                <>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Agency / Company</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{customerObj.company || "Walk-in"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Custom ID</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary-color)" }}>{customerObj.custom_id || "N/A"}</span>
                  </div>
                </>
              )}
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>WhatsApp Contact</span>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}><i className="fab fa-whatsapp" style={{ color: "#10b981", marginRight: "6px" }}></i> {booking.whatsapp || "N/A"}</span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Email Address</span>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-envelope" style={{ color: "#64748b", marginRight: "6px" }}></i> {booking.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Card C: Fare & Financials */}
          <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
              <i className="fas fa-file-invoice-dollar" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              Fare & Financials
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Before Discount:</span>
                <span style={{ fontWeight: "600", color: "#334155" }}>SR {parsed.priceBeforeDiscount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Discount Applied:</span>
                <span style={{ fontWeight: "600", color: "#ef4444" }}>- SR {parsed.discount.toFixed(2)}</span>
              </div>
              {parsed.discountReason && (
                <div style={{ background: "#fef2f2", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", color: "#991b1b", border: "1px solid #fee2e2" }}>
                  <strong>Reason: </strong> {parsed.discountReason}
                </div>
              )}
              <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "5px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>Final Booking Fare:</span>
                <span style={{ fontWeight: "800", color: "var(--success-color)", fontSize: "16px" }}>SR {parseFloat(booking.car_price || 0).toFixed(2)}</span>
              </div>
              <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "5px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Payment Method:</span>
                <span style={{ fontWeight: "700", color: "#3b82f6" }}>{booking.payment_method || parsed.paymentMethod || "Credit"}</span>
              </div>

              {(booking.payment_method === "Cash" || parsed.paymentMethod === "Cash") && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Received Amount:</span>
                    <span style={{ fontWeight: "700", color: "#10b981" }}>SR {parseFloat(booking.received_amount || parsed.receivedAmount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Pending Amount:</span>
                    <span style={{ fontWeight: "700", color: "#ef4444" }}>SR {parseFloat(booking.pending_amount || parsed.pendingAmount || 0).toFixed(2)}</span>
                  </div>
                </>
              )}

              {customerObj?.company && (
                <>
                  <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "10px 0" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>
                      Corporate Billing ({customerObj.company})
                    </span>
                    {isDebited ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#ecfdf5",
                        color: "#047857",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: "1px solid #a7f3d0"
                      }}>
                        <i className="fas fa-check-circle" style={{ fontSize: "15px" }}></i>
                        <span>Debited to Company Ledger</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleDebitLedger}
                        disabled={submittingDebit || checkingLedger}
                        style={{
                          width: "100%",
                          background: checkingLedger ? "#cbd5e1" : (submittingDebit ? "#93c5fd" : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"),
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: (submittingDebit || checkingLedger) ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {submittingDebit ? (
                          <>
                            <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#fff" }}></div>
                            <span>Processing Debit...</span>
                          </>
                        ) : checkingLedger ? (
                          <span>Checking Ledger Status...</span>
                        ) : (
                          <>
                            <i className="fas fa-file-invoice-dollar"></i>
                            <span>Debit SR {parseFloat(booking.car_price || 0).toFixed(2)} to Ledger</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function BookingViewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid var(--primary-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <BookingViewContent />
    </Suspense>
  );
}
